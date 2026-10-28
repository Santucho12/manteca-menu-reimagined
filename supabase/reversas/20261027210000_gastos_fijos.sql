-- Reversa de gastos_fijos: vuelven la regla de recurrentes y el total de antes, y se va la clave.
-- Las claves cargadas se pierden; los fijos y sus gastos quedan.

drop function if exists public.gastos_total(date, date, uuid, uuid, text);

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

revoke all on function public.gastos_total(date, date, uuid, uuid) from public, anon;
grant execute on function public.gastos_total(date, date, uuid, uuid) to authenticated;

create or replace function public.reglas_de_recurrentes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.activo and not old.activo then
    new.generar_desde := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
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

revoke insert (clave) on table public.gastos_recurrentes from authenticated;
alter table public.gastos_recurrentes drop column if exists clave;
