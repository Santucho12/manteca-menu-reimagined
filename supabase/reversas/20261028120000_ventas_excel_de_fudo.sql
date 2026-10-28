-- Reversa de la subida del Excel de Fudo: se quitan las funciones y la regla vuelve a no
-- dejar anular ninguna venta de Fudo. No borra las ventas que ya se hayan subido: quedan como
-- ventas de Fudo comunes (no se pueden anular desde el sistema).

drop function if exists public.ventas_importar_excel(jsonb);
drop function if exists public.ventas_aplicar_lote(uuid, jsonb);
drop function if exists public.ventas_crear_del_excel(uuid, date, public.medio_de_caja, bigint);
drop function if exists public.ventas_validar_excel(jsonb);

create or replace function public.reglas_de_ventas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.anulado then
    raise exception 'Una venta anulada no se cambia' using errcode = 'PV305';
  end if;
  if new.anulado then
    if old.origen = 'fudo' then
      raise exception 'Una venta de Fudo se corrige en Fudo' using errcode = 'PV307';
    end if;
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PV306';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
  end if;
  return new;
end
$$;
