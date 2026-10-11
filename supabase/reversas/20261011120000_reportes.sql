-- Reversa de reportes: solo funciones de lectura, no se pierde ningun dato.
drop function if exists public.reporte_gastos(date, date);
drop function if exists public.reporte_ventas_por_categoria(date, date);
drop function if exists public.reporte_ventas_por_producto(date, date);
drop function if exists public.reporte_ventas_por_dia(date, date);
drop function if exists public.reportes_exigir_admin();
