-- Compras (pedido 96): el pedido opcional, la recepcion con lo que llego y a que precio, y el
-- gasto de Mercaderia (pagado o por pagar) que genera cada compra. La compra pagada con la
-- caja se arma sobre su gasto "Sin clasificar". Todo se escribe con funciones, en una sola
-- transaccion; costo_de_insumos() pasa a tomar el precio de la ultima compra recibida.

do $$
begin
  create type public.estado_de_compra as enum ('pedida', 'recibida');
exception when duplicate_object then null;
end $$;

create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  proveedor_id uuid not null references public.proveedores (id),
  estado public.estado_de_compra not null,
  -- El dia que llego; vacio mientras esta pedida.
  fecha date,
  otros_cargos_centavos bigint not null default 0 check (otros_cargos_centavos >= 0),
  total_centavos bigint not null default 0 check (total_centavos >= 0),
  factura text check (factura is null or char_length(factura) between 1 and 60),
  gasto_id uuid references public.gastos (id),
  por_pagar_id uuid references public.gastos_por_pagar (id),
  clave uuid,
  anulado boolean not null default false,
  motivo_anulacion text check (motivo_anulacion is null or char_length(motivo_anulacion) <= 300),
  anulado_por uuid references public.perfiles (id) on delete set null,
  fecha_anulacion timestamptz,
  creado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  check (estado = 'pedida' or fecha is not null)
);

create unique index if not exists compras_clave on public.compras (local_id, clave);
create index if not exists compras_local_fecha on public.compras (local_id, fecha);
create index if not exists compras_proveedor on public.compras (proveedor_id);

