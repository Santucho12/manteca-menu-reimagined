-- Esquema completo de la base del Sistema Manteca, al dia con la ultima migracion
-- (20261012120000_revision_fase_1). Se actualiza en el mismo cambio que cada
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

-- Menu (3c de 5): aplicar un aumento masivo. El servidor calcula los precios nuevos con la
-- misma funcion que arma la vista previa; la base comprueba que la lista sea exactamente la de
-- hoy y que nadie haya cambiado un precio en el medio. Si no, no aplica nada.

create or replace function public.menu_precios_del_alcance(el_local uuid, la_categoria uuid)
returns table (id uuid, monto_centavos bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.id, pr.monto_centavos
    from public.precios pr
    join public.presentaciones pre on pre.id = pr.presentacion_id and pre.activo
    join public.categorias c on c.id = pre.categoria_id and c.activo
    left join public.productos p on p.id = pr.producto_id
   where pr.activo and pr.local_id = el_local
     and (la_categoria is null or c.id = la_categoria)
     and (pr.producto_id is null or (p.activo and p.categoria_id = pre.categoria_id))
$$;

create or replace function public.menu_aumento_vigente(el_local uuid, la_categoria uuid, recibidos jsonb)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with lista as (
    select (r ->> 'id')::uuid as id, (r ->> 'antes_centavos')::bigint as antes
      from jsonb_array_elements(coalesce(recibidos, '[]'::jsonb)) r
  ), actuales as (
    select * from public.menu_precios_del_alcance(el_local, la_categoria)
  )
  select (select count(*) from lista) = (select count(distinct id) from lista)
     and (select count(*) from lista) > 0
     and not exists (
       select 1 from actuales a full join lista l on l.id = a.id
        where a.id is null or l.id is null or a.monto_centavos <> l.antes
     )
$$;

create or replace function public.menu_aplicar_aumento(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
  la_categoria uuid := nullif(datos ->> 'categoria_id', '')::uuid;
  el_aumento uuid;
begin
  if la_categoria is not null and not exists (
    select 1 from public.categorias c where c.id = la_categoria and c.local_id = el_local and c.activo
  ) then
    raise exception 'La categoria no existe o esta desactivada' using errcode = 'PM106';
  end if;
  -- Traba los precios del local: otro admin no los cambia entre la comprobacion y el cambio.
  perform 1 from public.precios pr where pr.local_id = el_local for update;
  if not public.menu_aumento_vigente(el_local, la_categoria, datos -> 'precios') then
    raise exception 'Los precios cambiaron desde la vista previa' using errcode = 'PM105';
  end if;
  insert into public.aumentos (local_id, porcentaje, redondeo_centavos, categoria_id, usuario_id)
  values (el_local, (datos ->> 'porcentaje')::integer, (datos ->> 'redondeo_centavos')::bigint,
          la_categoria, (select auth.uid()))
  returning id into el_aumento;
  update public.precios pr set monto_centavos = (r ->> 'despues_centavos')::bigint
    from jsonb_array_elements(datos -> 'precios') r
   where pr.id = (r ->> 'id')::uuid;
  return el_aumento;
end
$$;

revoke all on function
  public.menu_precios_del_alcance(uuid, uuid),
  public.menu_aumento_vigente(uuid, uuid, jsonb),
  public.menu_aplicar_aumento(jsonb)
  from public, anon, authenticated;
grant execute on function public.menu_aplicar_aumento(jsonb) to authenticated;

-- Menu (4 de 5): lo unico que lee el visitante. Corre con los permisos de su duenio para
-- saltear RLS a proposito: el filtro de lo publico esta en la definicion (visible, activo, con
-- precio y del local principal). El aviso de Supabase por una vista asi queda explicado aca.
-- No llama funciones: una funcion correria con los permisos del visitante.

create or replace view public.menu_publico
with (security_invoker = false)
as
select c.id as categoria_id,
       c.nombre as categoria,
       c.subtitulo,
       c.foto,
       c.icono,
       c.orden as orden_categoria,
       comun.lista as compartidos,
       p.id as producto_id,
       p.nombre,
       p.descripcion,
       p.etiqueta,
       p.orden,
       vigentes.lista as precios
  from public.categorias c
  join public.productos p on p.categoria_id = c.id and p.visible and p.activo
  cross join lateral (
    select coalesce(
             jsonb_agg(jsonb_build_object('presentacion', pre.nombre, 'monto_centavos', pr.monto_centavos)
                       order by pre.orden, pre.id),
             '[]'::jsonb) as lista
      from public.presentaciones pre
      join public.precios pr on pr.presentacion_id = pre.id and pr.producto_id is null and pr.activo
     where pre.categoria_id = c.id and pre.activo
  ) comun
  cross join lateral (
    select jsonb_agg(jsonb_build_object(
             'presentacion', pre.nombre,
             'monto_centavos', coalesce(propio.monto_centavos, compartido.monto_centavos),
             'compartido', propio.monto_centavos is null)
           order by pre.orden, pre.id) as lista,
           count(coalesce(propio.monto_centavos, compartido.monto_centavos)) as con_precio
      from public.presentaciones pre
      left join public.precios propio
        on propio.presentacion_id = pre.id and propio.producto_id = p.id and propio.activo
      left join public.precios compartido
        on compartido.presentacion_id = pre.id and compartido.producto_id is null and compartido.activo
     where pre.categoria_id = c.id and pre.activo
  ) vigentes
 where c.visible and c.activo and vigentes.con_precio > 0
   -- El local principal. Con un segundo local se suma el filtro por dominio.
   and c.local_id = (select l.id from public.locales l order by l.fecha_creacion, l.id limit 1);

revoke all on table public.menu_publico from anon, authenticated;
grant select on table public.menu_publico to anon, authenticated;

-- Menu (5 de 5): carga inicial de datos, sin cambios de esquema. Ver
-- migrations/20261008120400_menu_carga_inicial.sql.

-- Menu: una presentacion que llega sin monto_compartido_centavos deja su precio compartido
-- como esta. El formulario manda solo los precios que la persona cambio: asi guardar un
-- formulario abierto antes de un aumento no lo revierte. Monto null sigue siendo "sacarlo".

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
    if item ? 'monto_compartido_centavos' then
      perform public.menu_poner_precio(el_local, la_presentacion, null,
                                       (item ->> 'monto_compartido_centavos')::bigint);
    end if;
    conservadas := conservadas || la_presentacion;
    posicion := posicion + 1;
  end loop;
  update public.presentaciones set activo = false
   where categoria_id = la_categoria and activo and not (id = any (conservadas));
end
$$;

revoke all on function public.menu_escribir_presentaciones(uuid, uuid, jsonb)
  from public, anon, authenticated;

-- Proveedores: a quien se le compra y como contactarlo. El admin activo los lee, carga y
-- cambia en su local; el local sale de la sesion (no se otorga la columna) y nadie borra:
-- un proveedor que no se usa mas se desactiva.

create table if not exists public.proveedores (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  nombre text not null check (char_length(nombre) between 1 and 100),
  -- Formato internacional sin el +: 549, caracteristica y numero.
  telefono text check (telefono is null or telefono ~ '^549[0-9]{10}$'),
  ubicacion text check (ubicacion is null or char_length(ubicacion) between 1 and 200),
  que_compra text check (que_compra is null or char_length(que_compra) between 1 and 200),
  observaciones text check (observaciones is null or char_length(observaciones) between 1 and 1000),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists proveedores_local_nombre on public.proveedores (local_id, nombre);

drop trigger if exists marcar_actualizacion on public.proveedores;
create trigger marcar_actualizacion before update on public.proveedores
  for each row execute function public.marcar_actualizacion();
drop trigger if exists auditar on public.proveedores;
create trigger auditar after insert or update on public.proveedores
  for each row execute function public.auditar();

alter table public.proveedores enable row level security;

revoke all on table public.proveedores from anon, authenticated;
grant select on table public.proveedores to authenticated;
grant insert (nombre, telefono, ubicacion, que_compra, observaciones)
  on table public.proveedores to authenticated;
grant update (nombre, telefono, ubicacion, que_compra, observaciones, activo)
  on table public.proveedores to authenticated;

drop policy if exists "proveedores: el admin activo ve los de su local" on public.proveedores;
create policy "proveedores: el admin activo ve los de su local" on public.proveedores
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "proveedores: el admin activo carga en su local" on public.proveedores;
create policy "proveedores: el admin activo carga en su local" on public.proveedores
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "proveedores: el admin activo cambia los de su local" on public.proveedores;
create policy "proveedores: el admin activo cambia los de su local" on public.proveedores
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Gastos: lo que sale, con sus categorias y las plantillas de los recurrentes. El admin activo
-- lee, carga y cambia lo de su local; el local sale de la sesion y nadie borra: un gasto se
-- anula con motivo. Las reglas que no se pueden saltear viven en los triggers.

do $$
begin
  create type public.medio_de_pago as enum ('efectivo_caja', 'transferencia', 'tarjeta', 'otro');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.frecuencia_de_gasto as enum ('mensual', 'bimestral', 'anual');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.categorias_de_gasto (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  nombre text not null check (char_length(nombre) between 1 and 60),
  pide_proveedor boolean not null default false,
  -- Sin clasificar: la usan los gastos que llegan de un cierre. No se elige ni se toca a mano.
  de_sistema boolean not null default false,
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create unique index if not exists categorias_de_gasto_nombre
  on public.categorias_de_gasto (local_id, lower(nombre));

create table if not exists public.gastos_recurrentes (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  categoria_id uuid not null references public.categorias_de_gasto (id),
  monto_centavos bigint not null check (monto_centavos > 0),
  descripcion text check (descripcion is null or char_length(descripcion) between 1 and 200),
  proveedor_id uuid references public.proveedores (id),
  medio_de_pago public.medio_de_pago not null,
  frecuencia public.frecuencia_de_gasto not null,
  -- Se repite cada 1, 2 o 12 meses desde aca, el mismo dia (o el ultimo del mes).
  primer_vencimiento date not null,
  activo boolean not null default true,
  creado_por uuid references public.perfiles (id) on delete set null default auth.uid(),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists gastos_recurrentes_local on public.gastos_recurrentes (local_id);

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  -- El dia en Argentina: define a que mes cuenta.
  fecha date not null,
  categoria_id uuid not null references public.categorias_de_gasto (id),
  monto_centavos bigint not null check (monto_centavos > 0),
  descripcion text check (descripcion is null or char_length(descripcion) between 1 and 200),
  proveedor_id uuid references public.proveedores (id),
  medio_de_pago public.medio_de_pago not null,
  comprobante text check (comprobante is null or char_length(comprobante) between 1 and 60),
  recurrente_id uuid references public.gastos_recurrentes (id),
  vencimiento date,
  anulado boolean not null default false,
  motivo_anulacion text check (motivo_anulacion is null or char_length(motivo_anulacion) <= 300),
  anulado_por uuid references public.perfiles (id) on delete set null,
  fecha_anulacion timestamptz,
  creado_por uuid references public.perfiles (id) on delete set null default auth.uid(),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  -- Un recurrente no se genera dos veces para el mismo vencimiento, aunque se haya anulado.
  constraint gastos_recurrente_vencimiento unique (recurrente_id, vencimiento)
);

create index if not exists gastos_local_fecha on public.gastos (local_id, fecha desc);
create index if not exists gastos_proveedor_fecha on public.gastos (proveedor_id, fecha);
create index if not exists gastos_categoria on public.gastos (categoria_id);

-- Reglas

create or replace function public.gastos_validar_categoria_y_proveedor(
  el_local uuid, la_categoria uuid, el_proveedor uuid, proveedor_anterior uuid
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.categorias_de_gasto c
                  where c.id = la_categoria and c.local_id = el_local and c.activo and not c.de_sistema) then
    raise exception 'Esa categoria no esta disponible' using errcode = 'PG201';
  end if;
  if el_proveedor is null and exists (select 1 from public.categorias_de_gasto c
                                       where c.id = la_categoria and c.pide_proveedor) then
    raise exception 'Esta categoria pide un proveedor' using errcode = 'PG202';
  end if;
  if el_proveedor is not null and el_proveedor is distinct from proveedor_anterior
     and not exists (select 1 from public.proveedores p
                      where p.id = el_proveedor and p.local_id = el_local and p.activo) then
    raise exception 'Ese proveedor no esta disponible' using errcode = 'PG203';
  end if;
end
$$;

create or replace function public.reglas_de_gastos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.anulado then
    raise exception 'Un gasto anulado no se cambia' using errcode = 'PG204';
  end if;
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
    return new;
  end if;
  -- Lo que genera un recurrente se copia de su plantilla, aunque la categoria ya no se use.
  if tg_op = 'INSERT' and new.recurrente_id is not null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

create or replace function public.reglas_de_recurrentes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

create or replace function public.reglas_de_categorias_de_gasto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.de_sistema and (new.nombre is distinct from old.nombre or new.activo is distinct from old.activo) then
    raise exception 'Sin clasificar no se cambia' using errcode = 'PG206';
  end if;
  return new;
end
$$;

-- Triggers

drop trigger if exists reglas on public.gastos;
create trigger reglas before insert or update on public.gastos
  for each row execute function public.reglas_de_gastos();
drop trigger if exists reglas on public.gastos_recurrentes;
create trigger reglas before insert or update on public.gastos_recurrentes
  for each row execute function public.reglas_de_recurrentes();
drop trigger if exists reglas on public.categorias_de_gasto;
create trigger reglas before update on public.categorias_de_gasto
  for each row execute function public.reglas_de_categorias_de_gasto();

drop trigger if exists marcar_actualizacion on public.gastos;
create trigger marcar_actualizacion before update on public.gastos
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.gastos_recurrentes;
create trigger marcar_actualizacion before update on public.gastos_recurrentes
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.categorias_de_gasto;
create trigger marcar_actualizacion before update on public.categorias_de_gasto
  for each row execute function public.marcar_actualizacion();

drop trigger if exists auditar on public.gastos;
create trigger auditar after insert or update on public.gastos
  for each row execute function public.auditar('anulado_por', 'fecha_anulacion');
drop trigger if exists auditar on public.gastos_recurrentes;
create trigger auditar after insert or update on public.gastos_recurrentes
  for each row execute function public.auditar();
drop trigger if exists auditar on public.categorias_de_gasto;
create trigger auditar after insert or update on public.categorias_de_gasto
  for each row execute function public.auditar();

revoke all on function
  public.gastos_validar_categoria_y_proveedor(uuid, uuid, uuid, uuid),
  public.reglas_de_gastos(),
  public.reglas_de_recurrentes(),
  public.reglas_de_categorias_de_gasto()
  from public, anon, authenticated;

-- Permisos

alter table public.categorias_de_gasto enable row level security;
alter table public.gastos_recurrentes enable row level security;
alter table public.gastos enable row level security;

revoke all on table public.categorias_de_gasto, public.gastos_recurrentes, public.gastos
  from anon, authenticated;
grant select on table public.categorias_de_gasto, public.gastos_recurrentes, public.gastos
  to authenticated;
grant insert (nombre, pide_proveedor) on table public.categorias_de_gasto to authenticated;
grant update (nombre, pide_proveedor, activo) on table public.categorias_de_gasto to authenticated;
grant insert (categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago, frecuencia,
              primer_vencimiento)
  on table public.gastos_recurrentes to authenticated;
grant update (categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago, frecuencia,
              primer_vencimiento, activo)
  on table public.gastos_recurrentes to authenticated;
grant insert (fecha, categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago, comprobante)
  on table public.gastos to authenticated;
grant update (fecha, categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago, comprobante,
              anulado, motivo_anulacion)
  on table public.gastos to authenticated;

drop policy if exists "categorias_de_gasto: el admin activo ve las de su local" on public.categorias_de_gasto;
create policy "categorias_de_gasto: el admin activo ve las de su local" on public.categorias_de_gasto
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "categorias_de_gasto: el admin activo carga en su local" on public.categorias_de_gasto;
create policy "categorias_de_gasto: el admin activo carga en su local" on public.categorias_de_gasto
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "categorias_de_gasto: el admin activo cambia las de su local" on public.categorias_de_gasto;
create policy "categorias_de_gasto: el admin activo cambia las de su local" on public.categorias_de_gasto
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "gastos_recurrentes: el admin activo ve los de su local" on public.gastos_recurrentes;
create policy "gastos_recurrentes: el admin activo ve los de su local" on public.gastos_recurrentes
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos_recurrentes: el admin activo carga en su local" on public.gastos_recurrentes;
create policy "gastos_recurrentes: el admin activo carga en su local" on public.gastos_recurrentes
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos_recurrentes: el admin activo cambia los de su local" on public.gastos_recurrentes;
create policy "gastos_recurrentes: el admin activo cambia los de su local" on public.gastos_recurrentes
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "gastos: el admin activo ve los de su local" on public.gastos;
create policy "gastos: el admin activo ve los de su local" on public.gastos
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos: el admin activo carga en su local" on public.gastos;
create policy "gastos: el admin activo carga en su local" on public.gastos
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos: el admin activo cambia los de su local" on public.gastos;
create policy "gastos: el admin activo cambia los de su local" on public.gastos
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Las categorias de arranque, en cada local. Un local nuevo las recibe al crearse con la
-- misma consulta (cuando exista el alta de locales).
insert into public.categorias_de_gasto (local_id, nombre, pide_proveedor, de_sistema)
select l.id, c.nombre, c.pide_proveedor, c.de_sistema
  from public.locales l
 cross join (values
   ('Mercadería', true, false), ('Alquiler', false, false), ('Servicios', false, false),
   ('Sueldos', false, false), ('Impuestos', false, false), ('Mantenimiento', false, false),
   ('Otros', false, false), ('Sin clasificar', false, true)
 ) as c (nombre, pide_proveedor, de_sistema)
on conflict do nothing;

-- Generacion de los gastos recurrentes: crea los vencimientos que falten hasta una fecha. La
-- corre pg_cron todos los dias a las 3 de Argentina y el servidor al abrir Gastos, con la
-- clave secreta: es un proceso sin usuario y los gastos quedan a nombre del sistema.

create extension if not exists pg_cron;

create or replace function public.generar_gastos_recurrentes(hasta date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  creados integer;
begin
  -- Cada vencimiento sale del primero mas k periodos, no del anterior: asi el 31 de enero
  -- pasa al 28 de febrero y vuelve al 31 en marzo.
  insert into public.gastos (local_id, fecha, categoria_id, monto_centavos, descripcion,
                             proveedor_id, medio_de_pago, recurrente_id, vencimiento, creado_por)
  select r.local_id, v.vencimiento, r.categoria_id, r.monto_centavos, r.descripcion,
         r.proveedor_id, r.medio_de_pago, r.id, v.vencimiento, null
    from public.gastos_recurrentes r
   cross join lateral (
     select (r.primer_vencimiento + make_interval(months => k * case r.frecuencia
               when 'mensual' then 1 when 'bimestral' then 2 else 12 end))::date as vencimiento
       from generate_series(0, 1200) as k
   ) v
   where r.activo and v.vencimiento <= hasta
  on conflict (recurrente_id, vencimiento) do nothing;
  get diagnostics creados = row_count;
  return creados;
end
$$;

revoke all on function public.generar_gastos_recurrentes(date) from public, anon, authenticated;
grant execute on function public.generar_gastos_recurrentes(date) to service_role;

select cron.unschedule(jobid) from cron.job where jobname = 'generar-gastos-recurrentes';
select cron.schedule(
  'generar-gastos-recurrentes',
  '0 6 * * *',
  $$select public.generar_gastos_recurrentes((now() at time zone 'America/Argentina/Buenos_Aires')::date)$$
);

-- Totales de gastos sin lo anulado: el de la lista filtrada y lo pagado a cada proveedor.
-- Son security invoker: suman solo lo que RLS deja ver a quien pregunta.

create or replace function public.gastos_total(
  desde date, hasta date, la_categoria uuid default null, el_proveedor uuid default null
)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(g.monto_centavos), 0)::bigint
    from public.gastos g
   where not g.anulado
     and g.fecha between desde and hasta
     and (la_categoria is null or g.categoria_id = la_categoria)
     and (el_proveedor is null or g.proveedor_id = el_proveedor)
$$;

create or replace function public.gastos_pagado_por_proveedor(desde date, hasta date)
returns table (proveedor_id uuid, total_centavos bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select g.proveedor_id, sum(g.monto_centavos)::bigint
    from public.gastos g
   where not g.anulado and g.proveedor_id is not null and g.fecha between desde and hasta
   group by g.proveedor_id
$$;

revoke all on function public.gastos_total(date, date, uuid, uuid) from public, anon;
revoke all on function public.gastos_pagado_por_proveedor(date, date) from public, anon;
grant execute on function public.gastos_total(date, date, uuid, uuid) to authenticated;
grant execute on function public.gastos_pagado_por_proveedor(date, date) to authenticated;

-- Un recurrente reactivado genera desde el dia en que se reactivo: lo que vencio mientras
-- estaba desactivado no aparece de golpe. La fecha la pone la base, en dia de Argentina.

alter table public.gastos_recurrentes add column if not exists generar_desde date;

create or replace function public.reglas_de_recurrentes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.activo and not old.activo then
    new.generar_desde := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  end if;
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

create or replace function public.generar_gastos_recurrentes(hasta date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  creados integer;
begin
  -- Cada vencimiento sale del primero mas k periodos, no del anterior: asi el 31 de enero
  -- pasa al 28 de febrero y vuelve al 31 en marzo.
  insert into public.gastos (local_id, fecha, categoria_id, monto_centavos, descripcion,
                             proveedor_id, medio_de_pago, recurrente_id, vencimiento, creado_por)
  select r.local_id, v.vencimiento, r.categoria_id, r.monto_centavos, r.descripcion,
         r.proveedor_id, r.medio_de_pago, r.id, v.vencimiento, null
    from public.gastos_recurrentes r
   cross join lateral (
     select (r.primer_vencimiento + make_interval(months => k * case r.frecuencia
               when 'mensual' then 1 when 'bimestral' then 2 else 12 end))::date as vencimiento
       from generate_series(0, 1200) as k
   ) v
   where r.activo and v.vencimiento <= hasta
     and (r.generar_desde is null or v.vencimiento >= r.generar_desde)
  on conflict (recurrente_id, vencimiento) do nothing;
  get diagnostics creados = row_count;
  return creados;
end
$$;

revoke all on function public.generar_gastos_recurrentes(date) from public, anon, authenticated;
grant execute on function public.generar_gastos_recurrentes(date) to service_role;

-- Cierres de caja: lo que declara Caja al final del dia, sus retiros y los gastos pagados con
-- la caja, que pasan a Gastos como "Sin clasificar". Se guarda todo junto con una funcion;
-- Caja ve solo los suyos y el admin los revisa y los anula. Lo esperado llega con Ventas.

do $$
begin
  create type public.estado_de_cierre as enum
    ('esperando_ventas', 'cierra', 'con_diferencia', 'revisado', 'anulado');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.cierres_de_caja (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  -- El dia en Argentina al que corresponde la caja.
  fecha date not null,
  cargado_por uuid not null references public.perfiles (id) default auth.uid(),
  fondo_inicial_centavos bigint not null check (fondo_inicial_centavos >= 0),
  efectivo_centavos bigint not null check (efectivo_centavos >= 0),
  credito_centavos bigint not null default 0 check (credito_centavos >= 0),
  debito_centavos bigint not null default 0 check (debito_centavos >= 0),
  qr_centavos bigint not null default 0 check (qr_centavos >= 0),
  transferencia_centavos bigint not null default 0 check (transferencia_centavos >= 0),
  queda_en_caja_centavos bigint not null check (queda_en_caja_centavos >= 0),
  comentario text check (comentario is null or char_length(comentario) <= 500),
  estado public.estado_de_cierre not null default 'esperando_ventas',
  -- Lo esperado lo completa el recalculo con las ventas del dia; hasta entonces, nulo.
  esperado_efectivo_centavos bigint,
  esperado_credito_centavos bigint,
  esperado_debito_centavos bigint,
  esperado_qr_centavos bigint,
  esperado_transferencia_centavos bigint,
  revisado boolean not null default false,
  revisado_por uuid references public.perfiles (id) on delete set null,
  fecha_revision timestamptz,
  comentario_revision text check (comentario_revision is null or char_length(comentario_revision) <= 500),
  anulado boolean not null default false,
  motivo_anulacion text check (motivo_anulacion is null or char_length(motivo_anulacion) <= 300),
  anulado_por uuid references public.perfiles (id) on delete set null,
  fecha_anulacion timestamptz,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

-- Un cierre por dia; el anulado deja libre el dia.
create unique index if not exists cierres_de_caja_un_dia
  on public.cierres_de_caja (local_id, fecha) where not anulado;
create index if not exists cierres_de_caja_local_fecha on public.cierres_de_caja (local_id, fecha desc);
create index if not exists cierres_de_caja_cargado_por on public.cierres_de_caja (cargado_por);

create table if not exists public.retiros_de_caja (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  cierre_id uuid not null references public.cierres_de_caja (id),
  monto_centavos bigint not null check (monto_centavos > 0),
  quien text not null check (char_length(quien) between 1 and 80),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists retiros_de_caja_cierre on public.retiros_de_caja (cierre_id);

create table if not exists public.configuracion_de_caja (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null unique references public.locales (id),
  tolerancia_centavos bigint not null default 50000 check (tolerancia_centavos >= 0),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

alter table public.gastos add column if not exists cierre_id uuid references public.cierres_de_caja (id);
create index if not exists gastos_cierre on public.gastos (cierre_id);

-- Quien puede cargar un cierre

create or replace function public.es_caja_activa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'caja' and activo
  )
$$;

create or replace function public.cierres_exigir_quien_carga()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.es_caja_activa() or public.es_admin_activo()) then
    raise exception 'No tenes permiso para cargar cierres' using errcode = '42501';
  end if;
end
$$;

-- Guardar: el cierre, sus retiros y sus gastos, o nada

create or replace function public.cierres_insertar(el_local uuid, datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo uuid;
begin
  insert into public.cierres_de_caja (local_id, fecha, cargado_por, fondo_inicial_centavos,
    efectivo_centavos, credito_centavos, debito_centavos, qr_centavos, transferencia_centavos,
    queda_en_caja_centavos, comentario)
  values (el_local, (datos ->> 'fecha')::date, (select auth.uid()),
    (datos ->> 'fondo_inicial_centavos')::bigint, (datos ->> 'efectivo_centavos')::bigint,
    coalesce((datos ->> 'credito_centavos')::bigint, 0), coalesce((datos ->> 'debito_centavos')::bigint, 0),
    coalesce((datos ->> 'qr_centavos')::bigint, 0), coalesce((datos ->> 'transferencia_centavos')::bigint, 0),
    (datos ->> 'queda_en_caja_centavos')::bigint, nullif(trim(datos ->> 'comentario'), ''))
  returning id into nuevo;
  return nuevo;
exception
  when unique_violation then
    raise exception 'Ya hay un cierre de ese dia' using errcode = 'PC302';
end
$$;

create or replace function public.cierres_guardar(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_fecha date := (datos ->> 'fecha')::date;
  nuevo uuid;
begin
  perform public.cierres_exigir_quien_carga();
  if la_fecha > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    raise exception 'No se carga el cierre de un dia que no llego' using errcode = 'PC301';
  end if;
  nuevo := public.cierres_insertar(el_local, datos);
  insert into public.retiros_de_caja (local_id, cierre_id, monto_centavos, quien)
  select el_local, nuevo, (r ->> 'monto_centavos')::bigint, trim(r ->> 'quien')
    from jsonb_array_elements(coalesce(datos -> 'retiros', '[]')) r;
  insert into public.gastos (local_id, fecha, categoria_id, monto_centavos, descripcion,
                             medio_de_pago, cierre_id)
  select el_local, la_fecha, c.id, (g ->> 'monto_centavos')::bigint, trim(g ->> 'descripcion'),
         'efectivo_caja', nuevo
    from jsonb_array_elements(coalesce(datos -> 'gastos', '[]')) g
   cross join public.categorias_de_gasto c
   where c.local_id = el_local and c.de_sistema;
  return nuevo;
end
$$;

-- Lo que quedo en la caja en el ultimo cierre anterior: precarga el fondo inicial.
create or replace function public.cierres_fondo_sugerido(la_fecha date)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.cierres_exigir_quien_carga();
  return (select c.queda_en_caja_centavos from public.cierres_de_caja c
           where c.local_id = public.local_del_usuario() and not c.anulado and c.fecha < la_fecha
           order by c.fecha desc limit 1);
end
$$;

-- Reglas de un cierre guardado: se revisa o se anula, nada mas

create or replace function public.reglas_de_cierres()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.anulado then
    raise exception 'Un cierre anulado no se cambia' using errcode = 'PC303';
  end if;
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PC304';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
    new.estado := 'anulado';
  elsif new.revisado and not old.revisado then
    new.revisado_por := (select auth.uid());
    new.fecha_revision := now();
    new.estado := 'revisado';
  end if;
  return new;
end
$$;

-- Anular un cierre anula los gastos que salieron de el.
create or replace function public.anular_gastos_del_cierre()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.anulado and not old.anulado then
    perform set_config('manteca.anulando_cierre', 'si', true);
    update public.gastos
       set anulado = true, motivo_anulacion = 'Se anulo el cierre de caja: ' || new.motivo_anulacion
     where cierre_id = new.id and not anulado;
    perform set_config('manteca.anulando_cierre', '', true);
  end if;
  return new;
end
$$;

-- Gastos: el que salio de un cierre se clasifica, pero su plata se corrige desde el cierre.
create or replace function public.reglas_de_gastos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.anulado then
    raise exception 'Un gasto anulado no se cambia' using errcode = 'PG204';
  end if;
  if tg_op = 'UPDATE' and old.cierre_id is not null then
    if new.monto_centavos <> old.monto_centavos or new.fecha <> old.fecha
       or new.medio_de_pago <> old.medio_de_pago then
      raise exception 'El monto de un gasto de caja se corrige anulando el cierre' using errcode = 'PC305';
    end if;
    if new.anulado and coalesce(current_setting('manteca.anulando_cierre', true), '') <> 'si' then
      raise exception 'Un gasto de caja se anula anulando el cierre' using errcode = 'PC306';
    end if;
  end if;
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
    return new;
  end if;
  -- Lo que genera un recurrente o un cierre entra tal cual, aunque sea "Sin clasificar".
  if tg_op = 'INSERT' and (new.recurrente_id is not null or new.cierre_id is not null) then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

-- Triggers

drop trigger if exists reglas on public.cierres_de_caja;
create trigger reglas before update on public.cierres_de_caja
  for each row execute function public.reglas_de_cierres();
drop trigger if exists anular_gastos on public.cierres_de_caja;
create trigger anular_gastos after update on public.cierres_de_caja
  for each row execute function public.anular_gastos_del_cierre();

drop trigger if exists marcar_actualizacion on public.cierres_de_caja;
create trigger marcar_actualizacion before update on public.cierres_de_caja
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.retiros_de_caja;
create trigger marcar_actualizacion before update on public.retiros_de_caja
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.configuracion_de_caja;
create trigger marcar_actualizacion before update on public.configuracion_de_caja
  for each row execute function public.marcar_actualizacion();

drop trigger if exists auditar on public.cierres_de_caja;
create trigger auditar after insert or update on public.cierres_de_caja
  for each row execute function public.auditar('anulado_por', 'fecha_anulacion', 'revisado_por', 'fecha_revision', 'estado');
drop trigger if exists auditar on public.retiros_de_caja;
create trigger auditar after insert or update on public.retiros_de_caja
  for each row execute function public.auditar();
drop trigger if exists auditar on public.configuracion_de_caja;
create trigger auditar after insert or update on public.configuracion_de_caja
  for each row execute function public.auditar();

revoke all on function
  public.cierres_exigir_quien_carga(),
  public.cierres_insertar(uuid, jsonb),
  public.reglas_de_cierres(),
  public.anular_gastos_del_cierre(),
  public.reglas_de_gastos()
  from public, anon, authenticated;
revoke all on function public.cierres_guardar(jsonb) from public, anon;
revoke all on function public.cierres_fondo_sugerido(date) from public, anon;
revoke all on function public.es_caja_activa() from public, anon;
grant execute on function public.cierres_guardar(jsonb) to authenticated;
grant execute on function public.cierres_fondo_sugerido(date) to authenticated;
grant execute on function public.es_caja_activa() to authenticated;

-- Permisos

alter table public.cierres_de_caja enable row level security;
alter table public.retiros_de_caja enable row level security;
alter table public.configuracion_de_caja enable row level security;

revoke all on table public.cierres_de_caja, public.retiros_de_caja, public.configuracion_de_caja
  from anon, authenticated;
grant select on table public.cierres_de_caja, public.retiros_de_caja, public.configuracion_de_caja
  to authenticated;
grant update (revisado, comentario_revision, anulado, motivo_anulacion)
  on table public.cierres_de_caja to authenticated;
grant update (tolerancia_centavos) on table public.configuracion_de_caja to authenticated;

drop policy if exists "cierres_de_caja: el admin ve los de su local y caja los suyos" on public.cierres_de_caja;
create policy "cierres_de_caja: el admin ve los de su local y caja los suyos" on public.cierres_de_caja
  for select to authenticated
  using (
    ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
    or (cargado_por = (select auth.uid()) and (select public.es_caja_activa()))
  );
drop policy if exists "cierres_de_caja: el admin activo revisa y anula los de su local" on public.cierres_de_caja;
create policy "cierres_de_caja: el admin activo revisa y anula los de su local" on public.cierres_de_caja
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Los retiros se ven si se ve su cierre.
drop policy if exists "retiros_de_caja: se ven con su cierre" on public.retiros_de_caja;
create policy "retiros_de_caja: se ven con su cierre" on public.retiros_de_caja
  for select to authenticated
  using (exists (select 1 from public.cierres_de_caja c where c.id = cierre_id));

drop policy if exists "configuracion_de_caja: el admin activo ve la de su local" on public.configuracion_de_caja;
create policy "configuracion_de_caja: el admin activo ve la de su local" on public.configuracion_de_caja
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "configuracion_de_caja: el admin activo la cambia" on public.configuracion_de_caja;
create policy "configuracion_de_caja: el admin activo la cambia" on public.configuracion_de_caja
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- La tolerancia de arranque, $500, en cada local.
insert into public.configuracion_de_caja (local_id)
select l.id from public.locales l
on conflict (local_id) do nothing;

-- Caja ve los gastos que declaro en sus propios cierres, para leer su cierre completo. No
-- ve ningun otro gasto ni puede escribir en Gastos.

drop policy if exists "gastos: caja ve los de sus cierres" on public.gastos;
create policy "gastos: caja ve los de sus cierres" on public.gastos
  for select to authenticated
  using (
    cierre_id is not null
    and (select public.es_caja_activa())
    and exists (
      select 1 from public.cierres_de_caja c
       where c.id = cierre_id and c.cargado_por = (select auth.uid())
    )
  );

-- Ventas: las cargadas a mano y, cuando se conecte Fudo, las que entren por su API, con la
-- misma forma (origen, identificador externo, estado, renglones y pagos). El admin activo las
-- lee y anula las suyas; la venta a mano se guarda con una funcion que calcula los totales.

do $$
begin
  create type public.origen_de_venta as enum ('manual', 'fudo');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.estado_de_venta as enum ('cerrada', 'cancelada', 'en_curso');
exception
  when duplicate_object then null;
end
$$;

-- Los cinco medios del cierre de caja; cada medio de Fudo se vinculara a uno de estos.
do $$
begin
  create type public.medio_de_caja as enum ('efectivo', 'credito', 'debito', 'qr', 'transferencia');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.canales_de_venta (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  nombre text not null check (char_length(nombre) between 1 and 60),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create unique index if not exists canales_de_venta_nombre
  on public.canales_de_venta (local_id, lower(nombre));

create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  origen public.origen_de_venta not null default 'manual',
  -- El identificador de la venta en Fudo: traerla dos veces no la duplica.
  fudo_id text,
  -- El dia en Argentina en que se cerro la venta.
  fecha date not null,
  cerrada_en timestamptz default now(),
  estado public.estado_de_venta not null default 'cerrada',
  total_centavos bigint not null check (total_centavos >= 0),
  canal_id uuid references public.canales_de_venta (id),
  comentario text check (comentario is null or char_length(comentario) <= 500),
  anulado boolean not null default false,
  motivo_anulacion text check (motivo_anulacion is null or char_length(motivo_anulacion) <= 300),
  anulado_por uuid references public.perfiles (id) on delete set null,
  fecha_anulacion timestamptz,
  creado_por uuid references public.perfiles (id) on delete set null default auth.uid(),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  constraint ventas_fudo_id unique (local_id, fudo_id)
);

create index if not exists ventas_local_fecha on public.ventas (local_id, fecha desc);

create table if not exists public.renglones_de_venta (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  venta_id uuid not null references public.ventas (id),
  -- Nulo en una venta de Fudo cuyo producto todavia no se vinculo.
  producto_id uuid references public.productos (id),
  presentacion_id uuid references public.presentaciones (id),
  -- El nombre al momento de vender: si despues cambia, la venta no.
  descripcion text not null check (char_length(descripcion) between 1 and 200),
  cantidad numeric(12, 3) not null check (cantidad > 0),
  precio_unitario_centavos bigint not null check (precio_unitario_centavos >= 0),
  subtotal_centavos bigint not null check (subtotal_centavos >= 0),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists renglones_de_venta_venta on public.renglones_de_venta (venta_id);
create index if not exists renglones_de_venta_producto on public.renglones_de_venta (producto_id);

create table if not exists public.pagos_de_venta (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  venta_id uuid not null references public.ventas (id),
  medio public.medio_de_caja not null,
  monto_centavos bigint not null check (monto_centavos >= 0),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists pagos_de_venta_venta on public.pagos_de_venta (venta_id);

-- Guardar una venta a mano: la venta, sus renglones y su pago, o nada

create or replace function public.ventas_validar_manual(el_local uuid, datos jsonb)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para cargar ventas' using errcode = '42501';
  end if;
  if (datos ->> 'fecha')::date > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    raise exception 'No se carga una venta de un dia que no llego' using errcode = 'PV301';
  end if;
  if jsonb_array_length(coalesce(datos -> 'renglones', '[]')) = 0 then
    raise exception 'La venta no tiene productos' using errcode = 'PV302';
  end if;
  if not exists (select 1 from public.canales_de_venta c
                  where c.id = (datos ->> 'canal_id')::uuid and c.local_id = el_local and c.activo) then
    raise exception 'Ese canal no esta disponible' using errcode = 'PV303';
  end if;
  if exists (select 1 from jsonb_array_elements(datos -> 'renglones') r
              where not exists (
                select 1 from public.productos p
                  join public.presentaciones pr on pr.categoria_id = p.categoria_id
                 where p.id = (r ->> 'producto_id')::uuid and pr.id = (r ->> 'presentacion_id')::uuid
                   and p.local_id = el_local and p.activo and pr.activo)) then
    raise exception 'Ese producto no esta disponible' using errcode = 'PV304';
  end if;
end
$$;

create or replace function public.ventas_guardar_manual(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  el_total bigint;
  nueva uuid;
begin
  perform public.ventas_validar_manual(el_local, datos);
  -- Cada subtotal se redondea a centavos; el total es la suma de los subtotales.
  select coalesce(sum(round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)), 0)
    into el_total
    from jsonb_array_elements(datos -> 'renglones') r;
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, comentario)
  values (el_local, 'manual', (datos ->> 'fecha')::date, 'cerrada', el_total,
          (datos ->> 'canal_id')::uuid, nullif(trim(datos ->> 'comentario'), ''))
  returning id into nueva;
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos)
  select el_local, nueva, p.id, pr.id, p.nombre || ' · ' || pr.nombre, (r ->> 'cantidad')::numeric,
         (r ->> 'precio_unitario_centavos')::bigint,
         round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)
    from jsonb_array_elements(datos -> 'renglones') r
    join public.productos p on p.id = (r ->> 'producto_id')::uuid
    join public.presentaciones pr on pr.id = (r ->> 'presentacion_id')::uuid;
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  values (el_local, nueva, (datos ->> 'medio')::public.medio_de_caja, el_total);
  return nueva;
end
$$;

-- Totales sin lo anulado: lo cobrado y, aparte, lo cancelado. Con un medio, solo lo pagado con el.
create or replace function public.ventas_totales(
  desde date, hasta date, el_origen text default null, el_medio text default null
)
returns table (cobrado_centavos bigint, cobradas bigint, cancelado_centavos bigint, canceladas bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with del_periodo as (
    select v.estado,
           case when el_medio is null then v.total_centavos
                else (select coalesce(sum(p.monto_centavos), 0) from public.pagos_de_venta p
                       where p.venta_id = v.id and p.medio::text = el_medio) end as monto
      from public.ventas v
     where not v.anulado and v.fecha between desde and hasta
       and (el_origen is null or v.origen::text = el_origen)
       and (el_medio is null or exists (select 1 from public.pagos_de_venta p
                                         where p.venta_id = v.id and p.medio::text = el_medio))
  )
  select coalesce(sum(monto) filter (where estado = 'cerrada'), 0)::bigint,
         count(*) filter (where estado = 'cerrada'),
         coalesce(sum(monto) filter (where estado = 'cancelada'), 0)::bigint,
         count(*) filter (where estado = 'cancelada')
    from del_periodo
$$;

-- Reglas: una venta guardada solo se anula, con motivo, y si es a mano

create or replace function public.reglas_de_ventas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.anulado then
    raise exception 'Una venta anulada no se cambia' using errcode = 'PV305';
  end if;
  if new.anulado then
    if old.origen = 'fudo' then
      raise exception 'Una venta de Fudo se corrige en Fudo' using errcode = 'PV307';
    end if;
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PV306';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
  end if;
  return new;
end
$$;

drop trigger if exists reglas on public.ventas;
create trigger reglas before update on public.ventas
  for each row execute function public.reglas_de_ventas();

drop trigger if exists marcar_actualizacion on public.ventas;
create trigger marcar_actualizacion before update on public.ventas
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.renglones_de_venta;
create trigger marcar_actualizacion before update on public.renglones_de_venta
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.pagos_de_venta;
create trigger marcar_actualizacion before update on public.pagos_de_venta
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.canales_de_venta;
create trigger marcar_actualizacion before update on public.canales_de_venta
  for each row execute function public.marcar_actualizacion();

drop trigger if exists auditar on public.ventas;
create trigger auditar after insert or update on public.ventas
  for each row execute function public.auditar('anulado_por', 'fecha_anulacion');
drop trigger if exists auditar on public.renglones_de_venta;
create trigger auditar after insert or update on public.renglones_de_venta
  for each row execute function public.auditar();
drop trigger if exists auditar on public.pagos_de_venta;
create trigger auditar after insert or update on public.pagos_de_venta
  for each row execute function public.auditar();
drop trigger if exists auditar on public.canales_de_venta;
create trigger auditar after insert or update on public.canales_de_venta
  for each row execute function public.auditar();

revoke all on function
  public.ventas_validar_manual(uuid, jsonb),
  public.reglas_de_ventas()
  from public, anon, authenticated;
revoke all on function public.ventas_guardar_manual(jsonb) from public, anon;
revoke all on function public.ventas_totales(date, date, text, text) from public, anon;
grant execute on function public.ventas_guardar_manual(jsonb) to authenticated;
grant execute on function public.ventas_totales(date, date, text, text) to authenticated;

-- Permisos

alter table public.canales_de_venta enable row level security;
alter table public.ventas enable row level security;
alter table public.renglones_de_venta enable row level security;
alter table public.pagos_de_venta enable row level security;

revoke all on table public.canales_de_venta, public.ventas, public.renglones_de_venta,
  public.pagos_de_venta from anon, authenticated;
grant select on table public.canales_de_venta, public.ventas, public.renglones_de_venta,
  public.pagos_de_venta to authenticated;
grant update (anulado, motivo_anulacion) on table public.ventas to authenticated;
grant insert (nombre) on table public.canales_de_venta to authenticated;
grant update (nombre, activo) on table public.canales_de_venta to authenticated;

drop policy if exists "ventas: el admin activo ve las de su local" on public.ventas;
create policy "ventas: el admin activo ve las de su local" on public.ventas
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "ventas: el admin activo anula las de su local" on public.ventas;
create policy "ventas: el admin activo anula las de su local" on public.ventas
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "renglones_de_venta: el admin activo ve los de su local" on public.renglones_de_venta;
create policy "renglones_de_venta: el admin activo ve los de su local" on public.renglones_de_venta
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "pagos_de_venta: el admin activo ve los de su local" on public.pagos_de_venta;
create policy "pagos_de_venta: el admin activo ve los de su local" on public.pagos_de_venta
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "canales_de_venta: el admin activo ve los de su local" on public.canales_de_venta;
create policy "canales_de_venta: el admin activo ve los de su local" on public.canales_de_venta
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "canales_de_venta: el admin activo carga en su local" on public.canales_de_venta;
create policy "canales_de_venta: el admin activo carga en su local" on public.canales_de_venta
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "canales_de_venta: el admin activo cambia los de su local" on public.canales_de_venta;
create policy "canales_de_venta: el admin activo cambia los de su local" on public.canales_de_venta
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Los canales de arranque, en cada local.
insert into public.canales_de_venta (local_id, nombre)
select l.id, c.nombre
  from public.locales l
 cross join (values ('Cheaf'), ('Encargo'), ('Venta a comercios'), ('Otro')) as c (nombre)
on conflict do nothing;

-- Ajustes de la revision de ventas: una clave de carga hace que la misma venta mandada dos
-- veces (un toque repetido, un reintento) devuelva la ya guardada en vez de crear otra; y los
-- totales suman tambien lo anulado, para mostrar el total de lo que se esta viendo.

alter table public.ventas add column if not exists clave uuid;
create unique index if not exists ventas_clave on public.ventas (local_id, clave);

create or replace function public.ventas_guardar_manual(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_clave uuid := (datos ->> 'clave')::uuid;
  el_total bigint;
  nueva uuid;
begin
  perform public.ventas_validar_manual(el_local, datos);
  select v.id into nueva from public.ventas v where v.local_id = el_local and v.clave = la_clave;
  if nueva is not null then
    return nueva;
  end if;
  -- Cada subtotal se redondea a centavos; el total es la suma de los subtotales.
  select coalesce(sum(round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)), 0)
    into el_total
    from jsonb_array_elements(datos -> 'renglones') r;
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, comentario, clave)
  values (el_local, 'manual', (datos ->> 'fecha')::date, 'cerrada', el_total,
          (datos ->> 'canal_id')::uuid, nullif(trim(datos ->> 'comentario'), ''), la_clave)
  returning id into nueva;
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos)
  select el_local, nueva, p.id, pr.id, p.nombre || ' · ' || pr.nombre, (r ->> 'cantidad')::numeric,
         (r ->> 'precio_unitario_centavos')::bigint,
         round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)
    from jsonb_array_elements(datos -> 'renglones') r
    join public.productos p on p.id = (r ->> 'producto_id')::uuid
    join public.presentaciones pr on pr.id = (r ->> 'presentacion_id')::uuid;
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  values (el_local, nueva, (datos ->> 'medio')::public.medio_de_caja, el_total);
  return nueva;
end
$$;

-- Cambia lo que devuelve: se borra y se vuelve a crear.
drop function if exists public.ventas_totales(date, date, text, text);
create function public.ventas_totales(
  desde date, hasta date, el_origen text default null, el_medio text default null
)
returns table (
  cobrado_centavos bigint, cobradas bigint, cancelado_centavos bigint, canceladas bigint,
  anulado_centavos bigint, anuladas bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with del_periodo as (
    select v.estado, v.anulado,
           case when el_medio is null then v.total_centavos
                else (select coalesce(sum(p.monto_centavos), 0) from public.pagos_de_venta p
                       where p.venta_id = v.id and p.medio::text = el_medio) end as monto
      from public.ventas v
     where v.fecha between desde and hasta
       and (el_origen is null or v.origen::text = el_origen)
       and (el_medio is null or exists (select 1 from public.pagos_de_venta p
                                         where p.venta_id = v.id and p.medio::text = el_medio))
  )
  select coalesce(sum(monto) filter (where estado = 'cerrada' and not anulado), 0)::bigint,
         count(*) filter (where estado = 'cerrada' and not anulado),
         coalesce(sum(monto) filter (where estado = 'cancelada' and not anulado), 0)::bigint,
         count(*) filter (where estado = 'cancelada' and not anulado),
         coalesce(sum(monto) filter (where anulado), 0)::bigint,
         count(*) filter (where anulado)
    from del_periodo
$$;

revoke all on function public.ventas_totales(date, date, text, text) from public, anon;
grant execute on function public.ventas_totales(date, date, text, text) to authenticated;

-- Reportes

create or replace function public.reportes_exigir_admin()
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para ver los reportes' using errcode = '42501';
  end if;
end
$$;

create or replace function public.reporte_ventas_por_dia(desde date, hasta date)
returns table (dia date, ventas bigint, monto_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.reportes_exigir_admin();
  return query
    select v.fecha, count(*), coalesce(sum(v.total_centavos), 0)::bigint
      from public.ventas v
     where v.local_id = public.local_del_usuario() and v.estado = 'cerrada' and not v.anulado
       and v.fecha between desde and hasta
     group by v.fecha
     order by v.fecha;
end
$$;

-- La categoria es la de hoy del producto. Un renglon sin producto (de Fudo, sin vincular)
-- queda con su descripcion y sin categoria.
create or replace function public.reporte_ventas_por_producto(desde date, hasta date)
returns table (
  producto_id uuid, producto text, categoria_id uuid, categoria text, presentacion text,
  cantidad numeric, monto_centavos bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.reportes_exigir_admin();
  return query
    select r.producto_id, coalesce(p.nombre, r.descripcion), c.id, c.nombre,
           coalesce(pr.nombre, ''), sum(r.cantidad), sum(r.subtotal_centavos)::bigint
      from public.renglones_de_venta r
      join public.ventas v on v.id = r.venta_id
      left join public.productos p on p.id = r.producto_id
      left join public.categorias c on c.id = p.categoria_id
      left join public.presentaciones pr on pr.id = r.presentacion_id
     where v.local_id = public.local_del_usuario() and v.estado = 'cerrada' and not v.anulado
       and v.fecha between desde and hasta
     group by r.producto_id, coalesce(p.nombre, r.descripcion), c.id, c.nombre,
              coalesce(pr.nombre, '')
     order by 7 desc, 2, 5, 1;
end
$$;

create or replace function public.reporte_ventas_por_categoria(desde date, hasta date)
returns table (categoria_id uuid, categoria text, ventas bigint, monto_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.reportes_exigir_admin();
  return query
    select c.id, coalesce(c.nombre, 'Sin vincular'), count(distinct v.id),
           sum(r.subtotal_centavos)::bigint
      from public.renglones_de_venta r
      join public.ventas v on v.id = r.venta_id
      left join public.productos p on p.id = r.producto_id
      left join public.categorias c on c.id = p.categoria_id
     where v.local_id = public.local_del_usuario() and v.estado = 'cerrada' and not v.anulado
       and v.fecha between desde and hasta
     group by c.id, c.nombre
     order by 4 desc, 2, 1;
end
$$;

create or replace function public.reporte_gastos(desde date, hasta date)
returns table (dia date, categoria_id uuid, categoria text, monto_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.reportes_exigir_admin();
  return query
    select g.fecha, g.categoria_id, cg.nombre, sum(g.monto_centavos)::bigint
      from public.gastos g
      join public.categorias_de_gasto cg on cg.id = g.categoria_id
     where g.local_id = public.local_del_usuario() and not g.anulado
       and g.fecha between desde and hasta
     group by g.fecha, g.categoria_id, cg.nombre
     order by g.fecha, cg.nombre, g.categoria_id;
end
$$;

revoke all on function public.reportes_exigir_admin() from public, anon;
revoke all on function public.reporte_ventas_por_dia(date, date) from public, anon;
revoke all on function public.reporte_ventas_por_producto(date, date) from public, anon;
revoke all on function public.reporte_ventas_por_categoria(date, date) from public, anon;
revoke all on function public.reporte_gastos(date, date) from public, anon;
grant execute on function public.reportes_exigir_admin() to authenticated;
grant execute on function public.reporte_ventas_por_dia(date, date) to authenticated;
grant execute on function public.reporte_ventas_por_producto(date, date) to authenticated;
grant execute on function public.reporte_ventas_por_categoria(date, date) to authenticated;
grant execute on function public.reporte_gastos(date, date) to authenticated;

-- Revision de la primera fase
alter table public.gastos add column if not exists clave uuid;
create unique index if not exists gastos_clave on public.gastos (local_id, clave);
grant insert (clave) on public.gastos to authenticated;

-- Un gasto viejo que ya tenia ese medio se puede seguir editando: solo se frena el cambio.
create or replace function public.gastos_exigir_medio(nuevo text, anterior text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if nuevo = 'efectivo_caja' and anterior is distinct from 'efectivo_caja' then
    raise exception 'El efectivo de la caja sale por el cierre del dia' using errcode = 'PG207';
  end if;
end
$$;

revoke all on function public.gastos_exigir_medio(text, text) from public, anon, authenticated;

create or replace function public.reglas_de_gastos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.anulado then
    raise exception 'Un gasto anulado no se cambia' using errcode = 'PG204';
  end if;
  if tg_op = 'UPDATE' and old.cierre_id is not null then
    if new.monto_centavos <> old.monto_centavos or new.fecha <> old.fecha
       or new.medio_de_pago <> old.medio_de_pago then
      raise exception 'El monto de un gasto de caja se corrige anulando el cierre' using errcode = 'PC305';
    end if;
    if new.anulado and coalesce(current_setting('manteca.anulando_cierre', true), '') <> 'si' then
      raise exception 'Un gasto de caja se anula anulando el cierre' using errcode = 'PC306';
    end if;
  end if;
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
    return new;
  end if;
  -- Lo que genera un recurrente entra con el medio de su plantilla; despues, como cualquiera.
  if new.cierre_id is null and not (tg_op = 'INSERT' and new.recurrente_id is not null) then
    perform public.gastos_exigir_medio(new.medio_de_pago::text,
      case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
  end if;
  -- Lo que genera un recurrente o un cierre entra tal cual, aunque sea "Sin clasificar".
  if tg_op = 'INSERT' and (new.recurrente_id is not null or new.cierre_id is not null) then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

create or replace function public.reglas_de_recurrentes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.gastos_exigir_medio(new.medio_de_pago::text,
    case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
  if tg_op = 'UPDATE' and new.activo and not old.activo then
    new.generar_desde := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  end if;
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

-- Para cada cierre, lo que quedo en la caja en el cierre sin anular anterior de su local. Solo
-- el admin: Caja lee sus cierres, no los de los demas.
create or replace function public.cierres_fondos_anteriores(ids uuid[])
returns table (id uuid, fondo_anterior_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para ver los cierres' using errcode = '42501';
  end if;
  return query
    select c.id,
           (select a.queda_en_caja_centavos from public.cierres_de_caja a
             where a.local_id = c.local_id and not a.anulado and a.fecha < c.fecha
             order by a.fecha desc limit 1)
      from public.cierres_de_caja c
     where c.id = any(ids);
end
$$;

revoke all on function public.cierres_fondos_anteriores(uuid[]) from public, anon;
grant execute on function public.cierres_fondos_anteriores(uuid[]) to authenticated;

-- Gastos fijos: la clave para que cargar dos veces el mismo fijo no lo duplique, el cambio de
-- fecha o de frecuencia que vale desde el proximo pago (antes volvia a cargar meses pasados) y
-- el total por tipo (lo que cargaron los fijos o lo que vino de la caja).

alter table public.gastos_recurrentes add column if not exists clave uuid unique;
grant insert (clave) on table public.gastos_recurrentes to authenticated;

create or replace function public.reglas_de_recurrentes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  -- Otra fecha u otra frecuencia arman otra serie: cuenta desde el proximo pago, y lo que ya
  -- paso no se vuelve a cargar.
  if tg_op = 'UPDATE' and (new.primer_vencimiento is distinct from old.primer_vencimiento
                           or new.frecuencia is distinct from old.frecuencia) then
    if new.primer_vencimiento <= hoy then
      raise exception 'El proximo pago tiene que ser despues de hoy' using errcode = 'PG208';
    end if;
    new.generar_desde := new.primer_vencimiento;
  end if;
  if tg_op = 'UPDATE' and new.activo and not old.activo then
    new.generar_desde := greatest(coalesce(new.generar_desde, hoy), hoy);
  end if;
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

revoke all on function public.reglas_de_recurrentes() from public, anon, authenticated;

drop function if exists public.gastos_total(date, date, uuid, uuid);

create or replace function public.gastos_total(
  desde date, hasta date, la_categoria uuid default null, el_proveedor uuid default null,
  el_tipo text default null
)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(g.monto_centavos), 0)::bigint
    from public.gastos g
   where not g.anulado
     and g.fecha between desde and hasta
     and (la_categoria is null or g.categoria_id = la_categoria)
     and (el_proveedor is null or g.proveedor_id = el_proveedor)
     and (el_tipo is null
          or (el_tipo = 'fijos' and g.recurrente_id is not null)
          or (el_tipo = 'caja' and g.cierre_id is not null))
$$;

revoke all on function public.gastos_total(date, date, uuid, uuid, text) from public, anon;
grant execute on function public.gastos_total(date, date, uuid, uuid, text) to authenticated;

-- Migracion 20261028150000_gastos_por_pagar (pedido 65).

-- Gastos por pagar: lo que se anota antes de pagarlo y lo que dejan los fijos el dia que
-- vencen. Pagar es cargar un gasto con por_pagar_id: la base copia los datos de lo por pagar
-- y no deja pagarlo dos veces. Los fijos dejan de cargar gastos pagados solos (pedido 65).

create table if not exists public.gastos_por_pagar (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  -- El dia en Argentina en que vence; puede haber pasado.
  vencimiento date not null,
  categoria_id uuid not null references public.categorias_de_gasto (id),
  monto_centavos bigint not null check (monto_centavos > 0),
  descripcion text check (descripcion is null or char_length(descripcion) between 1 and 200),
  proveedor_id uuid references public.proveedores (id),
  -- Si no se sabe al anotarlo, se elige al pagar.
  medio_de_pago public.medio_de_pago,
  comprobante text check (comprobante is null or char_length(comprobante) between 1 and 60),
  recurrente_id uuid references public.gastos_recurrentes (id),
  clave uuid,
  anulado boolean not null default false,
  motivo_anulacion text check (motivo_anulacion is null or char_length(motivo_anulacion) <= 300),
  anulado_por uuid references public.perfiles (id) on delete set null,
  fecha_anulacion timestamptz,
  creado_por uuid references public.perfiles (id) on delete set null default auth.uid(),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  -- Un fijo deja un solo por pagar por vencimiento, aunque se anule.
  constraint gastos_por_pagar_recurrente_vencimiento unique (recurrente_id, vencimiento)
);

create index if not exists gastos_por_pagar_local_vencimiento
  on public.gastos_por_pagar (local_id, vencimiento);
create unique index if not exists gastos_por_pagar_clave
  on public.gastos_por_pagar (local_id, clave);

alter table public.gastos
  add column if not exists por_pagar_id uuid references public.gastos_por_pagar (id);
-- Un solo pago vigente: anulado el pago, se puede volver a pagar.
create unique index if not exists gastos_un_pago_por_pagar
  on public.gastos (por_pagar_id) where not anulado;

-- Reglas

-- Cada vencimiento de un fijo sale del primero mas k periodos, como en la generacion.
create or replace function public.es_vencimiento_del_fijo(
  primero date, la_frecuencia public.frecuencia_de_gasto, el_dia date
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select exists (
    select 1 from generate_series(0, 1200) as k
     where (primero + make_interval(months => k * case la_frecuencia
              when 'mensual' then 1 when 'bimestral' then 2 else 12 end))::date = el_dia)
$$;

create or replace function public.reglas_de_por_pagar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fijo public.gastos_recurrentes;
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if tg_op = 'UPDATE' then
    if old.anulado then
      raise exception 'Lo anulado no se cambia' using errcode = 'PG204';
    end if;
    if new.anulado then
      if coalesce(trim(new.motivo_anulacion), '') = '' then
        raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
      end if;
      if exists (select 1 from public.gastos g where g.por_pagar_id = new.id and not g.anulado) then
        raise exception 'Ya esta pagado: se anula el pago' using errcode = 'PG210';
      end if;
      new.anulado_por := (select auth.uid());
      new.fecha_anulacion := now();
    end if;
    return new;
  end if;
  if new.recurrente_id is null then
    if new.medio_de_pago is not null then
      perform public.gastos_exigir_medio(new.medio_de_pago::text, null);
    end if;
    perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id,
      new.proveedor_id, null);
    return new;
  end if;
  select * into fijo from public.gastos_recurrentes r
   where r.id = new.recurrente_id and r.local_id = new.local_id;
  -- Una persona solo adelanta un proximo pago de un fijo activo; lo vencido lo crea el proceso,
  -- que corre sin usuario.
  if not found or ((select auth.uid()) is not null and not (
       fijo.activo and new.vencimiento > hoy
       and new.vencimiento >= coalesce(fijo.generar_desde, fijo.primer_vencimiento)
       and public.es_vencimiento_del_fijo(fijo.primer_vencimiento, fijo.frecuencia,
                                          new.vencimiento))) then
    raise exception 'Esa fecha no es un proximo pago del fijo' using errcode = 'PG211';
  end if;
  new.categoria_id := fijo.categoria_id;
  new.proveedor_id := fijo.proveedor_id;
  new.descripcion := fijo.descripcion;
  new.monto_centavos := fijo.monto_centavos;
  new.medio_de_pago := fijo.medio_de_pago;
  return new;
end
$$;

-- Pagar copia los datos de lo por pagar: no se pueden mandar otros.
create or replace function public.datos_del_por_pagar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pendiente public.gastos_por_pagar;
begin
  select * into pendiente from public.gastos_por_pagar p
   where p.id = new.por_pagar_id and p.local_id = new.local_id and not p.anulado;
  if not found then
    raise exception 'Eso ya no esta por pagar' using errcode = 'PG209';
  end if;
  new.categoria_id := pendiente.categoria_id;
  new.proveedor_id := pendiente.proveedor_id;
  new.descripcion := pendiente.descripcion;
  new.comprobante := pendiente.comprobante;
  new.recurrente_id := pendiente.recurrente_id;
  new.vencimiento := null;
  new.cierre_id := null;
  return new;
end
$$;

create or replace function public.reglas_de_gastos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.anulado then
    raise exception 'Un gasto anulado no se cambia' using errcode = 'PG204';
  end if;
  if tg_op = 'UPDATE' and old.cierre_id is not null then
    if new.monto_centavos <> old.monto_centavos or new.fecha <> old.fecha
       or new.medio_de_pago <> old.medio_de_pago then
      raise exception 'El monto de un gasto de caja se corrige anulando el cierre' using errcode = 'PC305';
    end if;
    if new.anulado and coalesce(current_setting('manteca.anulando_cierre', true), '') <> 'si' then
      raise exception 'Un gasto de caja se anula anulando el cierre' using errcode = 'PC306';
    end if;
  end if;
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
    return new;
  end if;
  -- Lo que cargaron los fijos antes de lo por pagar entro con el medio de su plantilla; un
  -- pago, como cualquiera.
  if new.cierre_id is null
     and not (tg_op = 'INSERT' and new.recurrente_id is not null and new.por_pagar_id is null) then
    perform public.gastos_exigir_medio(new.medio_de_pago::text,
      case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
  end if;
  -- Lo de un fijo, un cierre o un pago entra tal cual, aunque la categoria ya no se use.
  if tg_op = 'INSERT' and (new.recurrente_id is not null or new.cierre_id is not null
                           or new.por_pagar_id is not null) then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

-- Lo que vence de un fijo queda por pagar. Los vencimientos que un fijo ya habia cargado
-- pagados, antes de que hubiera por pagar, no vuelven.
create or replace function public.generar_gastos_recurrentes(hasta date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  creados integer;
begin
  -- Cada vencimiento sale del primero mas k periodos, no del anterior: asi el 31 de enero
  -- pasa al 28 de febrero y vuelve al 31 en marzo.
  insert into public.gastos_por_pagar (local_id, vencimiento, categoria_id, monto_centavos,
                                       descripcion, proveedor_id, medio_de_pago, recurrente_id,
                                       creado_por)
  select r.local_id, v.vencimiento, r.categoria_id, r.monto_centavos, r.descripcion,
         r.proveedor_id, r.medio_de_pago, r.id, null
    from public.gastos_recurrentes r
   cross join lateral (
     select (r.primer_vencimiento + make_interval(months => k * case r.frecuencia
               when 'mensual' then 1 when 'bimestral' then 2 else 12 end))::date as vencimiento
       from generate_series(0, 1200) as k
   ) v
   where r.activo and v.vencimiento <= hasta
     and (r.generar_desde is null or v.vencimiento >= r.generar_desde)
     and not exists (select 1 from public.gastos g
                      where g.recurrente_id = r.id and g.vencimiento = v.vencimiento)
  on conflict (recurrente_id, vencimiento) do nothing;
  get diagnostics creados = row_count;
  return creados;
end
$$;

-- Lo por pagar vigente y sin pago, con los nombres que muestra la pantalla. Corre con los
-- permisos de quien consulta: RLS decide que filas ve.
create or replace function public.pagos_pendientes()
returns table (
  id uuid,
  vencimiento date,
  descripcion text,
  monto_centavos bigint,
  medio_de_pago public.medio_de_pago,
  recurrente_id uuid,
  categoria text,
  proveedor text,
  frecuencia public.frecuencia_de_gasto
)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.id, p.vencimiento, p.descripcion, p.monto_centavos, p.medio_de_pago, p.recurrente_id,
         c.nombre, pr.nombre, r.frecuencia
    from public.gastos_por_pagar p
    join public.categorias_de_gasto c on c.id = p.categoria_id
    left join public.proveedores pr on pr.id = p.proveedor_id
    left join public.gastos_recurrentes r on r.id = p.recurrente_id
   where not p.anulado
     and not exists (select 1 from public.gastos g where g.por_pagar_id = p.id and not g.anulado)
   order by p.vencimiento, p.id
$$;

-- Triggers

drop trigger if exists reglas on public.gastos_por_pagar;
create trigger reglas before insert or update on public.gastos_por_pagar
  for each row execute function public.reglas_de_por_pagar();
drop trigger if exists marcar_actualizacion on public.gastos_por_pagar;
create trigger marcar_actualizacion before update on public.gastos_por_pagar
  for each row execute function public.marcar_actualizacion();
drop trigger if exists auditar on public.gastos_por_pagar;
create trigger auditar after insert or update on public.gastos_por_pagar
  for each row execute function public.auditar('anulado_por', 'fecha_anulacion');
-- Corre antes que "reglas": los triggers de un mismo momento van por orden alfabetico.
drop trigger if exists datos_del_por_pagar on public.gastos;
create trigger datos_del_por_pagar before insert on public.gastos
  for each row when (new.por_pagar_id is not null)
  execute function public.datos_del_por_pagar();

revoke all on function
  public.es_vencimiento_del_fijo(date, public.frecuencia_de_gasto, date),
  public.reglas_de_por_pagar(),
  public.datos_del_por_pagar()
  from public, anon, authenticated;
revoke all on function public.pagos_pendientes() from public, anon;
grant execute on function public.pagos_pendientes() to authenticated;

-- Permisos

alter table public.gastos_por_pagar enable row level security;

revoke all on table public.gastos_por_pagar from anon, authenticated;
grant select on table public.gastos_por_pagar to authenticated;
grant insert (vencimiento, categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago,
              comprobante, recurrente_id, clave)
  on table public.gastos_por_pagar to authenticated;
grant update (anulado, motivo_anulacion) on table public.gastos_por_pagar to authenticated;
grant insert (por_pagar_id) on table public.gastos to authenticated;

drop policy if exists "gastos_por_pagar: el admin activo ve los de su local" on public.gastos_por_pagar;
create policy "gastos_por_pagar: el admin activo ve los de su local" on public.gastos_por_pagar
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos_por_pagar: el admin activo carga en su local" on public.gastos_por_pagar;
create policy "gastos_por_pagar: el admin activo carga en su local" on public.gastos_por_pagar
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos_por_pagar: el admin activo cambia los de su local" on public.gastos_por_pagar;
create policy "gastos_por_pagar: el admin activo cambia los de su local" on public.gastos_por_pagar
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Migracion 20261028160000_fijos_sin_efectivo_de_caja.

-- Un gasto fijo vuelve a rechazar el efectivo de la caja: la regla de la revision de la fase 1
-- se perdio al reescribir reglas_de_recurrentes en el pedido 58 (20261027210000_gastos_fijos).
-- El efectivo de la caja sale por el cierre del dia.

create or replace function public.reglas_de_recurrentes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  perform public.gastos_exigir_medio(new.medio_de_pago::text,
    case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
  -- Otra fecha u otra frecuencia arman otra serie: cuenta desde el proximo pago, y lo que ya
  -- paso no se vuelve a cargar.
  if tg_op = 'UPDATE' and (new.primer_vencimiento is distinct from old.primer_vencimiento
                           or new.frecuencia is distinct from old.frecuencia) then
    if new.primer_vencimiento <= hoy then
      raise exception 'El proximo pago tiene que ser despues de hoy' using errcode = 'PG208';
    end if;
    new.generar_desde := new.primer_vencimiento;
  end if;
  if tg_op = 'UPDATE' and new.activo and not old.activo then
    new.generar_desde := greatest(coalesce(new.generar_desde, hoy), hoy);
  end if;
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

revoke all on function public.reglas_de_recurrentes() from public, anon, authenticated;

-- Migracion 20261028170000_generar_por_pagar.

-- La generacion de lo que vence pasa a generar_por_pagar, que acepta un fijo: sin el, genera
-- todos, como el proceso de cada dia. Los tests generan solo el suyo: generar todos con una
-- fecha lejana llenaba de pagos falsos los fijos de la base de pruebas.

create or replace function public.generar_por_pagar(hasta date, el_fijo uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  creados integer;
begin
  -- Cada vencimiento sale del primero mas k periodos, no del anterior: asi el 31 de enero
  -- pasa al 28 de febrero y vuelve al 31 en marzo. Lo que un fijo ya habia cargado pagado,
  -- antes de que hubiera por pagar, no vuelve.
  insert into public.gastos_por_pagar (local_id, vencimiento, categoria_id, monto_centavos,
                                       descripcion, proveedor_id, medio_de_pago, recurrente_id,
                                       creado_por)
  select r.local_id, v.vencimiento, r.categoria_id, r.monto_centavos, r.descripcion,
         r.proveedor_id, r.medio_de_pago, r.id, null
    from public.gastos_recurrentes r
   cross join lateral (
     select (r.primer_vencimiento + make_interval(months => k * case r.frecuencia
               when 'mensual' then 1 when 'bimestral' then 2 else 12 end))::date as vencimiento
       from generate_series(0, 1200) as k
   ) v
   where r.activo and v.vencimiento <= hasta
     and (el_fijo is null or r.id = el_fijo)
     and (r.generar_desde is null or v.vencimiento >= r.generar_desde)
     and not exists (select 1 from public.gastos g
                      where g.recurrente_id = r.id and g.vencimiento = v.vencimiento)
  on conflict (recurrente_id, vencimiento) do nothing;
  get diagnostics creados = row_count;
  return creados;
end
$$;

-- La llaman el proceso de cada dia y la aplicacion al abrir Gastos: todos los fijos.
create or replace function public.generar_gastos_recurrentes(hasta date)
returns integer
language sql
security definer
set search_path = ''
as $$
  select public.generar_por_pagar(hasta, null)
$$;

revoke all on function public.generar_por_pagar(date, uuid) from public, anon, authenticated;
grant execute on function public.generar_por_pagar(date, uuid) to service_role;
revoke all on function public.generar_gastos_recurrentes(date) from public, anon, authenticated;
grant execute on function public.generar_gastos_recurrentes(date) to service_role;
