-- Totales de gastos sin lo anulado: el de la lista filtrada y lo pagado a cada proveedor.
-- Son security invoker: suman solo lo que RLS deja ver a quien pregunta.

create or replace function public.gastos_total(
  desde date, hasta date, la_categoria uuid default null, el_proveedor uuid default null
)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(g.monto_centavos), 0)::bigint
    from public.gastos g
   where not g.anulado
     and g.fecha between desde and hasta
     and (la_categoria is null or g.categoria_id = la_categoria)
     and (el_proveedor is null or g.proveedor_id = el_proveedor)
$$;

create or replace function public.gastos_pagado_por_proveedor(desde date, hasta date)
returns table (proveedor_id uuid, total_centavos bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select g.proveedor_id, sum(g.monto_centavos)::bigint
    from public.gastos g
   where not g.anulado and g.proveedor_id is not null and g.fecha between desde and hasta
   group by g.proveedor_id
$$;

revoke all on function public.gastos_total(date, date, uuid, uuid) from public, anon;
revoke all on function public.gastos_pagado_por_proveedor(date, date) from public, anon;
grant execute on function public.gastos_total(date, date, uuid, uuid) to authenticated;
grant execute on function public.gastos_pagado_por_proveedor(date, date) to authenticated;
