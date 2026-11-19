-- Pedido 89: vender en el mostrador, sin Fudo. Caja y el admin guardan cada venta al cobrar, con
-- los precios del menu que calcula la base; lo esperado de la caja suma solo lo cobrado en la
-- caja del local; Local es el tipo de venta del mostrador; y salen la subida del Excel de Fudo y
-- la espera de los cierres.

-- 1. Si la venta se cobro en la caja del local. Las que ya estaban contaban en lo esperado y
--    siguen contando; nadie inserta directo, asi que el valor por defecto solo lo usan las
--    siembras de prueba. Las funciones de guardar lo dicen siempre.
alter table public.ventas add column if not exists en_la_caja boolean not null default true;

-- 2. Local: el tipo de venta del mostrador, uno por local y del sistema.
alter table public.canales_de_venta
  add column if not exists de_sistema boolean not null default false;

insert into public.canales_de_venta (local_id, nombre, activo, de_sistema)
select l.id, 'Local', true, true from public.locales l
on conflict (local_id, lower(nombre)) do update set de_sistema = true, activo = true;

create or replace function public.crear_tipo_de_venta_local()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.canales_de_venta (local_id, nombre, activo, de_sistema)
  values (new.id, 'Local', true, true)
  on conflict (local_id, lower(nombre)) do update set de_sistema = true, activo = true;
  return new;
end
$$;

drop trigger if exists tipo_de_venta_local on public.locales;
create trigger tipo_de_venta_local after insert on public.locales
  for each row execute function public.crear_tipo_de_venta_local();

-- Local no se renombra ni se desactiva: el mostrador vende siempre con ese tipo.
create or replace function public.reglas_de_canales()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.de_sistema
     and (new.nombre is distinct from old.nombre or not new.activo or not new.de_sistema) then
    raise exception 'Local es el tipo de venta del mostrador' using errcode = 'PV312';
  end if;
  return new;
end
$$;

drop trigger if exists reglas on public.canales_de_venta;
create trigger reglas before update on public.canales_de_venta
  for each row execute function public.reglas_de_canales();

create or replace function public.ventas_borrar_canal(el_canal uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  el_borrado public.canales_de_venta;
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para borrar canales' using errcode = '42501';
  end if;
  select * into el_borrado from public.canales_de_venta c
   where c.id = el_canal and c.local_id = el_local;
  if not found then
    raise exception 'Ese canal no esta disponible' using errcode = 'PV303';
  end if;
  if el_borrado.de_sistema then
    raise exception 'Local es el tipo de venta del mostrador' using errcode = 'PV312';
  end if;
  if exists (select 1 from public.ventas v where v.canal_id = el_canal) then
    raise exception 'Ese canal ya tiene ventas: se desactiva, no se borra' using errcode = 'PV309';
  end if;
  delete from public.canales_de_venta where id = el_canal;
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes)
  values (el_local, (select auth.uid()), 'canales_de_venta', el_canal::text, 'baja', to_jsonb(el_borrado));
end
$$;

-- 3. Lo que se vende en el mostrador: cada producto activo, en cada forma de venta activa de su
--    categoria, con el precio que rige (el propio o el de la categoria). Se muestre o no en la
--    carta. Lo leen Caja y el admin; Caja no ve las tablas del menu.
create or replace function public.catalogo_para_vender()
returns table (
  categoria_id uuid, categoria text, producto_id uuid, producto text,
  presentacion_id uuid, presentacion text, precio_centavos bigint
)
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
  select c.id, c.nombre, p.id, p.nombre, pre.id, pre.nombre,
         coalesce(propio.monto_centavos, comun.monto_centavos)
    from public.categorias c
    join public.productos p on p.categoria_id = c.id and p.activo
    join public.presentaciones pre on pre.categoria_id = c.id and pre.activo
    left join public.precios propio
      on propio.presentacion_id = pre.id and propio.producto_id = p.id and propio.activo
    left join public.precios comun
      on comun.presentacion_id = pre.id and comun.producto_id is null and comun.activo
   where c.local_id = public.local_del_usuario() and c.activo
     and coalesce(propio.monto_centavos, comun.monto_centavos) is not null
   order by c.orden, c.id, p.orden, p.id, pre.orden, pre.id;
