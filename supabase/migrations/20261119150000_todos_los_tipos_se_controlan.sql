-- Todos los tipos de venta se controlan en el cierre, salvo Local, que es la caja (Santiago,
-- 2026-11-19): los que ya existen y los nuevos. Nadie lo cambia: lo pone la base al guardar.

update public.canales_de_venta set se_controla_en_el_cierre = not de_sistema
 where se_controla_en_el_cierre is distinct from not de_sistema;

create or replace function public.tipos_se_controlan_salvo_local()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.se_controla_en_el_cierre := not new.de_sistema;
  return new;
end
$$;

drop trigger if exists se_controla_salvo_local on public.canales_de_venta;
create trigger se_controla_salvo_local before insert or update on public.canales_de_venta
  for each row execute function public.tipos_se_controlan_salvo_local();

revoke update (se_controla_en_el_cierre) on table public.canales_de_venta from authenticated;
revoke all on function public.tipos_se_controlan_salvo_local() from public, anon, authenticated;
