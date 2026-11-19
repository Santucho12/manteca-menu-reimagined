-- Reversa de 20261119140100_cierre_por_tipo: se pierden los controles anotados en los cierres y
-- que tipos se controlan. Las ventas del mostrador con otro tipo que Local quedan con ese tipo.

drop function if exists public.cierres_guardar(jsonb);
alter function public.cierres_guardar_caja(jsonb) rename to cierres_guardar;
drop function if exists public.cierres_editar(uuid, jsonb);
alter function public.cierres_editar_caja(uuid, jsonb) rename to cierres_editar;
revoke all on function public.cierres_guardar(jsonb) from public, anon;
revoke all on function public.cierres_editar(uuid, jsonb) from public, anon;
grant execute on function public.cierres_guardar(jsonb) to authenticated;
grant execute on function public.cierres_editar(uuid, jsonb) to authenticated;

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
  el_total := public.ventas_validar_mostrador(el_local, datos);
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, clave,
                             en_la_caja, turno)
  values (el_local, 'mostrador', e.fecha, 'cerrada', el_total,
          (select c.id from public.canales_de_venta c where c.local_id = el_local and c.de_sistema),
          la_clave, true, e.turno)
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

drop function if exists public.ventas_tipo_del_mostrador(uuid, jsonb);
drop function if exists public.caja_tipos_para_vender();
drop function if exists public.cierres_controles(date, date);
drop function if exists public.cierres_anotar_controles(uuid, uuid, jsonb);
drop table if exists public.controles_de_cierre;
revoke update (se_controla_en_el_cierre) on table public.canales_de_venta from authenticated;
alter table public.canales_de_venta drop constraint if exists canales_de_venta_local_no_se_controla;
alter table public.canales_de_venta drop column if exists se_controla_en_el_cierre;
