-- Esquema completo de la base del Sistema Manteca, al dia con la ultima migracion
-- (20261007150200_usuarios_triggers_y_permisos). Se actualiza en el mismo cambio que cada
-- migracion.

-- Tipos

do $$
begin
  create type public.rol_usuario as enum ('invitado', 'caja', 'encargado', 'admin');
exception
  when duplicate_object then null;
end
$$;

-- Tablas

create table if not exists public.locales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 100),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  local_id uuid not null references public.locales (id),
  nombre text not null check (char_length(nombre) between 1 and 100),
  email text not null unique,
  rol public.rol_usuario not null default 'invitado',
  activo boolean not null default true,
  debe_cambiar_contrasena boolean not null default false,
  -- Los invitados que esperan un rol van primero en la lista de Usuarios.
  pendiente boolean generated always as (rol = 'invitado' and activo) stored,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists perfiles_local_rol_activo on public.perfiles (local_id, rol, activo);

-- Lo que el servidor anota con la clave secreta antes de resetear una contrasena o corregir un
-- email: asi la base sabe que lo pidio un admin (o la siembra de pruebas) y no la persona.
create table if not exists public.acciones_de_cuenta (
  id uuid primary key default gen_random_uuid(),
  cuenta_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('reseteo', 'correccion', 'siembra')),
  por uuid references public.perfiles (id) on delete set null,
  fecha_uso timestamptz,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists acciones_de_cuenta_cuenta
  on public.acciones_de_cuenta (cuenta_id, fecha_creacion desc);
create index if not exists acciones_de_cuenta_por on public.acciones_de_cuenta (por);

create table if not exists public.auditoria (
  id bigint generated always as identity primary key,
  local_id uuid references public.locales (id),
  usuario_id uuid references public.perfiles (id) on delete set null,
  tabla text not null,
  registro_id text not null,
  accion text not null check (accion in (
    'alta', 'cambio', 'anulacion', 'desactivacion', 'reactivacion',
    'reseteo_de_contrasena', 'cambio_de_contrasena'
  )),
  antes jsonb,
  despues jsonb,
  motivo text,
  fecha timestamptz not null default now()
);

create index if not exists auditoria_local_fecha on public.auditoria (local_id, fecha desc);
create index if not exists auditoria_registro on public.auditoria (tabla, registro_id);
create index if not exists auditoria_usuario on public.auditoria (usuario_id);

-- Funciones que usan las politicas

create or replace function public.local_del_usuario()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select local_id from public.perfiles where id = (select auth.uid())
$$;

create or replace function public.es_admin_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'admin' and activo
  )
$$;

create or replace function public.rol_de_cuenta_nueva(cuentas bigint)
returns public.rol_usuario
language sql
immutable
set search_path = ''
as $$
  select case
    when cuentas = 0 then 'admin'::public.rol_usuario
    else 'invitado'::public.rol_usuario
  end
$$;

-- Auditoria y fecha de actualizacion

create or replace function public.marcar_actualizacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.fecha_actualizacion := now();
  return new;
end
$$;

create or replace function public.auditar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ignoradas text[] := array_append(tg_argv, 'fecha_actualizacion');
  fila jsonb := to_jsonb(new);
  autor uuid := coalesce(
    (select auth.uid()),
    nullif(current_setting('manteca.usuario', true), '')::uuid
  );
  antes jsonb;
  despues jsonb;
  accion text;
begin
  if tg_op = 'INSERT' then
    despues := fila - ignoradas;
    accion := 'alta';
  else
    select jsonb_object_agg(n.key, o.value), jsonb_object_agg(n.key, n.value)
      into antes, despues
      from jsonb_each(fila) n
      join jsonb_each(to_jsonb(old)) o on o.key = n.key
     where n.value is distinct from o.value
       and not (n.key = any (ignoradas));
    if antes is null then
      return new;
    end if;
    accion := case
      when despues ? 'anulado' and (despues ->> 'anulado')::boolean then 'anulacion'
      when despues ? 'activo' and not (despues ->> 'activo')::boolean then 'desactivacion'
      when despues ? 'activo' then 'reactivacion'
      else 'cambio'
    end;
  end if;
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes, despues, motivo)
  values (
    coalesce(fila ->> 'local_id', case when tg_table_name = 'locales' then fila ->> 'id' end)::uuid,
    autor,
    tg_table_name,
    fila ->> 'id',
    accion,
    antes,
    despues,
    case when accion = 'anulacion' then fila ->> 'motivo_anulacion' end
  );
  return new;
