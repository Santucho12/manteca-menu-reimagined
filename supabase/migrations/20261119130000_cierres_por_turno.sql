-- Cierres por turno (pedido 98): dos cierres por dia, Mediodia (1) y Noche (2). Cada venta guarda
-- su turno al cobrarse y cada cierre compara lo contado con lo cobrado en su turno. Lo que ya
-- existe queda como Noche: un dia viejo sigue cerrando igual. La traba a la hora del cierre va
-- en la migracion siguiente.

-- 1. El turno de cada venta y de cada cierre, y las horas de cierre de cada turno.
alter table public.ventas
  add column if not exists turno smallint not null default 2 check (turno in (1, 2));
alter table public.cierres_de_caja
  add column if not exists turno smallint not null default 2 check (turno in (1, 2));
alter table public.configuracion_de_caja
  add column if not exists hora_cierre_mediodia time not null default '16:00',
  add column if not exists hora_cierre_noche time not null default '23:00';
alter table public.configuracion_de_caja drop constraint if exists configuracion_de_caja_horas;
alter table public.configuracion_de_caja
  add constraint configuracion_de_caja_horas check (hora_cierre_mediodia < hora_cierre_noche);

-- 2. Un cierre sin anular por turno, en lugar de uno por dia.
drop index if exists public.cierres_de_caja_un_dia;
create unique index if not exists cierres_de_caja_un_turno
  on public.cierres_de_caja (local_id, fecha, turno) where not anulado;

-- 3. El turno al que va una venta del mostrador: el Mediodia, hasta que tenga cierre.
create or replace function public.caja_turno_de_la_venta(el_local uuid, la_fecha date)
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select case when exists (
    select 1 from public.cierres_de_caja c
     where c.local_id = el_local and c.fecha = la_fecha and c.turno = 1 and not c.anulado
  ) then 2 else 1 end::smallint;
$$;

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

-- 4. La venta a mano guarda el turno que se eligio; sin elegirlo, la Noche.
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
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, comentario, clave,
                             en_la_caja, turno)
  values (el_local, 'manual', (datos ->> 'fecha')::date, 'cerrada', el_total,
          (datos ->> 'canal_id')::uuid, nullif(trim(datos ->> 'comentario'), ''), la_clave,
          coalesce((datos ->> 'en_la_caja')::boolean, false),
          coalesce((datos ->> 'turno')::smallint, 2))
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

