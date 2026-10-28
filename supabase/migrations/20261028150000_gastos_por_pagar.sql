-- Gastos por pagar: lo que se anota antes de pagarlo y lo que dejan los fijos el dia que
-- vencen. Pagar es cargar un gasto con por_pagar_id: la base copia los datos de lo por pagar
-- y no deja pagarlo dos veces. Los fijos dejan de cargar gastos pagados solos (pedido 65).

create table if not exists public.gastos_por_pagar (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  -- El dia en Argentina en que vence; puede haber pasado.
  vencimiento date not null,
  categoria_id uuid not null references public.categorias_de_gasto (id),
  monto_centavos bigint not null check (monto_centavos > 0),
  descripcion text check (descripcion is null or char_length(descripcion) between 1 and 200),
  proveedor_id uuid references public.proveedores (id),
  -- Si no se sabe al anotarlo, se elige al pagar.
  medio_de_pago public.medio_de_pago,
  comprobante text check (comprobante is null or char_length(comprobante) between 1 and 60),
  recurrente_id uuid references public.gastos_recurrentes (id),
  clave uuid,
  anulado boolean not null default false,
  motivo_anulacion text check (motivo_anulacion is null or char_length(motivo_anulacion) <= 300),
  anulado_por uuid references public.perfiles (id) on delete set null,
  fecha_anulacion timestamptz,
  creado_por uuid references public.perfiles (id) on delete set null default auth.uid(),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  -- Un fijo deja un solo por pagar por vencimiento, aunque se anule.
  constraint gastos_por_pagar_recurrente_vencimiento unique (recurrente_id, vencimiento)
);

create index if not exists gastos_por_pagar_local_vencimiento
  on public.gastos_por_pagar (local_id, vencimiento);
create unique index if not exists gastos_por_pagar_clave
  on public.gastos_por_pagar (local_id, clave);

alter table public.gastos
  add column if not exists por_pagar_id uuid references public.gastos_por_pagar (id);
-- Un solo pago vigente: anulado el pago, se puede volver a pagar.
create unique index if not exists gastos_un_pago_por_pagar
  on public.gastos (por_pagar_id) where not anulado;

-- Reglas

-- Cada vencimiento de un fijo sale del primero mas k periodos, como en la generacion.
create or replace function public.es_vencimiento_del_fijo(
  primero date, la_frecuencia public.frecuencia_de_gasto, el_dia date
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select exists (
    select 1 from generate_series(0, 1200) as k
     where (primero + make_interval(months => k * case la_frecuencia
              when 'mensual' then 1 when 'bimestral' then 2 else 12 end))::date = el_dia)
$$;

create or replace function public.reglas_de_por_pagar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fijo public.gastos_recurrentes;
  hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if tg_op = 'UPDATE' then
    if old.anulado then
      raise exception 'Lo anulado no se cambia' using errcode = 'PG204';
    end if;
    if new.anulado then
      if coalesce(trim(new.motivo_anulacion), '') = '' then
        raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
      end if;
      if exists (select 1 from public.gastos g where g.por_pagar_id = new.id and not g.anulado) then
        raise exception 'Ya esta pagado: se anula el pago' using errcode = 'PG210';
      end if;
      new.anulado_por := (select auth.uid());
      new.fecha_anulacion := now();
    end if;
    return new;
  end if;
  if new.recurrente_id is null then
    if new.medio_de_pago is not null then
      perform public.gastos_exigir_medio(new.medio_de_pago::text, null);
    end if;
    perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id,
      new.proveedor_id, null);
    return new;
  end if;
  select * into fijo from public.gastos_recurrentes r
   where r.id = new.recurrente_id and r.local_id = new.local_id;
  -- Una persona solo adelanta un proximo pago de un fijo activo; lo vencido lo crea el proceso,
  -- que corre sin usuario.
  if not found or ((select auth.uid()) is not null and not (
       fijo.activo and new.vencimiento > hoy
       and new.vencimiento >= coalesce(fijo.generar_desde, fijo.primer_vencimiento)
       and public.es_vencimiento_del_fijo(fijo.primer_vencimiento, fijo.frecuencia,
                                          new.vencimiento))) then
    raise exception 'Esa fecha no es un proximo pago del fijo' using errcode = 'PG211';
  end if;
  new.categoria_id := fijo.categoria_id;
  new.proveedor_id := fijo.proveedor_id;
  new.descripcion := fijo.descripcion;
  new.monto_centavos := fijo.monto_centavos;
  new.medio_de_pago := fijo.medio_de_pago;
  return new;
end
$$;

-- Pagar copia los datos de lo por pagar: no se pueden mandar otros.
create or replace function public.datos_del_por_pagar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pendiente public.gastos_por_pagar;
begin
  select * into pendiente from public.gastos_por_pagar p
   where p.id = new.por_pagar_id and p.local_id = new.local_id and not p.anulado;
  if not found then
    raise exception 'Eso ya no esta por pagar' using errcode = 'PG209';
  end if;
  new.categoria_id := pendiente.categoria_id;
  new.proveedor_id := pendiente.proveedor_id;
  new.descripcion := pendiente.descripcion;
  new.comprobante := pendiente.comprobante;
  new.recurrente_id := pendiente.recurrente_id;
  new.vencimiento := null;
  new.cierre_id := null;
  return new;