end
$$;

-- Cuentas de Supabase Auth

create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cuentas bigint;
begin
  -- Serializa las altas: dos cuentas nuevas a la vez no pueden quedar las dos como admin.
  perform pg_advisory_xact_lock(hashtext('manteca.crear_perfil'));
  select count(*) into cuentas from public.perfiles;
  -- Quien se registra es el autor de su propia alta.
  perform set_config('manteca.usuario', new.id::text, true);
  insert into public.perfiles (id, local_id, nombre, email, rol)
  values (
    new.id,
    (select id from public.locales order by fecha_creacion, id limit 1),
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)), 100),
    lower(new.email),
    public.rol_de_cuenta_nueva(cuentas)
  );
  perform set_config('manteca.usuario', '', true);
  return new;
end
$$;

create or replace function public.usar_accion(cuenta uuid, tipos text[], out tipo text, out por uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Vale una sola vez y solo si es reciente: una que quedo sin usar no habilita cambios despues.
  update public.acciones_de_cuenta a
     set fecha_uso = now()
   where a.id = (
     select b.id from public.acciones_de_cuenta b
      where b.cuenta_id = cuenta
        and b.tipo = any (tipos)
        and b.fecha_uso is null
        and b.fecha_creacion > now() - interval '10 minutes'
      order by b.fecha_creacion desc
      limit 1
      for update skip locked
   )
  returning a.tipo, a.por into tipo, por;
end
$$;

create or replace function public.registrar_cambio_de_contrasena(cuenta uuid, tipo text, por uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  es_reseteo boolean := coalesce(tipo = 'reseteo', false);
  -- Sin accion anotada la cambio la propia persona. La siembra queda a nombre del sistema.
  autor uuid := case when tipo is null then cuenta else por end;
begin
  update public.perfiles set debe_cambiar_contrasena = es_reseteo where id = cuenta;
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion)
  select p.local_id, autor, 'perfiles', cuenta::text,
         case when es_reseteo then 'reseteo_de_contrasena' else 'cambio_de_contrasena' end
    from public.perfiles p
   where p.id = cuenta;
end
$$;

create or replace function public.sincronizar_cuenta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  usada record;
begin
  if new.email is distinct from old.email then
    select * into usada from public.usar_accion(new.id, array['correccion']);
    if usada.tipo is null then
      raise exception 'El email de una cuenta lo cambia un administrador' using errcode = 'PM003';
    end if;
    perform set_config('manteca.usuario', coalesce(usada.por::text, ''), true);
    update public.perfiles set email = lower(new.email) where id = new.id;
  end if;
  -- Sin contrasena anterior no es un cambio: es la primera que se pone.
  if new.encrypted_password is distinct from old.encrypted_password
     and coalesce(old.encrypted_password, '') <> '' then
    select * into usada from public.usar_accion(new.id, array['reseteo', 'siembra']);
    perform public.registrar_cambio_de_contrasena(new.id, usada.tipo, usada.por);
  end if;
  perform set_config('manteca.usuario', '', true);
  return new;
end
$$;

-- Reglas de los perfiles

create or replace function public.reglas_de_perfiles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  otros_admins bigint;
begin
  if (select auth.uid()) = new.id
     and (new.rol is distinct from old.rol or new.activo is distinct from old.activo) then
    raise exception 'No podes cambiar tu propio rol ni desactivarte' using errcode = 'PM001';
  end if;
  if old.rol = 'admin' and old.activo and not (new.rol = 'admin' and new.activo) then
    -- Un bloqueo por local: dos admins que se bajan a la vez no lo dejan sin ninguno.
    perform pg_advisory_xact_lock(hashtext('manteca.admins'), hashtext(old.local_id::text));
    select count(*) into otros_admins
      from public.perfiles
     where local_id = old.local_id and rol = 'admin' and activo and id <> old.id;
    if otros_admins = 0 then
      raise exception 'Tiene que quedar al menos un administrador activo' using errcode = 'PM002';
    end if;
  end if;
  return new;
end
$$;

-- Triggers

drop trigger if exists al_crear_cuenta on auth.users;
create trigger al_crear_cuenta after insert on auth.users
  for each row execute function public.crear_perfil();

drop trigger if exists al_actualizar_cuenta on auth.users;
create trigger al_actualizar_cuenta before update on auth.users
  for each row execute function public.sincronizar_cuenta();

drop trigger if exists marcar_actualizacion on public.locales;
create trigger marcar_actualizacion before update on public.locales
  for each row execute function public.marcar_actualizacion();

drop trigger if exists marcar_actualizacion on public.perfiles;
create trigger marcar_actualizacion before update on public.perfiles
  for each row execute function public.marcar_actualizacion();

drop trigger if exists marcar_actualizacion on public.acciones_de_cuenta;
create trigger marcar_actualizacion before update on public.acciones_de_cuenta
  for each row execute function public.marcar_actualizacion();

drop trigger if exists reglas on public.perfiles;
create trigger reglas before update on public.perfiles
  for each row execute function public.reglas_de_perfiles();

drop trigger if exists auditar on public.locales;
create trigger auditar after insert or update on public.locales
  for each row execute function public.auditar();

drop trigger if exists auditar on public.perfiles;
create trigger auditar after insert or update on public.perfiles
  for each row execute function public.auditar('debe_cambiar_contrasena', 'pendiente');

-- Permisos

alter table public.locales enable row level security;
alter table public.perfiles enable row level security;
alter table public.acciones_de_cuenta enable row level security;
alter table public.auditoria enable row level security;

revoke all on table public.locales, public.perfiles, public.acciones_de_cuenta, public.auditoria
  from anon, authenticated;
grant select on table public.locales to authenticated;
grant select on table public.perfiles to authenticated;
grant update (nombre, rol, activo) on table public.perfiles to authenticated;
grant select on table public.auditoria to authenticated;
-- acciones_de_cuenta queda sin grants ni policies: solo la usan el servidor y la base.

revoke all on function
  public.local_del_usuario(),
  public.es_admin_activo(),
  public.rol_de_cuenta_nueva(bigint),
  public.marcar_actualizacion(),
  public.auditar(),
  public.crear_perfil(),
  public.usar_accion(uuid, text[]),
  public.registrar_cambio_de_contrasena(uuid, text, uuid),
  public.sincronizar_cuenta(),
  public.reglas_de_perfiles()
  from public, anon, authenticated;
-- Las policies las ejecutan con el rol de quien consulta: sin este permiso, toda lectura falla.
grant execute on function public.local_del_usuario(), public.es_admin_activo() to authenticated;
grant execute on function public.rol_de_cuenta_nueva(bigint) to service_role;

drop policy if exists "locales: el admin activo ve su local" on public.locales;
create policy "locales: el admin activo ve su local" on public.locales
  for select to authenticated
  using ((select public.es_admin_activo()) and id = (select public.local_del_usuario()));

-- Una sola policy de lectura: con dos, Postgres evalua las dos en cada consulta.
drop policy if exists "perfiles: cada uno ve el suyo y el admin activo los de su local" on public.perfiles;
create policy "perfiles: cada uno ve el suyo y el admin activo los de su local" on public.perfiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  );

