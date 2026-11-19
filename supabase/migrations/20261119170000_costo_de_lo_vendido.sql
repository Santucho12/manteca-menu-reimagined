-- El costo de lo vendido (pedido 97): cada renglon de venta guarda el costo de ese momento,
-- con el mismo calculo que la pantalla Costos, y Reportes suma la ganancia por producto. Lo
-- completa un disparador al cargar el renglon, asi vale para el mostrador y la venta a mano
-- sin cambiar sus funciones. Caja vende pero no lee la columna: no ve las ventas.

alter table public.renglones_de_venta add column if not exists costo_unitario_centavos bigint
  check (costo_unitario_centavos is null or costo_unitario_centavos >= 0);

create or replace function public.renglones_de_venta_costo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.costo_unitario_centavos is null and new.producto_id is not null
     and new.presentacion_id is not null then
    select c.costo_centavos into new.costo_unitario_centavos
      from public.costos_de_productos_del_local(new.local_id) c
     where c.producto_id = new.producto_id and c.presentacion_id = new.presentacion_id
       and c.estado = 'ok';
  end if;
  return new;
end;
$$;

revoke all on function public.renglones_de_venta_costo() from public, anon, authenticated;

create or replace trigger costo_al_vender before insert on public.renglones_de_venta
  for each row execute function public.renglones_de_venta_costo();

-- Por producto, en el periodo y sin lo anulado: unidades, ventas, costo y ganancia. La
-- ganancia se cuenta sobre lo que tiene costo; lo que no, se dice aparte.
create or replace function public.ganancia_por_producto(desde date, hasta date)
returns table (
  producto_id uuid, producto text, unidades numeric, ventas_centavos bigint,
  costo_centavos bigint, ganancia_centavos bigint, sin_costo integer
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.reportes_exigir_admin();
  return query
    select r.producto_id, coalesce(p.nombre, min(r.descripcion)),
           sum(r.cantidad),
           sum(r.subtotal_centavos)::bigint,
           coalesce(sum(round(r.cantidad * r.costo_unitario_centavos)), 0)::bigint,
           (coalesce(sum(r.subtotal_centavos) filter (where r.costo_unitario_centavos is not null), 0)
             - coalesce(sum(round(r.cantidad * r.costo_unitario_centavos)), 0))::bigint,
           (count(*) filter (where r.costo_unitario_centavos is null))::integer
      from public.renglones_de_venta r
      join public.ventas v on v.id = r.venta_id
      left join public.productos p on p.id = r.producto_id
     where v.local_id = public.local_del_usuario() and v.estado = 'cerrada' and not v.anulado
       and v.fecha between desde and hasta
     group by r.producto_id, p.nombre
     order by 6 desc, 2;
end
$$;

revoke all on function public.ganancia_por_producto(date, date) from public, anon;
grant execute on function public.ganancia_por_producto(date, date) to authenticated;
