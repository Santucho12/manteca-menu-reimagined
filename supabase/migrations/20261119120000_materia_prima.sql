-- Materia prima (pedido 94): los insumos y las formas en que se compran, con su precio de
-- referencia. Solo el admin activo de su local los ve y los cambia; nadie borra. El costo
-- de hoy de cada insumo no se guarda: lo calcula costo_de_insumos(), que mientras no exista
-- Compras solo mira las referencias.

do $$
begin
  create type public.unidad_de_uso as enum ('g', 'ml', 'unidad');
exception when duplicate_object then null;
end $$;

create table if not exists public.insumos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  nombre text not null check (char_length(nombre) between 1 and 100),
  unidad_de_uso public.unidad_de_uso not null,
  observaciones text check (observaciones is null or char_length(observaciones) between 1 and 500),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists insumos_local_nombre on public.insumos (local_id, nombre);

create table if not exists public.formas_de_compra (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  insumo_id uuid not null references public.insumos (id),
  proveedor_id uuid references public.proveedores (id),
  como_se_compra text not null check (char_length(como_se_compra) between 1 and 100),
  -- En la unidad de uso del insumo: la bolsa de 25 kg trae 25000 g.
  contenido numeric(14, 3) not null check (contenido > 0),
  precio_referencia_centavos bigint check (precio_referencia_centavos is null or precio_referencia_centavos > 0),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists formas_de_compra_local on public.formas_de_compra (local_id);
create index if not exists formas_de_compra_insumo on public.formas_de_compra (insumo_id);
create index if not exists formas_de_compra_proveedor on public.formas_de_compra (proveedor_id);

-- El insumo y el proveedor tienen que ser del mismo local que la forma, y un insumo
-- desactivado no se compra de una forma nueva.
create or replace function public.formas_de_compra_reglas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.insumos i
                  where i.id = new.insumo_id and i.local_id = new.local_id) then
    raise exception 'Ese insumo no esta disponible' using errcode = 'PI301';
  end if;
  if new.proveedor_id is not null and not exists (
       select 1 from public.proveedores p
        where p.id = new.proveedor_id and p.local_id = new.local_id) then
    raise exception 'Ese proveedor no esta disponible' using errcode = 'PI301';
  end if;
  if tg_op = 'INSERT' and not exists (select 1 from public.insumos i
                                       where i.id = new.insumo_id and i.activo) then
    raise exception 'Reactiva primero el insumo' using errcode = 'PI302';
  end if;
  return new;
end;
$$;

revoke all on function public.formas_de_compra_reglas() from public, anon, authenticated;

drop trigger if exists reglas on public.formas_de_compra;
create trigger reglas before insert or update on public.formas_de_compra
  for each row execute function public.formas_de_compra_reglas();

drop trigger if exists marcar_actualizacion on public.insumos;
create trigger marcar_actualizacion before update on public.insumos
  for each row execute function public.marcar_actualizacion();
drop trigger if exists auditar on public.insumos;
create trigger auditar after insert or update on public.insumos
  for each row execute function public.auditar();
drop trigger if exists marcar_actualizacion on public.formas_de_compra;
create trigger marcar_actualizacion before update on public.formas_de_compra
  for each row execute function public.marcar_actualizacion();
drop trigger if exists auditar on public.formas_de_compra;
create trigger auditar after insert or update on public.formas_de_compra
  for each row execute function public.auditar();

-- Permisos: el local sale de la sesion y una forma no se pasa a otro insumo.

alter table public.insumos enable row level security;
alter table public.formas_de_compra enable row level security;

revoke all on table public.insumos, public.formas_de_compra from anon, authenticated;
grant select on table public.insumos, public.formas_de_compra to authenticated;
grant insert (nombre, unidad_de_uso, observaciones) on table public.insumos to authenticated;
grant update (nombre, unidad_de_uso, observaciones, activo) on table public.insumos to authenticated;
grant insert (insumo_id, proveedor_id, como_se_compra, contenido, precio_referencia_centavos)
  on table public.formas_de_compra to authenticated;
grant update (proveedor_id, como_se_compra, contenido, precio_referencia_centavos, activo)
  on table public.formas_de_compra to authenticated;

drop policy if exists "insumos: el admin activo ve los de su local" on public.insumos;
create policy "insumos: el admin activo ve los de su local" on public.insumos
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "insumos: el admin activo carga en su local" on public.insumos;
create policy "insumos: el admin activo carga en su local" on public.insumos
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "insumos: el admin activo cambia los de su local" on public.insumos;
create policy "insumos: el admin activo cambia los de su local" on public.insumos
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "formas_de_compra: el admin activo ve las de su local" on public.formas_de_compra;
create policy "formas_de_compra: el admin activo ve las de su local" on public.formas_de_compra
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "formas_de_compra: el admin activo carga en su local" on public.formas_de_compra;
create policy "formas_de_compra: el admin activo carga en su local" on public.formas_de_compra
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "formas_de_compra: el admin activo cambia las de su local" on public.formas_de_compra;
create policy "formas_de_compra: el admin activo cambia las de su local" on public.formas_de_compra
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Lo que cuesta hoy cada insumo, en centavos por unidad de uso y con fraccion de centavo.
-- Security invoker: cada uno ve solo los insumos que su RLS le deja ver.
create or replace function public.costo_de_insumos()
returns table (insumo_id uuid, costo_por_unidad numeric, origen text, fecha_origen date)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id,
         round(f.precio_referencia_centavos / f.contenido, 6),
         case when f.id is not null then 'referencia' end,
         null::date
    from public.insumos i
    left join lateral (
      select fc.id, fc.precio_referencia_centavos, fc.contenido
        from public.formas_de_compra fc
       where fc.insumo_id = i.id and fc.activo and fc.precio_referencia_centavos is not null
       order by fc.fecha_actualizacion desc, fc.fecha_creacion desc
       limit 1
    ) f on true;
$$;

revoke all on function public.costo_de_insumos() from public, anon;
grant execute on function public.costo_de_insumos() to authenticated;
