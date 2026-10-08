-- Menu: una presentacion que llega sin monto_compartido_centavos deja su precio compartido
-- como esta. El formulario manda solo los precios que la persona cambio: asi guardar un
-- formulario abierto antes de un aumento no lo revierte. Monto null sigue siendo "sacarlo".

create or replace function public.menu_escribir_presentaciones(
  el_local uuid, la_categoria uuid, lista jsonb
)
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

revoke all on function public.menu_escribir_presentaciones(uuid, uuid, jsonb)
  from public, anon, authenticated;
