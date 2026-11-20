-- Reversa de compras_y_sus_gastos: el gasto y lo por pagar de una compra vuelven a poder
-- anularse sueltos, y anular el cierre ya no anula la compra. No toca datos.
drop trigger if exists anular_su_compra on public.gastos;
drop function if exists public.anular_compra_del_gasto();

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
  if tg_op = 'UPDATE' and coalesce(current_setting('manteca.desde_compras', true), '') = 'si' then
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

create or replace function public.reglas_de_por_pagar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fijo public.gastos_recurrentes;
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if tg_op = 'UPDATE' then
    if old.anulado then
      raise exception 'Lo anulado no se cambia' using errcode = 'PG204';
    end if;
    if new.anulado then
      if coalesce(trim(new.motivo_anulacion), '') = '' then
        raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
      end if;
      if exists (select 1 from public.gastos g where g.por_pagar_id = new.id and not g.anulado) then
        raise exception 'Ya esta pagado: se anula el pago' using errcode = 'PG210';
      end if;
      new.anulado_por := (select auth.uid());
      new.fecha_anulacion := now();
    end if;
    return new;
  end if;
  if new.recurrente_id is null then
    if new.medio_de_pago is not null then
      perform public.gastos_exigir_medio(new.medio_de_pago::text, null);
    end if;
    perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id,
      new.proveedor_id, null);
    return new;
  end if;
  select * into fijo from public.gastos_recurrentes r
   where r.id = new.recurrente_id and r.local_id = new.local_id;
  if not found or ((select auth.uid()) is not null and not (
       fijo.activo and new.vencimiento > hoy
       and new.vencimiento >= coalesce(fijo.generar_desde, fijo.primer_vencimiento)
       and public.es_vencimiento_del_fijo(fijo.primer_vencimiento, fijo.frecuencia,
                                          new.vencimiento))) then
    raise exception 'Esa fecha no es un proximo pago del fijo' using errcode = 'PG211';
  end if;
  new.categoria_id := fijo.categoria_id;
  new.proveedor_id := fijo.proveedor_id;
  new.descripcion := fijo.descripcion;
  new.monto_centavos := fijo.monto_centavos;
  new.medio_de_pago := fijo.medio_de_pago;
  return new;
end
$$;

-- Anula la compra y lo que genero. Un gasto de caja no se anula: vuelve a "Sin clasificar".
create or replace function public.compras_anular(la_compra uuid, motivo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.compras;
  el_motivo text := nullif(trim(motivo), '');
begin
  perform public.compras_exigir_admin();
  select * into c from public.compras
   where id = la_compra and local_id = public.local_del_usuario() and not anulado;
  if not found then
    raise exception 'Esa compra ya no esta disponible' using errcode = 'PU308';
  end if;
  if el_motivo is null then
    raise exception 'Escribi el motivo de la anulacion' using errcode = 'PU309';
  end if;
  if c.gasto_id is not null and exists (select 1 from public.gastos g
                                         where g.id = c.gasto_id and g.cierre_id is not null) then
    perform set_config('manteca.desde_compras', 'si', true);
    update public.gastos set categoria_id = public.compras_categoria(c.local_id, 'Sin clasificar'),
           proveedor_id = null, compra_id = null
     where id = c.gasto_id;
    perform set_config('manteca.desde_compras', '', true);
  elsif c.gasto_id is not null then
    update public.gastos set anulado = true, motivo_anulacion = 'Se anulo la compra: ' || el_motivo
     where id = c.gasto_id and not anulado;
  end if;
  if c.por_pagar_id is not null then
    update public.gastos_por_pagar set anulado = true,
           motivo_anulacion = 'Se anulo la compra: ' || el_motivo
     where id = c.por_pagar_id and not anulado;
  end if;
  update public.compras set anulado = true, motivo_anulacion = el_motivo,
         anulado_por = (select auth.uid()), fecha_anulacion = now()
   where id = c.id;
end;
$$;

