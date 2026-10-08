-- Menu (4 de 5): lo unico que lee el visitante. Corre con los permisos de su duenio para
-- saltear RLS a proposito: el filtro de lo publico esta en la definicion (visible, activo, con
-- precio y del local principal). El aviso de Supabase por una vista asi queda explicado aca.
-- No llama funciones: una funcion correria con los permisos del visitante.

create or replace view public.menu_publico
with (security_invoker = false)
as
select c.id as categoria_id,
       c.nombre as categoria,
       c.subtitulo,
       c.foto,
       c.icono,
       c.orden as orden_categoria,
       comun.lista as compartidos,
       p.id as producto_id,
       p.nombre,
       p.descripcion,
       p.etiqueta,
       p.orden,
       vigentes.lista as precios
  from public.categorias c
  join public.productos p on p.categoria_id = c.id and p.visible and p.activo
  cross join lateral (
    select coalesce(
             jsonb_agg(jsonb_build_object('presentacion', pre.nombre, 'monto_centavos', pr.monto_centavos)
                       order by pre.orden, pre.id),
             '[]'::jsonb) as lista
      from public.presentaciones pre
      join public.precios pr on pr.presentacion_id = pre.id and pr.producto_id is null and pr.activo
     where pre.categoria_id = c.id and pre.activo
  ) comun
  cross join lateral (
    select jsonb_agg(jsonb_build_object(
             'presentacion', pre.nombre,
             'monto_centavos', coalesce(propio.monto_centavos, compartido.monto_centavos),
             'compartido', propio.monto_centavos is null)
           order by pre.orden, pre.id) as lista,
           count(coalesce(propio.monto_centavos, compartido.monto_centavos)) as con_precio
      from public.presentaciones pre
      left join public.precios propio
        on propio.presentacion_id = pre.id and propio.producto_id = p.id and propio.activo
      left join public.precios compartido
        on compartido.presentacion_id = pre.id and compartido.producto_id is null and compartido.activo
     where pre.categoria_id = c.id and pre.activo
  ) vigentes
 where c.visible and c.activo and vigentes.con_precio > 0
   -- El local principal. Con un segundo local se suma el filtro por dominio.
   and c.local_id = (select l.id from public.locales l order by l.fecha_creacion, l.id limit 1);

revoke all on table public.menu_publico from anon, authenticated;
grant select on table public.menu_publico to anon, authenticated;
