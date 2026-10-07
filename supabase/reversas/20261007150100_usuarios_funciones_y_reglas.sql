-- Reversa de 20261007150100_usuarios_funciones_y_reglas: borra las funciones. Va despues de la
-- reversa de 20261007150200, que quita los triggers y las policies que las usan.

drop function if exists public.sincronizar_cuenta();
drop function if exists public.registrar_cambio_de_contrasena(uuid, text, uuid);
drop function if exists public.usar_accion(uuid, text[]);
drop function if exists public.crear_perfil();
drop function if exists public.reglas_de_perfiles();
drop function if exists public.auditar();
drop function if exists public.marcar_actualizacion();
drop function if exists public.rol_de_cuenta_nueva(bigint);
drop function if exists public.es_admin_activo();
drop function if exists public.local_del_usuario();
