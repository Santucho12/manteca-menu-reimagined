-- Generacion de los gastos recurrentes: crea los vencimientos que falten hasta una fecha. La
-- corre pg_cron todos los dias a las 3 de Argentina y el servidor al abrir Gastos, con la
-- clave secreta: es un proceso sin usuario y los gastos quedan a nombre del sistema.

create extension if not exists pg_cron;

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
  on conflict (recurrente_id, vencimiento) do nothing;
  get diagnostics creados = row_count;
  return creados;
end
$$;

revoke all on function public.generar_gastos_recurrentes(date) from public, anon, authenticated;
grant execute on function public.generar_gastos_recurrentes(date) to service_role;

select cron.unschedule(jobid) from cron.job where jobname = 'generar-gastos-recurrentes';
select cron.schedule(
  'generar-gastos-recurrentes',
  '0 6 * * *',
  $$select public.generar_gastos_recurrentes((now() at time zone 'America/Argentina/Buenos_Aires')::date)$$
);