drop policy if exists "perfiles: el admin activo edita los de su local" on public.perfiles;
create policy "perfiles: el admin activo edita los de su local" on public.perfiles
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "auditoria: el admin activo ve la de su local" on public.auditoria;
create policy "auditoria: el admin activo ve la de su local" on public.auditoria
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Menu (1 de 5): las tablas de categorias, presentaciones, productos, precios y aumentos.
-- El admin activo las lee en su local; nadie escribe directo: las funciones de las
-- migraciones siguientes hacen cada cambio entero o no lo hacen.

do $$
begin
  create type public.etiqueta_de_producto as enum ('mas_vendido', 'artesanal', 'nuevo');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  nombre text not null check (char_length(nombre) between 1 and 100),
  subtitulo text check (subtitulo is null or char_length(subtitulo) between 1 and 100),
  -- Una ruta de public/menu (carga inicial) o un objeto del bucket fotos-del-menu.
  foto text check (foto is null or char_length(foto) between 1 and 300),
  icono text not null check (icono in (
    '🥐', '🧈', '🍞', '🥨', '☕', '➕', '🥖', '🥯', '🍩', '🍪', '🧁', '🍰', '🥧', '🥪', '🍵', '🧃'
  )),
  orden integer not null,
  visible boolean not null default false,
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists categorias_local_orden on public.categorias (local_id, orden);

