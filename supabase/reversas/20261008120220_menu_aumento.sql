-- Reversa de menu (3c de 5). Saca las funciones del aumento; los aumentos anotados quedan.
drop function if exists public.menu_aplicar_aumento(jsonb);
drop function if exists public.menu_aumento_vigente(uuid, uuid, jsonb);
drop function if exists public.menu_precios_del_alcance(uuid, uuid);
