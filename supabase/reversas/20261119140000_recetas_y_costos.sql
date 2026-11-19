-- Reversa de recetas y costos. Borra las recetas, las unidades de cada presentacion y los
-- margenes cargados: no se recuperan.
drop function if exists public.costos_de_productos();
drop function if exists public.costos_de_productos_del_local(uuid);
drop function if exists public.recetas_guardar(jsonb);
drop function if exists public.recetas_controlar(uuid, jsonb);
drop trigger if exists reglas on public.insumos;
drop function if exists public.insumos_reglas();
drop table if exists public.configuracion_de_costos;
drop table if exists public.costos_de_presentacion;
drop function if exists public.costos_de_presentacion_reglas();
drop table if exists public.renglones_de_receta;
drop table if exists public.recetas;
