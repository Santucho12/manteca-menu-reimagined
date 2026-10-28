-- Subir el Excel de Fudo: la funcion que guarda lo que dice la hoja "Medios de pago", un dia y
-- un medio por lote, como tantas ventas de origen Fudo como diga el Excel, sin productos.
-- Subir otra vez el mismo dia y medio actualiza lo que cambio y anula las que sobren, sin
-- borrar nada. Una venta de Fudo sigue sin anularse a mano; solo la subida anula las suyas.

create or replace function public.ventas_validar_excel(lotes jsonb)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para subir ventas' using errcode = '42501';
  end if;
  if jsonb_typeof(lotes) is distinct from 'array' or jsonb_array_length(lotes) not between 1 and 2000 then
    raise exception 'La subida no tiene lotes validos' using errcode = 'PV308';
  end if;
  if exists (select 1 from jsonb_array_elements(lotes) l
             where jsonb_typeof(l -> 'montos') is distinct from 'array'
                or jsonb_array_length(l -> 'montos') not between 1 and 5000
                or coalesce((l ->> 'fecha') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$', true)
                or (l ->> 'medio') is null
                or not ((l ->> 'medio') = any (enum_range(null::public.medio_de_caja)::text[]))
                or exists (select 1 from jsonb_array_elements(l -> 'montos') m
                            where jsonb_typeof(m) is distinct from 'number' or (m #>> '{}') !~ '^[0-9]+$')) then
    raise exception 'Un lote de la subida no es valido' using errcode = 'PV308';
  end if;
  if (select count(distinct (l ->> 'fecha') || '|' || (l ->> 'medio')) <> count(*)
        from jsonb_array_elements(lotes) l) then
    raise exception 'La subida repite un dia y un medio' using errcode = 'PV308';
  end if;
  if exists (select 1 from jsonb_array_elements(lotes) l
             where (l ->> 'fecha')::date > (now() at time zone 'America/Argentina/Buenos_Aires')::date) then
    raise exception 'No se carga una venta de un dia que no llego' using errcode = 'PV301';
  end if;
end
$$;

-- Un dia y un medio: devuelve cuantas ventas se crearon, se actualizaron, quedaron iguales y
-- se anularon. Las ventas del lote se emparejan con las que ya habia por orden de carga.
create or replace function public.ventas_aplicar_lote(el_local uuid, lote jsonb)
returns int[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  la_fecha date := (lote ->> 'fecha')::date;
  el_medio public.medio_de_caja := (lote ->> 'medio')::public.medio_de_caja;
  montos bigint[] := array(select (m #>> '{}')::bigint
                             from jsonb_array_elements(lote -> 'montos') with ordinality t(m, n) order by n);
  vigentes uuid[] := array(select v.id from public.ventas v
                            where v.local_id = el_local and v.origen = 'fudo' and not v.anulado
                              and v.fudo_id like 'excel:' || la_fecha || ':' || el_medio || ':%'
                            order by v.fecha_creacion, v.id);
  cantidad_vigentes int := coalesce(cardinality(vigentes), 0);
  resultado int[] := array[0, 0, 0, 0];
  i int;
  cambio int;
begin
  for i in 1..cardinality(montos) loop
    if i > cantidad_vigentes then
      perform public.ventas_crear_del_excel(el_local, la_fecha, el_medio, montos[i]);
      resultado[1] := resultado[1] + 1;
    else
      update public.ventas set total_centavos = montos[i] where id = vigentes[i] and total_centavos <> montos[i];
      get diagnostics cambio = row_count;
      update public.pagos_de_venta set monto_centavos = montos[i] where venta_id = vigentes[i] and monto_centavos <> montos[i];
      resultado[2 + (1 - cambio)] := resultado[2 + (1 - cambio)] + 1;
    end if;
  end loop;
  perform set_config('manteca.reemplazando_excel', 'si', true);
  update public.ventas
     set anulado = true, motivo_anulacion = 'Reemplazada por una nueva subida del Excel de Fudo'
   where id = any (vigentes[cardinality(montos) + 1:cantidad_vigentes]);
  get diagnostics cambio = row_count;
  perform set_config('manteca.reemplazando_excel', '', true);
  resultado[4] := cambio;
  return resultado;
end
$$;

create or replace function public.ventas_crear_del_excel(el_local uuid, la_fecha date, el_medio public.medio_de_caja, el_monto bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  nueva uuid;
begin
  -- El Excel solo trae el dia: la hora de cierre queda sin dato, no se inventa una.
  insert into public.ventas (local_id, origen, fudo_id, fecha, cerrada_en, estado, total_centavos, fecha_creacion)
  values (el_local, 'fudo', 'excel:' || la_fecha || ':' || el_medio || ':' || gen_random_uuid(), la_fecha,
          null, 'cerrada', el_monto, clock_timestamp())
  returning id into nueva;
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  values (el_local, nueva, el_medio, el_monto);
end
$$;

create or replace function public.ventas_importar_excel(lotes jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  lote jsonb;
  parcial int[];
  suma int[] := array[0, 0, 0, 0];
begin
  perform public.ventas_validar_excel(lotes);
  for lote in select l from jsonb_array_elements(lotes) l loop
    parcial := public.ventas_aplicar_lote(el_local, lote);
    suma := array[suma[1] + parcial[1], suma[2] + parcial[2], suma[3] + parcial[3], suma[4] + parcial[4]];
  end loop;
  return jsonb_build_object('nuevas', suma[1], 'actualizadas', suma[2], 'iguales', suma[3], 'anuladas', suma[4]);
end
$$;

-- La unica anulacion de una venta de Fudo que se permite es la de la propia subida del Excel.
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
    if old.origen = 'fudo'
       and not (coalesce(current_setting('manteca.reemplazando_excel', true), '') = 'si'
                and old.fudo_id like 'excel:%') then
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

revoke all on function
  public.ventas_validar_excel(jsonb),
  public.ventas_aplicar_lote(uuid, jsonb),
  public.ventas_crear_del_excel(uuid, date, public.medio_de_caja, bigint)
  from public, anon, authenticated;
revoke all on function public.ventas_importar_excel(jsonb) from public, anon;
grant execute on function public.ventas_importar_excel(jsonb) to authenticated;
