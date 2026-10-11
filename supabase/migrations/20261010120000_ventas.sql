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
