-- Borrar un canal de venta, solo si nunca se uso (excepcion de Santiago a "nada se borra", pedido
-- 60): uno con ventas se desactiva. La baja queda en la auditoria con el canal tal como estaba,
-- y por eso la auditoria admite la accion 'baja'.

alter table public.auditoria drop constraint if exists auditoria_accion_check;
alter table public.auditoria add constraint auditoria_accion_check check (accion in (
  'alta', 'cambio', 'anulacion', 'desactivacion', 'reactivacion', 'baja',
  'reseteo_de_contrasena', 'cambio_de_contrasena'
));

create or replace function public.ventas_borrar_canal(el_canal uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  el_borrado public.canales_de_venta;
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para borrar canales' using errcode = '42501';
  end if;
  select * into el_borrado from public.canales_de_venta c
   where c.id = el_canal and c.local_id = el_local;
  if not found then
    raise exception 'Ese canal no esta disponible' using errcode = 'PV303';
  end if;
  if exists (select 1 from public.ventas v where v.canal_id = el_canal) then
    raise exception 'Ese canal ya tiene ventas: se desactiva, no se borra' using errcode = 'PV309';
  end if;
  delete from public.canales_de_venta where id = el_canal;
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes)
  values (el_local, (select auth.uid()), 'canales_de_venta', el_canal::text, 'baja', to_jsonb(el_borrado));
end
$$;

revoke all on function public.ventas_borrar_canal(uuid) from public, anon;
grant execute on function public.ventas_borrar_canal(uuid) to authenticated;
