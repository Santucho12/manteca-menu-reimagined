-- Gastos fijos: la clave para que cargar dos veces el mismo fijo no lo duplique, el cambio de
-- fecha o de frecuencia que vale desde el proximo pago (antes volvia a cargar meses pasados) y
-- el total por tipo (lo que cargaron los fijos o lo que vino de la caja).

alter table public.gastos_recurrentes add column if not exists clave uuid unique;
grant insert (clave) on table public.gastos_recurrentes to authenticated;

create or replace function public.reglas_de_recurrentes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  -- Otra fecha u otra frecuencia arman otra serie: cuenta desde el proximo pago, y lo que ya
  -- paso no se vuelve a cargar.
  if tg_op = 'UPDATE' and (new.primer_vencimiento is distinct from old.primer_vencimiento
                           or new.frecuencia is distinct from old.frecuencia) then
    if new.primer_vencimiento <= hoy then
      raise exception 'El proximo pago tiene que ser despues de hoy' using errcode = 'PG208';
    end if;
    new.generar_desde := new.primer_vencimiento;
  end if;
  if tg_op = 'UPDATE' and new.activo and not old.activo then
    new.generar_desde := greatest(coalesce(new.generar_desde, hoy), hoy);
  end if;
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

revoke all on function public.reglas_de_recurrentes() from public, anon, authenticated;

drop function if exists public.gastos_total(date, date, uuid, uuid);

create or replace function public.gastos_total(
  desde date, hasta date, la_categoria uuid default null, el_proveedor uuid default null,
  el_tipo text default null
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
     and (el_tipo is null
          or (el_tipo = 'fijos' and g.recurrente_id is not null)
          or (el_tipo = 'caja' and g.cierre_id is not null))
$$;

revoke all on function public.gastos_total(date, date, uuid, uuid, text) from public, anon;
grant execute on function public.gastos_total(date, date, uuid, uuid, text) to authenticated;
