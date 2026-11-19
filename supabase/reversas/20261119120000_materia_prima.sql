-- Reversa de materia prima. Borra los insumos y sus formas de compra con todo lo cargado:
-- no se recupera.
drop function if exists public.costo_de_insumos();
drop table if exists public.formas_de_compra;
drop function if exists public.formas_de_compra_reglas();
drop table if exists public.insumos;
drop type if exists public.unidad_de_uso;