-- Las formas en que se vende lo de una categoria. Sacar una es desactivarla: sus precios
-- quedan guardados y dejan de mostrarse.
create table if not exists public.presentaciones (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  categoria_id uuid not null references public.categorias (id),
  nombre text not null check (char_length(nombre) between 1 and 50),
  orden integer not null,
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists presentaciones_categoria on public.presentaciones (categoria_id, orden);
create index if not exists presentaciones_local on public.presentaciones (local_id);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  categoria_id uuid not null references public.categorias (id),
  nombre text not null check (char_length(nombre) between 1 and 100),
  descripcion text check (descripcion is null or char_length(descripcion) between 1 and 300),
  etiqueta public.etiqueta_de_producto,
  orden integer not null,
  visible boolean not null default false,
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists productos_categoria on public.productos (categoria_id, orden);
create index if not exists productos_local on public.productos (local_id);

-- Sin producto es el precio compartido de la categoria. Una sola fila por presentacion y
-- producto: quitar un precio lo desactiva y volver a cargarlo lo reactiva.
create table if not exists public.precios (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  presentacion_id uuid not null references public.presentaciones (id),
  producto_id uuid references public.productos (id),
  -- Pesos enteros para el publico, guardados en centavos.
  monto_centavos bigint not null check (monto_centavos > 0 and monto_centavos % 100 = 0),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  constraint precios_unicos unique nulls not distinct (presentacion_id, producto_id)
);

create index if not exists precios_producto on public.precios (producto_id);
create index if not exists precios_local on public.precios (local_id);

create table if not exists public.aumentos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  porcentaje integer not null check (porcentaje between -50 and 200 and porcentaje <> 0),
  redondeo_centavos bigint not null check (redondeo_centavos in (1000, 5000, 10000, 50000)),
  -- Vacio: el aumento fue sobre todo el menu.
  categoria_id uuid references public.categorias (id),
  usuario_id uuid references public.perfiles (id) on delete set null,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists aumentos_local on public.aumentos (local_id, fecha_creacion desc);
create index if not exists aumentos_categoria on public.aumentos (categoria_id);
create index if not exists aumentos_usuario on public.aumentos (usuario_id);

-- Triggers

drop trigger if exists marcar_actualizacion on public.categorias;
create trigger marcar_actualizacion before update on public.categorias
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.presentaciones;
create trigger marcar_actualizacion before update on public.presentaciones
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.productos;
create trigger marcar_actualizacion before update on public.productos
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.precios;
create trigger marcar_actualizacion before update on public.precios
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.aumentos;
create trigger marcar_actualizacion before update on public.aumentos
  for each row execute function public.marcar_actualizacion();

drop trigger if exists auditar on public.categorias;
create trigger auditar after insert or update on public.categorias
  for each row execute function public.auditar();
drop trigger if exists auditar on public.presentaciones;
create trigger auditar after insert or update on public.presentaciones
  for each row execute function public.auditar();
drop trigger if exists auditar on public.productos;
create trigger auditar after insert or update on public.productos
  for each row execute function public.auditar();
drop trigger if exists auditar on public.precios;
create trigger auditar after insert or update on public.precios
  for each row execute function public.auditar();
drop trigger if exists auditar on public.aumentos;
create trigger auditar after insert or update on public.aumentos
  for each row execute function public.auditar();

-- Permisos

alter table public.categorias enable row level security;
alter table public.presentaciones enable row level security;
alter table public.productos enable row level security;
alter table public.precios enable row level security;
alter table public.aumentos enable row level security;

revoke all on table public.categorias, public.presentaciones, public.productos, public.precios,
  public.aumentos from anon, authenticated;
grant select on table public.categorias, public.presentaciones, public.productos, public.precios,
  public.aumentos to authenticated;

drop policy if exists "categorias: el admin activo ve las de su local" on public.categorias;
create policy "categorias: el admin activo ve las de su local" on public.categorias
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "presentaciones: el admin activo ve las de su local" on public.presentaciones;
create policy "presentaciones: el admin activo ve las de su local" on public.presentaciones
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "productos: el admin activo ve los de su local" on public.productos;
create policy "productos: el admin activo ve los de su local" on public.productos
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "precios: el admin activo ve los de su local" on public.precios;
create policy "precios: el admin activo ve los de su local" on public.precios
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "aumentos: el admin activo ve los de su local" on public.aumentos;
create policy "aumentos: el admin activo ve los de su local" on public.aumentos
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Menu (2 de 5): el bucket de las fotos de las categorias. Se lee publico (son las fotos del
-- menu); sube solo el admin activo, a la carpeta de su local. Nadie cambia ni borra: una foto
-- reemplazada queda guardada.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-del-menu', 'fotos-del-menu', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "fotos-del-menu: el admin activo sube a su local" on storage.objects;
create policy "fotos-del-menu: el admin activo sube a su local" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos-del-menu'
    and (select public.es_admin_activo())
    and (storage.foldername(name))[1] = (select public.local_del_usuario())::text
  );

