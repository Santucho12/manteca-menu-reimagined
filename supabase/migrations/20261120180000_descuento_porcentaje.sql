-- El porcentaje del descuento, para que Ventas diga "10 % ($1.444)" y no solo el monto (pedido 102).
alter table public.ventas
  add column if not exists descuento_porcentaje integer check (descuento_porcentaje is null or descuento_porcentaje between 1 and 100);

create or replace function public.ventas_anotar_descuento(la_venta uuid, el_local uuid, datos jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  lo_que_suma bigint;
begin
  select sum(r.subtotal_centavos)::bigint into lo_que_suma
    from public.renglones_de_venta r where r.venta_id = la_venta;
  update public.ventas
     set descuento_centavos = public.ventas_descuento_del_mostrador(lo_que_suma, datos),
         motivo_descuento = nullif(trim(coalesce(datos -> 'descuento' ->> 'motivo', '')), ''),
         descuento_porcentaje = case when datos -> 'descuento' ->> 'tipo' = 'porcentaje'
                                     then least(100, (datos -> 'descuento' ->> 'valor')::integer) end
   where id = la_venta and local_id = el_local;
end
$$;
