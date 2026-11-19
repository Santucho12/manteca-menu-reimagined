-- Reversa de 20261119150000_todos_los_tipos_se_controlan: el admin vuelve a elegir que tipos se
-- controlan. Los tipos quedan como estaban (controlados, salvo Local).
drop trigger if exists se_controla_salvo_local on public.canales_de_venta;
drop function if exists public.tipos_se_controlan_salvo_local();
grant update (se_controla_en_el_cierre) on table public.canales_de_venta to authenticated;
