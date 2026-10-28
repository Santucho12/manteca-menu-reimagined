-- Reversa de generar_por_pagar: la generacion vuelve a vivir entera en
-- generar_gastos_recurrentes, solo para todos los fijos. No toca datos.

create or replace function public.generar_gastos_recurrentes(hasta date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  creados integer;
begin
  insert into public.gastos_por_pagar (local_id, vencimiento, categoria_id, monto_centavos,
                                       descripcion, proveedor_id, medio_de_pago, recurrente_id,
                                       creado_por)
  select r.local_id, v.vencimiento, r.categoria_id, r.monto_centavos, r.descripcion,
         r.proveedor_id, r.medio_de_pago, r.id, null
    from public.gastos_recurrentes r
   cross join lateral (
     select (r.primer_vencimiento + make_interval(months => k * case r.frecuencia
               when 'mensual' then 1 when 'bimestral' then 2 else 12 end))::date as vencimiento
       from generate_series(0, 1200) as k
   ) v
   where r.activo and v.vencimiento <= hasta
     and (r.generar_desde is null or v.vencimiento >= r.generar_desde)
     and not exists (select 1 from public.gastos g
                      where g.recurrente_id = r.id and g.vencimiento = v.vencimiento)
  on conflict (recurrente_id, vencimiento) do nothing;
  get diagnostics creados = row_count;
  return creados;
end
$$;

revoke all on function public.generar_gastos_recurrentes(date) from public, anon, authenticated;
grant execute on function public.generar_gastos_recurrentes(date) to service_role;

drop function if exists public.generar_por_pagar(date, uuid);
