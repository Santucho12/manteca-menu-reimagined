-- La traba a la hora del cierre (pedido 98): pasada la hora de un turno con ventas y sin cierre,
-- o con la caja de ayer sin cerrar, el mostrador no vende hasta cargar el cierre o postergarlo 10
-- minutos. Despues del cierre de la noche no se vende hasta el dia siguiente. Suma los turnos
-- pendientes para el control y deja que el admin cambie las horas de cierre.

-- 1. Cada postergacion es una fila: no se cambia ni se borra.
create table if not exists public.postergaciones_de_cierre (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  fecha date not null,
  turno smallint not null check (turno in (1, 2)),
  postergado_por uuid not null references public.perfiles (id) default auth.uid(),
  desde timestamptz not null,
  hasta timestamptz not null check (hasta > desde),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);
create index if not exists postergaciones_de_cierre_turno
  on public.postergaciones_de_cierre (local_id, fecha, turno, hasta desc);

drop trigger if exists auditar on public.postergaciones_de_cierre;
create trigger auditar after insert on public.postergaciones_de_cierre
  for each row execute function public.auditar();

alter table public.postergaciones_de_cierre enable row level security;
revoke all on table public.postergaciones_de_cierre from anon, authenticated;
grant select on table public.postergaciones_de_cierre to authenticated;

drop policy if exists "postergaciones: el admin activo ve las de su local" on public.postergaciones_de_cierre;
create policy "postergaciones: el admin activo ve las de su local" on public.postergaciones_de_cierre
  for select to authenticated
  using (public.es_admin_activo() and local_id = public.local_del_usuario());

drop policy if exists "postergaciones: caja activa ve las suyas" on public.postergaciones_de_cierre;
create policy "postergaciones: caja activa ve las suyas" on public.postergaciones_de_cierre
  for select to authenticated
  using (public.es_caja_activa() and postergado_por = (select auth.uid()));

-- 2. Lo que se pregunta de un turno.
create or replace function public.caja_turno_con_ventas(el_local uuid, la_fecha date, el_turno smallint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ventas v
     where v.local_id = el_local and v.fecha = la_fecha and v.turno = el_turno and v.en_la_caja
       and v.estado = 'cerrada' and not v.anulado
  );
$$;

create or replace function public.caja_turno_con_cierre(el_local uuid, la_fecha date, el_turno smallint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cierres_de_caja c
     where c.local_id = el_local and c.fecha = la_fecha and c.turno = el_turno and not c.anulado
  );
$$;

create or replace function public.caja_dia_sin_abrir(el_local uuid, la_fecha date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.dias_sin_abrir d
     where d.local_id = el_local and d.fecha = la_fecha and d.activo
  );
$$;

create or replace function public.caja_hora_del_turno(el_local uuid, el_turno smallint)
returns time
language sql
stable
security definer
set search_path = ''
as $$
  select case when el_turno = 1 then k.hora_cierre_mediodia else k.hora_cierre_noche end
    from public.configuracion_de_caja k where k.local_id = el_local;
$$;

-- El turno de ayer que traba hoy: el ultimo con ventas, si no tiene cierre y ayer abrio.
create or replace function public.caja_turno_de_ayer_sin_cerrar(el_local uuid, ayer date)
returns smallint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  el_turno smallint;
begin
  if public.caja_dia_sin_abrir(el_local, ayer) then
    return null;
  end if;
  el_turno := case when public.caja_turno_con_ventas(el_local, ayer, 2::smallint) then 2
                   when public.caja_turno_con_ventas(el_local, ayer, 1::smallint) then 1 end;
  if el_turno is null or public.caja_turno_con_cierre(el_local, ayer, el_turno) then
    return null;
  end if;
  return el_turno;
end
$$;

