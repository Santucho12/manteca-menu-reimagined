-- Recetas y Costos (pedido 95): la receta de cada producto (y la propia de una presentacion),
-- las unidades y el agregado de cada presentacion y los margenes del local. El costo no se
-- guarda: lo calcula costos_de_productos(), en un solo lugar, para la pantalla y para la venta.
-- Solo el admin activo de su local lo ve; la receta se guarda entera con recetas_guardar().

create table if not exists public.recetas (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  producto_id uuid not null references public.productos (id),
  -- Null: la receta de una unidad del producto. Con valor: la propia de esa presentacion.
  presentacion_id uuid references public.presentaciones (id),
  rinde numeric(10, 3) not null default 1 check (rinde > 0),
  desperdicio_porcentaje numeric(5, 2) not null default 0
    check (desperdicio_porcentaje between 0 and 50),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  constraint recetas_una_por_presentacion unique nulls not distinct (producto_id, presentacion_id)
);

create table if not exists public.renglones_de_receta (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  receta_id uuid not null references public.recetas (id),
  insumo_id uuid not null references public.insumos (id),
  -- En la unidad de uso del insumo.
  cantidad numeric(14, 3) not null check (cantidad > 0),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  constraint renglones_de_receta_un_insumo unique (receta_id, insumo_id)
);

create table if not exists public.costos_de_presentacion (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  presentacion_id uuid not null unique references public.presentaciones (id),
  unidades numeric(10, 3) not null check (unidades > 0),
  agregado_centavos bigint not null default 0 check (agregado_centavos >= 0),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.configuracion_de_costos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null unique default public.local_del_usuario() references public.locales (id),
  margen_objetivo_porcentaje integer not null default 65
    check (margen_objetivo_porcentaje between 1 and 95),
  margen_minimo_porcentaje integer not null default 50
    check (margen_minimo_porcentaje between 0 and 95),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  check (margen_minimo_porcentaje <= margen_objetivo_porcentaje)
);

create index if not exists recetas_local on public.recetas (local_id);
create index if not exists recetas_producto on public.recetas (producto_id);
create index if not exists renglones_de_receta_receta on public.renglones_de_receta (receta_id);
create index if not exists renglones_de_receta_insumo on public.renglones_de_receta (insumo_id);
create index if not exists costos_de_presentacion_local on public.costos_de_presentacion (local_id);

-- Las unidades se cargan solo para una presentacion del mismo local.
create or replace function public.costos_de_presentacion_reglas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.presentaciones p
                  where p.id = new.presentacion_id and p.local_id = new.local_id) then
    raise exception 'Esa presentacion no esta disponible' using errcode = 'PK301';
  end if;
  return new;
end;
$$;

-- La unidad de uso no cambia si el insumo ya esta en una receta: cambiaria sus cantidades.
create or replace function public.insumos_reglas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.unidad_de_uso is distinct from old.unidad_de_uso
     and exists (select 1 from public.renglones_de_receta r where r.insumo_id = new.id) then
    raise exception 'Ese insumo ya esta en una receta: no cambia en que se mide'
      using errcode = 'PI303';
  end if;
  return new;
end;
$$;

revoke all on function public.costos_de_presentacion_reglas() from public, anon, authenticated;
revoke all on function public.insumos_reglas() from public, anon, authenticated;

drop trigger if exists reglas on public.costos_de_presentacion;
create trigger reglas before insert or update on public.costos_de_presentacion
  for each row execute function public.costos_de_presentacion_reglas();
drop trigger if exists reglas on public.insumos;
create trigger reglas before update on public.insumos
  for each row execute function public.insumos_reglas();

do $$
declare
  tabla text;