-- 5. Guardar el cierre de un turno. La Noche de hoy espera al Mediodia si el Mediodia vendio.
create or replace function public.cierres_insertar(el_local uuid, datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo uuid;
begin
  insert into public.cierres_de_caja (local_id, fecha, turno, cargado_por, fondo_inicial_centavos,
    efectivo_centavos, credito_centavos, debito_centavos, qr_centavos, transferencia_centavos,
    queda_en_caja_centavos, comentario)
  values (el_local, (datos ->> 'fecha')::date, coalesce((datos ->> 'turno')::smallint, 2),
    (select auth.uid()),
    (datos ->> 'fondo_inicial_centavos')::bigint, (datos ->> 'efectivo_centavos')::bigint,
    coalesce((datos ->> 'credito_centavos')::bigint, 0), coalesce((datos ->> 'debito_centavos')::bigint, 0),
    coalesce((datos ->> 'qr_centavos')::bigint, 0), coalesce((datos ->> 'transferencia_centavos')::bigint, 0),
    (datos ->> 'queda_en_caja_centavos')::bigint, nullif(trim(datos ->> 'comentario'), ''))
  returning id into nuevo;
  return nuevo;
exception
  when unique_violation then
    raise exception 'Ya hay un cierre de ese turno' using errcode = 'PC302';
end
$$;

create or replace function public.caja_mediodia_sin_cerrar(el_local uuid, la_fecha date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ventas v
     where v.local_id = el_local and v.fecha = la_fecha and v.turno = 1 and v.en_la_caja
       and v.estado = 'cerrada' and not v.anulado
  ) and not exists (
    select 1 from public.cierres_de_caja c
     where c.local_id = el_local and c.fecha = la_fecha and c.turno = 1 and not c.anulado
  );
$$;

create or replace function public.cierres_guardar(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_fecha date := (datos ->> 'fecha')::date;
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  nuevo uuid;
begin
  perform public.cierres_exigir_quien_carga();
  if la_fecha > hoy then
    raise exception 'No se carga el cierre de un dia que no llego' using errcode = 'PC301';
  end if;
  if la_fecha = hoy and coalesce((datos ->> 'turno')::smallint, 2) = 2
     and public.caja_mediodia_sin_cerrar(el_local, hoy) then
    raise exception 'Primero va el cierre del mediodia' using errcode = 'PC309';
  end if;
  nuevo := public.cierres_insertar(el_local, datos);
  insert into public.retiros_de_caja (local_id, cierre_id, monto_centavos, quien)
  select el_local, nuevo, (r ->> 'monto_centavos')::bigint, trim(r ->> 'quien')
    from jsonb_array_elements(coalesce(datos -> 'retiros', '[]')) r;
  insert into public.gastos (local_id, fecha, categoria_id, monto_centavos, descripcion,
                             medio_de_pago, cierre_id)
  select el_local, la_fecha, c.id, (g ->> 'monto_centavos')::bigint, trim(g ->> 'descripcion'),
         'efectivo_caja', nuevo
    from jsonb_array_elements(coalesce(datos -> 'gastos', '[]')) g
   cross join public.categorias_de_gasto c
   where c.local_id = el_local and c.de_sistema;
  return nuevo;
end
$$;

-- 6. El fondo sale del cierre anterior contando el turno: la Noche, del Mediodia del mismo dia.
drop function if exists public.cierres_fondo_sugerido(date);
create or replace function public.cierres_fondo_sugerido(la_fecha date, el_turno smallint default 2)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.cierres_exigir_quien_carga();
  return (select c.queda_en_caja_centavos from public.cierres_de_caja c
           where c.local_id = public.local_del_usuario() and not c.anulado
             and (c.fecha, c.turno) < (la_fecha, el_turno)
           order by c.fecha desc, c.turno desc limit 1);
end
$$;

drop function if exists public.cierres_fecha_del_fondo(date);
create or replace function public.cierres_fecha_del_fondo(la_fecha date, el_turno smallint default 2)
returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.cierres_exigir_quien_carga();
  return (select c.fecha from public.cierres_de_caja c
           where c.local_id = public.local_del_usuario() and not c.anulado
             and (c.fecha, c.turno) < (la_fecha, el_turno)
           order by c.fecha desc, c.turno desc limit 1);
end
$$;

create or replace function public.cierres_fondos_anteriores(ids uuid[])
returns table (id uuid, fondo_anterior_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para ver los cierres' using errcode = '42501';
  end if;
  return query
    select c.id,
           (select a.queda_en_caja_centavos from public.cierres_de_caja a
             where a.local_id = c.local_id and not a.anulado and (a.fecha, a.turno) < (c.fecha, c.turno)
             order by a.fecha desc, a.turno desc limit 1)
      from public.cierres_de_caja c
     where c.id = any(ids);
end
$$;

-- 7. Lo esperado de cada cierre: lo cobrado en la caja en su fecha y en su turno. Cambia lo que
--    devuelve (suma el turno): se borra y se vuelve a crear.
drop function if exists public.cierres_con_resultado(date, date, uuid);
create function public.cierres_con_resultado(desde date, hasta date, persona uuid default null)
returns table (
  id uuid, fecha date, turno smallint, cargado_por uuid, persona_nombre text, anulado boolean,
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
  select c.id, c.fecha, c.turno, c.cargado_por, p.nombre, c.anulado, c.motivo_anulacion, c.comentario,
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
     where ve.local_id = c.local_id and ve.fecha = c.fecha and ve.turno = c.turno
       and ve.estado = 'cerrada' and not ve.anulado and ve.en_la_caja
  ) v on true
  where c.fecha between desde and hasta
    and (persona is null or c.cargado_por = persona)
    and ((public.es_admin_activo() and c.local_id = public.local_del_usuario())
         or (c.cargado_por = (select auth.uid()) and public.es_caja_activa()))
  order by c.fecha desc, c.turno desc, c.fecha_creacion desc;
end
$$;

-- Permisos
revoke all on function
  public.caja_turno_de_la_venta(uuid, date),
  public.caja_mediodia_sin_cerrar(uuid, date)
  from public, anon, authenticated;
revoke all on function public.cierres_fondo_sugerido(date, smallint) from public, anon;
revoke all on function public.cierres_fecha_del_fondo(date, smallint) from public, anon;
revoke all on function public.cierres_con_resultado(date, date, uuid) from public, anon;
grant execute on function public.cierres_fondo_sugerido(date, smallint) to authenticated;
grant execute on function public.cierres_fecha_del_fondo(date, smallint) to authenticated;
grant execute on function public.cierres_con_resultado(date, date, uuid) to authenticated;
