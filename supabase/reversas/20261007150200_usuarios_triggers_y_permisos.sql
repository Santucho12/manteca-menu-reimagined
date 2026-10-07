-- Reversa de 20261007150200_usuarios_triggers_y_permisos: quita los triggers, las policies y
-- los permisos, y borra los datos (perfiles, locales, acciones y auditoria), que no se
-- recuperan. Es la primera de las tres reversas.

drop trigger if exists al_crear_cuenta on auth.users;
drop trigger if exists al_actualizar_cuenta on auth.users;
drop trigger if exists marcar_actualizacion on public.locales;
drop trigger if exists marcar_actualizacion on public.perfiles;
drop trigger if exists marcar_actualizacion on public.acciones_de_cuenta;
drop trigger if exists reglas on public.perfiles;
drop trigger if exists auditar on public.locales;
drop trigger if exists auditar on public.perfiles;

drop policy if exists "locales: el admin activo ve su local" on public.locales;
drop policy if exists "perfiles: cada uno ve el suyo y el admin activo los de su local" on public.perfiles;
drop policy if exists "perfiles: el admin activo edita los de su local" on public.perfiles;
drop policy if exists "auditoria: el admin activo ve la de su local" on public.auditoria;

revoke all on table public.locales, public.perfiles, public.acciones_de_cuenta, public.auditoria
  from authenticated;

delete from public.auditoria;
delete from public.acciones_de_cuenta;
delete from public.perfiles;
delete from public.locales;
