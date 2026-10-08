-- Menu (3 de 5): guardar una categoria o un producto, entero o nada. Un producto visible
-- nunca queda sin precio: si el cambio lo deja asi, la funcion pide confirmar (PM101) y, con
-- la confirmacion, lo oculta.

create or replace function public.menu_exigir_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para hacer esto' using errcode = 'PM100';
  end if;
  return public.local_del_usuario();
end
$$;

-- Tiene precio si alguna presentacion activa de su categoria tiene uno propio o el compartido.
create or replace function public.tiene_precio(el_producto uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.productos p
      join public.presentaciones pre on pre.categoria_id = p.categoria_id and pre.activo
      join public.precios pr on pr.presentacion_id = pre.id and pr.activo
       and (pr.producto_id = p.id or pr.producto_id is null)
     where p.id = el_producto
  )
$$;

create or replace function public.menu_validar_foto(la_foto text, el_local uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if la_foto is null or la_foto = '' then
    return null;
  end if;
  if la_foto ~ '^/menu/[A-Za-z0-9._-]+$' then
    return la_foto;
  end if;
  if (storage.foldername(la_foto))[1] = el_local::text and exists (
    select 1 from storage.objects o where o.bucket_id = 'fotos-del-menu' and o.name = la_foto
  ) then
    return la_foto;
  end if;
  raise exception 'La foto no existe o no es de este local' using errcode = 'PM106';
end
$$;

-- Sin monto, el precio se desactiva y el producto vuelve a heredar el de la categoria.
create or replace function public.menu_poner_precio(
  el_local uuid, la_presentacion uuid, el_producto uuid, monto bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if monto is null then
    update public.precios set activo = false
     where presentacion_id = la_presentacion and producto_id is not distinct from el_producto
       and activo;
    return;
  end if;
  insert into public.precios (local_id, presentacion_id, producto_id, monto_centavos)
  values (el_local, la_presentacion, el_producto, monto)
  on conflict on constraint precios_unicos
  do update set monto_centavos = excluded.monto_centavos, activo = true;
end
$$;

create or replace function public.menu_ocultar_sin_precio(las_categorias uuid[], confirmar boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  sin_precio jsonb;
begin
  select coalesce(jsonb_agg(p.nombre order by p.orden, p.id), '[]'::jsonb) into sin_precio
    from public.productos p
   where p.categoria_id = any (las_categorias) and p.visible and p.activo
     and not public.tiene_precio(p.id);
  if jsonb_array_length(sin_precio) > 0 and not confirmar then
    raise exception 'Hay productos que quedan sin precio'
      using errcode = 'PM101', detail = sin_precio::text;
  end if;
  update public.productos set visible = false
   where categoria_id = any (las_categorias) and visible and activo
     and not public.tiene_precio(id);
  return sin_precio;
end
$$;

create or replace function public.menu_escribir_categoria(el_local uuid, datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  la_categoria uuid := nullif(datos ->> 'id', '')::uuid;
  nueva_foto text := public.menu_validar_foto(datos ->> 'foto', el_local);
begin
  if la_categoria is null then
    insert into public.categorias (local_id, nombre, subtitulo, foto, icono, orden)
    values (el_local, datos ->> 'nombre', nullif(datos ->> 'subtitulo', ''), nueva_foto,
            datos ->> 'icono',
            (select coalesce(max(c.orden) + 1, 0) from public.categorias c where c.local_id = el_local))
    returning id into la_categoria;
    return la_categoria;
  end if;
  update public.categorias
     set nombre = datos ->> 'nombre', subtitulo = nullif(datos ->> 'subtitulo', ''),
         foto = nueva_foto, icono = datos ->> 'icono'
   where id = la_categoria and local_id = el_local and activo;
  if not found then
    raise exception 'No encontramos esa categoria' using errcode = 'PM100';
  end if;
  return la_categoria;
end
$$;

-- Las presentaciones llegan en el orden de la pantalla. Las activas que no vienen se sacan.
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
    perform public.menu_poner_precio(el_local, la_presentacion, null,
                                     (item ->> 'monto_compartido_centavos')::bigint);
    conservadas := conservadas || la_presentacion;
    posicion := posicion + 1;
  end loop;
  update public.presentaciones set activo = false
   where categoria_id = la_categoria and activo and not (id = any (conservadas));
end
$$;

create or replace function public.menu_guardar_categoria(datos jsonb, confirmar boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
  la_categoria uuid := public.menu_escribir_categoria(el_local, datos);
begin
  perform public.menu_escribir_presentaciones(el_local, la_categoria, datos -> 'presentaciones');
  return jsonb_build_object(
    'id', la_categoria,
    'ocultados', public.menu_ocultar_sin_precio(array[la_categoria], confirmar)
  );
end
$$;

create or replace function public.menu_escribir_producto(el_local uuid, datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_producto uuid := nullif(datos ->> 'id', '')::uuid;
  la_categoria uuid := (datos ->> 'categoria_id')::uuid;
  anterior uuid;
  siguiente integer;
begin
  if not exists (select 1 from public.categorias c
                  where c.id = la_categoria and c.local_id = el_local and c.activo) then
    raise exception 'La categoria no existe o esta desactivada' using errcode = 'PM106';
  end if;
  select coalesce(max(p.orden) + 1, 0) into siguiente
    from public.productos p where p.categoria_id = la_categoria;
  if el_producto is null then
    insert into public.productos (local_id, categoria_id, nombre, descripcion, etiqueta, orden)
    values (el_local, la_categoria, datos ->> 'nombre', nullif(datos ->> 'descripcion', ''),
            nullif(datos ->> 'etiqueta', '')::public.etiqueta_de_producto, siguiente)
    returning id into el_producto;
    return el_producto;
  end if;
  select p.categoria_id into anterior
    from public.productos p where p.id = el_producto and p.local_id = el_local and p.activo;
  if not found then
    raise exception 'No encontramos ese producto' using errcode = 'PM100';
  end if;
  update public.productos
     set categoria_id = la_categoria, nombre = datos ->> 'nombre',
         descripcion = nullif(datos ->> 'descripcion', ''),
         etiqueta = nullif(datos ->> 'etiqueta', '')::public.etiqueta_de_producto,
         orden = case when anterior = la_categoria then orden else siguiente end
   where id = el_producto;
  return el_producto;
end
$$;

create or replace function public.menu_escribir_precios_del_producto(
  el_local uuid, el_producto uuid, lista jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  la_presentacion uuid;
begin
  for item in select value from jsonb_array_elements(coalesce(lista, '[]'::jsonb)) loop
    la_presentacion := (item ->> 'presentacion_id')::uuid;
    if not exists (
      select 1 from public.presentaciones pre
        join public.productos p on p.categoria_id = pre.categoria_id
       where pre.id = la_presentacion and pre.activo and p.id = el_producto
    ) then
      raise exception 'Esa presentacion no es de la categoria del producto' using errcode = 'PM106';
    end if;
    perform public.menu_poner_precio(el_local, la_presentacion, el_producto,
                                     (item ->> 'monto_centavos')::bigint);
  end loop;
end
$$;

create or replace function public.menu_guardar_producto(datos jsonb, confirmar boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
  el_producto uuid := public.menu_escribir_producto(el_local, datos);
  pide_visible boolean := coalesce((datos ->> 'visible')::boolean, false);
  ocultados jsonb := '[]'::jsonb;
begin
  perform public.menu_escribir_precios_del_producto(el_local, el_producto, datos -> 'precios');
  if pide_visible and not public.tiene_precio(el_producto) then
    if not confirmar then
      raise exception 'El producto queda sin precio'
        using errcode = 'PM101', detail = jsonb_build_array(datos ->> 'nombre')::text;
    end if;
    ocultados := jsonb_build_array(datos ->> 'nombre');
  end if;
  update public.productos set visible = pide_visible and public.tiene_precio(el_producto)
   where id = el_producto;
  return jsonb_build_object('id', el_producto, 'ocultados', ocultados);
end
$$;

-- Solo las dos de guardar se llaman desde la aplicacion; el resto son piezas internas.
revoke all on function
  public.menu_exigir_admin(),
  public.tiene_precio(uuid),
  public.menu_validar_foto(text, uuid),
  public.menu_poner_precio(uuid, uuid, uuid, bigint),
  public.menu_ocultar_sin_precio(uuid[], boolean),
  public.menu_escribir_categoria(uuid, jsonb),
  public.menu_escribir_presentaciones(uuid, uuid, jsonb),
  public.menu_guardar_categoria(jsonb, boolean),
  public.menu_escribir_producto(uuid, jsonb),
  public.menu_escribir_precios_del_producto(uuid, uuid, jsonb),
  public.menu_guardar_producto(jsonb, boolean)
  from public, anon, authenticated;
grant execute on function
  public.menu_guardar_categoria(jsonb, boolean),
  public.menu_guardar_producto(jsonb, boolean)
  to authenticated;