end
$$;

-- 4. Guardar una venta del mostrador. La base vuelve a calcular cada precio con el menu: si el
--    que vio quien vende ya no es el que rige, la venta no se guarda.
create or replace function public.ventas_renglones_del_mostrador(el_local uuid, datos jsonb)
returns table (
  producto_id uuid, presentacion_id uuid, descripcion text, cantidad numeric,
  precio_centavos bigint, mandado_centavos bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, pre.id, p.nombre || ' · ' || pre.nombre, (r ->> 'cantidad')::numeric,
         coalesce(propio.monto_centavos, comun.monto_centavos), (r ->> 'precio_centavos')::bigint
    from jsonb_array_elements(datos -> 'renglones') r
    join public.productos p
      on p.id = (r ->> 'producto_id')::uuid and p.local_id = el_local and p.activo
    join public.categorias c on c.id = p.categoria_id and c.activo
    join public.presentaciones pre
      on pre.id = (r ->> 'presentacion_id')::uuid and pre.categoria_id = p.categoria_id and pre.activo
    left join public.precios propio
      on propio.presentacion_id = pre.id and propio.producto_id = p.id and propio.activo
    left join public.precios comun
      on comun.presentacion_id = pre.id and comun.producto_id is null and comun.activo
   where coalesce(propio.monto_centavos, comun.monto_centavos) is not null
$$;

-- Uno o dos medios distintos, de los cinco del cierre, cada uno de mas de $0, que suman el total.
create or replace function public.ventas_validar_pagos_del_mostrador(datos jsonb, el_total bigint)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  pagos jsonb := coalesce(datos -> 'pagos', '[]');
begin
  if jsonb_array_length(pagos) not between 1 and 2
     or (select count(distinct p ->> 'medio') from jsonb_array_elements(pagos) p)
        <> jsonb_array_length(pagos)
     or exists (select 1 from jsonb_array_elements(pagos) p
                 where not coalesce((p ->> 'medio') = any (enum_range(null::public.medio_de_caja)::text[]), false)
                    or coalesce((p ->> 'monto_centavos')::bigint, 0) <= 0)
     or (select sum((p ->> 'monto_centavos')::bigint) from jsonb_array_elements(pagos) p)
        <> el_total then
    raise exception 'Los pagos no suman el total' using errcode = 'PV311';
  end if;
end
$$;

-- Devuelve el total de la venta, calculado con los precios del menu.
create or replace function public.ventas_validar_mostrador(el_local uuid, datos jsonb)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  renglones jsonb := coalesce(datos -> 'renglones', '[]');
  cambiado text;
  el_total bigint;
begin
  if jsonb_array_length(renglones) = 0 then
    raise exception 'La venta no tiene productos' using errcode = 'PV302';
  end if;
  if exists (select 1 from jsonb_array_elements(renglones) r
              where (r ->> 'cantidad')::numeric < 1
                 or (r ->> 'cantidad')::numeric <> trunc((r ->> 'cantidad')::numeric)) then
    raise exception 'La cantidad es un entero desde 1' using errcode = 'PV313';
  end if;
  if (select count(*) from public.ventas_renglones_del_mostrador(el_local, datos))
     <> jsonb_array_length(renglones) then
    raise exception 'Ese producto no esta disponible' using errcode = 'PV304';
  end if;
  select r.descripcion into cambiado from public.ventas_renglones_del_mostrador(el_local, datos) r
   where r.precio_centavos <> r.mandado_centavos limit 1;
  if cambiado is not null then
    raise exception 'Cambio el precio de %', cambiado using errcode = 'PV310';
  end if;
  select sum(r.cantidad * r.precio_centavos)::bigint into el_total
    from public.ventas_renglones_del_mostrador(el_local, datos) r;
  perform public.ventas_validar_pagos_del_mostrador(datos, el_total);
  return el_total;
end
$$;

create or replace function public.ventas_guardar_mostrador(datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_clave uuid := (datos ->> 'clave')::uuid;
  el_total bigint;
  nueva uuid;
begin
  if not (public.es_caja_activa() or public.es_admin_activo()) then
    raise exception 'No tenes permiso para vender' using errcode = '42501';
  end if;
  -- La misma clave otra vez (un toque repetido, un reintento sin conexion): la que ya estaba.
  select v.id, v.total_centavos into nueva, el_total
    from public.ventas v where v.local_id = el_local and v.clave = la_clave;
  if nueva is not null then
    return jsonb_build_object('id', nueva, 'total_centavos', el_total);
  end if;
  el_total := public.ventas_validar_mostrador(el_local, datos);
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, clave, en_la_caja)
  values (el_local, 'mostrador', (now() at time zone 'America/Argentina/Buenos_Aires')::date,
          'cerrada', el_total,
          (select c.id from public.canales_de_venta c where c.local_id = el_local and c.de_sistema),
          la_clave, true)
  returning id into nueva;
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos)
  select el_local, nueva, r.producto_id, r.presentacion_id, r.descripcion, r.cantidad,
         r.precio_centavos, (r.cantidad * r.precio_centavos)::bigint
    from public.ventas_renglones_del_mostrador(el_local, datos) r;
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  select el_local, nueva, (p ->> 'medio')::public.medio_de_caja, (p ->> 'monto_centavos')::bigint
    from jsonb_array_elements(datos -> 'pagos') p;
  return jsonb_build_object('id', nueva, 'total_centavos', el_total);
