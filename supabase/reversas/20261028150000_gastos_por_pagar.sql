-- Reversa de gastos_por_pagar: los fijos vuelven a cargar gastos pagados solos y se va lo por
-- pagar. Se pierden lo por pagar y el enlace de cada pago con lo suyo; los gastos pagados
-- quedan. Lo que quedo por pagar de un fijo se carga pagado la proxima vez que corra el proceso.

drop function if exists public.pagos_pendientes();

create or replace function public.generar_gastos_recurrentes(hasta date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  creados integer;
begin
  -- Cada vencimiento sale del primero mas k periodos, no del anterior: asi el 31 de enero
  -- pasa al 28 de febrero y vuelve al 31 en marzo.
  insert into public.gastos (local_id, fecha, categoria_id, monto_centavos, descripcion,
                             proveedor_id, medio_de_pago, recurrente_id, vencimiento, creado_por)
  select r.local_id, v.vencimiento, r.categoria_id, r.monto_centavos, r.descripcion,
         r.proveedor_id, r.medio_de_pago, r.id, v.vencimiento, null
    from public.gastos_recurrentes r
   cross join lateral (
     select (r.primer_vencimiento + make_interval(months => k * case r.frecuencia
               when 'mensual' then 1 when 'bimestral' then 2 else 12 end))::date as vencimiento
       from generate_series(0, 1200) as k
   ) v
   where r.activo and v.vencimiento <= hasta
     and (r.generar_desde is null or v.vencimiento >= r.generar_desde)
  on conflict (recurrente_id, vencimiento) do nothing;
  get diagnostics creados = row_count;
  return creados;
end
$$;

create or replace function public.reglas_de_gastos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.anulado then
    raise exception 'Un gasto anulado no se cambia' using errcode = 'PG204';
  end if;
  if tg_op = 'UPDATE' and old.cierre_id is not null then
    if new.monto_centavos <> old.monto_centavos or new.fecha <> old.fecha
       or new.medio_de_pago <> old.medio_de_pago then
      raise exception 'El monto de un gasto de caja se corrige anulando el cierre' using errcode = 'PC305';
    end if;
    if new.anulado and coalesce(current_setting('manteca.anulando_cierre', true), '') <> 'si' then
      raise exception 'Un gasto de caja se anula anulando el cierre' using errcode = 'PC306';
    end if;
  end if;
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
    return new;
  end if;
  -- Lo que genera un recurrente entra con el medio de su plantilla; despues, como cualquiera.
  if new.cierre_id is null and not (tg_op = 'INSERT' and new.recurrente_id is not null) then
    perform public.gastos_exigir_medio(new.medio_de_pago::text,
      case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
  end if;
  -- Lo que genera un recurrente o un cierre entra tal cual, aunque sea "Sin clasificar".
  if tg_op = 'INSERT' and (new.recurrente_id is not null or new.cierre_id is not null) then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

drop trigger if exists datos_del_por_pagar on public.gastos;
drop function if exists public.datos_del_por_pagar();
drop index if exists public.gastos_un_pago_por_pagar;
revoke insert (por_pagar_id) on table public.gastos from authenticated;
alter table public.gastos drop column if exists por_pagar_id;
drop table if exists public.gastos_por_pagar;
drop function if exists public.reglas_de_por_pagar();
drop function if exists public.es_vencimiento_del_fijo(date, public.frecuencia_de_gasto, date);
