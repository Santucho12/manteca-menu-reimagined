-- Dice de que dia es el cierre del que sale el fondo sugerido (el ultimo sin anular antes de la
-- fecha), para avisar en la carga cuando no es el de ayer. Solo lee: no cambia datos.
create or replace function public.cierres_fecha_del_fondo(la_fecha date)
returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.cierres_exigir_quien_carga();
  return (select c.fecha from public.cierres_de_caja c
           where c.local_id = public.local_del_usuario() and not c.anulado and c.fecha < la_fecha
           order by c.fecha desc limit 1);
end
$$;

revoke all on function public.cierres_fecha_del_fondo(date) from public, anon;
grant execute on function public.cierres_fecha_del_fondo(date) to authenticated;
