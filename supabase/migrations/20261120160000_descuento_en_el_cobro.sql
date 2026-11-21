-- Descuento en el cobro (Santiago, 2026-11-20, pedido 102; excepción a "en el mostrador no se
-- hacen descuentos"): por porcentaje o por monto, con motivo. La cuenta es la de
-- src/lib/vender/descuento.ts. Los renglones quedan con su precio; el descuento va en la venta.

alter table public.ventas
  add column if not exists descuento_centavos bigint not null default 0 check (descuento_centavos >= 0),
  add column if not exists motivo_descuento text
    check (motivo_descuento is null or char_length(motivo_descuento) between 3 and 300);

-- Cuánto se descuenta de lo que suman los renglones: nunca más que eso. Sin descuento, cero.
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
  if d ->> 'tipo' not in ('porcentaje', 'monto') or valor is null or valor <= 0
     or valor <> trunc(valor)
     or char_length(trim(coalesce(d ->> 'motivo', ''))) not between 3 and 300 then
    raise exception 'El descuento no es valido' using errcode = 'PV320';
  end if;
  return least(lo_que_suma, case when d ->> 'tipo' = 'porcentaje'
                                 then round(lo_que_suma * valor / 100)::bigint
                                 else (valor * 100)::bigint end);
end
$$;

revoke all on function public.ventas_descuento_del_mostrador(bigint, jsonb) from public, anon, authenticated;

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
  -- Con descuento total no hay nada que cobrar: un pago de $0 no se acepta.
  if el_total = 0 then
    raise exception 'El descuento no es valido' using errcode = 'PV320';
  end if;
  perform public.ventas_validar_pagos_del_mostrador(datos, el_total);
  return el_total;
end
$$;

-- El descuento y su motivo quedan en la venta, al cobrar y al editarla.
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
         motivo_descuento = nullif(trim(coalesce(datos -> 'descuento' ->> 'motivo', '')), '')
   where id = la_venta and local_id = el_local;
end
$$;

revoke all on function public.ventas_anotar_descuento(uuid, uuid, jsonb) from public, anon, authenticated;

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
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos)
  select el_local, la_venta, x.producto_id, x.presentacion_id, x.descripcion, x.cantidad,
         x.precio_centavos, x.subtotal_centavos
    from public.ventas_cuenta_del_mostrador(el_local, datos) x
   order by x.orden;
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
