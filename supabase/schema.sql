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
