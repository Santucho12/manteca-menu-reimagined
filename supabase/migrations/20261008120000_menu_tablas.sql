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
