-- Reversa de la clave de carga y los totales con lo anulado: vuelven la funcion de guardado y
-- los totales de 20261010120000_ventas, y se quita la columna clave.
create or replace function public.ventas_guardar_manual(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  el_total bigint;
  nueva uuid;
begin
  perform public.ventas_validar_manual(el_local, datos);
  select coalesce(sum(round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)), 0)
    into el_total
    from jsonb_array_elements(datos -> 'renglones') r;
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, comentario)
  values (el_local, 'manual', (datos ->> 'fecha')::date, 'cerrada', el_total,
          (datos ->> 'canal_id')::uuid, nullif(trim(datos ->> 'comentario'), ''))
  returning id into nueva;
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos)
  select el_local, nueva, p.id, pr.id, p.nombre || ' · ' || pr.nombre, (r ->> 'cantidad')::numeric,
         (r ->> 'precio_unitario_centavos')::bigint,
         round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)
    from jsonb_array_elements(datos -> 'renglones') r
    join public.productos p on p.id = (r ->> 'producto_id')::uuid
    join public.presentaciones pr on pr.id = (r ->> 'presentacion_id')::uuid;
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  values (el_local, nueva, (datos ->> 'medio')::public.medio_de_caja, el_total);
  return nueva;
end
$$;

drop function if exists public.ventas_totales(date, date, text, text);
create function public.ventas_totales(
  desde date, hasta date, el_origen text default null, el_medio text default null
)
returns table (cobrado_centavos bigint, cobradas bigint, cancelado_centavos bigint, canceladas bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with del_periodo as (
    select v.estado,
           case when el_medio is null then v.total_centavos
                else (select coalesce(sum(p.monto_centavos), 0) from public.pagos_de_venta p
                       where p.venta_id = v.id and p.medio::text = el_medio) end as monto
      from public.ventas v
     where not v.anulado and v.fecha between desde and hasta
       and (el_origen is null or v.origen::text = el_origen)
       and (el_medio is null or exists (select 1 from public.pagos_de_venta p
                                         where p.venta_id = v.id and p.medio::text = el_medio))
  )
  select coalesce(sum(monto) filter (where estado = 'cerrada'), 0)::bigint,
         count(*) filter (where estado = 'cerrada'),
         coalesce(sum(monto) filter (where estado = 'cancelada'), 0)::bigint,
         count(*) filter (where estado = 'cancelada')
    from del_periodo
$$;
revoke all on function public.ventas_totales(date, date, text, text) from public, anon;
grant execute on function public.ventas_totales(date, date, text, text) to authenticated;

drop index if exists public.ventas_clave;
alter table public.ventas drop column if exists clave;
