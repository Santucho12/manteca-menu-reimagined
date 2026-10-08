-- Reversa de menu (3 de 5). Saca las funciones de guardar; los datos quedan.
drop function if exists public.menu_guardar_producto(jsonb, boolean);
drop function if exists public.menu_escribir_precios_del_producto(uuid, uuid, jsonb);
drop function if exists public.menu_escribir_producto(uuid, jsonb);
drop function if exists public.menu_guardar_categoria(jsonb, boolean);
drop function if exists public.menu_escribir_presentaciones(uuid, uuid, jsonb);
drop function if exists public.menu_escribir_categoria(uuid, jsonb);
drop function if exists public.menu_ocultar_sin_precio(uuid[], boolean);
drop function if exists public.menu_poner_precio(uuid, uuid, uuid, bigint);
drop function if exists public.menu_validar_foto(text, uuid);
drop function if exists public.tiene_precio(uuid);
drop function if exists public.menu_exigir_admin();
