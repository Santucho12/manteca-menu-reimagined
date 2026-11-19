-- Reversa del pedido 89 (vender en el mostrador). Vuelven la subida del Excel de Fudo, la espera
-- de los cierres y la venta a mano sin la casilla de la caja. Las ventas del mostrador y el tipo
-- Local quedan guardados (nada se borra): Local deja de ser del sistema.

drop function if exists public.ventas_guardar_mostrador(jsonb);
drop function if exists public.ventas_validar_mostrador(uuid, jsonb);
drop function if exists public.ventas_validar_pagos_del_mostrador(jsonb, bigint);
drop function if exists public.ventas_renglones_del_mostrador(uuid, jsonb);
drop function if exists public.catalogo_para_vender();

drop trigger if exists reglas on public.canales_de_venta;
drop function if exists public.reglas_de_canales();
drop trigger if exists tipo_de_venta_local on public.locales;
drop function if exists public.crear_tipo_de_venta_local();
alter table public.canales_de_venta drop column if exists de_sistema;

-- La venta a mano como estaba (pedido 30, con su clave).
create or replace function public.ventas_guardar_manual(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_clave uuid := (datos ->> 'clave')::uuid;
  el_total bigint;
  nueva uuid;
begin
  perform public.ventas_validar_manual(el_local, datos);
  select v.id into nueva from public.ventas v where v.local_id = el_local and v.clave = la_clave;
  if nueva is not null then
    return nueva;
  end if;
  -- Cada subtotal se redondea a centavos; el total es la suma de los subtotales.
  select coalesce(sum(round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)), 0)
    into el_total
    from jsonb_array_elements(datos -> 'renglones') r;
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, comentario, clave)
  values (el_local, 'manual', (datos ->> 'fecha')::date, 'cerrada', el_total,
          (datos ->> 'canal_id')::uuid, nullif(trim(datos ->> 'comentario'), ''), la_clave)
  returning id into nueva;
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos)
  select el_local, nueva, p.id, pr.id, p.nombre || ' · ' || pr.nombre, (r ->> 'cantidad')::numeric,
         (r ->> 'precio_unitario_centavos')::bigint,
         round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)
    from jsonb_array_elements(datos -> 'renglones') r
    join public.productos p on p.id = (r ->> 'producto_id')::uuid
    join public.presentaciones pr on pr.id = (r ->> 'presentacion_id')::uuid;
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  values (el_local, nueva, (datos ->> 'medio')::public.medio_de_caja, el_total);
  return nueva;
end
$$;

-- Borrar un tipo de venta como estaba (pedido 60).
create or replace function public.ventas_borrar_canal(el_canal uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  el_borrado public.canales_de_venta;
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para borrar canales' using errcode = '42501';
  end if;
  select * into el_borrado from public.canales_de_venta c
   where c.id = el_canal and c.local_id = el_local;
  if not found then
    raise exception 'Ese canal no esta disponible' using errcode = 'PV303';
  end if;
  if exists (select 1 from public.ventas v where v.canal_id = el_canal) then
    raise exception 'Ese canal ya tiene ventas: se desactiva, no se borra' using errcode = 'PV309';
  end if;
  delete from public.canales_de_venta where id = el_canal;
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes)
  values (el_local, (select auth.uid()), 'canales_de_venta', el_canal::text, 'baja', to_jsonb(el_borrado));
end
$$;

alter table public.ventas drop column if exists en_la_caja;

-- Lo esperado como estaba (pedido 84), con la espera de las ventas de Fudo.
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

