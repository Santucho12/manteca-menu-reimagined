-- Reversa de ventas. Borra las ventas, sus renglones y pagos, y los canales: no se recuperan.
drop function if exists public.ventas_guardar_manual(jsonb);
drop function if exists public.ventas_validar_manual(uuid, jsonb);
drop function if exists public.ventas_totales(date, date, text, text);
drop table if exists public.pagos_de_venta;
drop table if exists public.renglones_de_venta;
drop table if exists public.ventas;
drop table if exists public.canales_de_venta;
drop function if exists public.reglas_de_ventas();
drop type if exists public.medio_de_caja;
drop type if exists public.estado_de_venta;
drop type if exists public.origen_de_venta;