end
$$;

-- 5. La venta a mano dice si se cobro en la caja del local; sin decirlo, no.
create or replace function public.ventas_guardar_manual(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_clave uuid := (datos ->> 'clave')::uuid;
  el_total bigint;
  nueva uuid;
begin
  perform public.ventas_validar_manual(el_local, datos);
  select v.id into nueva from public.ventas v where v.local_id = el_local and v.clave = la_clave;
  if nueva is not null then
    return nueva;
  end if;
  -- Cada subtotal se redondea a centavos; el total es la suma de los subtotales.
  select coalesce(sum(round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)), 0)
    into el_total
    from jsonb_array_elements(datos -> 'renglones') r;
  insert into public.ventas (local_id, origen, fecha, estado, total_centavos, canal_id, comentario, clave,
                             en_la_caja)
  values (el_local, 'manual', (datos ->> 'fecha')::date, 'cerrada', el_total,
          (datos ->> 'canal_id')::uuid, nullif(trim(datos ->> 'comentario'), ''), la_clave,
          coalesce((datos ->> 'en_la_caja')::boolean, false))
  returning id into nueva;
  insert into public.renglones_de_venta (local_id, venta_id, producto_id, presentacion_id, descripcion,
                                         cantidad, precio_unitario_centavos, subtotal_centavos)
  select el_local, nueva, p.id, pr.id, p.nombre || ' · ' || pr.nombre, (r ->> 'cantidad')::numeric,
         (r ->> 'precio_unitario_centavos')::bigint,
         round((r ->> 'cantidad')::numeric * (r ->> 'precio_unitario_centavos')::bigint)
    from jsonb_array_elements(datos -> 'renglones') r
    join public.productos p on p.id = (r ->> 'producto_id')::uuid
    join public.presentaciones pr on pr.id = (r ->> 'presentacion_id')::uuid;
  insert into public.pagos_de_venta (local_id, venta_id, medio, monto_centavos)
  values (el_local, nueva, (datos ->> 'medio')::public.medio_de_caja, el_total);
  return nueva;
end
$$;

