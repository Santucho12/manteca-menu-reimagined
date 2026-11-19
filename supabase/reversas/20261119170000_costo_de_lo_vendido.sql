-- Reversa del costo de lo vendido. Borra el costo guardado en cada renglon de venta: no se
-- recupera (se puede recalcular solo con el costo de hoy, no con el de cada dia).
drop function if exists public.ganancia_por_producto(date, date);
drop trigger if exists costo_al_vender on public.renglones_de_venta;
drop function if exists public.renglones_de_venta_costo();
alter table public.renglones_de_venta drop column if exists costo_unitario_centavos;
