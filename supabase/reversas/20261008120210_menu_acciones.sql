-- Reversa de menu (3b de 5). Saca las funciones; los datos quedan.
drop function if exists public.menu_reactivar(text, uuid);
drop function if exists public.menu_desactivar(text, uuid);
drop function if exists public.menu_mover(text, uuid, text);
drop function if exists public.menu_intercambiar_orden(text, uuid, uuid);
drop function if exists public.menu_vecino(text, uuid, text);
drop function if exists public.menu_cambiar_visibilidad(text, uuid, boolean);
drop function if exists public.menu_no_encontrado();
