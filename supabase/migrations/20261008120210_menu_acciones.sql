-- Menu (3b de 5): mostrar u ocultar, ordenar, desactivar y reactivar categorias y productos.
-- Lo reactivado vuelve oculto y ultimo, para que el admin lo revise antes de mostrarlo.

-- Sin SQL dinamico: EXECUTE no actualiza FOUND, y cada rama queda a la vista.
create or replace function public.menu_no_encontrado()
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'No encontramos eso en el menu' using errcode = 'PM100';
end
$$;

create or replace function public.menu_cambiar_visibilidad(el_tipo text, el_id uuid, mostrar boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
begin
  if el_tipo = 'categoria' then
    update public.categorias set visible = mostrar
     where id = el_id and local_id = el_local and activo;
  else
    if mostrar and not public.tiene_precio(el_id) then
      raise exception 'Cargale un precio para mostrarlo' using errcode = 'PM102';
    end if;
    update public.productos set visible = mostrar
     where id = el_id and local_id = el_local and activo;
  end if;
  if not found then
    perform public.menu_no_encontrado();
  end if;
end
$$;

-- Los hermanos de una categoria son las categorias activas del local; los de un producto, los
-- productos activos de su categoria.
create or replace function public.menu_vecino(el_tipo text, el_id uuid, direccion text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  el_vecino uuid;
begin
  if el_tipo = 'categoria' then
    select v.id into el_vecino from public.categorias c
      join public.categorias v on v.local_id = c.local_id and v.activo and v.id <> c.id
     where c.id = el_id
       and case when direccion = 'arriba' then v.orden < c.orden else v.orden > c.orden end
     order by case when direccion = 'arriba' then -v.orden else v.orden end
     limit 1;
  else
    select v.id into el_vecino from public.productos p
      join public.productos v on v.categoria_id = p.categoria_id and v.activo and v.id <> p.id
     where p.id = el_id
       and case when direccion = 'arriba' then v.orden < p.orden else v.orden > p.orden end
     order by case when direccion = 'arriba' then -v.orden else v.orden end
     limit 1;
  end if;
  return el_vecino;
end
$$;

create or replace function public.menu_intercambiar_orden(el_tipo text, uno uuid, otro uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if el_tipo = 'categoria' then
    update public.categorias c set orden = o.orden
      from public.categorias o
     where (c.id, o.id) in ((uno, otro), (otro, uno));
  else
    update public.productos p set orden = o.orden
      from public.productos o
     where (p.id, o.id) in ((uno, otro), (otro, uno));
  end if;
end
$$;

create or replace function public.menu_mover(el_tipo text, el_id uuid, direccion text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
  el_vecino uuid;
begin
  if not exists (select 1 from public.categorias where id = el_id and local_id = el_local and activo)
     and not exists (select 1 from public.productos where id = el_id and local_id = el_local and activo) then
    perform public.menu_no_encontrado();
  end if;
  el_vecino := public.menu_vecino(el_tipo, el_id, direccion);
  if el_vecino is not null then
    perform public.menu_intercambiar_orden(el_tipo, el_id, el_vecino);
  end if;
end
$$;

create or replace function public.menu_desactivar(el_tipo text, el_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
  activos jsonb;
begin
  if el_tipo = 'categoria' then
    select coalesce(jsonb_agg(p.nombre order by p.orden, p.id), '[]'::jsonb) into activos
      from public.productos p
     -- Con el local: al admin de otro local no se le cuentan los productos de este.
     where p.categoria_id = el_id and p.local_id = el_local and p.activo;
    if jsonb_array_length(activos) > 0 then
      raise exception 'La categoria tiene productos activos'
        using errcode = 'PM103', detail = activos::text;
    end if;
    update public.categorias set activo = false, visible = false
     where id = el_id and local_id = el_local and activo;
  else
    update public.productos set activo = false, visible = false
     where id = el_id and local_id = el_local and activo;
  end if;
  if not found then
    perform public.menu_no_encontrado();
  end if;
end
$$;

create or replace function public.menu_reactivar(el_tipo text, el_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
begin
  if el_tipo = 'categoria' then
    update public.categorias
       set activo = true, visible = false,
           orden = (select coalesce(max(c.orden) + 1, 0) from public.categorias c where c.local_id = el_local)
     where id = el_id and local_id = el_local and not activo;
  else
    if exists (select 1 from public.productos p join public.categorias c on c.id = p.categoria_id
                where p.id = el_id and p.local_id = el_local and not c.activo) then
      raise exception 'Reactiva primero la categoria' using errcode = 'PM104';
    end if;
    update public.productos p
       set activo = true, visible = false,
           orden = (select coalesce(max(o.orden) + 1, 0) from public.productos o where o.categoria_id = p.categoria_id)
     where p.id = el_id and p.local_id = el_local and not p.activo;
  end if;
  if not found then
    raise exception 'No encontramos eso entre lo desactivado' using errcode = 'PM100';
  end if;
end
$$;

revoke all on function
  public.menu_no_encontrado(),
  public.menu_intercambiar_orden(text, uuid, uuid),
  public.menu_vecino(text, uuid, text),
  public.menu_cambiar_visibilidad(text, uuid, boolean),
  public.menu_mover(text, uuid, text),
  public.menu_desactivar(text, uuid),
  public.menu_reactivar(text, uuid)
  from public, anon, authenticated;
grant execute on function
  public.menu_cambiar_visibilidad(text, uuid, boolean),
  public.menu_mover(text, uuid, text),
  public.menu_desactivar(text, uuid),
  public.menu_reactivar(text, uuid)
  to authenticated;
