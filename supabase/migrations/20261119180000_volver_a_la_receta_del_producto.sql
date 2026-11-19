-- Una presentacion que tenia su receta propia vuelve a usar la del producto: la propia se
-- desactiva (nada se borra) y queda en la auditoria. Sigue al pedido 95.

create or replace function public.recetas_usar_la_del_producto(el_producto uuid, la_presentacion uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para hacer esto' using errcode = 'PK300';
  end if;
  update public.recetas set activo = false
   where producto_id = el_producto and presentacion_id = la_presentacion
     and local_id = public.local_del_usuario() and activo;
  if not found then
    raise exception 'Esa presentacion no tiene receta propia' using errcode = 'PK305';
  end if;
end;
$$;

revoke all on function public.recetas_usar_la_del_producto(uuid, uuid) from public, anon;
grant execute on function public.recetas_usar_la_del_producto(uuid, uuid) to authenticated;
