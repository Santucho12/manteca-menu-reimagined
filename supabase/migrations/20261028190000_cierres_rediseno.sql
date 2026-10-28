-- Cierres de caja rediseñados (pedido 66): lo esperado se calcula al mostrar con las ventas del
-- dia, asi que se sacan el estado y los esperados guardados y todo lo de revisar. El cierre se
-- puede editar con cierres_editar.

alter table public.cierres_de_caja
  drop column if exists estado,
  drop column if exists esperado_efectivo_centavos,
  drop column if exists esperado_credito_centavos,
  drop column if exists esperado_debito_centavos,
  drop column if exists esperado_qr_centavos,
  drop column if exists esperado_transferencia_centavos,
  drop column if exists revisado,
  drop column if exists revisado_por,
  drop column if exists fecha_revision,
  drop column if exists comentario_revision;

drop type if exists public.estado_de_cierre;

-- Un cierre guardado solo se anula (con motivo); editar pasa por cierres_editar.
create or replace function public.reglas_de_cierres()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.anulado then
    raise exception 'Un cierre anulado no se cambia' using errcode = 'PC303';
  end if;
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PC304';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
  end if;
  return new;
end
$$;

drop trigger if exists auditar on public.cierres_de_caja;
create trigger auditar after insert or update on public.cierres_de_caja
  for each row execute function public.auditar('anulado_por', 'fecha_anulacion');

revoke update on table public.cierres_de_caja from authenticated;
grant update (anulado, motivo_anulacion) on table public.cierres_de_caja to authenticated;

-- Los cierres del rango con lo declarado y lo vendido ese dia por medio: la cuenta la hace
-- resultadoDelCierre. Caja recibe solo los suyos y no necesita leer las ventas.
create or replace function public.cierres_con_resultado(desde date, hasta date, persona uuid default null)
returns table (
  id uuid, fecha date, cargado_por uuid, persona_nombre text, anulado boolean,
  motivo_anulacion text, comentario text,
  fondo_inicial_centavos bigint, efectivo_centavos bigint, credito_centavos bigint,
  debito_centavos bigint, qr_centavos bigint, transferencia_centavos bigint,
  queda_en_caja_centavos bigint, retiros_centavos bigint, gastos_centavos bigint,
  ventas_efectivo_centavos bigint, ventas_credito_centavos bigint, ventas_debito_centavos bigint,
  ventas_qr_centavos bigint, ventas_transferencia_centavos bigint, tolerancia_centavos bigint
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
    coalesce((select k.tolerancia_centavos from public.configuracion_de_caja k where k.local_id = c.local_id), 50000)
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

-- Editar un cierre: cambia lo declarado y reemplaza sus retiros y sus gastos de caja. Los
-- gastos viejos se anulan con motivo (un gasto de caja no se edita suelto) y los retiros viejos
-- quedan dichos en la auditoria del cierre.
create or replace function public.cierres_editar(el_id uuid, datos jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_cierre public.cierres_de_caja;
  retiros_viejos jsonb;
  retiros_nuevos jsonb := coalesce(datos -> 'retiros', '[]');
begin
  perform public.cierres_exigir_quien_carga();
  select * into el_cierre from public.cierres_de_caja where id = el_id;
  if not found or not ((public.es_admin_activo() and el_cierre.local_id = public.local_del_usuario())
                       or (el_cierre.cargado_por = (select auth.uid()) and public.es_caja_activa())) then
    raise exception 'No tenes permiso para editar este cierre' using errcode = '42501';
  end if;
  if el_cierre.anulado then
    raise exception 'Un cierre anulado no se cambia' using errcode = 'PC303';
  end if;
  update public.cierres_de_caja set
    fondo_inicial_centavos = (datos ->> 'fondo_inicial_centavos')::bigint,
    efectivo_centavos = (datos ->> 'efectivo_centavos')::bigint,
    credito_centavos = coalesce((datos ->> 'credito_centavos')::bigint, 0),
    debito_centavos = coalesce((datos ->> 'debito_centavos')::bigint, 0),
    qr_centavos = coalesce((datos ->> 'qr_centavos')::bigint, 0),
    transferencia_centavos = coalesce((datos ->> 'transferencia_centavos')::bigint, 0),
    queda_en_caja_centavos = (datos ->> 'queda_en_caja_centavos')::bigint,
    comentario = nullif(trim(datos ->> 'comentario'), '')
  where id = el_id;
  select coalesce(jsonb_agg(jsonb_build_object('monto_centavos', monto_centavos, 'quien', quien)), '[]')
    into retiros_viejos from public.retiros_de_caja where cierre_id = el_id;
  delete from public.retiros_de_caja where cierre_id = el_id;
  insert into public.retiros_de_caja (local_id, cierre_id, monto_centavos, quien)
  select el_cierre.local_id, el_id, (r ->> 'monto_centavos')::bigint, trim(r ->> 'quien')
    from jsonb_array_elements(retiros_nuevos) r;
  if retiros_viejos is distinct from retiros_nuevos then
    insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes, despues)
    values (el_cierre.local_id, (select auth.uid()), 'cierres_de_caja', el_id::text, 'cambio',
            jsonb_build_object('retiros', retiros_viejos), jsonb_build_object('retiros', retiros_nuevos));
  end if;
  perform set_config('manteca.anulando_cierre', 'si', true);
  update public.gastos set anulado = true, motivo_anulacion = 'Se edito el cierre de caja'
   where cierre_id = el_id and not anulado;
  perform set_config('manteca.anulando_cierre', '', true);
  insert into public.gastos (local_id, fecha, categoria_id, monto_centavos, descripcion, medio_de_pago, cierre_id)
  select el_cierre.local_id, el_cierre.fecha, c.id, (g ->> 'monto_centavos')::bigint, trim(g ->> 'descripcion'),
         'efectivo_caja', el_id
    from jsonb_array_elements(coalesce(datos -> 'gastos', '[]')) g
   cross join public.categorias_de_gasto c
   where c.local_id = el_cierre.local_id and c.de_sistema;
end
$$;

revoke all on function public.cierres_con_resultado(date, date, uuid) from public, anon;
revoke all on function public.cierres_editar(uuid, jsonb) from public, anon;
grant execute on function public.cierres_con_resultado(date, date, uuid) to authenticated;
grant execute on function public.cierres_editar(uuid, jsonb) to authenticated;
