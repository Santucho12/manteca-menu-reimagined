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
