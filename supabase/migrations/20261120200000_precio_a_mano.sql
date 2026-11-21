-- Precio a mano en el mostrador (Santiago, 2026-11-20, pedido 102; excepción a "el precio es el
-- del menú"): el precio de un producto (promo, Pedidos Ya) y el total final, con motivo. Admin y
-- Caja. El total final va como un descuento de tipo 'total': lo que suma menos lo escrito.

alter table public.ventas
  add column if not exists descuento_tipo text check (descuento_tipo in ('porcentaje', 'monto', 'total')),
  add column if not exists motivo_precio text
    check (motivo_precio is null or char_length(motivo_precio) between 3 and 300);

alter table public.renglones_de_venta
  add column if not exists precio_cambiado boolean not null default false;

create or replace function public.ventas_descuento_del_mostrador(lo_que_suma bigint, datos jsonb)
returns bigint
language plpgsql
immutable
set search_path = ''
as $$
declare
  d jsonb := datos -> 'descuento';
  valor numeric;
begin
  if d is null or jsonb_typeof(d) = 'null' then
    return 0;
  end if;
  valor := (d ->> 'valor')::numeric;
  if d ->> 'tipo' not in ('porcentaje', 'monto', 'total') or valor is null or valor <= 0
     or valor <> trunc(valor)
     or char_length(trim(coalesce(d ->> 'motivo', ''))) not between 3 and 300 then
    raise exception 'El descuento no es valido' using errcode = 'PV320';
  end if;
  return case d ->> 'tipo'
    when 'porcentaje' then least(lo_que_suma, round(lo_que_suma * valor / 100)::bigint)
    when 'monto' then least(lo_que_suma, (valor * 100)::bigint)
    else greatest(0, lo_que_suma - (valor * 100)::bigint) end;
end
$$;

revoke all on function public.ventas_descuento_del_mostrador(bigint, jsonb) from public, anon, authenticated;

drop function if exists public.ventas_cuenta_del_mostrador(uuid, jsonb);
drop function if exists public.ventas_renglones_del_mostrador(uuid, jsonb);
create function public.ventas_renglones_del_mostrador(el_local uuid, datos jsonb)
returns table (
  orden bigint, producto_id uuid, presentacion_id uuid, categoria_id uuid, descripcion text,
  cantidad numeric, precio_centavos bigint, mandado_centavos bigint, unidades integer,
  gramos integer, compartido boolean, solo_centavos bigint, surtida boolean, precio_cambiado boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select x.orden, x.producto_id, x.presentacion_id, x.categoria_id, x.descripcion, x.cantidad,
         coalesce(x.especial, x.del_menu),
         case when x.especial is null then x.mandado else x.especial end,
         x.unidades, x.gramos, x.compartido and x.especial is null,
         case when x.gramos_forma is null then (x.cantidad * coalesce(x.especial, x.del_menu))::bigint
              else round(coalesce(x.especial, x.del_menu) * x.gramos::numeric / x.gramos_forma)::bigint end,
         false, x.especial is not null
    from (
      select r.orden, p.id producto_id, pre.id presentacion_id, p.categoria_id,
             p.nombre || ' · ' || pre.nombre
               || case when pre.gramos is null then '' else ' (' || (r.dato ->> 'gramos') || ' g)' end descripcion,
             case when pre.gramos is null then (r.dato ->> 'cantidad')::numeric
                  else (r.dato ->> 'gramos')::numeric / pre.gramos end cantidad,
             coalesce(propio.monto_centavos, comun.monto_centavos) del_menu,
             (r.dato ->> 'precio_centavos')::bigint mandado,
             (r.dato ->> 'precio_especial')::bigint especial,
             pre.unidades, pre.gramos gramos_forma,
             case when pre.gramos is null then null else (r.dato ->> 'gramos')::integer end gramos,
             propio.monto_centavos is null compartido
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
    ) x
  union all
  select r.orden, null, pre.id, c.id, c.nombre || ' surtidas · ' || pre.nombre,
         (r.dato ->> 'cantidad')::numeric, comun.monto_centavos, (r.dato ->> 'precio_centavos')::bigint,
         pre.unidades, null, true, ((r.dato ->> 'cantidad')::numeric * comun.monto_centavos)::bigint, true, false
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
  precio_centavos bigint, subtotal_centavos bigint, surtida boolean, precio_cambiado boolean
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
         (subtotales ->> x.orden::text)::bigint, x.surtida, x.precio_cambiado
    from public.ventas_renglones_del_mostrador(el_local, datos) x
   order by x.orden;
end
$$;

revoke all on function public.ventas_cuenta_del_mostrador(uuid, jsonb) from public, anon, authenticated;

create or replace function public.ventas_poner_renglones(la_venta uuid, el_local uuid, datos jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos, surtida,
                                         precio_cambiado)
  select el_local, la_venta, x.producto_id, x.presentacion_id, x.descripcion, x.cantidad,
         x.precio_centavos, x.subtotal_centavos, x.surtida, x.precio_cambiado
    from public.ventas_cuenta_del_mostrador(el_local, datos) x
   order by x.orden
$$;

revoke all on function public.ventas_poner_renglones(uuid, uuid, jsonb) from public, anon, authenticated;

-- Un precio a mano es un entero mayor que cero y la venta lleva su motivo.
create or replace function public.ventas_validar_precios_a_mano(datos jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if exists (select 1 from jsonb_array_elements(coalesce(datos -> 'renglones', '[]')) r
              where r ? 'precio_especial'
                and (coalesce((r ->> 'precio_especial')::numeric, 0) <= 0
                     or (r ->> 'precio_especial')::numeric <> trunc((r ->> 'precio_especial')::numeric)))
     or (exists (select 1 from jsonb_array_elements(coalesce(datos -> 'renglones', '[]')) r
                  where r ? 'precio_especial')
         and char_length(trim(coalesce(datos ->> 'motivo_precio', ''))) not between 3 and 300) then
    raise exception 'El precio cambiado no es valido' using errcode = 'PV323';
  end if;
end
$$;

revoke all on function public.ventas_validar_precios_a_mano(jsonb) from public, anon, authenticated;

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
  lo_que_suma bigint;
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
  perform public.ventas_validar_precios_a_mano(datos);
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
  select sum(x.subtotal_centavos)::bigint into lo_que_suma
    from public.ventas_cuenta_del_mostrador(el_local, datos) x;
  el_total := lo_que_suma - public.ventas_descuento_del_mostrador(lo_que_suma, datos);
  if el_total = 0 then
    raise exception 'El descuento no es valido' using errcode = 'PV320';
  end if;
  perform public.ventas_validar_pagos_del_mostrador(datos, el_total);
  return el_total;
end
$$;

create or replace function public.ventas_anotar_descuento(la_venta uuid, el_local uuid, datos jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  lo_que_suma bigint;
begin
  select sum(r.subtotal_centavos)::bigint into lo_que_suma
    from public.renglones_de_venta r where r.venta_id = la_venta;
  update public.ventas
     set descuento_centavos = public.ventas_descuento_del_mostrador(lo_que_suma, datos),
         motivo_descuento = nullif(trim(coalesce(datos -> 'descuento' ->> 'motivo', '')), ''),
         descuento_tipo = datos -> 'descuento' ->> 'tipo',
         descuento_porcentaje = case when datos -> 'descuento' ->> 'tipo' = 'porcentaje'
                                     then least(100, (datos -> 'descuento' ->> 'valor')::integer) end,
         motivo_precio = case when exists (select 1 from public.renglones_de_venta r
                                            where r.venta_id = la_venta and r.precio_cambiado)
                              then nullif(trim(coalesce(datos ->> 'motivo_precio', '')), '') end
   where id = la_venta and local_id = el_local;
end
$$;
