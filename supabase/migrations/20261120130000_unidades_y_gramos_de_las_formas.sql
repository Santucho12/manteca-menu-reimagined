-- Cada forma de venta dice cuánto es: en unidades (Docena = 12) o en gramos (Por cuarto = 250).
-- Vender lo usa para juntar la docena variada de facturas y para cobrar por peso (Santiago,
-- 2026-11-20, pedido 102).

alter table public.presentaciones
  add column if not exists unidades integer check (unidades is null or unidades between 1 and 999999),
  add column if not exists gramos integer check (gramos is null or gramos between 1 and 999999);

alter table public.presentaciones drop constraint if exists presentaciones_una_sola_medida;
alter table public.presentaciones
  add constraint presentaciones_una_sola_medida check (unidades is null or gramos is null);

-- Lo que ya hay se reconoce por el nombre; lo demás queda sin medida hasta que el admin la ponga.
update public.presentaciones set unidades = 12 where unidades is null and gramos is null and lower(trim(nombre)) = 'docena';
update public.presentaciones set unidades = 6 where unidades is null and gramos is null and lower(trim(nombre)) in ('media docena', '1/2 docena');
update public.presentaciones set unidades = 1 where unidades is null and gramos is null and lower(trim(nombre)) = 'unidad';
update public.presentaciones set gramos = 250 where unidades is null and gramos is null and lower(trim(nombre)) in ('por cuarto', 'cuarto', '1/4 kg', '1/4');

-- El Menú manda la medida de cada forma. Un llamado sin esas claves no la toca.
create or replace function public.menu_escribir_presentaciones(el_local uuid, la_categoria uuid, lista jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  posicion integer := 0;
  la_presentacion uuid;
  conservadas uuid[] := '{}';
begin
  if jsonb_typeof(lista) is distinct from 'array' or jsonb_array_length(lista) = 0 then
    raise exception 'La categoria necesita al menos una presentacion' using errcode = '23514';
  end if;
  for item in select value from jsonb_array_elements(lista) loop
    la_presentacion := nullif(item ->> 'id', '')::uuid;
    if la_presentacion is null then
      insert into public.presentaciones (local_id, categoria_id, nombre, orden)
      values (el_local, la_categoria, item ->> 'nombre', posicion)
      returning id into la_presentacion;
    else
      update public.presentaciones set nombre = item ->> 'nombre', orden = posicion, activo = true
       where id = la_presentacion and categoria_id = la_categoria;
      if not found then
        raise exception 'No encontramos esa presentacion' using errcode = 'PM100';
      end if;
    end if;
    if item ? 'unidades' or item ? 'gramos' then
      update public.presentaciones
         set unidades = (item ->> 'unidades')::integer, gramos = (item ->> 'gramos')::integer
       where id = la_presentacion;
    end if;
    if item ? 'monto_compartido_centavos' then
      perform public.menu_poner_precio(el_local, la_presentacion, null,
                                       (item ->> 'monto_compartido_centavos')::bigint);
    end if;
    conservadas := conservadas || la_presentacion;
    posicion := posicion + 1;
  end loop;
  update public.presentaciones set activo = false
   where categoria_id = la_categoria and activo and not (id = any (conservadas));
end
$$;
