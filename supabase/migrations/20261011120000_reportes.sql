-- Reportes: lecturas agregadas de ventas y gastos que comparten Reportes e Inicio. Solo un
-- admin activo: Caja lee sus cierres y los gastos de su cierre y no tiene que ver esto. Lo
-- cancelado y lo anulado no cuentan; el dia es la fecha en Argentina que ya guarda cada fila.

create or replace function public.reportes_exigir_admin()
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para ver los reportes' using errcode = '42501';
  end if;
end
$$;

create or replace function public.reporte_ventas_por_dia(desde date, hasta date)
returns table (dia date, ventas bigint, monto_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.reportes_exigir_admin();
  return query
    select v.fecha, count(*), coalesce(sum(v.total_centavos), 0)::bigint
      from public.ventas v
     where v.local_id = public.local_del_usuario() and v.estado = 'cerrada' and not v.anulado
       and v.fecha between desde and hasta
     group by v.fecha
     order by v.fecha;
end
$$;

-- La categoria es la de hoy del producto. Un renglon sin producto (de Fudo, sin vincular)
-- queda con su descripcion y sin categoria.
create or replace function public.reporte_ventas_por_producto(desde date, hasta date)
returns table (
  producto_id uuid, producto text, categoria_id uuid, categoria text, presentacion text,
  cantidad numeric, monto_centavos bigint
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
    select r.producto_id, coalesce(p.nombre, r.descripcion), c.id, c.nombre,
           coalesce(pr.nombre, ''), sum(r.cantidad), sum(r.subtotal_centavos)::bigint
      from public.renglones_de_venta r
      join public.ventas v on v.id = r.venta_id
      left join public.productos p on p.id = r.producto_id
      left join public.categorias c on c.id = p.categoria_id
      left join public.presentaciones pr on pr.id = r.presentacion_id
     where v.local_id = public.local_del_usuario() and v.estado = 'cerrada' and not v.anulado
       and v.fecha between desde and hasta
     group by r.producto_id, coalesce(p.nombre, r.descripcion), c.id, c.nombre,
              coalesce(pr.nombre, '')
     order by 7 desc, 2;
end
$$;

create or replace function public.reporte_ventas_por_categoria(desde date, hasta date)
returns table (categoria_id uuid, categoria text, ventas bigint, monto_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.reportes_exigir_admin();
  return query
    select c.id, coalesce(c.nombre, 'Sin vincular'), count(distinct v.id),
           sum(r.subtotal_centavos)::bigint
      from public.renglones_de_venta r
      join public.ventas v on v.id = r.venta_id
      left join public.productos p on p.id = r.producto_id
      left join public.categorias c on c.id = p.categoria_id
     where v.local_id = public.local_del_usuario() and v.estado = 'cerrada' and not v.anulado
       and v.fecha between desde and hasta
     group by c.id, c.nombre
     order by 4 desc, 2;
end
$$;

create or replace function public.reporte_gastos(desde date, hasta date)
returns table (dia date, categoria_id uuid, categoria text, monto_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.reportes_exigir_admin();
  return query
    select g.fecha, g.categoria_id, cg.nombre, sum(g.monto_centavos)::bigint
      from public.gastos g
      join public.categorias_de_gasto cg on cg.id = g.categoria_id
     where g.local_id = public.local_del_usuario() and not g.anulado
       and g.fecha between desde and hasta
     group by g.fecha, g.categoria_id, cg.nombre
     order by g.fecha, cg.nombre;
end
$$;

revoke all on function public.reportes_exigir_admin() from public, anon;
revoke all on function public.reporte_ventas_por_dia(date, date) from public, anon;
revoke all on function public.reporte_ventas_por_producto(date, date) from public, anon;
revoke all on function public.reporte_ventas_por_categoria(date, date) from public, anon;
revoke all on function public.reporte_gastos(date, date) from public, anon;
grant execute on function public.reportes_exigir_admin() to authenticated;
grant execute on function public.reporte_ventas_por_dia(date, date) to authenticated;
grant execute on function public.reporte_ventas_por_producto(date, date) to authenticated;
grant execute on function public.reporte_ventas_por_categoria(date, date) to authenticated;
grant execute on function public.reporte_gastos(date, date) to authenticated;