begin
  foreach tabla in array array['recetas', 'renglones_de_receta', 'costos_de_presentacion',
                               'configuracion_de_costos'] loop
    execute format('drop trigger if exists marcar_actualizacion on public.%I', tabla);
    execute format('create trigger marcar_actualizacion before update on public.%I
                    for each row execute function public.marcar_actualizacion()', tabla);
    execute format('drop trigger if exists auditar on public.%I', tabla);
    execute format('create trigger auditar after insert or update on public.%I
                    for each row execute function public.auditar()', tabla);
    execute format('alter table public.%I enable row level security', tabla);
    execute format('revoke all on table public.%I from anon, authenticated', tabla);
    execute format('grant select on table public.%I to authenticated', tabla);
    execute format('drop policy if exists "%s: el admin activo ve lo de su local" on public.%I',
                   tabla, tabla);
    execute format('create policy "%s: el admin activo ve lo de su local" on public.%I
                    for select to authenticated
                    using ((select public.es_admin_activo())
                           and local_id = (select public.local_del_usuario()))', tabla, tabla);
  end loop;
end $$;

-- Recetas y renglones se escriben solo con recetas_guardar; unidades y margenes, directo.
grant insert (presentacion_id, unidades, agregado_centavos)
  on table public.costos_de_presentacion to authenticated;
grant update (unidades, agregado_centavos) on table public.costos_de_presentacion to authenticated;
grant insert (margen_objetivo_porcentaje, margen_minimo_porcentaje)
  on table public.configuracion_de_costos to authenticated;
grant update (margen_objetivo_porcentaje, margen_minimo_porcentaje)
  on table public.configuracion_de_costos to authenticated;

do $$
declare
  tabla text;
begin
  foreach tabla in array array['costos_de_presentacion', 'configuracion_de_costos'] loop
    execute format('drop policy if exists "%s: el admin activo carga en su local" on public.%I',
                   tabla, tabla);
    execute format('create policy "%s: el admin activo carga en su local" on public.%I
                    for insert to authenticated
                    with check ((select public.es_admin_activo())
                                and local_id = (select public.local_del_usuario()))', tabla, tabla);
    execute format('drop policy if exists "%s: el admin activo cambia lo de su local" on public.%I',
                   tabla, tabla);
    execute format('create policy "%s: el admin activo cambia lo de su local" on public.%I
                    for update to authenticated
                    using ((select public.es_admin_activo())
                           and local_id = (select public.local_del_usuario()))
                    with check ((select public.es_admin_activo())
                                and local_id = (select public.local_del_usuario()))', tabla, tabla);
  end loop;
end $$;

-- Controles de recetas_guardar: el producto y la presentacion son del local y de la misma
-- categoria; los insumos son del local, no se repiten y hay al menos uno.
create or replace function public.recetas_controlar(el_local uuid, datos jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_producto uuid := (datos ->> 'producto_id')::uuid;
  la_presentacion uuid := nullif(datos ->> 'presentacion_id', '')::uuid;
  renglones jsonb := coalesce(datos -> 'renglones', '[]'::jsonb);
begin
  if not exists (select 1 from public.productos p where p.id = el_producto and p.local_id = el_local)
     or (la_presentacion is not null and not exists (
           select 1 from public.presentaciones pr join public.productos p on p.categoria_id = pr.categoria_id
            where pr.id = la_presentacion and p.id = el_producto)) then
    raise exception 'Ese producto o esa presentacion no estan disponibles' using errcode = 'PK301';
  end if;
  if jsonb_array_length(renglones) = 0 then
    raise exception 'La receta necesita al menos un insumo' using errcode = 'PK304';
  end if;
  if (select count(*) <> count(distinct e ->> 'insumo_id') from jsonb_array_elements(renglones) e) then
    raise exception 'Un insumo esta dos veces en la receta' using errcode = 'PK303';
  end if;
  if exists (select 1 from jsonb_array_elements(renglones) e
              where not exists (select 1 from public.insumos i
                                 where i.id = (e ->> 'insumo_id')::uuid and i.local_id = el_local)) then
    raise exception 'Ese insumo no esta disponible' using errcode = 'PK301';
  end if;
end;
$$;

-- Guarda la receta entera en una transaccion: la crea o la actualiza, carga o reactiva cada
-- renglon y desactiva los que no vinieron. Un insumo desactivado solo sigue si ya estaba.
create or replace function public.recetas_guardar(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  el_producto uuid := (datos ->> 'producto_id')::uuid;
  la_presentacion uuid := nullif(datos ->> 'presentacion_id', '')::uuid;
  la_receta uuid;
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para hacer esto' using errcode = 'PK300';
  end if;
  perform public.recetas_controlar(el_local, datos);
  select r.id into la_receta from public.recetas r
   where r.producto_id = el_producto and r.presentacion_id is not distinct from la_presentacion;
  if la_receta is null then
    insert into public.recetas (local_id, producto_id, presentacion_id)
    values (el_local, el_producto, la_presentacion) returning id into la_receta;
  end if;
  update public.recetas set rinde = coalesce((datos ->> 'rinde')::numeric, 1),
         desperdicio_porcentaje = coalesce((datos ->> 'desperdicio_porcentaje')::numeric, 0),
         activo = true
   where id = la_receta;
  if exists (select 1 from jsonb_array_elements(datos -> 'renglones') e
               join public.insumos i on i.id = (e ->> 'insumo_id')::uuid
              where not i.activo and not exists (
                select 1 from public.renglones_de_receta rr
                 where rr.receta_id = la_receta and rr.insumo_id = i.id)) then
    raise exception 'Reactiva primero el insumo' using errcode = 'PK302';
  end if;
  insert into public.renglones_de_receta (local_id, receta_id, insumo_id, cantidad)
  select el_local, la_receta, (e ->> 'insumo_id')::uuid, (e ->> 'cantidad')::numeric
    from jsonb_array_elements(datos -> 'renglones') e
  on conflict (receta_id, insumo_id)
  do update set cantidad = excluded.cantidad, activo = true;
  update public.renglones_de_receta set activo = false
   where receta_id = la_receta and activo
     and insumo_id not in (select (e ->> 'insumo_id')::uuid
                             from jsonb_array_elements(datos -> 'renglones') e);
  return la_receta;
end;
$$;

-- El costo de cada producto activo en cada presentacion activa de su categoria, en centavos
-- redondeados una sola vez (la mitad hacia arriba), o el motivo por el que no lo tiene.
create or replace function public.costos_de_productos_del_local(el_local uuid)
returns table (producto_id uuid, presentacion_id uuid, costo_centavos bigint, estado text)
language sql
stable
security definer
set search_path = ''
as $$
  with insumo_costo as (
    select c.insumo_id, c.costo_por_unidad from public.costo_de_insumos() c
  ), receta_costo as (
    select r.id, r.producto_id, r.presentacion_id,
           sum(rr.cantidad * ic.costo_por_unidad) * (1 + r.desperdicio_porcentaje / 100) / r.rinde
             as costo,
           bool_or(ic.costo_por_unidad is null) as falta
      from public.recetas r
      join public.renglones_de_receta rr on rr.receta_id = r.id and rr.activo
      left join insumo_costo ic on ic.insumo_id = rr.insumo_id
     where r.local_id = el_local and r.activo
     group by r.id
  )
  select p.id, pr.id,
         case when calculo.estado = 'ok' then round(calculo.valor)::bigint end,
         calculo.estado
    from public.productos p
    join public.presentaciones pr on pr.categoria_id = p.categoria_id and pr.activo
    left join receta_costo propia on propia.producto_id = p.id and propia.presentacion_id = pr.id
    left join receta_costo base on base.producto_id = p.id and base.presentacion_id is null
    left join public.costos_de_presentacion cp on cp.presentacion_id = pr.id
    cross join lateral (
      select case
               when propia.id is not null then
                 case when propia.falta then 'insumo_sin_precio' else 'ok' end
               when base.id is null then 'sin_receta'
               when cp.id is null then 'sin_unidades'
               when base.falta then 'insumo_sin_precio'
               else 'ok'
             end as estado,
             case
               when propia.id is not null then propia.costo + coalesce(cp.agregado_centavos, 0)
               else base.costo * cp.unidades + cp.agregado_centavos
             end as valor
    ) calculo
   where p.local_id = el_local and p.activo;
$$;

-- Lo que ve el admin: el calculo de su local. Para cualquier otro, nada.
create or replace function public.costos_de_productos()
returns table (producto_id uuid, presentacion_id uuid, costo_centavos bigint, estado text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.* from public.costos_de_productos_del_local(public.local_del_usuario()) c
   where public.es_admin_activo();
$$;

revoke all on function public.recetas_controlar(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.costos_de_productos_del_local(uuid) from public, anon, authenticated;
revoke all on function public.recetas_guardar(jsonb) from public, anon;
revoke all on function public.costos_de_productos() from public, anon;
grant execute on function public.recetas_guardar(jsonb) to authenticated;
grant execute on function public.costos_de_productos() to authenticated;
