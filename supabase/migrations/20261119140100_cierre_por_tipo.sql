-- Cierre por tipo de venta (pedido 99): el admin marca que tipos se controlan en el cierre; el
-- mostrador vende con el tipo que se elija; y el cierre de cada turno anota, por cada tipo
-- controlado, lo que dice su facturacion (total y, si se quiere, cantidad), que se compara con lo
-- cargado de ese tipo en el turno.

-- 1. Que tipos se controlan. Local no: es la caja.
alter table public.canales_de_venta
  add column if not exists se_controla_en_el_cierre boolean not null default false;
alter table public.canales_de_venta drop constraint if exists canales_de_venta_local_no_se_controla;
alter table public.canales_de_venta
  add constraint canales_de_venta_local_no_se_controla
  check (not (de_sistema and se_controla_en_el_cierre));
grant update (se_controla_en_el_cierre) on table public.canales_de_venta to authenticated;

-- 2. Lo anotado de cada tipo en un cierre. Lo escriben solo las funciones del cierre.
create table if not exists public.controles_de_cierre (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  cierre_id uuid not null references public.cierres_de_caja (id),
  canal_id uuid not null references public.canales_de_venta (id),
  cantidad integer check (cantidad is null or cantidad >= 0),
  total_centavos bigint not null check (total_centavos >= 0),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  constraint controles_de_cierre_uno_por_tipo unique (cierre_id, canal_id)
);
create index if not exists controles_de_cierre_local on public.controles_de_cierre (local_id);

drop trigger if exists marcar_actualizacion on public.controles_de_cierre;
create trigger marcar_actualizacion before update on public.controles_de_cierre
  for each row execute function public.marcar_actualizacion();
drop trigger if exists auditar on public.controles_de_cierre;
create trigger auditar after insert or update on public.controles_de_cierre
  for each row execute function public.auditar();

alter table public.controles_de_cierre enable row level security;
revoke all on table public.controles_de_cierre from anon, authenticated;
grant select on table public.controles_de_cierre to authenticated;

drop policy if exists "controles: el admin activo ve los de su local" on public.controles_de_cierre;
create policy "controles: el admin activo ve los de su local" on public.controles_de_cierre
  for select to authenticated
  using (public.es_admin_activo() and local_id = public.local_del_usuario());

drop policy if exists "controles: caja activa ve los de sus cierres" on public.controles_de_cierre;
create policy "controles: caja activa ve los de sus cierres" on public.controles_de_cierre
  for select to authenticated
  using (public.es_caja_activa() and exists (
    select 1 from public.cierres_de_caja c
     where c.id = cierre_id and c.cargado_por = (select auth.uid())));

-- 3. Anotar los controles de un cierre: solo tipos del local que se controlan. Al editar, el
--    mismo tipo cambia su fila.
create or replace function public.cierres_anotar_controles(el_local uuid, el_cierre uuid, datos jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from jsonb_array_elements(coalesce(datos -> 'controles', '[]')) k
              where not exists (select 1 from public.canales_de_venta c
                                 where c.id = (k ->> 'canal_id')::uuid and c.local_id = el_local
                                   and c.se_controla_en_el_cierre)) then
    raise exception 'Ese tipo de venta no se controla en el cierre' using errcode = 'PC311';
  end if;
  insert into public.controles_de_cierre (local_id, cierre_id, canal_id, cantidad, total_centavos)
  select el_local, el_cierre, (k ->> 'canal_id')::uuid, (k ->> 'cantidad')::integer,
         (k ->> 'total_centavos')::bigint
    from jsonb_array_elements(coalesce(datos -> 'controles', '[]')) k
  on conflict (cierre_id, canal_id) do update
    set cantidad = excluded.cantidad, total_centavos = excluded.total_centavos;
end
$$;


