-- El Excel de Fudo en el sistema (pedido 84): cada cierre dice si su dia ya tiene ventas de
-- Fudo cargadas, se lee hasta que dia las hay y cuanto se vendio sin detalle de productos, y la
-- subida del Excel deja un solo registro de auditoria con su resumen en vez de uno por venta.

-- Un dia tiene ventas cargadas si hay alguna venta de Fudo sin anular de ese dia o posterior:
-- con el Excel o con la API, lo que falta es siempre lo ultimo.
drop function if exists public.cierres_con_resultado(date, date, uuid);
create function public.cierres_con_resultado(desde date, hasta date, persona uuid default null)
returns table (
  id uuid, fecha date, cargado_por uuid, persona_nombre text, anulado boolean,
  motivo_anulacion text, comentario text,
  fondo_inicial_centavos bigint, efectivo_centavos bigint, credito_centavos bigint,
  debito_centavos bigint, qr_centavos bigint, transferencia_centavos bigint,
  queda_en_caja_centavos bigint, retiros_centavos bigint, gastos_centavos bigint,
  ventas_efectivo_centavos bigint, ventas_credito_centavos bigint, ventas_debito_centavos bigint,
  ventas_qr_centavos bigint, ventas_transferencia_centavos bigint, tolerancia_centavos bigint,
  ventas_cargadas boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.cierres_exigir_quien_carga();
  return query
  select c.id, c.fecha, c.cargado_por, p.nombre, c.anulado, c.motivo_anulacion, c.comentario,
    c.fondo_inicial_centavos, c.efectivo_centavos, c.credito_centavos, c.debito_centavos,
    c.qr_centavos, c.transferencia_centavos, c.queda_en_caja_centavos,
    coalesce((select sum(r.monto_centavos) from public.retiros_de_caja r where r.cierre_id = c.id), 0)::bigint,
    coalesce((select sum(g.monto_centavos) from public.gastos g where g.cierre_id = c.id and not g.anulado), 0)::bigint,
    coalesce(v.efectivo, 0)::bigint, coalesce(v.credito, 0)::bigint, coalesce(v.debito, 0)::bigint,
    coalesce(v.qr, 0)::bigint, coalesce(v.transferencia, 0)::bigint,
    coalesce((select k.tolerancia_centavos from public.configuracion_de_caja k where k.local_id = c.local_id), 50000),
    exists (select 1 from public.ventas f
             where f.local_id = c.local_id and f.origen = 'fudo' and not f.anulado and f.fecha >= c.fecha)
  from public.cierres_de_caja c
  join public.perfiles p on p.id = c.cargado_por
  left join lateral (
    select sum(pv.monto_centavos) filter (where pv.medio = 'efectivo') as efectivo,
           sum(pv.monto_centavos) filter (where pv.medio = 'credito') as credito,
           sum(pv.monto_centavos) filter (where pv.medio = 'debito') as debito,
           sum(pv.monto_centavos) filter (where pv.medio = 'qr') as qr,
           sum(pv.monto_centavos) filter (where pv.medio = 'transferencia') as transferencia
      from public.ventas ve
      join public.pagos_de_venta pv on pv.venta_id = ve.id
     where ve.local_id = c.local_id and ve.fecha = c.fecha and ve.estado = 'cerrada' and not ve.anulado
  ) v on true
  where c.fecha between desde and hasta
    and (persona is null or c.cargado_por = persona)
    and ((public.es_admin_activo() and c.local_id = public.local_del_usuario())
         or (c.cargado_por = (select auth.uid()) and public.es_caja_activa()))
  order by c.fecha desc, c.fecha_creacion desc;
end
$$;

create or replace function public.ventas_fudo_cargadas_hasta()
returns date
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  perform public.reportes_exigir_admin();
  return (select max(v.fecha) from public.ventas v
           where v.local_id = public.local_del_usuario() and v.origen = 'fudo' and not v.anulado);
end
$$;

-- Lo vendido sin renglones (el Excel de Fudo no trae productos): con esto los reportes por
-- producto y por categoria cierran con el total del periodo.
create or replace function public.reporte_ventas_sin_detalle(desde date, hasta date)
returns table (ventas bigint, monto_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.reportes_exigir_admin();
  return query
    select count(*), coalesce(sum(v.total_centavos), 0)::bigint
      from public.ventas v
     where v.local_id = public.local_del_usuario() and v.estado = 'cerrada' and not v.anulado
       and v.fecha between desde and hasta
       and not exists (select 1 from public.renglones_de_venta r where r.venta_id = v.id);
end
$$;

alter table public.auditoria drop constraint if exists auditoria_accion_check;
alter table public.auditoria add constraint auditoria_accion_check check (accion in (
  'alta', 'cambio', 'anulacion', 'desactivacion', 'reactivacion', 'baja',
  'reseteo_de_contrasena', 'cambio_de_contrasena', 'importacion'
));

-- Durante la subida del Excel las ventas y sus pagos no se auditan una por una: la subida deja
-- su propio registro con el resumen.
create or replace function public.auditar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ignoradas text[] := array_append(tg_argv, 'fecha_actualizacion');
  fila jsonb := to_jsonb(new);
  autor uuid := coalesce(
    (select auth.uid()),
    nullif(current_setting('manteca.usuario', true), '')::uuid
  );
  antes jsonb;
  despues jsonb;
  accion text;
begin
  if coalesce(current_setting('manteca.importando_excel', true), '') = 'si'
     and tg_table_name in ('ventas', 'pagos_de_venta') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    despues := fila - ignoradas;
    accion := 'alta';
  else
    select jsonb_object_agg(n.key, o.value), jsonb_object_agg(n.key, n.value)
      into antes, despues
      from jsonb_each(fila) n
      join jsonb_each(to_jsonb(old)) o on o.key = n.key
     where n.value is distinct from o.value
       and not (n.key = any (ignoradas));
    if antes is null then
      return new;
    end if;
    accion := case
      when despues ? 'anulado' and (despues ->> 'anulado')::boolean then 'anulacion'
      when despues ? 'activo' and not (despues ->> 'activo')::boolean then 'desactivacion'
      when despues ? 'activo' then 'reactivacion'
      else 'cambio'
    end;
  end if;
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes, despues, motivo)
  values (
    coalesce(fila ->> 'local_id', case when tg_table_name = 'locales' then fila ->> 'id' end)::uuid,
    autor,
    tg_table_name,
    fila ->> 'id',
    accion,
    antes,
    despues,
    case when accion = 'anulacion' then fila ->> 'motivo_anulacion' end
  );
  return new;
end
$$;

create or replace function public.ventas_auditar_subida(el_local uuid, lotes jsonb, suma int[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  desde date := (select min((l ->> 'fecha')::date) from jsonb_array_elements(lotes) l);
  hasta date := (select max((l ->> 'fecha')::date) from jsonb_array_elements(lotes) l);
begin
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, despues)
  values (el_local, (select auth.uid()), 'ventas', 'excel:' || desde || ':' || hasta, 'importacion',
    jsonb_build_object(
      'desde', desde, 'hasta', hasta,
      'dias', (select count(distinct l ->> 'fecha') from jsonb_array_elements(lotes) l),
      'nuevas', suma[1], 'actualizadas', suma[2], 'iguales', suma[3], 'anuladas', suma[4],
      'total_centavos', (select coalesce(sum((m #>> '{}')::bigint), 0)
                           from jsonb_array_elements(lotes) l, jsonb_array_elements(l -> 'montos') m)));
end
$$;

create or replace function public.ventas_importar_excel(lotes jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  lote jsonb;
  parcial int[];
  suma int[] := array[0, 0, 0, 0];
begin
  perform public.ventas_validar_excel(lotes);
  perform set_config('manteca.importando_excel', 'si', true);
  for lote in select l from jsonb_array_elements(lotes) l loop
    parcial := public.ventas_aplicar_lote(el_local, lote);
    suma := array[suma[1] + parcial[1], suma[2] + parcial[2], suma[3] + parcial[3], suma[4] + parcial[4]];
  end loop;
  perform set_config('manteca.importando_excel', '', true);
  perform public.ventas_auditar_subida(el_local, lotes, suma);
  return jsonb_build_object('nuevas', suma[1], 'actualizadas', suma[2], 'iguales', suma[3], 'anuladas', suma[4]);
end
$$;

revoke all on function public.cierres_con_resultado(date, date, uuid) from public, anon;
grant execute on function public.cierres_con_resultado(date, date, uuid) to authenticated;
revoke all on function public.ventas_fudo_cargadas_hasta() from public, anon;
grant execute on function public.ventas_fudo_cargadas_hasta() to authenticated;
revoke all on function public.reporte_ventas_sin_detalle(date, date) from public, anon;
grant execute on function public.reporte_ventas_sin_detalle(date, date) to authenticated;
revoke all on function public.ventas_auditar_subida(uuid, jsonb, int[]) from public, anon, authenticated;
