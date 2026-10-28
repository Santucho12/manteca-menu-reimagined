-- Un gasto fijo vuelve a rechazar el efectivo de la caja: la regla de la revision de la fase 1
-- se perdio al reescribir reglas_de_recurrentes en el pedido 58 (20261027210000_gastos_fijos).
-- El efectivo de la caja sale por el cierre del dia.

create or replace function public.reglas_de_recurrentes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  perform public.gastos_exigir_medio(new.medio_de_pago::text,
    case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
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
