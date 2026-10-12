-- Reversa de la revision de la primera fase: vuelven las reglas de gastos y de recurrentes de
-- antes y se quitan la funcion del fondo anterior y la clave de carga (no guarda datos del
-- negocio: era solo para no duplicar una carga).
create or replace function public.reglas_de_gastos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.anulado then
    raise exception 'Un gasto anulado no se cambia' using errcode = 'PG204';
  end if;
  if tg_op = 'UPDATE' and old.cierre_id is not null then
    if new.monto_centavos <> old.monto_centavos or new.fecha <> old.fecha
       or new.medio_de_pago <> old.medio_de_pago then
      raise exception 'El monto de un gasto de caja se corrige anulando el cierre' using errcode = 'PC305';
    end if;
    if new.anulado and coalesce(current_setting('manteca.anulando_cierre', true), '') <> 'si' then
      raise exception 'Un gasto de caja se anula anulando el cierre' using errcode = 'PC306';
    end if;
  end if;
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
    return new;
  end if;
  if tg_op = 'INSERT' and (new.recurrente_id is not null or new.cierre_id is not null) then
    return new;
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

drop function if exists public.cierres_fondos_anteriores(uuid[]);
drop function if exists public.gastos_exigir_medio(text, text);
drop index if exists public.gastos_clave;
alter table public.gastos drop column if exists clave;
