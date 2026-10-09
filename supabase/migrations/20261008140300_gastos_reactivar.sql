-- Un recurrente reactivado genera desde el dia en que se reactivo: lo que vencio mientras
-- estaba desactivado no aparece de golpe. La fecha la pone la base, en dia de Argentina.

alter table public.gastos_recurrentes add column if not exists generar_desde date;

create or replace function public.reglas_de_recurrentes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.activo and not old.activo then
    new.generar_desde := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
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

revoke all on function public.generar_gastos_recurrentes(date) from public, anon, authenticated;
grant execute on function public.generar_gastos_recurrentes(date) to service_role;
