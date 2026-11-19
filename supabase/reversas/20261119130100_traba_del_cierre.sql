-- Reversa de 20261119130100_traba_del_cierre: el mostrador vende sin traba. Se pierden las
-- postergaciones guardadas.

create or replace function public.ventas_guardar_mostrador(datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_clave uuid := (datos ->> 'clave')::uuid;
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
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
  el_total := public.ventas_validar_mostrador(el_local, datos);
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, clave,
                             en_la_caja, turno)
  values (el_local, 'mostrador', hoy, 'cerrada', el_total,
          (select c.id from public.canales_de_venta c where c.local_id = el_local and c.de_sistema),
          la_clave, true, public.caja_turno_de_la_venta(el_local, hoy))
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

revoke update (hora_cierre_mediodia, hora_cierre_noche) on table public.configuracion_de_caja from authenticated;
drop function if exists public.cierres_turnos_pendientes(date, date, timestamptz);
drop function if exists public.caja_postergar_cierre();
drop function if exists public.caja_estado_del_mostrador();
drop function if exists public.caja_estado_del_turno(timestamptz);
drop function if exists public.caja_turno_de_ayer_sin_cerrar(uuid, date);
drop function if exists public.caja_hora_del_turno(uuid, smallint);
drop function if exists public.caja_dia_sin_abrir(uuid, date);
drop function if exists public.caja_turno_con_cierre(uuid, date, smallint);
drop function if exists public.caja_turno_con_ventas(uuid, date, smallint);
drop table if exists public.postergaciones_de_cierre;