-- 3. El estado del mostrador en un momento: a que turno va una venta y si esta trabado. Sin
--    montos: Caja lo lee y no ve lo vendido.
create or replace function public.caja_estado_del_turno(momento timestamptz)
returns table (
  fecha date, turno smallint, trabado boolean, motivo text, fecha_trabada date,
  turno_trabado smallint, postergado_hasta timestamptz, proxima_hora timestamptz,
  hora_de_corte time
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  zona constant text := 'America/Argentina/Buenos_Aires';
  el_local uuid := public.local_del_usuario();
  hoy date := (momento at time zone zona)::date;
  ahora time := (momento at time zone zona)::time;
  el_turno smallint;
  la_hora time;
  de_ayer smallint;
  el_motivo text;
  la_fecha date;
  el_trabado smallint;
  hasta timestamptz;
begin
  if not (public.es_caja_activa() or public.es_admin_activo()) then
    raise exception 'No tenes permiso para vender' using errcode = '42501';
  end if;
  el_turno := case
    when public.caja_turno_con_cierre(el_local, hoy, 1::smallint) then 2
    when ahora >= public.caja_hora_del_turno(el_local, 1::smallint)
         and not public.caja_turno_con_ventas(el_local, hoy, 1::smallint) then 2
    else 1 end;
  la_hora := public.caja_hora_del_turno(el_local, el_turno);
  de_ayer := public.caja_turno_de_ayer_sin_cerrar(el_local, hoy - 1);
  if de_ayer is not null then
    el_motivo := 'ayer'; la_fecha := hoy - 1; el_trabado := de_ayer;
  elsif public.caja_turno_con_cierre(el_local, hoy, 2::smallint) then
    el_motivo := 'cerrada'; la_fecha := hoy; el_trabado := 2;
  elsif ahora >= la_hora and public.caja_turno_con_ventas(el_local, hoy, el_turno) then
    el_motivo := 'hora'; la_fecha := hoy; el_trabado := el_turno;
  end if;
  select max(p.hasta) into hasta from public.postergaciones_de_cierre p
   where p.local_id = el_local and p.fecha = la_fecha and p.turno = el_trabado and p.hasta > momento;
  return query select hoy, el_turno,
    el_motivo is not null and (el_motivo = 'cerrada' or hasta is null),
    el_motivo, la_fecha, el_trabado, hasta,
    case when ahora < la_hora then (hoy + la_hora) at time zone zona end,
    la_hora;
end
$$;

create or replace function public.caja_estado_del_mostrador()
returns table (
  fecha date, turno smallint, trabado boolean, motivo text, fecha_trabada date,
  turno_trabado smallint, postergado_hasta timestamptz, proxima_hora timestamptz,
  hora_de_corte time
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.caja_estado_del_turno(now());
$$;

-- 4. Postergar 10 minutos desde ahora, sin pasar del fin del dia.
create or replace function public.caja_postergar_cierre()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  zona constant text := 'America/Argentina/Buenos_Aires';
  e record;
  fin_del_dia timestamptz;
  el_hasta timestamptz;
begin
  select * into e from public.caja_estado_del_turno(now());
  if e.motivo is null or e.motivo = 'cerrada' then
    raise exception 'No hay ningun cierre para postergar' using errcode = 'PC310';
  end if;
  fin_del_dia := ((e.fecha + 1)::timestamp at time zone zona) - interval '1 second';
  el_hasta := least(now() + interval '10 minutes', fin_del_dia);
  insert into public.postergaciones_de_cierre (local_id, fecha, turno, desde, hasta)
  values (public.local_del_usuario(), e.fecha_trabada, e.turno_trabado, now(), el_hasta);
  return el_hasta;
end
$$;

-- 5. El mostrador vende solo sin traba, y la venta va al turno del estado.
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

-- 6. Los turnos pendientes: con ventas en la caja, sin cierre, de un dia que abrio y con la
--    hora ya pasada. Solo el admin.
create or replace function public.cierres_turnos_pendientes(desde date, hasta date,
                                                            momento timestamptz default now())
returns table (fecha date, turno smallint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  zona constant text := 'America/Argentina/Buenos_Aires';
  el_local uuid := public.local_del_usuario();
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para ver los cierres' using errcode = '42501';
  end if;
  return query
  select distinct v.fecha, v.turno
    from public.ventas v
   where v.local_id = el_local and v.fecha between desde and hasta and v.en_la_caja
     and v.estado = 'cerrada' and not v.anulado
     and not public.caja_turno_con_cierre(el_local, v.fecha, v.turno)
     and not public.caja_dia_sin_abrir(el_local, v.fecha)
     and (v.fecha + public.caja_hora_del_turno(el_local, v.turno)) at time zone zona <= momento
   order by v.fecha desc, v.turno desc;
end
$$;

-- 7. El admin cambia las horas de cierre como la tolerancia: con su policy y con auditoria.
grant update (hora_cierre_mediodia, hora_cierre_noche) on table public.configuracion_de_caja to authenticated;

-- Permisos
revoke all on function
  public.caja_turno_con_ventas(uuid, date, smallint),
  public.caja_turno_con_cierre(uuid, date, smallint),
  public.caja_dia_sin_abrir(uuid, date),
  public.caja_hora_del_turno(uuid, smallint),
  public.caja_turno_de_ayer_sin_cerrar(uuid, date)
  from public, anon, authenticated;
revoke all on function public.caja_estado_del_turno(timestamptz) from public, anon;
revoke all on function public.caja_estado_del_mostrador() from public, anon;
revoke all on function public.caja_postergar_cierre() from public, anon;
revoke all on function public.cierres_turnos_pendientes(date, date, timestamptz) from public, anon;
grant execute on function public.caja_estado_del_turno(timestamptz) to authenticated;
grant execute on function public.caja_estado_del_mostrador() to authenticated;
grant execute on function public.caja_postergar_cierre() to authenticated;
grant execute on function public.cierres_turnos_pendientes(date, date, timestamptz) to authenticated;
