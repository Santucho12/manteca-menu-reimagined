-- Reversa del pedido 90: sin el reporte por tipo, y los totales de la lista sin el filtro por
-- tipo, como estaban.

drop function if exists public.reporte_ventas_por_tipo(date, date);
drop function if exists public.ventas_totales(date, date, text, text, uuid);

create function public.ventas_totales(
  desde date, hasta date, el_origen text default null, el_medio text default null
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


revoke all on function public.ventas_totales(date, date, text, text) from public, anon;
grant execute on function public.ventas_totales(date, date, text, text) to authenticated;