-- 6. Lo esperado de la caja suma solo lo cobrado en la caja del local, y ningun cierre espera
--    las ventas: se cargan al cobrar. Cambia lo que devuelve: se borra y se vuelve a crear.
drop function if exists public.cierres_con_resultado(date, date, uuid);
create function public.cierres_con_resultado(desde date, hasta date, persona uuid default null)
returns table (
  id uuid, fecha date, cargado_por uuid, persona_nombre text, anulado boolean,
  motivo_anulacion text, comentario text,
  fondo_inicial_centavos bigint, efectivo_centavos bigint, credito_centavos bigint,
  debito_centavos bigint, qr_centavos bigint, transferencia_centavos bigint,
  queda_en_caja_centavos bigint, retiros_centavos bigint, gastos_centavos bigint,
  ventas_efectivo_centavos bigint, ventas_credito_centavos bigint, ventas_debito_centavos bigint,
  ventas_qr_centavos bigint, ventas_transferencia_centavos bigint, tolerancia_centavos bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.cierres_exigir_quien_carga();
  return query
  select c.id, c.fecha, c.cargado_por, p.nombre, c.anulado, c.motivo_anulacion, c.comentario,
    c.fondo_inicial_centavos, c.efectivo_centavos, c.credito_centavos, c.debito_centavos,
    c.qr_centavos, c.transferencia_centavos, c.queda_en_caja_centavos,
    coalesce((select sum(r.monto_centavos) from public.retiros_de_caja r where r.cierre_id = c.id), 0)::bigint,
    coalesce((select sum(g.monto_centavos) from public.gastos g where g.cierre_id = c.id and not g.anulado), 0)::bigint,
    coalesce(v.efectivo, 0)::bigint, coalesce(v.credito, 0)::bigint, coalesce(v.debito, 0)::bigint,
    coalesce(v.qr, 0)::bigint, coalesce(v.transferencia, 0)::bigint,
    coalesce((select k.tolerancia_centavos from public.configuracion_de_caja k where k.local_id = c.local_id), 50000)
  from public.cierres_de_caja c
  join public.perfiles p on p.id = c.cargado_por
  left join lateral (
    select sum(pv.monto_centavos) filter (where pv.medio = 'efectivo') as efectivo,
           sum(pv.monto_centavos) filter (where pv.medio = 'credito') as credito,
           sum(pv.monto_centavos) filter (where pv.medio = 'debito') as debito,
           sum(pv.monto_centavos) filter (where pv.medio = 'qr') as qr,
           sum(pv.monto_centavos) filter (where pv.medio = 'transferencia') as transferencia
      from public.ventas ve
      join public.pagos_de_venta pv on pv.venta_id = ve.id
     where ve.local_id = c.local_id and ve.fecha = c.fecha and ve.estado = 'cerrada'
       and not ve.anulado and ve.en_la_caja
  ) v on true
  where c.fecha between desde and hasta
    and (persona is null or c.cargado_por = persona)
    and ((public.es_admin_activo() and c.local_id = public.local_del_usuario())
         or (c.cargado_por = (select auth.uid()) and public.es_caja_activa()))
  order by c.fecha desc, c.fecha_creacion desc;
end
$$;

-- 7. Sin Fudo: la subida del Excel, hasta cuando hay ventas y lo vendido sin detalle.
drop function if exists public.ventas_importar_excel(jsonb);
drop function if exists public.ventas_auditar_subida(uuid, jsonb, int[]);
drop function if exists public.ventas_aplicar_lote(uuid, jsonb);
drop function if exists public.ventas_crear_del_excel(uuid, date, public.medio_de_caja, bigint);
drop function if exists public.ventas_validar_excel(jsonb);
drop function if exists public.ventas_fudo_cargadas_hasta();
drop function if exists public.reporte_ventas_sin_detalle(date, date);

-- Permisos
revoke all on function
  public.crear_tipo_de_venta_local(),
  public.reglas_de_canales(),
  public.ventas_renglones_del_mostrador(uuid, jsonb),
  public.ventas_validar_pagos_del_mostrador(jsonb, bigint),
  public.ventas_validar_mostrador(uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.catalogo_para_vender() from public, anon;
revoke all on function public.ventas_guardar_mostrador(jsonb) from public, anon;
revoke all on function public.cierres_con_resultado(date, date, uuid) from public, anon;
grant execute on function public.catalogo_para_vender() to authenticated;
grant execute on function public.ventas_guardar_mostrador(jsonb) to authenticated;
grant execute on function public.cierres_con_resultado(date, date, uuid) to authenticated;
