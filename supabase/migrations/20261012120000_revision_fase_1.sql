-- Revision de la primera fase: el efectivo de la caja sale solo por el cierre (un gasto a mano
-- con ese medio nunca llega a la caja y deja un faltante); la misma carga de un gasto mandada
-- dos veces no lo duplica; y el control ve lo que quedo en el cierre anterior, para marcar el
-- fondo que no coincide.

alter table public.gastos add column if not exists clave uuid;
create unique index if not exists gastos_clave on public.gastos (local_id, clave);
grant insert (clave) on public.gastos to authenticated;

-- Un gasto viejo que ya tenia ese medio se puede seguir editando: solo se frena el cambio.
create or replace function public.gastos_exigir_medio(nuevo text, anterior text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if nuevo = 'efectivo_caja' and anterior is distinct from 'efectivo_caja' then
    raise exception 'El efectivo de la caja sale por el cierre del dia' using errcode = 'PG207';
  end if;
end
$$;

revoke all on function public.gastos_exigir_medio(text, text) from public, anon;

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
  if new.cierre_id is null and new.recurrente_id is null then
    perform public.gastos_exigir_medio(new.medio_de_pago::text,
      case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
  end if;
  -- Lo que genera un recurrente o un cierre entra tal cual, aunque sea "Sin clasificar".
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
  perform public.gastos_exigir_medio(new.medio_de_pago::text,
    case when tg_op = 'UPDATE' then old.medio_de_pago::text end);
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

-- Para cada cierre, lo que quedo en la caja en el cierre sin anular anterior de su local. Solo
-- el admin: Caja lee sus cierres, no los de los demas.
create or replace function public.cierres_fondos_anteriores(ids uuid[])
returns table (id uuid, fondo_anterior_centavos bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para ver los cierres' using errcode = '42501';
  end if;
  return query
    select c.id,
           (select a.queda_en_caja_centavos from public.cierres_de_caja a
             where a.local_id = c.local_id and not a.anulado and a.fecha < c.fecha
             order by a.fecha desc limit 1)
      from public.cierres_de_caja c
     where c.id = any(ids);
end
$$;

revoke all on function public.cierres_fondos_anteriores(uuid[]) from public, anon;
grant execute on function public.cierres_fondos_anteriores(uuid[]) to authenticated;