end
$$;

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
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

-- Lo que vence de un fijo queda por pagar. Los vencimientos que un fijo ya habia cargado
-- pagados, antes de que hubiera por pagar, no vuelven.
create or replace function public.generar_gastos_recurrentes(hasta date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  creados integer;
begin
  -- Cada vencimiento sale del primero mas k periodos, no del anterior: asi el 31 de enero
  -- pasa al 28 de febrero y vuelve al 31 en marzo.
  insert into public.gastos_por_pagar (local_id, vencimiento, categoria_id, monto_centavos,
                                       descripcion, proveedor_id, medio_de_pago, recurrente_id,
                                       creado_por)
  select r.local_id, v.vencimiento, r.categoria_id, r.monto_centavos, r.descripcion,
         r.proveedor_id, r.medio_de_pago, r.id, null
    from public.gastos_recurrentes r
   cross join lateral (
     select (r.primer_vencimiento + make_interval(months => k * case r.frecuencia
               when 'mensual' then 1 when 'bimestral' then 2 else 12 end))::date as vencimiento
       from generate_series(0, 1200) as k
   ) v
   where r.activo and v.vencimiento <= hasta
     and (r.generar_desde is null or v.vencimiento >= r.generar_desde)
     and not exists (select 1 from public.gastos g
                      where g.recurrente_id = r.id and g.vencimiento = v.vencimiento)
  on conflict (recurrente_id, vencimiento) do nothing;
  get diagnostics creados = row_count;
  return creados;
end
$$;

-- Lo por pagar vigente y sin pago, con los nombres que muestra la pantalla. Corre con los
-- permisos de quien consulta: RLS decide que filas ve.
create or replace function public.pagos_pendientes()
returns table (
  id uuid,
  vencimiento date,
  descripcion text,
  monto_centavos bigint,
  medio_de_pago public.medio_de_pago,
  recurrente_id uuid,
  categoria text,
  proveedor text,
  frecuencia public.frecuencia_de_gasto
)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.id, p.vencimiento, p.descripcion, p.monto_centavos, p.medio_de_pago, p.recurrente_id,
         c.nombre, pr.nombre, r.frecuencia
    from public.gastos_por_pagar p
    join public.categorias_de_gasto c on c.id = p.categoria_id
    left join public.proveedores pr on pr.id = p.proveedor_id
    left join public.gastos_recurrentes r on r.id = p.recurrente_id
   where not p.anulado
     and not exists (select 1 from public.gastos g where g.por_pagar_id = p.id and not g.anulado)
   order by p.vencimiento, p.id
$$;

-- Triggers

drop trigger if exists reglas on public.gastos_por_pagar;
create trigger reglas before insert or update on public.gastos_por_pagar
  for each row execute function public.reglas_de_por_pagar();
drop trigger if exists marcar_actualizacion on public.gastos_por_pagar;
create trigger marcar_actualizacion before update on public.gastos_por_pagar
  for each row execute function public.marcar_actualizacion();
drop trigger if exists auditar on public.gastos_por_pagar;
create trigger auditar after insert or update on public.gastos_por_pagar
  for each row execute function public.auditar('anulado_por', 'fecha_anulacion');
-- Corre antes que "reglas": los triggers de un mismo momento van por orden alfabetico.
drop trigger if exists datos_del_por_pagar on public.gastos;
create trigger datos_del_por_pagar before insert on public.gastos
  for each row when (new.por_pagar_id is not null)
  execute function public.datos_del_por_pagar();

revoke all on function
  public.es_vencimiento_del_fijo(date, public.frecuencia_de_gasto, date),
  public.reglas_de_por_pagar(),
  public.datos_del_por_pagar()
  from public, anon, authenticated;
revoke all on function public.pagos_pendientes() from public, anon;
grant execute on function public.pagos_pendientes() to authenticated;

-- Permisos

alter table public.gastos_por_pagar enable row level security;

revoke all on table public.gastos_por_pagar from anon, authenticated;
grant select on table public.gastos_por_pagar to authenticated;
grant insert (vencimiento, categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago,
              comprobante, recurrente_id, clave)
  on table public.gastos_por_pagar to authenticated;
grant update (anulado, motivo_anulacion) on table public.gastos_por_pagar to authenticated;
grant insert (por_pagar_id) on table public.gastos to authenticated;

drop policy if exists "gastos_por_pagar: el admin activo ve los de su local" on public.gastos_por_pagar;
create policy "gastos_por_pagar: el admin activo ve los de su local" on public.gastos_por_pagar
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos_por_pagar: el admin activo carga en su local" on public.gastos_por_pagar;
create policy "gastos_por_pagar: el admin activo carga en su local" on public.gastos_por_pagar
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos_por_pagar: el admin activo cambia los de su local" on public.gastos_por_pagar;
create policy "gastos_por_pagar: el admin activo cambia los de su local" on public.gastos_por_pagar
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
