-- Menu (3c de 5): aplicar un aumento masivo. El servidor calcula los precios nuevos con la
-- misma funcion que arma la vista previa; la base comprueba que la lista sea exactamente la de
-- hoy y que nadie haya cambiado un precio en el medio. Si no, no aplica nada.

create or replace function public.menu_precios_del_alcance(el_local uuid, la_categoria uuid)
returns table (id uuid, monto_centavos bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.id, pr.monto_centavos
    from public.precios pr
    join public.presentaciones pre on pre.id = pr.presentacion_id and pre.activo
    join public.categorias c on c.id = pre.categoria_id and c.activo
    left join public.productos p on p.id = pr.producto_id
   where pr.activo and pr.local_id = el_local
     and (la_categoria is null or c.id = la_categoria)
     and (pr.producto_id is null or (p.activo and p.categoria_id = pre.categoria_id))
$$;

create or replace function public.menu_aumento_vigente(el_local uuid, la_categoria uuid, recibidos jsonb)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with lista as (
    select (r ->> 'id')::uuid as id, (r ->> 'antes_centavos')::bigint as antes
      from jsonb_array_elements(coalesce(recibidos, '[]'::jsonb)) r
  ), actuales as (
    select * from public.menu_precios_del_alcance(el_local, la_categoria)
  )
  select (select count(*) from lista) = (select count(distinct id) from lista)
     and (select count(*) from lista) > 0
     and not exists (
       select 1 from actuales a full join lista l on l.id = a.id
        where a.id is null or l.id is null or a.monto_centavos <> l.antes
     )
$$;

create or replace function public.menu_aplicar_aumento(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.menu_exigir_admin();
  la_categoria uuid := nullif(datos ->> 'categoria_id', '')::uuid;
  el_aumento uuid;
begin
  if la_categoria is not null and not exists (
    select 1 from public.categorias c where c.id = la_categoria and c.local_id = el_local and c.activo
  ) then
    raise exception 'La categoria no existe o esta desactivada' using errcode = 'PM106';
  end if;
  -- Traba los precios del local: otro admin no los cambia entre la comprobacion y el cambio.
  perform 1 from public.precios pr where pr.local_id = el_local for update;
  if not public.menu_aumento_vigente(el_local, la_categoria, datos -> 'precios') then
    raise exception 'Los precios cambiaron desde la vista previa' using errcode = 'PM105';
  end if;
  insert into public.aumentos (local_id, porcentaje, redondeo_centavos, categoria_id, usuario_id)
  values (el_local, (datos ->> 'porcentaje')::integer, (datos ->> 'redondeo_centavos')::bigint,
          la_categoria, (select auth.uid()))
  returning id into el_aumento;
  update public.precios pr set monto_centavos = (r ->> 'despues_centavos')::bigint
    from jsonb_array_elements(datos -> 'precios') r
   where pr.id = (r ->> 'id')::uuid;
  return el_aumento;
end
$$;

revoke all on function
  public.menu_precios_del_alcance(uuid, uuid),
  public.menu_aumento_vigente(uuid, uuid, jsonb),
  public.menu_aplicar_aumento(jsonb)
  from public, anon, authenticated;
grant execute on function public.menu_aplicar_aumento(jsonb) to authenticated;
