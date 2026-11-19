-- Pedido 90: ventas por tipo de venta. El reporte suma cada tipo, y los totales de la lista de
-- Ventas siguen tambien al filtro por tipo.

-- Lo cerrado y sin anular del periodo, por tipo; las ventas viejas de Fudo no tienen tipo.
create or replace function public.reporte_ventas_por_tipo(desde date, hasta date)
returns table (canal_id uuid, tipo text, ventas bigint, monto_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  perform public.reportes_exigir_admin();
  return query
    select c.id, coalesce(c.nombre, 'Sin tipo'), count(*)::bigint, sum(v.total_centavos)::bigint
      from public.ventas v
      left join public.canales_de_venta c on c.id = v.canal_id
     where v.local_id = public.local_del_usuario() and v.estado = 'cerrada' and not v.anulado
       and v.fecha between desde and hasta
     group by c.id, c.nombre
     order by 4 desc, 2, 1;
end
$$;

-- Los totales de la lista suman tambien un tipo. Cambian los parametros: se borra y se vuelve a
-- crear.
drop function if exists public.ventas_totales(date, date, text, text);
create function public.ventas_totales(
  desde date, hasta date, el_origen text default null, el_medio text default null,
  el_canal uuid default null
)
returns table (
  cobrado_centavos bigint, cobradas bigint, cancelado_centavos bigint, canceladas bigint,
  anulado_centavos bigint, anuladas bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with del_periodo as (
    select v.estado, v.anulado,
           case when el_medio is null then v.total_centavos
                else (select coalesce(sum(p.monto_centavos), 0) from public.pagos_de_venta p
                       where p.venta_id = v.id and p.medio::text = el_medio) end as monto
      from public.ventas v
     where v.fecha between desde and hasta
       and (el_origen is null or v.origen::text = el_origen)
       and (el_canal is null or v.canal_id = el_canal)
       and (el_medio is null or exists (select 1 from public.pagos_de_venta p
                                         where p.venta_id = v.id and p.medio::text = el_medio))
  )
  select coalesce(sum(monto) filter (where estado = 'cerrada' and not anulado), 0)::bigint,
         count(*) filter (where estado = 'cerrada' and not anulado),
         coalesce(sum(monto) filter (where estado = 'cancelada' and not anulado), 0)::bigint,
         count(*) filter (where estado = 'cancelada' and not anulado),
         coalesce(sum(monto) filter (where anulado), 0)::bigint,
         count(*) filter (where anulado)
    from del_periodo
$$;

revoke all on function public.reporte_ventas_por_tipo(date, date) from public, anon;
revoke all on function public.ventas_totales(date, date, text, text, uuid) from public, anon;
grant execute on function public.reporte_ventas_por_tipo(date, date) to authenticated;
grant execute on function public.ventas_totales(date, date, text, text, uuid) to authenticated;
