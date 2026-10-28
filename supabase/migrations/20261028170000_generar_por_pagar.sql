-- La generacion de lo que vence pasa a generar_por_pagar, que acepta un fijo: sin el, genera
-- todos, como el proceso de cada dia. Los tests generan solo el suyo: generar todos con una
-- fecha lejana llenaba de pagos falsos los fijos de la base de pruebas.

create or replace function public.generar_por_pagar(hasta date, el_fijo uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  creados integer;
begin
  -- Cada vencimiento sale del primero mas k periodos, no del anterior: asi el 31 de enero
  -- pasa al 28 de febrero y vuelve al 31 en marzo. Lo que un fijo ya habia cargado pagado,
  -- antes de que hubiera por pagar, no vuelve.
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
     and (el_fijo is null or r.id = el_fijo)
     and (r.generar_desde is null or v.vencimiento >= r.generar_desde)
     and not exists (select 1 from public.gastos g
                      where g.recurrente_id = r.id and g.vencimiento = v.vencimiento)
  on conflict (recurrente_id, vencimiento) do nothing;
  get diagnostics creados = row_count;
  return creados;
end
$$;

-- La llaman el proceso de cada dia y la aplicacion al abrir Gastos: todos los fijos.
create or replace function public.generar_gastos_recurrentes(hasta date)
returns integer
language sql
security definer
set search_path = ''
as $$
  select public.generar_por_pagar(hasta, null)
$$;

revoke all on function public.generar_por_pagar(date, uuid) from public, anon, authenticated;
grant execute on function public.generar_por_pagar(date, uuid) to service_role;
revoke all on function public.generar_gastos_recurrentes(date) from public, anon, authenticated;
grant execute on function public.generar_gastos_recurrentes(date) to service_role;
