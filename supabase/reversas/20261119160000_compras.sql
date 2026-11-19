-- Reversa de compras. Borra las compras y sus renglones: no se recuperan. Los gastos y lo por
-- pagar que generaron quedan, sin el enlace a la compra. Vuelven reglas_de_gastos y
-- costo_de_insumos como estaban (el costo solo por la referencia).
drop function if exists public.compras_anular(uuid, text);
drop function if exists public.compras_desde_gasto(jsonb);
drop function if exists public.compras_pedir(jsonb);
drop function if exists public.compras_recibir(jsonb);
drop function if exists public.compras_ya_cargada(uuid, jsonb);
drop function if exists public.compras_generar_pago(uuid, jsonb);
drop function if exists public.compras_cargar_renglones(uuid, uuid, jsonb);
drop function if exists public.compras_controlar(uuid, uuid, jsonb);
drop function if exists public.compras_categoria(uuid, text);
drop function if exists public.compras_exigir_admin();
alter table public.gastos drop column if exists compra_id;
alter table public.gastos_por_pagar drop column if exists compra_id;
drop table if exists public.renglones_de_compra;
drop table if exists public.compras;
drop type if exists public.estado_de_compra;

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
  -- Lo que cargaron los fijos antes de lo por pagar entro con el medio de su plantilla; un
  -- pago, como cualquiera.
  if new.cierre_id is null
     and not (tg_op = 'INSERT' and new.recurrente_id is not null and new.por_pagar_id is null) then
    perform public.gastos_exigir_medio(new.medio_de_pago::text,
      case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
  end if;
  -- Lo de un fijo, un cierre o un pago entra tal cual, aunque la categoria ya no se use.
  if tg_op = 'INSERT' and (new.recurrente_id is not null or new.cierre_id is not null
                           or new.por_pagar_id is not null) then
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


create or replace function public.costo_de_insumos()
returns table (insumo_id uuid, costo_por_unidad numeric, origen text, fecha_origen date)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id,
         round(f.precio_referencia_centavos / f.contenido, 6),
         case when f.id is not null then 'referencia' end,
         null::date
    from public.insumos i
    left join lateral (
      select fc.id, fc.precio_referencia_centavos, fc.contenido
        from public.formas_de_compra fc
       where fc.insumo_id = i.id and fc.activo and fc.precio_referencia_centavos is not null
       order by fc.fecha_actualizacion desc, fc.fecha_creacion desc
       limit 1
    ) f on true;
$$;
