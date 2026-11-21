-- Los tipos de venta se ordenan a mano, arrastrando (Santiago, 2026-11-20, pedido 102). El orden
-- vale para la lista de Tipos de venta y para los botones de Vender.

alter table public.canales_de_venta add column if not exists orden integer not null default 0;

-- Los de hoy quedan como se veían en Vender: Local primero y después por nombre.
update public.canales_de_venta c
   set orden = o.n
  from (select id, row_number() over (partition by local_id order by de_sistema desc, nombre) n
          from public.canales_de_venta) o
 where o.id = c.id;

-- Un tipo nuevo va al final de su local.
create or replace function public.canales_al_final()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(max(c.orden), 0) + 1 into new.orden
    from public.canales_de_venta c
   where c.local_id = new.local_id;
  return new;
end
$$;

revoke all on function public.canales_al_final() from public, anon, authenticated;

drop trigger if exists al_final on public.canales_de_venta;
create trigger al_final before insert on public.canales_de_venta
  for each row execute function public.canales_al_final();

-- El admin manda los ids en el orden nuevo. Corre con su sesión: la policy de cambio solo le deja
-- tocar los de su local, y lo de otro local se ignora.
create or replace function public.ventas_ordenar_canales(los_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para ordenar los tipos de venta' using errcode = '42501';
  end if;
  update public.canales_de_venta c
     set orden = array_position(los_ids, c.id)
   where c.id = any(los_ids)
     and c.local_id = public.local_del_usuario()
     and c.orden is distinct from array_position(los_ids, c.id);
end
$$;

-- La función corre con la sesión del admin: necesita poder cambiar la columna del orden.
grant update (orden) on table public.canales_de_venta to authenticated;

revoke all on function public.ventas_ordenar_canales(uuid[]) from public, anon;
grant execute on function public.ventas_ordenar_canales(uuid[]) to authenticated;

-- Vender ofrece los tipos en el orden guardado; Local sigue viniendo elegido por ser de sistema.
create or replace function public.caja_tipos_para_vender()
returns table (id uuid, nombre text, de_sistema boolean, se_controla_en_el_cierre boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.es_caja_activa() or public.es_admin_activo()) then
    raise exception 'No tenes permiso para vender' using errcode = '42501';
  end if;
  return query
  select c.id, c.nombre, c.de_sistema, c.se_controla_en_el_cierre
    from public.canales_de_venta c
   where c.local_id = public.local_del_usuario() and c.activo
   order by c.orden, c.nombre;
end
$$;