create table if not exists public.renglones_de_compra (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  compra_id uuid not null references public.compras (id),
  forma_de_compra_id uuid not null references public.formas_de_compra (id),
  cantidad_pedida numeric(12, 3) check (cantidad_pedida is null or cantidad_pedida > 0),
  cantidad numeric(12, 3) not null default 0 check (cantidad >= 0),
  -- Lo que se pago por cada unidad de la forma de compra; cero es una bonificacion.
  precio_unitario_centavos bigint not null default 0 check (precio_unitario_centavos >= 0),
  subtotal_centavos bigint not null default 0 check (subtotal_centavos >= 0),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists renglones_de_compra_compra on public.renglones_de_compra (compra_id);
create index if not exists renglones_de_compra_forma on public.renglones_de_compra (forma_de_compra_id);

-- Solo para mostrar: el gasto o lo por pagar que genero una compra lleva a ella.
alter table public.gastos add column if not exists compra_id uuid references public.compras (id);
alter table public.gastos_por_pagar add column if not exists compra_id uuid
  references public.compras (id);

create or replace trigger marcar_actualizacion before update on public.compras
  for each row execute function public.marcar_actualizacion();
create or replace trigger auditar after insert or update on public.compras
  for each row execute function public.auditar('anulado_por', 'fecha_anulacion');
create or replace trigger marcar_actualizacion before update on public.renglones_de_compra
  for each row execute function public.marcar_actualizacion();
create or replace trigger auditar after insert or update on public.renglones_de_compra
  for each row execute function public.auditar();

alter table public.compras enable row level security;
alter table public.renglones_de_compra enable row level security;
revoke all on table public.compras, public.renglones_de_compra from anon, authenticated;
grant select on table public.compras, public.renglones_de_compra to authenticated;

do $$
declare
  tabla text;
begin
  foreach tabla in array array['compras', 'renglones_de_compra'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tabla) then
      execute format('create policy "%s: el admin activo ve lo de su local" on public.%I
                      for select to authenticated
                      using ((select public.es_admin_activo())
                             and local_id = (select public.local_del_usuario()))', tabla, tabla);
    end if;
  end loop;
end $$;

-- Las reglas de gastos, iguales, mas una salida: al anular una compra pagada con la caja, su
-- gasto vuelve a "Sin clasificar", que a mano no se elige.
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

create or replace function public.compras_exigir_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para hacer esto' using errcode = 'PU300';
  end if;
end;
$$;

create or replace function public.compras_categoria(el_local uuid, el_nombre text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id from public.categorias_de_gasto c where c.local_id = el_local and c.nombre = el_nombre;
$$;

-- El proveedor es del local y esta activo; cada renglon es una forma activa del local, de ese
-- proveedor o sin proveedor, con cantidad mayor que cero.
create or replace function public.compras_controlar(el_local uuid, el_proveedor uuid, renglones jsonb)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.proveedores p
                  where p.id = el_proveedor and p.local_id = el_local and p.activo) then
    raise exception 'Ese proveedor no esta disponible' using errcode = 'PU301';
  end if;
  if jsonb_array_length(coalesce(renglones, '[]'::jsonb)) = 0 then
    raise exception 'La compra necesita al menos un renglon' using errcode = 'PU303';
  end if;
  if exists (select 1 from jsonb_array_elements(renglones) e
              where not exists (select 1 from public.formas_de_compra f
                                 where f.id = (e ->> 'forma_de_compra_id')::uuid
                                   and f.local_id = el_local and f.activo
                                   and (f.proveedor_id is null or f.proveedor_id = el_proveedor))) then
    raise exception 'Esa forma de compra no es de este proveedor' using errcode = 'PU304';
  end if;
  if exists (select 1 from jsonb_array_elements(renglones) e
              where coalesce((e ->> 'cantidad')::numeric, 0) <= 0) then
    raise exception 'Cada renglon lleva una cantidad' using errcode = 'PU310';
  end if;
end;
$$;

-- Carga lo que llego: cambia el renglon pedido de esa forma o agrega uno nuevo.
create or replace function public.compras_cargar_renglones(el_local uuid, la_compra uuid, renglones jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  e jsonb;
  la_cantidad numeric;
  el_precio bigint;
begin
  for e in select * from jsonb_array_elements(renglones) loop
    la_cantidad := (e ->> 'cantidad')::numeric;
    el_precio := coalesce((e ->> 'precio_unitario_centavos')::bigint, 0);
    update public.renglones_de_compra r
       set cantidad = la_cantidad, precio_unitario_centavos = el_precio,
           subtotal_centavos = round(la_cantidad * el_precio)::bigint
     where r.compra_id = la_compra and r.forma_de_compra_id = (e ->> 'forma_de_compra_id')::uuid;
    if not found then
      insert into public.renglones_de_compra (local_id, compra_id, forma_de_compra_id, cantidad,
                                              precio_unitario_centavos, subtotal_centavos)
      values (el_local, la_compra, (e ->> 'forma_de_compra_id')::uuid, la_cantidad, el_precio,
              round(la_cantidad * el_precio)::bigint);
    end if;
  end loop;
end;
$$;

-- El gasto pagado o lo por pagar de la compra, en Mercaderia, con el proveedor y el total.
create or replace function public.compras_generar_pago(la_compra uuid, pago jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.compras;
  mercaderia uuid;
  descripcion text;
  nuevo uuid;
begin
  select * into c from public.compras where id = la_compra;
  mercaderia := public.compras_categoria(c.local_id, 'Mercadería');
  descripcion := 'Compra' || coalesce(' ' || c.factura, '');
  if pago ->> 'tipo' = 'por_pagar' then
    insert into public.gastos_por_pagar (local_id, vencimiento, categoria_id, monto_centavos,
                                         descripcion, proveedor_id, comprobante, compra_id)
    values (c.local_id, (pago ->> 'vencimiento')::date, mercaderia, c.total_centavos, descripcion,
            c.proveedor_id, c.factura, c.id)
    returning id into nuevo;
    update public.compras set por_pagar_id = nuevo where id = c.id;
  elsif pago ->> 'tipo' = 'pagada' then
    insert into public.gastos (local_id, fecha, categoria_id, monto_centavos, descripcion,
                               proveedor_id, medio_de_pago, comprobante, compra_id)
    values (c.local_id, (pago ->> 'fecha')::date, mercaderia, c.total_centavos, descripcion,
            c.proveedor_id, (pago ->> 'medio')::public.medio_de_pago, c.factura, c.id)
    returning id into nuevo;
    update public.compras set gasto_id = nuevo where id = c.id;
  else
    raise exception 'Elegi si se pago o queda por pagar' using errcode = 'PU311';
  end if;
end;
$$;

create or replace function public.compras_ya_cargada(el_local uuid, datos jsonb)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id from public.compras c
   where c.local_id = el_local and c.clave = nullif(datos ->> 'clave', '')::uuid;
$$;

-- Recibe un pedido o carga una compra directa, con su gasto, en una sola transaccion.
create or replace function public.compras_recibir(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_compra uuid := nullif(datos ->> 'compra_id', '')::uuid;
  el_proveedor uuid := (datos ->> 'proveedor_id')::uuid;
  la_fecha date := (datos ->> 'fecha')::date;
  otros bigint := coalesce((datos ->> 'otros_cargos_centavos')::bigint, 0);
  la_factura text := nullif(trim(datos ->> 'factura'), '');
  ya uuid;
  el_total bigint;
begin
  perform public.compras_exigir_admin();
  ya := public.compras_ya_cargada(el_local, datos);
  if ya is not null then
    return ya;
  end if;
  if la_fecha is null or la_fecha > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    raise exception 'La fecha de la compra no puede ser futura' using errcode = 'PU302';
  end if;
  perform public.compras_controlar(el_local, el_proveedor, datos -> 'renglones');
  if la_compra is null then
    insert into public.compras (local_id, proveedor_id, estado, fecha, otros_cargos_centavos,
                                factura, clave)
    values (el_local, el_proveedor, 'recibida', la_fecha, otros, la_factura,
            nullif(datos ->> 'clave', '')::uuid)
    returning id into la_compra;
  else
    update public.compras c
       set estado = 'recibida', fecha = la_fecha, otros_cargos_centavos = otros, factura = la_factura
     where c.id = la_compra and c.local_id = el_local and c.estado = 'pedida' and not c.anulado
       and c.proveedor_id = el_proveedor;
    if not found then
      raise exception 'Ese pedido ya se recibio o se anulo' using errcode = 'PU306';
    end if;
  end if;
  perform public.compras_cargar_renglones(el_local, la_compra, datos -> 'renglones');
  select coalesce(sum(r.subtotal_centavos), 0) + otros into el_total
    from public.renglones_de_compra r where r.compra_id = la_compra;
  if el_total <= 0 then
    raise exception 'La compra no puede ser de cero' using errcode = 'PU305';
  end if;
  update public.compras set total_centavos = el_total where id = la_compra;
  perform public.compras_generar_pago(la_compra, datos -> 'pago');
  return la_compra;
end;
$$;

-- Un pedido al proveedor: no genera gasto ni cambia precios hasta que se recibe.
create or replace function public.compras_pedir(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  el_proveedor uuid := (datos ->> 'proveedor_id')::uuid;
  la_compra uuid;
begin
  perform public.compras_exigir_admin();
  la_compra := public.compras_ya_cargada(el_local, datos);
  if la_compra is not null then
    return la_compra;
  end if;
  perform public.compras_controlar(el_local, el_proveedor, datos -> 'renglones');
  insert into public.compras (local_id, proveedor_id, estado, clave)
  values (el_local, el_proveedor, 'pedida', nullif(datos ->> 'clave', '')::uuid)
  returning id into la_compra;
  insert into public.renglones_de_compra (local_id, compra_id, forma_de_compra_id, cantidad_pedida)
  select el_local, la_compra, (e ->> 'forma_de_compra_id')::uuid, (e ->> 'cantidad')::numeric
    from jsonb_array_elements(datos -> 'renglones') e;
  return la_compra;
end;
$$;

-- Una compra pagada con la caja: se arma sobre su gasto "Sin clasificar", sin crear otro. La
-- diferencia entre el monto y los renglones va a otros cargos.
create or replace function public.compras_desde_gasto(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  el_proveedor uuid := (datos ->> 'proveedor_id')::uuid;
  g public.gastos;
  la_compra uuid;
  suma bigint;
begin
  perform public.compras_exigir_admin();
  select * into g from public.gastos
   where id = (datos ->> 'gasto_id')::uuid and local_id = el_local and cierre_id is not null
     and not anulado and compra_id is null
     and categoria_id = public.compras_categoria(el_local, 'Sin clasificar');
  if not found then
    raise exception 'Ese gasto ya no esta para clasificar' using errcode = 'PU312';
  end if;
  perform public.compras_controlar(el_local, el_proveedor, datos -> 'renglones');
  insert into public.compras (local_id, proveedor_id, estado, fecha, factura, gasto_id, clave)
  values (el_local, el_proveedor, 'recibida', g.fecha, nullif(trim(datos ->> 'factura'), ''), g.id,
          nullif(datos ->> 'clave', '')::uuid)
  returning id into la_compra;
  perform public.compras_cargar_renglones(el_local, la_compra, datos -> 'renglones');
  select coalesce(sum(r.subtotal_centavos), 0) into suma
    from public.renglones_de_compra r where r.compra_id = la_compra;
  if suma > g.monto_centavos then
    raise exception 'Los renglones pasan el monto del gasto' using errcode = 'PU307';
  end if;
  update public.compras set otros_cargos_centavos = g.monto_centavos - suma,
         total_centavos = g.monto_centavos
   where id = la_compra;
  update public.gastos set categoria_id = public.compras_categoria(el_local, 'Mercadería'),
         proveedor_id = el_proveedor, compra_id = la_compra
   where id = g.id;
  return la_compra;
end;
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

-- Lo que cuesta hoy cada insumo: el precio de la ultima compra recibida y no anulada (por la
-- fecha de la compra y despues por la carga) o, si no hay, la referencia de la forma cambiada
-- por ultima vez. Una bonificacion a $0 no cuenta.
create or replace function public.costo_de_insumos()
returns table (insumo_id uuid, costo_por_unidad numeric, origen text, fecha_origen date)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id,
         coalesce(ultima.costo, round(ref.precio_referencia_centavos / ref.contenido, 6)),
         case when ultima.costo is not null then 'compra'
              when ref.id is not null then 'referencia' end,
         ultima.fecha
    from public.insumos i
    left join lateral (
      select round(r.precio_unitario_centavos / f.contenido, 6) as costo, c.fecha
        from public.renglones_de_compra r
        join public.compras c on c.id = r.compra_id
        join public.formas_de_compra f on f.id = r.forma_de_compra_id
       where f.insumo_id = i.id and c.estado = 'recibida' and not c.anulado
         and r.precio_unitario_centavos > 0 and r.cantidad > 0
       order by c.fecha desc, c.fecha_creacion desc, r.fecha_creacion desc
       limit 1
    ) ultima on true
    left join lateral (
      select fc.id, fc.precio_referencia_centavos, fc.contenido
        from public.formas_de_compra fc
       where fc.insumo_id = i.id and fc.activo and fc.precio_referencia_centavos is not null
       order by fc.fecha_actualizacion desc, fc.fecha_creacion desc
       limit 1
    ) ref on true;
$$;

revoke all on function public.compras_exigir_admin() from public, anon, authenticated;
revoke all on function public.compras_categoria(uuid, text) from public, anon, authenticated;
revoke all on function public.compras_controlar(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.compras_cargar_renglones(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.compras_generar_pago(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.compras_ya_cargada(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.compras_recibir(jsonb) from public, anon;
revoke all on function public.compras_pedir(jsonb) from public, anon;
revoke all on function public.compras_desde_gasto(jsonb) from public, anon;
revoke all on function public.compras_anular(uuid, text) from public, anon;
grant execute on function public.compras_recibir(jsonb) to authenticated;
grant execute on function public.compras_pedir(jsonb) to authenticated;
grant execute on function public.compras_desde_gasto(jsonb) to authenticated;
grant execute on function public.compras_anular(uuid, text) to authenticated;
