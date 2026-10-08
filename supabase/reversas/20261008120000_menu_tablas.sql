-- Reversa de menu (1 de 5). Borra las tablas del menu con todo lo cargado: no se recupera.
drop table if exists public.aumentos;
drop table if exists public.precios;
drop table if exists public.productos;
drop table if exists public.presentaciones;
drop table if exists public.categorias;
drop type if exists public.etiqueta_de_producto;