-- La subida del Excel de Fudo, como en los pedidos 59 y 84.
create or replace function public.ventas_validar_excel(lotes jsonb)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para subir ventas' using errcode = '42501';
  end if;
  if jsonb_typeof(lotes) is distinct from 'array' or jsonb_array_length(lotes) not between 1 and 2000 then
    raise exception 'La subida no tiene lotes validos' using errcode = 'PV308';
  end if;
  if exists (select 1 from jsonb_array_elements(lotes) l
             where jsonb_typeof(l -> 'montos') is distinct from 'array'
                or jsonb_array_length(l -> 'montos') not between 1 and 5000
                or coalesce((l ->> 'fecha') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$', true)
                or (l ->> 'medio') is null
                or not ((l ->> 'medio') = any (enum_range(null::public.medio_de_caja)::text[]))
                or exists (select 1 from jsonb_array_elements(l -> 'montos') m
                            where jsonb_typeof(m) is distinct from 'number' or (m #>> '{}') !~ '^[0-9]+$')) then
    raise exception 'Un lote de la subida no es valido' using errcode = 'PV308';
  end if;
  if (select count(distinct (l ->> 'fecha') || '|' || (l ->> 'medio')) <> count(*)
        from jsonb_array_elements(lotes) l) then
    raise exception 'La subida repite un dia y un medio' using errcode = 'PV308';
  end if;
  if exists (select 1 from jsonb_array_elements(lotes) l
             where (l ->> 'fecha')::date > (now() at time zone 'America/Argentina/Buenos_Aires')::date) then
    raise exception 'No se carga una venta de un dia que no llego' using errcode = 'PV301';
  end if;
end
$$;

create or replace function public.ventas_aplicar_lote(el_local uuid, lote jsonb)
returns int[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  la_fecha date := (lote ->> 'fecha')::date;
  el_medio public.medio_de_caja := (lote ->> 'medio')::public.medio_de_caja;
  montos bigint[] := array(select (m #>> '{}')::bigint
                             from jsonb_array_elements(lote -> 'montos') with ordinality t(m, n) order by n);
  vigentes uuid[] := array(select v.id from public.ventas v
                            where v.local_id = el_local and v.origen = 'fudo' and not v.anulado
                              and v.fudo_id like 'excel:' || la_fecha || ':' || el_medio || ':%'
                            order by v.fecha_creacion, v.id);
  cantidad_vigentes int := coalesce(cardinality(vigentes), 0);
  resultado int[] := array[0, 0, 0, 0];
  i int;
  cambio int;
begin
  for i in 1..cardinality(montos) loop
    if i > cantidad_vigentes then
      perform public.ventas_crear_del_excel(el_local, la_fecha, el_medio, montos[i]);
      resultado[1] := resultado[1] + 1;
    else
      update public.ventas set total_centavos = montos[i] where id = vigentes[i] and total_centavos <> montos[i];
      get diagnostics cambio = row_count;
      update public.pagos_de_venta set monto_centavos = montos[i] where venta_id = vigentes[i] and monto_centavos <> montos[i];
      resultado[2 + (1 - cambio)] := resultado[2 + (1 - cambio)] + 1;
    end if;
  end loop;
  perform set_config('manteca.reemplazando_excel', 'si', true);
  update public.ventas
     set anulado = true, motivo_anulacion = 'Reemplazada por una nueva subida del Excel de Fudo'
   where id = any (vigentes[cardinality(montos) + 1:cantidad_vigentes]);
  get diagnostics cambio = row_count;
  perform set_config('manteca.reemplazando_excel', '', true);
  resultado[4] := cambio;
  return resultado;
end
$$;

create or replace function public.ventas_crear_del_excel(el_local uuid, la_fecha date, el_medio public.medio_de_caja, el_monto bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  nueva uuid;
begin
  -- El Excel solo trae el dia: la hora de cierre queda sin dato, no se inventa una.
  insert into public.ventas (local_id, origen, fudo_id, fecha, cerrada_en, estado, total_centavos, fecha_creacion)
  values (el_local, 'fudo', 'excel:' || la_fecha || ':' || el_medio || ':' || gen_random_uuid(), la_fecha,
          null, 'cerrada', el_monto, clock_timestamp())
  returning id into nueva;
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  values (el_local, nueva, el_medio, el_monto);
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

revoke all on function
  public.ventas_validar_excel(jsonb),
  public.ventas_aplicar_lote(uuid, jsonb),
  public.ventas_crear_del_excel(uuid, date, public.medio_de_caja, bigint),
  public.ventas_auditar_subida(uuid, jsonb, int[])
  from public, anon, authenticated;
revoke all on function public.ventas_importar_excel(jsonb) from public, anon;
revoke all on function public.cierres_con_resultado(date, date, uuid) from public, anon;
revoke all on function public.ventas_fudo_cargadas_hasta() from public, anon;
revoke all on function public.reporte_ventas_sin_detalle(date, date) from public, anon;
grant execute on function public.ventas_importar_excel(jsonb) to authenticated;
grant execute on function public.cierres_con_resultado(date, date, uuid) to authenticated;
grant execute on function public.ventas_fudo_cargadas_hasta() to authenticated;
grant execute on function public.reporte_ventas_sin_detalle(date, date) to authenticated;
