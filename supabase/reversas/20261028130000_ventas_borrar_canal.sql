-- Reversa de borrar un canal: se quita la funcion y la accion 'baja' de la auditoria. No
-- recupera canales ya borrados; sus datos quedan en las filas 'baja' de la auditoria, que antes
-- de volver atras se borran o se convierten (si quedara alguna, la restriccion no se puede
-- volver a poner).

drop function if exists public.ventas_borrar_canal(uuid);

delete from public.auditoria where accion = 'baja';
alter table public.auditoria drop constraint if exists auditoria_accion_check;
alter table public.auditoria add constraint auditoria_accion_check check (accion in (
  'alta', 'cambio', 'anulacion', 'desactivacion', 'reactivacion',
  'reseteo_de_contrasena', 'cambio_de_contrasena'
));
