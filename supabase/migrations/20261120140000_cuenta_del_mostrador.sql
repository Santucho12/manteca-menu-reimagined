-- La docena variada y la venta por peso en el mostrador (Santiago, 2026-11-20, pedido 102). La
-- cuenta es la de src/lib/vender/cuenta.ts: si cambia una, cambia la otra.
--  - Facturas sueltas de una categoría con precio para todos se juntan: cada 12 la docena, si
--    sobran 6 o más la media, y el resto por unidad. Se cobra así solo si sale menos.
--  - Una forma con gramos (Por cuarto = 250) se vende por peso: se manda lo pesado y se cobra en
--    proporción, redondeado al centavo.

-- El catálogo trae cuánto es cada forma y si su precio es el de todos.
drop function if exists public.catalogo_para_vender();
create function public.catalogo_para_vender()
returns table (
  categoria_id uuid, categoria text, producto_id uuid, producto text, presentacion_id uuid,
  presentacion text, precio_centavos bigint, unidades integer, gramos integer, compartido boolean
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
  select c.id, c.nombre, p.id, p.nombre, pre.id, pre.nombre,
         coalesce(propio.monto_centavos, comun.monto_centavos), pre.unidades, pre.gramos,
         propio.monto_centavos is null
    from public.categorias c
    join public.productos p on p.categoria_id = c.id and p.activo
    join public.presentaciones pre on pre.categoria_id = c.id and pre.activo
    left join public.precios propio
      on propio.presentacion_id = pre.id and propio.producto_id = p.id and propio.activo
    left join public.precios comun
      on comun.presentacion_id = pre.id and comun.producto_id is null and comun.activo
   where c.local_id = public.local_del_usuario() and c.activo
     and coalesce(propio.monto_centavos, comun.monto_centavos) is not null
   order by c.orden, c.id, p.orden, p.id, pre.orden, pre.id;
end
$$;

revoke all on function public.catalogo_para_vender() from public, anon;
grant execute on function public.catalogo_para_vender() to authenticated;

-- Cada renglón con su precio del menú y lo que sale solo. Lo pesado va en cuartos (300 g de un
-- cuarto es 1,2) y su descripción dice los gramos.
drop function if exists public.ventas_renglones_del_mostrador(uuid, jsonb);
create function public.ventas_renglones_del_mostrador(el_local uuid, datos jsonb)
returns table (
  orden bigint, producto_id uuid, presentacion_id uuid, categoria_id uuid, descripcion text,
  cantidad numeric, precio_centavos bigint, mandado_centavos bigint, unidades integer,
  gramos integer, compartido boolean, solo_centavos bigint
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
                         * (r.dato ->> 'gramos')::numeric / pre.gramos)::bigint end
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
   where coalesce(propio.monto_centavos, comun.monto_centavos) is not null
$$;

revoke all on function public.ventas_renglones_del_mostrador(uuid, jsonb) from public, anon, authenticated;

-- Lo que paga una categoría en paquetes (12, 6, 1), o null si no se arma justo.
create or replace function public.ventas_precio_en_paquetes(la_categoria uuid, las_unidades bigint)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  resto bigint := las_unidades;
  total bigint := 0;
  p record;
begin
  for p in
    select distinct on (pre.unidades) pre.unidades, comun.monto_centavos
      from public.presentaciones pre
      join public.precios comun
        on comun.presentacion_id = pre.id and comun.producto_id is null and comun.activo
     where pre.categoria_id = la_categoria and pre.activo and pre.unidades is not null
     order by pre.unidades desc, comun.monto_centavos
  loop
    total := total + (resto / p.unidades) * p.monto_centavos;
    resto := resto % p.unidades;
  end loop;
  return case when resto = 0 then total end;
end
$$;

revoke all on function public.ventas_precio_en_paquetes(uuid, bigint) from public, anon, authenticated;

-- La cuenta de cada renglón: lo que sale solo, salvo en la docena variada, donde el precio de los
-- paquetes se reparte según lo que salía cada uno y el último se lleva el resto.
create or replace function public.ventas_cuenta_del_mostrador(el_local uuid, datos jsonb)
returns table (
  orden bigint, producto_id uuid, presentacion_id uuid, descripcion text, cantidad numeric,
  precio_centavos bigint, subtotal_centavos bigint
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
         (subtotales ->> x.orden::text)::bigint
    from public.ventas_renglones_del_mostrador(el_local, datos) x
   order by x.orden;
end
$$;

revoke all on function public.ventas_cuenta_del_mostrador(uuid, jsonb) from public, anon, authenticated;

-- Lo pesado lleva sus gramos (enteros, desde 1); lo demás, una cantidad entera desde 1.
create or replace function public.ventas_validar_mostrador(el_local uuid, datos jsonb)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  renglones jsonb := coalesce(datos -> 'renglones', '[]');
  cambiado text;
  el_total bigint;
begin
  if jsonb_array_length(renglones) = 0 then
    raise exception 'La venta no tiene productos' using errcode = 'PV302';
  end if;
  if exists (select 1 from jsonb_array_elements(renglones) r
              where case when r ? 'gramos'
                         then (r ->> 'gramos')::numeric < 1 or (r ->> 'gramos')::numeric > 99999
                              or (r ->> 'gramos')::numeric <> trunc((r ->> 'gramos')::numeric)
                         else (r ->> 'cantidad')::numeric < 1
                              or (r ->> 'cantidad')::numeric <> trunc((r ->> 'cantidad')::numeric) end) then
    raise exception 'La cantidad es un entero desde 1' using errcode = 'PV313';
  end if;
  if (select count(*) from public.ventas_renglones_del_mostrador(el_local, datos))
     <> jsonb_array_length(renglones)
     or exists (select 1 from public.ventas_renglones_del_mostrador(el_local, datos) x
                 where (x.gramos is null) = ((renglones -> (x.orden::int - 1)) ? 'gramos')) then
    raise exception 'Ese producto no esta disponible' using errcode = 'PV304';
  end if;
  select x.descripcion into cambiado from public.ventas_renglones_del_mostrador(el_local, datos) x
   where x.precio_centavos <> x.mandado_centavos limit 1;
  if cambiado is not null then
    raise exception 'Cambio el precio de %', cambiado using errcode = 'PV310';
  end if;
  select sum(x.subtotal_centavos)::bigint into el_total
    from public.ventas_cuenta_del_mostrador(el_local, datos) x;
  perform public.ventas_validar_pagos_del_mostrador(datos, el_total);
  return el_total;
end
$$;

-- Al guardar, cada renglón con lo que le toca de la cuenta.
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
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos)
  select el_local, nueva, x.producto_id, x.presentacion_id, x.descripcion, x.cantidad,
         x.precio_centavos, x.subtotal_centavos
    from public.ventas_cuenta_del_mostrador(el_local, datos) x
   order by x.orden;
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  select el_local, nueva, (p ->> 'medio')::public.medio_de_caja, (p ->> 'monto_centavos')::bigint
    from jsonb_array_elements(datos -> 'pagos') p;
  return jsonb_build_object('id', nueva, 'total_centavos', el_total);
end
$$;
