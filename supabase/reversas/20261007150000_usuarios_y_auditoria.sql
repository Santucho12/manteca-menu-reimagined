-- Reversa de 20261007150000_usuarios_y_auditoria: borra las tablas y el tipo de rol. Va
-- despues de las reversas de 20261007150200 y 20261007150100. Se pierden perfiles, locales,
-- acciones y auditoria: no se recuperan. Las cuentas de Supabase Auth quedan.

drop table if exists public.auditoria;
drop table if exists public.acciones_de_cuenta;
drop table if exists public.perfiles;
drop table if exists public.locales;

drop type if exists public.rol_usuario;
