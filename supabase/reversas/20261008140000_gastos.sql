-- Reversa de gastos. Borra las tablas con todo lo cargado: no se recupera.
drop table if exists public.gastos;
drop table if exists public.gastos_recurrentes;
drop table if exists public.categorias_de_gasto;
drop function if exists public.reglas_de_gastos();
drop function if exists public.reglas_de_recurrentes();
drop function if exists public.reglas_de_categorias_de_gasto();
drop function if exists public.gastos_validar_categoria_y_proveedor(uuid, uuid, uuid, uuid);
drop type if exists public.frecuencia_de_gasto;
drop type if exists public.medio_de_pago;
