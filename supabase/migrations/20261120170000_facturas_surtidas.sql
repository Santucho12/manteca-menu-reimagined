-- Facturas surtidas (Santiago, 2026-11-20, pedido 102): en el mostrador se cobra la cantidad
-- (una docena, media, tres sueltas) sin saber cuáles; después de cobrar se arman, tocando cada
-- factura que entra en la bolsa. Mientras tanto la venta tiene un renglón surtido, sin producto.

alter table public.renglones_de_venta
  add column if not exists surtida boolean not null default false;

-- Los renglones del mostrador: los de siempre, y los surtidos, que llevan la forma de la categoría
-- (Docena, Media docena, Unidad) con su precio para todos y ningún producto.
drop function if exists public.ventas_cuenta_del_mostrador(uuid, jsonb);
drop function if exists public.ventas_renglones_del_mostrador(uuid, jsonb);
create function public.ventas_renglones_del_mostrador(el_local uuid, datos jsonb)
returns table (
  orden bigint, producto_id uuid, presentacion_id uuid, categoria_id uuid, descripcion text,
  cantidad numeric, precio_centavos bigint, mandado_centavos bigint, unidades integer,
  gramos integer, compartido boolean, solo_centavos bigint, surtida boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.orden, p.id, pre.id, p.categoria_id,
         p.nombre || ' · ' || pre.nombre
           || case when pre.gramos is null then '' else ' (' || (r.dato ->> 'gramos') || ' g)' end,
         case when pre.gramos is null then (r.dato ->> 'cantidad')::numeric
              else (r.dato ->> 'gramos')::numeric / pre.gramos end,
         coalesce(propio.monto_centavos, comun.monto_centavos), (r.dato ->> 'precio_centavos')::bigint,
         pre.unidades, case when pre.gramos is null then null else (r.dato ->> 'gramos')::integer end,
         propio.monto_centavos is null,
         case when pre.gramos is null
              then ((r.dato ->> 'cantidad')::numeric * coalesce(propio.monto_centavos, comun.monto_centavos))::bigint
              else round(coalesce(propio.monto_centavos, comun.monto_centavos)
                         * (r.dato ->> 'gramos')::numeric / pre.gramos)::bigint end,
         false
    from jsonb_array_elements(datos -> 'renglones') with ordinality as r (dato, orden)
    join public.productos p
      on p.id = (r.dato ->> 'producto_id')::uuid and p.local_id = el_local and p.activo
    join public.categorias c on c.id = p.categoria_id and c.activo
    join public.presentaciones pre
      on pre.id = (r.dato ->> 'presentacion_id')::uuid and pre.categoria_id = p.categoria_id and pre.activo
    left join public.precios propio
      on propio.presentacion_id = pre.id and propio.producto_id = p.id and propio.activo
    left join public.precios comun
      on comun.presentacion_id = pre.id and comun.producto_id is null and comun.activo
   where not coalesce((r.dato ->> 'surtida')::boolean, false)
     and coalesce(propio.monto_centavos, comun.monto_centavos) is not null
  union all
  select r.orden, null, pre.id, c.id, c.nombre || ' surtidas · ' || pre.nombre,
         (r.dato ->> 'cantidad')::numeric, comun.monto_centavos, (r.dato ->> 'precio_centavos')::bigint,
         pre.unidades, null, true, ((r.dato ->> 'cantidad')::numeric * comun.monto_centavos)::bigint, true
    from jsonb_array_elements(datos -> 'renglones') with ordinality as r (dato, orden)
    join public.presentaciones pre
      on pre.id = (r.dato ->> 'presentacion_id')::uuid and pre.activo and pre.unidades is not null
         and pre.gramos is null
    join public.categorias c on c.id = pre.categoria_id and c.activo and c.local_id = el_local
    join public.precios comun
      on comun.presentacion_id = pre.id and comun.producto_id is null and comun.activo
   where coalesce((r.dato ->> 'surtida')::boolean, false)
$$;

revoke all on function public.ventas_renglones_del_mostrador(uuid, jsonb) from public, anon, authenticated;

create function public.ventas_cuenta_del_mostrador(el_local uuid, datos jsonb)
returns table (
  orden bigint, producto_id uuid, presentacion_id uuid, descripcion text, cantidad numeric,
  precio_centavos bigint, subtotal_centavos bigint, surtida boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  subtotales jsonb := '{}';
  la_categoria uuid;
  antes bigint;
  ahora bigint;
  acumulado bigint;
  ultimo bigint;
  r record;
begin
  for r in select x.orden, x.solo_centavos from public.ventas_renglones_del_mostrador(el_local, datos) x loop
    subtotales := subtotales || jsonb_build_object(r.orden::text, r.solo_centavos);
  end loop;
  for la_categoria in
    select distinct x.categoria_id from public.ventas_renglones_del_mostrador(el_local, datos) x
     where x.compartido and x.unidades is not null and x.gramos is null
  loop
    select public.ventas_precio_en_paquetes(la_categoria, sum(x.cantidad * x.unidades)::bigint),
           sum(x.solo_centavos)
      into ahora, antes
      from public.ventas_renglones_del_mostrador(el_local, datos) x
     where x.categoria_id = la_categoria and x.compartido and x.unidades is not null and x.gramos is null;
    continue when ahora is null or ahora >= antes;
    acumulado := 0;
    for r in
      select x.orden, x.solo_centavos from public.ventas_renglones_del_mostrador(el_local, datos) x
       where x.categoria_id = la_categoria and x.compartido and x.unidades is not null and x.gramos is null
       order by x.orden
    loop
      subtotales := subtotales || jsonb_build_object(r.orden::text, (ahora * r.solo_centavos) / antes);
      acumulado := acumulado + (ahora * r.solo_centavos) / antes;
      ultimo := r.orden;
    end loop;
    subtotales := subtotales || jsonb_build_object(
      ultimo::text, (subtotales ->> ultimo::text)::bigint + ahora - acumulado);
  end loop;
  return query
  select x.orden, x.producto_id, x.presentacion_id, x.descripcion, x.cantidad, x.precio_centavos,
         (subtotales ->> x.orden::text)::bigint, x.surtida
    from public.ventas_renglones_del_mostrador(el_local, datos) x
   order by x.orden;
end
$$;

revoke all on function public.ventas_cuenta_del_mostrador(uuid, jsonb) from public, anon, authenticated;

-- Al guardar o editar, los renglones surtidos quedan marcados para armarlos.
create or replace function public.ventas_poner_renglones(la_venta uuid, el_local uuid, datos jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos, surtida)
  select el_local, la_venta, x.producto_id, x.presentacion_id, x.descripcion, x.cantidad,
         x.precio_centavos, x.subtotal_centavos, x.surtida
    from public.ventas_cuenta_del_mostrador(el_local, datos) x
   order by x.orden
$$;

revoke all on function public.ventas_poner_renglones(uuid, uuid, jsonb) from public, anon, authenticated;

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
  perform public.ventas_poner_renglones(nueva, el_local, datos);
  perform public.ventas_anotar_descuento(nueva, el_local, datos);
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  select el_local, nueva, (p ->> 'medio')::public.medio_de_caja, (p ->> 'monto_centavos')::bigint
    from jsonb_array_elements(datos -> 'pagos') p;
  return jsonb_build_object('id', nueva, 'total_centavos', el_total);
end
$$;

create or replace function public.ventas_editar(la_venta uuid, datos jsonb, el_motivo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  v public.ventas;
  antes jsonb;
  el_tipo uuid;
  el_total bigint;
begin
  if not (public.es_caja_activa() or public.es_admin_activo()) then
    raise exception 'No tenes permiso para editar ventas' using errcode = '42501';
  end if;
  select * into v from public.ventas x where x.id = la_venta and x.local_id = el_local for update;
  perform public.ventas_controlar_edicion(v, el_motivo);
  antes := public.ventas_como_esta(la_venta);
  el_tipo := public.ventas_tipo_del_mostrador(el_local, datos);
  el_total := public.ventas_validar_mostrador(el_local, datos);
  delete from public.pagos_de_venta where venta_id = la_venta;
  delete from public.renglones_de_venta where venta_id = la_venta;
  perform public.ventas_poner_renglones(la_venta, el_local, datos);
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  select el_local, la_venta, (p ->> 'medio')::public.medio_de_caja, (p ->> 'monto_centavos')::bigint
    from jsonb_array_elements(datos -> 'pagos') p;
  update public.ventas
     set total_centavos = el_total, canal_id = el_tipo, editada = true,
         motivo_edicion = trim(el_motivo), editada_por = auth.uid(), fecha_edicion = now()
   where id = la_venta;
  perform public.ventas_anotar_descuento(la_venta, el_local, datos);
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes, despues, motivo)
  values (el_local, auth.uid(), 'ventas', la_venta::text, 'cambio', antes,
          public.ventas_como_esta(la_venta), trim(el_motivo));
  return jsonb_build_object('id', la_venta, 'total_centavos', el_total);
end
$$;

-- Lo que falta armar: los renglones surtidos de las ventas sin anular de hoy y de ayer.
create or replace function public.ventas_por_armar()
returns table (
  venta_id uuid, renglon_id uuid, cerrada_en timestamptz, descripcion text, categoria_id uuid,
  unidades integer
)
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
  select v.id, r.id, v.cerrada_en, r.descripcion, pre.categoria_id,
         (r.cantidad * pre.unidades)::integer
    from public.renglones_de_venta r
    join public.ventas v on v.id = r.venta_id and not v.anulado
    join public.presentaciones pre on pre.id = r.presentacion_id
   where r.surtida and r.local_id = public.local_del_usuario()
     and v.fecha >= (now() at time zone 'America/Argentina/Buenos_Aires')::date - 1
   order by v.cerrada_en, r.id;
end
$$;

revoke all on function public.ventas_por_armar() from public, anon;
grant execute on function public.ventas_por_armar() to authenticated;

-- Arma un renglón surtido: cada factura con cuántas unidades. Tienen que sumar justo lo cobrado;
-- el renglón surtido se reemplaza por uno por factura, en Unidad, con su parte del precio.
create or replace function public.ventas_armar(el_renglon uuid, detalle jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  r public.renglones_de_venta;
  pre public.presentaciones;
  unidad public.presentaciones;
  total_unidades integer;
  acumulado bigint := 0;
  item record;
  cuantos integer;
  i integer := 0;
  parte bigint;
begin
  if not (public.es_caja_activa() or public.es_admin_activo()) then
    raise exception 'No tenes permiso para vender' using errcode = '42501';
  end if;
  select x.* into r from public.renglones_de_venta x
    join public.ventas v on v.id = x.venta_id and not v.anulado
   where x.id = el_renglon and x.local_id = el_local and x.surtida for update of x;
  if r.id is null then
    raise exception 'Ya no hay nada para armar en esa venta' using errcode = 'PV322';
  end if;
  select * into pre from public.presentaciones where id = r.presentacion_id;
  total_unidades := (r.cantidad * pre.unidades)::integer;
  select * into unidad from public.presentaciones
   where categoria_id = pre.categoria_id and activo and unidades = 1 order by orden limit 1;
  if jsonb_typeof(detalle) is distinct from 'array'
     or (select coalesce(sum((d ->> 'unidades')::integer), 0) from jsonb_array_elements(detalle) d)
        <> total_unidades
     or exists (select 1 from jsonb_array_elements(detalle) d where (d ->> 'unidades')::integer < 1) then
    raise exception 'Las facturas no suman lo cobrado' using errcode = 'PV321';
  end if;
  if exists (select 1 from jsonb_array_elements(detalle) d
              where not exists (select 1 from public.productos p
                                 where p.id = (d ->> 'producto_id')::uuid and p.activo
                                   and p.categoria_id = pre.categoria_id)) then
    raise exception 'Ese producto no esta disponible' using errcode = 'PV304';
  end if;
  cuantos := jsonb_array_length(detalle);
  for item in
    select (d ->> 'producto_id')::uuid producto_id, (d ->> 'unidades')::integer unidades, p.nombre
      from jsonb_array_elements(detalle) d join public.productos p on p.id = (d ->> 'producto_id')::uuid
  loop
    i := i + 1;
    parte := case when i = cuantos then r.subtotal_centavos - acumulado
                  else (r.subtotal_centavos * item.unidades) / total_unidades end;
    acumulado := acumulado + parte;
    insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                           cantidad, precio_unitario_centavos, subtotal_centavos)
    values (el_local, r.venta_id, item.producto_id, coalesce(unidad.id, pre.id),
            item.nombre || ' · ' || coalesce(unidad.nombre, pre.nombre),
            case when unidad.id is null then item.unidades::numeric / pre.unidades else item.unidades end,
            round(r.subtotal_centavos::numeric / total_unidades)::bigint, parte);
  end loop;
  delete from public.renglones_de_venta where id = r.id;
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes, despues, motivo)
  values (el_local, auth.uid(), 'ventas', r.venta_id::text, 'cambio',
          jsonb_build_object('surtidas', r.descripcion), jsonb_build_object('armado', detalle),
          'Armado de facturas surtidas');
end
$$;

revoke all on function public.ventas_armar(uuid, jsonb) from public, anon;
grant execute on function public.ventas_armar(uuid, jsonb) to authenticated;
