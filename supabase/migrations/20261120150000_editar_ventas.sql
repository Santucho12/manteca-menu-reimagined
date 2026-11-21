-- Una venta se puede editar (Santiago, 2026-11-20, pedido 102; excepción a "una venta no se edita,
-- se anula"): productos, cantidades, tipo de venta y medio de pago, con motivo. El admin edita
-- cualquiera; Caja, las de los últimos 30 minutos, que además puede ver. La venta queda marcada
-- como editada y Auditoría guarda cómo estaba antes y cómo quedó.

alter table public.ventas
  add column if not exists editada boolean not null default false,
  add column if not exists motivo_edicion text
    check (motivo_edicion is null or char_length(motivo_edicion) between 3 and 300),
  add column if not exists editada_por uuid,
  add column if not exists fecha_edicion timestamptz;

-- Caja ve las ventas del local de los últimos 30 minutos, con sus productos y pagos: lo justo para
-- corregir una recién cobrada, sin ver lo vendido en el día.
drop policy if exists "ventas: caja ve las de los ultimos 30 minutos" on public.ventas;
create policy "ventas: caja ve las de los ultimos 30 minutos" on public.ventas
  for select to authenticated
  using ((select public.es_caja_activa()) and local_id = (select public.local_del_usuario())
         and cerrada_en >= now() - interval '30 minutes');

drop policy if exists "renglones_de_venta: caja ve los de los ultimos 30 minutos" on public.renglones_de_venta;
create policy "renglones_de_venta: caja ve los de los ultimos 30 minutos" on public.renglones_de_venta
  for select to authenticated
  using ((select public.es_caja_activa()) and local_id = (select public.local_del_usuario())
         and exists (select 1 from public.ventas v
                      where v.id = venta_id and v.cerrada_en >= now() - interval '30 minutes'));

drop policy if exists "pagos_de_venta: caja ve los de los ultimos 30 minutos" on public.pagos_de_venta;
create policy "pagos_de_venta: caja ve los de los ultimos 30 minutos" on public.pagos_de_venta
  for select to authenticated
  using ((select public.es_caja_activa()) and local_id = (select public.local_del_usuario())
         and exists (select 1 from public.ventas v
                      where v.id = venta_id and v.cerrada_en >= now() - interval '30 minutes'));

-- Cómo está una venta, para Auditoría: total, tipo, productos y pagos.
create or replace function public.ventas_como_esta(la_venta uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total_centavos', v.total_centavos,
    'canal_id', v.canal_id,
    'renglones', coalesce((select jsonb_agg(jsonb_build_object(
        'descripcion', r.descripcion, 'cantidad', r.cantidad, 'subtotal_centavos', r.subtotal_centavos)
        order by r.fecha_creacion, r.id)
      from public.renglones_de_venta r where r.venta_id = v.id), '[]'),
    'pagos', coalesce((select jsonb_agg(jsonb_build_object('medio', p.medio, 'monto_centavos', p.monto_centavos)
        order by p.medio)
      from public.pagos_de_venta p where p.venta_id = v.id), '[]'))
    from public.ventas v where v.id = la_venta
$$;

revoke all on function public.ventas_como_esta(uuid) from public, anon, authenticated;

-- Quién puede editar esta venta, o por qué no.
create or replace function public.ventas_controlar_edicion(v public.ventas, el_motivo text)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if v.id is null then
    raise exception 'No encontramos esa venta' using errcode = 'PV316';
  elsif v.anulado then
    raise exception 'La venta esta anulada' using errcode = 'PV305';
  elsif v.origen = 'fudo' then
    raise exception 'Las ventas de Fudo no se editan' using errcode = 'PV317';
  elsif not public.es_admin_activo()
        and (v.cerrada_en is null or v.cerrada_en < now() - interval '30 minutes') then
    raise exception 'Paso el tiempo para editarla' using errcode = 'PV318';
  elsif char_length(trim(coalesce(el_motivo, ''))) not between 3 and 300 then
    raise exception 'Falta el motivo' using errcode = 'PV319';
  end if;
end
$$;

revoke all on function public.ventas_controlar_edicion(public.ventas, text) from public, anon, authenticated;

-- Edita la venta con la misma cuenta que el mostrador (precios del menú de hoy, docena variada y
-- peso) y deja en Auditoría cómo estaba y cómo quedó, con el motivo.
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
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes, despues, motivo)
  values (el_local, auth.uid(), 'ventas', la_venta::text, 'cambio', antes,
          public.ventas_como_esta(la_venta), trim(el_motivo));
  return jsonb_build_object('id', la_venta, 'total_centavos', el_total);
end
$$;

revoke all on function public.ventas_editar(uuid, jsonb, text) from public, anon;
grant execute on function public.ventas_editar(uuid, jsonb, text) to authenticated;