-- cierres_guardar y cierres_editar suman los controles. Se envuelven: lo demas no cambia.
alter function public.cierres_guardar(jsonb) rename to cierres_guardar_caja;
create or replace function public.cierres_guardar(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo uuid;
begin
  nuevo := public.cierres_guardar_caja(datos);
  perform public.cierres_anotar_controles(public.local_del_usuario(), nuevo, datos);
  return nuevo;
end
$$;

alter function public.cierres_editar(uuid, jsonb) rename to cierres_editar_caja;
create or replace function public.cierres_editar(el_id uuid, datos jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.cierres_editar_caja(el_id, datos);
  perform public.cierres_anotar_controles(public.local_del_usuario(), el_id, datos);
end
$$;

-- 4. Lo anotado de cada tipo y lo cargado de ese tipo en la fecha y el turno del cierre.
create or replace function public.cierres_controles(desde date, hasta date)
returns table (
  cierre_id uuid, canal_id uuid, tipo text, cantidad integer, total_centavos bigint,
  ventas_cantidad bigint, ventas_centavos bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.cierres_exigir_quien_carga();
  return query
  select k.cierre_id, k.canal_id, t.nombre, k.cantidad, k.total_centavos,
         count(v.id)::bigint, coalesce(sum(v.total_centavos), 0)::bigint
    from public.controles_de_cierre k
    join public.cierres_de_caja c on c.id = k.cierre_id
    join public.canales_de_venta t on t.id = k.canal_id
    left join public.ventas v on v.local_id = c.local_id and v.canal_id = k.canal_id
         and v.fecha = c.fecha and v.turno = c.turno and v.estado = 'cerrada' and not v.anulado
   where c.fecha between desde and hasta
     and ((public.es_admin_activo() and c.local_id = public.local_del_usuario())
          or (c.cargado_por = (select auth.uid()) and public.es_caja_activa()))
   group by k.cierre_id, k.canal_id, t.nombre, k.cantidad, k.total_centavos
   order by t.nombre;
end
$$;

-- 5. Los tipos que se eligen en Vender, sin montos: Caja no lee la tabla de tipos.
create or replace function public.caja_tipos_para_vender()
returns table (id uuid, nombre text, de_sistema boolean, se_controla_en_el_cierre boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.es_caja_activa() or public.es_admin_activo()) then
    raise exception 'No tenes permiso para vender' using errcode = '42501';
  end if;
  return query
  select c.id, c.nombre, c.de_sistema, c.se_controla_en_el_cierre
    from public.canales_de_venta c
   where c.local_id = public.local_del_usuario() and c.activo
   order by c.de_sistema desc, c.nombre;
end
$$;

-- 6. El mostrador vende con el tipo elegido; sin elegirlo, Local.
create or replace function public.ventas_tipo_del_mostrador(el_local uuid, datos jsonb)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  el_tipo uuid;
begin
  if datos ->> 'canal_id' is null then
    select c.id into el_tipo from public.canales_de_venta c where c.local_id = el_local and c.de_sistema;
    return el_tipo;
  end if;
  select c.id into el_tipo from public.canales_de_venta c
   where c.id = (datos ->> 'canal_id')::uuid and c.local_id = el_local and c.activo;
  if el_tipo is null then
    raise exception 'Ese tipo de venta no esta disponible' using errcode = 'PV316';
  end if;
  return el_tipo;
end
$$;

create or replace function public.ventas_guardar_mostrador(datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_clave uuid := (datos ->> 'clave')::uuid;
  e record;
  el_tipo uuid;
  el_total bigint;
  nueva uuid;
begin
  if not (public.es_caja_activa() or public.es_admin_activo()) then
    raise exception 'No tenes permiso para vender' using errcode = '42501';
  end if;
  -- La misma clave otra vez (un toque repetido, un reintento sin conexion): la que ya estaba.
  select v.id, v.total_centavos into nueva, el_total
    from public.ventas v where v.local_id = el_local and v.clave = la_clave;
  if nueva is not null then
    return jsonb_build_object('id', nueva, 'total_centavos', el_total);
  end if;
  select * into e from public.caja_estado_del_turno(now());
  if e.motivo = 'cerrada' then
    raise exception 'La caja de hoy ya cerro' using errcode = 'PV315';
  elsif e.trabado then
    raise exception 'Es hora del cierre de caja' using errcode = 'PV314';
  end if;
  el_tipo := public.ventas_tipo_del_mostrador(el_local, datos);
  el_total := public.ventas_validar_mostrador(el_local, datos);
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, clave,
                             en_la_caja, turno)
  values (el_local, 'mostrador', e.fecha, 'cerrada', el_total, el_tipo, la_clave, true, e.turno)
  returning id into nueva;
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos)
  select el_local, nueva, r.producto_id, r.presentacion_id, r.descripcion, r.cantidad,
         r.precio_centavos, (r.cantidad * r.precio_centavos)::bigint
    from public.ventas_renglones_del_mostrador(el_local, datos) r;
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  select el_local, nueva, (p ->> 'medio')::public.medio_de_caja, (p ->> 'monto_centavos')::bigint
    from jsonb_array_elements(datos -> 'pagos') p;
  return jsonb_build_object('id', nueva, 'total_centavos', el_total);
end
$$;

-- Permisos
revoke all on function
  public.cierres_anotar_controles(uuid, uuid, jsonb),
  public.cierres_guardar_caja(jsonb),
  public.cierres_editar_caja(uuid, jsonb),
  public.ventas_tipo_del_mostrador(uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.cierres_guardar(jsonb) from public, anon;
revoke all on function public.cierres_editar(uuid, jsonb) from public, anon;
revoke all on function public.cierres_controles(date, date) from public, anon;
revoke all on function public.caja_tipos_para_vender() from public, anon;
grant execute on function public.cierres_guardar(jsonb) to authenticated;
grant execute on function public.cierres_editar(uuid, jsonb) to authenticated;
grant execute on function public.cierres_controles(date, date) to authenticated;
grant execute on function public.caja_tipos_para_vender() to authenticated;
