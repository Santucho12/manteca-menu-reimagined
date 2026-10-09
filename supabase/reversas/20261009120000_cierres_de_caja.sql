-- Reversa de cierres de caja. Borra los cierres, sus retiros y la tolerancia: no se
-- recuperan. Los gastos que salieron de cierres quedan, sin su cierre_id. Vuelve la regla de
-- gastos de 20261008140000_gastos.
drop function if exists public.cierres_guardar(jsonb);
drop function if exists public.cierres_fondo_sugerido(date);
drop function if exists public.cierres_insertar(uuid, jsonb);
drop function if exists public.cierres_exigir_quien_carga();
alter table public.gastos drop column if exists cierre_id;
drop table if exists public.retiros_de_caja;
drop table if exists public.configuracion_de_caja;
drop table if exists public.cierres_de_caja;
drop function if exists public.reglas_de_cierres();
drop function if exists public.anular_gastos_del_cierre();
drop function if exists public.es_caja_activa();
drop type if exists public.estado_de_cierre;

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
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
    return new;
  end if;
  if tg_op = 'INSERT' and new.recurrente_id is not null then
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
