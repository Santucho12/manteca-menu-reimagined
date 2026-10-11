-- Ajustes de la revision de ventas: una clave de carga hace que la misma venta mandada dos
-- veces (un toque repetido, un reintento) devuelva la ya guardada en vez de crear otra; y los
-- totales suman tambien lo anulado, para mostrar el total de lo que se esta viendo.

alter table public.ventas add column if not exists clave uuid;
create unique index if not exists ventas_clave on public.ventas (local_id, clave);

create or replace function public.ventas_guardar_manual(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_clave uuid := (datos ->> 'clave')::uuid;
  el_total bigint;
  nueva uuid;
begin
  perform public.ventas_validar_manual(el_local, datos);
  select v.id into nueva from public.ventas v where v.local_id = el_local and v.clave = la_clave;
  if nueva is not null then
    return nueva;
  end if;
  -- Cada subtotal se redondea a centavos; el total es la suma de los subtotales.
  select coalesce(sum(round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)), 0)
    into el_total
    from jsonb_array_elements(datos -> 'renglones') r;
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, comentario, clave)
  values (el_local, 'manual', (datos ->> 'fecha')::date, 'cerrada', el_total,
          (datos ->> 'canal_id')::uuid, nullif(trim(datos ->> 'comentario'), ''), la_clave)
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

-- Cambia lo que devuelve: se borra y se vuelve a crear.
drop function if exists public.ventas_totales(date, date, text, text);
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
