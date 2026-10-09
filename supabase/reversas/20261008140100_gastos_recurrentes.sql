-- Reversa de la generacion de recurrentes. Los gastos ya generados quedan.
select cron.unschedule(jobid) from cron.job where jobname = 'generar-gastos-recurrentes';
drop function if exists public.generar_gastos_recurrentes(date);