-- Menu (3 de 5): guardar una categoria o un producto, entero o nada. Un producto visible
-- nunca queda sin precio: si el cambio lo deja asi, la funcion pide confirmar (PM101) y, con
-- la confirmacion, lo oculta.

create or replace function public.menu_exigir_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para hacer esto' using errcode = 'PM100';
  end if;
  return public.local_del_usuario();
end
$$;

-- Tiene precio si alguna presentacion activa de su categoria tiene uno propio o el compartido.
create or replace function public.tiene_precio(el_producto uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.productos p
      join public.presentaciones pre on pre.categoria_id = p.categoria_id and pre.activo
      join public.precios pr on pr.presentacion_id = pre.id and pr.activo
       and (pr.producto_id = p.id or pr.producto_id is null)
     where p.id = el_producto
  )
$$;

create or replace function public.menu_validar_foto(la_foto text, el_local uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if la_foto is null or la_foto = '' then
    return null;
  end if;
  if la_foto ~ '^/menu/[A-Za-z0-9._-]+$' then
    return la_foto;
  end if;
  if (storage.foldername(la_foto))[1] = el_local::text and exists (
    select 1 from storage.objects o where o.bucket_id = 'fotos-del-menu' and o.name = la_foto
  ) then
    return la_foto;
  end if;
  raise exception 'La foto no existe o no es de este local' using errcode = 'PM106';
end
$$;

-- Sin monto, el precio se desactiva y el producto vuelve a heredar el de la categoria.
create or replace function public.menu_poner_precio(
  el_local uuid, la_presentacion uuid, el_producto uuid, monto bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if monto is null then
    update public.precios set activo = false
     where presentacion_id = la_presentacion and producto_id is not distinct from el_producto
       and activo;
    return;
  end if;
  insert into public.precios (local_id, presentacion_id, producto_id, monto_centavos)
  values (el_local, la_presentacion, el_producto, monto)
  on conflict on constraint precios_unicos
  do update set monto_centavos = excluded.monto_centavos, activo = true;
end
$$;

create or replace function public.menu_ocultar_sin_precio(las_categorias uuid[], confirmar boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sin_precio jsonb;
begin
  select coalesce(jsonb_agg(p.nombre order by p.orden, p.id), '[]'::jsonb) into sin_precio
    from public.productos p
   where p.categoria_id = any (las_categorias) and p.visible and p.activo
     and not public.tiene_precio(p.id);
  if jsonb_array_length(sin_precio) > 0 and not confirmar then
    raise exception 'Hay productos que quedan sin precio'
      using errcode = 'PM101', detail = sin_precio::text;
  end if;
  update public.productos set visible = false
   where categoria_id = any (las_categorias) and visible and activo
     and not public.tiene_precio(id);
  return sin_precio;
end
$$;

create or replace function public.menu_escribir_categoria(el_local uuid, datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  la_categoria uuid := nullif(datos ->> 'id', '')::uuid;
  nueva_foto text := public.menu_validar_foto(datos ->> 'foto', el_local);
begin
  if la_categoria is null then
    insert into public.categorias (local_id, nombre, subtitulo, foto, icono, orden)
    values (el_local, datos ->> 'nombre', nullif(datos ->> 'subtitulo', ''), nueva_foto,
            datos ->> 'icono',
            (select coalesce(max(c.orden) + 1, 0) from public.categorias c where c.local_id = el_local))
    returning id into la_categoria;
    return la_categoria;
  end if;
  update public.categorias
     set nombre = datos ->> 'nombre', subtitulo = nullif(datos ->> 'subtitulo', ''),
         foto = nueva_foto, icono = datos ->> 'icono'
   where id = la_categoria and local_id = el_local and activo;
  if not found then
    raise exception 'No encontramos esa categoria' using errcode = 'PM100';
  end if;
  return la_categoria;
end
$$;

-- Las presentaciones llegan en el orden de la pantalla. Las activas que no vienen se sacan.
create or replace function public.menu_escribir_presentaciones(
  el_local uuid, la_categoria uuid, lista jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  posicion integer := 0;
  la_presentacion uuid;
  conservadas uuid[] := '{}';
begin
  if jsonb_typeof(lista) is distinct from 'array' or jsonb_array_length(lista) = 0 then
    raise exception 'La categoria necesita al menos una presentacion' using errcode = '23514';
  end if;
  for item in select value from jsonb_array_elements(lista) loop
    la_presentacion := nullif(item ->> 'id', '')::uuid;
    if la_presentacion is null then
      insert into public.presentaciones (local_id, categoria_id, nombre, orden)
      values (el_local, la_categoria, item ->> 'nombre', posicion)
      returning id into la_presentacion;
    else
      update public.presentaciones set nombre = item ->> 'nombre', orden = posicion, activo = true
       where id = la_presentacion and categoria_id = la_categoria;
      if not found then
        raise exception 'No encontramos esa presentacion' using errcode = 'PM100';
      end if;
    end if;
    perform public.menu_poner_precio(el_local, la_presentacion, null,
                                     (item ->> 'monto_compartido_centavos')::bigint);
    conservadas := conservadas || la_presentacion;
    posicion := posicion + 1;
  end loop;
  update public.presentaciones set activo = false
   where categoria_id = la_categoria and activo and not (id = any (conservadas));
end
$$;

create or replace function public.menu_guardar_categoria(datos jsonb, confirmar boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
  la_categoria uuid := public.menu_escribir_categoria(el_local, datos);
begin
  perform public.menu_escribir_presentaciones(el_local, la_categoria, datos -> 'presentaciones');
  return jsonb_build_object(
    'id', la_categoria,
    'ocultados', public.menu_ocultar_sin_precio(array[la_categoria], confirmar)
  );
end
$$;

create or replace function public.menu_escribir_producto(el_local uuid, datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_producto uuid := nullif(datos ->> 'id', '')::uuid;
  la_categoria uuid := (datos ->> 'categoria_id')::uuid;
  anterior uuid;
  siguiente integer;
begin
  if not exists (select 1 from public.categorias c
                  where c.id = la_categoria and c.local_id = el_local and c.activo) then
    raise exception 'La categoria no existe o esta desactivada' using errcode = 'PM106';
  end if;
  select coalesce(max(p.orden) + 1, 0) into siguiente
    from public.productos p where p.categoria_id = la_categoria;
  if el_producto is null then
    insert into public.productos (local_id, categoria_id, nombre, descripcion, etiqueta, orden)
    values (el_local, la_categoria, datos ->> 'nombre', nullif(datos ->> 'descripcion', ''),
            nullif(datos ->> 'etiqueta', '')::public.etiqueta_de_producto, siguiente)
    returning id into el_producto;
    return el_producto;
  end if;
  select p.categoria_id into anterior
    from public.productos p where p.id = el_producto and p.local_id = el_local and p.activo;
  if not found then
    raise exception 'No encontramos ese producto' using errcode = 'PM100';
  end if;
  update public.productos
     set categoria_id = la_categoria, nombre = datos ->> 'nombre',
         descripcion = nullif(datos ->> 'descripcion', ''),
         etiqueta = nullif(datos ->> 'etiqueta', '')::public.etiqueta_de_producto,
         orden = case when anterior = la_categoria then orden else siguiente end
   where id = el_producto;
  return el_producto;
end
$$;

create or replace function public.menu_escribir_precios_del_producto(
  el_local uuid, el_producto uuid, lista jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  la_presentacion uuid;
begin
  for item in select value from jsonb_array_elements(coalesce(lista, '[]'::jsonb)) loop
    la_presentacion := (item ->> 'presentacion_id')::uuid;
    if not exists (
      select 1 from public.presentaciones pre
        join public.productos p on p.categoria_id = pre.categoria_id
       where pre.id = la_presentacion and pre.activo and p.id = el_producto
    ) then
      raise exception 'Esa presentacion no es de la categoria del producto' using errcode = 'PM106';
    end if;
    perform public.menu_poner_precio(el_local, la_presentacion, el_producto,
                                     (item ->> 'monto_centavos')::bigint);
  end loop;
end
$$;

create or replace function public.menu_guardar_producto(datos jsonb, confirmar boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
  el_producto uuid := public.menu_escribir_producto(el_local, datos);
  pide_visible boolean := coalesce((datos ->> 'visible')::boolean, false);
  ocultados jsonb := '[]'::jsonb;
begin
  perform public.menu_escribir_precios_del_producto(el_local, el_producto, datos -> 'precios');
  if pide_visible and not public.tiene_precio(el_producto) then
    if not confirmar then
      raise exception 'El producto queda sin precio'
        using errcode = 'PM101', detail = jsonb_build_array(datos ->> 'nombre')::text;
    end if;
    ocultados := jsonb_build_array(datos ->> 'nombre');
  end if;
  update public.productos set visible = pide_visible and public.tiene_precio(el_producto)
   where id = el_producto;
  return jsonb_build_object('id', el_producto, 'ocultados', ocultados);
end
$$;

-- Solo las dos de guardar se llaman desde la aplicacion; el resto son piezas internas.
revoke all on function
  public.menu_exigir_admin(),
  public.tiene_precio(uuid),
  public.menu_validar_foto(text, uuid),
  public.menu_poner_precio(uuid, uuid, uuid, bigint),
  public.menu_ocultar_sin_precio(uuid[], boolean),
  public.menu_escribir_categoria(uuid, jsonb),
  public.menu_escribir_presentaciones(uuid, uuid, jsonb),
  public.menu_guardar_categoria(jsonb, boolean),
  public.menu_escribir_producto(uuid, jsonb),
  public.menu_escribir_precios_del_producto(uuid, uuid, jsonb),
  public.menu_guardar_producto(jsonb, boolean)
  from public, anon, authenticated;
grant execute on function
  public.menu_guardar_categoria(jsonb, boolean),
  public.menu_guardar_producto(jsonb, boolean)
  to authenticated;

-- Menu (3b de 5): mostrar u ocultar, ordenar, desactivar y reactivar categorias y productos.
-- Lo reactivado vuelve oculto y ultimo, para que el admin lo revise antes de mostrarlo.

-- Sin SQL dinamico: EXECUTE no actualiza FOUND, y cada rama queda a la vista.
create or replace function public.menu_no_encontrado()
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'No encontramos eso en el menu' using errcode = 'PM100';
end
$$;

create or replace function public.menu_cambiar_visibilidad(el_tipo text, el_id uuid, mostrar boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
begin
  if el_tipo = 'categoria' then
    update public.categorias set visible = mostrar
     where id = el_id and local_id = el_local and activo;
  else
    if mostrar and not public.tiene_precio(el_id) then
      raise exception 'Cargale un precio para mostrarlo' using errcode = 'PM102';
    end if;
    update public.productos set visible = mostrar
     where id = el_id and local_id = el_local and activo;
  end if;
  if not found then
    perform public.menu_no_encontrado();
  end if;
end
$$;

-- Los hermanos de una categoria son las categorias activas del local; los de un producto, los
-- productos activos de su categoria.
create or replace function public.menu_vecino(el_tipo text, el_id uuid, direccion text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  el_vecino uuid;
begin
  if el_tipo = 'categoria' then
    select v.id into el_vecino from public.categorias c
      join public.categorias v on v.local_id = c.local_id and v.activo and v.id <> c.id
     where c.id = el_id
       and case when direccion = 'arriba' then v.orden < c.orden else v.orden > c.orden end
     order by case when direccion = 'arriba' then -v.orden else v.orden end
     limit 1;
  else
    select v.id into el_vecino from public.productos p
      join public.productos v on v.categoria_id = p.categoria_id and v.activo and v.id <> p.id
     where p.id = el_id
       and case when direccion = 'arriba' then v.orden < p.orden else v.orden > p.orden end
     order by case when direccion = 'arriba' then -v.orden else v.orden end
     limit 1;
  end if;
  return el_vecino;
end
$$;

create or replace function public.menu_intercambiar_orden(el_tipo text, uno uuid, otro uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if el_tipo = 'categoria' then
    update public.categorias c set orden = o.orden
      from public.categorias o
     where (c.id, o.id) in ((uno, otro), (otro, uno));
  else
    update public.productos p set orden = o.orden
      from public.productos o
     where (p.id, o.id) in ((uno, otro), (otro, uno));
  end if;
end
$$;

create or replace function public.menu_mover(el_tipo text, el_id uuid, direccion text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
  el_vecino uuid;
begin
  if not exists (select 1 from public.categorias where id = el_id and local_id = el_local and activo)
     and not exists (select 1 from public.productos where id = el_id and local_id = el_local and activo) then
    perform public.menu_no_encontrado();
  end if;
  el_vecino := public.menu_vecino(el_tipo, el_id, direccion);
  if el_vecino is not null then
    perform public.menu_intercambiar_orden(el_tipo, el_id, el_vecino);
  end if;
end
$$;

create or replace function public.menu_desactivar(el_tipo text, el_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
  activos jsonb;
begin
  if el_tipo = 'categoria' then
    select coalesce(jsonb_agg(p.nombre order by p.orden, p.id), '[]'::jsonb) into activos
      from public.productos p
     -- Con el local: al admin de otro local no se le cuentan los productos de este.
     where p.categoria_id = el_id and p.local_id = el_local and p.activo;
    if jsonb_array_length(activos) > 0 then
      raise exception 'La categoria tiene productos activos'
        using errcode = 'PM103', detail = activos::text;
    end if;
    update public.categorias set activo = false, visible = false
     where id = el_id and local_id = el_local and activo;
  else
    update public.productos set activo = false, visible = false
     where id = el_id and local_id = el_local and activo;
  end if;
  if not found then
    perform public.menu_no_encontrado();
  end if;
end
$$;

create or replace function public.menu_reactivar(el_tipo text, el_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
begin
  if el_tipo = 'categoria' then
    update public.categorias
       set activo = true, visible = false,
           orden = (select coalesce(max(c.orden) + 1, 0) from public.categorias c where c.local_id = el_local)
     where id = el_id and local_id = el_local and not activo;
  else
    if exists (select 1 from public.productos p join public.categorias c on c.id = p.categoria_id
                where p.id = el_id and p.local_id = el_local and not c.activo) then
      raise exception 'Reactiva primero la categoria' using errcode = 'PM104';
    end if;
    update public.productos p
       set activo = true, visible = false,
           orden = (select coalesce(max(o.orden) + 1, 0) from public.productos o where o.categoria_id = p.categoria_id)
     where p.id = el_id and p.local_id = el_local and not p.activo;
  end if;
  if not found then
    raise exception 'No encontramos eso entre lo desactivado' using errcode = 'PM100';
  end if;
end
$$;

revoke all on function
  public.menu_no_encontrado(),
  public.menu_intercambiar_orden(text, uuid, uuid),
  public.menu_vecino(text, uuid, text),
  public.menu_cambiar_visibilidad(text, uuid, boolean),
  public.menu_mover(text, uuid, text),
  public.menu_desactivar(text, uuid),
  public.menu_reactivar(text, uuid)
  from public, anon, authenticated;
grant execute on function
  public.menu_cambiar_visibilidad(text, uuid, boolean),
  public.menu_mover(text, uuid, text),
  public.menu_desactivar(text, uuid),
  public.menu_reactivar(text, uuid)
  to authenticated;
