-- Cierres de caja: lo que declara Caja al final del dia, sus retiros y los gastos pagados con
-- la caja, que pasan a Gastos como "Sin clasificar". Se guarda todo junto con una funcion;
-- Caja ve solo los suyos y el admin los revisa y los anula. Lo esperado llega con Ventas.

do $$
begin
  create type public.estado_de_cierre as enum
    ('esperando_ventas', 'cierra', 'con_diferencia', 'revisado', 'anulado');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.cierres_de_caja (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  -- El dia en Argentina al que corresponde la caja.
  fecha date not null,
  cargado_por uuid not null references public.perfiles (id) default auth.uid(),
  fondo_inicial_centavos bigint not null check (fondo_inicial_centavos >= 0),
  efectivo_centavos bigint not null check (efectivo_centavos >= 0),
  credito_centavos bigint not null default 0 check (credito_centavos >= 0),
  debito_centavos bigint not null default 0 check (debito_centavos >= 0),
  qr_centavos bigint not null default 0 check (qr_centavos >= 0),
  transferencia_centavos bigint not null default 0 check (transferencia_centavos >= 0),
  queda_en_caja_centavos bigint not null check (queda_en_caja_centavos >= 0),
  comentario text check (comentario is null or char_length(comentario) <= 500),
  estado public.estado_de_cierre not null default 'esperando_ventas',
  -- Lo esperado lo completa el recalculo con las ventas del dia; hasta entonces, nulo.
  esperado_efectivo_centavos bigint,
  esperado_credito_centavos bigint,
  esperado_debito_centavos bigint,
  esperado_qr_centavos bigint,
  esperado_transferencia_centavos bigint,
  revisado boolean not null default false,
  revisado_por uuid references public.perfiles (id) on delete set null,
  fecha_revision timestamptz,
  comentario_revision text check (comentario_revision is null or char_length(comentario_revision) <= 500),
  anulado boolean not null default false,
  motivo_anulacion text check (motivo_anulacion is null or char_length(motivo_anulacion) <= 300),
  anulado_por uuid references public.perfiles (id) on delete set null,
  fecha_anulacion timestamptz,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

-- Un cierre por dia; el anulado deja libre el dia.
create unique index if not exists cierres_de_caja_un_dia
  on public.cierres_de_caja (local_id, fecha) where not anulado;
create index if not exists cierres_de_caja_local_fecha on public.cierres_de_caja (local_id, fecha desc);
create index if not exists cierres_de_caja_cargado_por on public.cierres_de_caja (cargado_por);

create table if not exists public.retiros_de_caja (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id),
  cierre_id uuid not null references public.cierres_de_caja (id),
  monto_centavos bigint not null check (monto_centavos > 0),
  quien text not null check (char_length(quien) between 1 and 80),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists retiros_de_caja_cierre on public.retiros_de_caja (cierre_id);

create table if not exists public.configuracion_de_caja (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null unique references public.locales (id),
  tolerancia_centavos bigint not null default 50000 check (tolerancia_centavos >= 0),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

alter table public.gastos add column if not exists cierre_id uuid references public.cierres_de_caja (id);
create index if not exists gastos_cierre on public.gastos (cierre_id);

-- Quien puede cargar un cierre

create or replace function public.es_caja_activa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'caja' and activo
  )
$$;

create or replace function public.cierres_exigir_quien_carga()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.es_caja_activa() or public.es_admin_activo()) then
    raise exception 'No tenes permiso para cargar cierres' using errcode = '42501';
  end if;
end
$$;

-- Guardar: el cierre, sus retiros y sus gastos, o nada

create or replace function public.cierres_insertar(el_local uuid, datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo uuid;
begin
  insert into public.cierres_de_caja (local_id, fecha, cargado_por, fondo_inicial_centavos,
    efectivo_centavos, credito_centavos, debito_centavos, qr_centavos, transferencia_centavos,
    queda_en_caja_centavos, comentario)
  values (el_local, (datos ->> 'fecha')::date, (select auth.uid()),
    (datos ->> 'fondo_inicial_centavos')::bigint, (datos ->> 'efectivo_centavos')::bigint,
    coalesce((datos ->> 'credito_centavos')::bigint, 0), coalesce((datos ->> 'debito_centavos')::bigint, 0),
    coalesce((datos ->> 'qr_centavos')::bigint, 0), coalesce((datos ->> 'transferencia_centavos')::bigint, 0),
    (datos ->> 'queda_en_caja_centavos')::bigint, nullif(trim(datos ->> 'comentario'), ''))
  returning id into nuevo;
  return nuevo;
exception
  when unique_violation then
    raise exception 'Ya hay un cierre de ese dia' using errcode = 'PC302';
end
$$;

create or replace function public.cierres_guardar(datos jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
  la_fecha date := (datos ->> 'fecha')::date;
  nuevo uuid;
begin
  perform public.cierres_exigir_quien_carga();
  if la_fecha > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    raise exception 'No se carga el cierre de un dia que no llego' using errcode = 'PC301';
  end if;
  nuevo := public.cierres_insertar(el_local, datos);
  insert into public.retiros_de_caja (local_id, cierre_id, monto_centavos, quien)
  select el_local, nuevo, (r ->> 'monto_centavos')::bigint, trim(r ->> 'quien')
    from jsonb_array_elements(coalesce(datos -> 'retiros', '[]')) r;
  insert into public.gastos (local_id, fecha, categoria_id, monto_centavos, descripcion,
                             medio_de_pago, cierre_id)
  select el_local, la_fecha, c.id, (g ->> 'monto_centavos')::bigint, trim(g ->> 'descripcion'),
         'efectivo_caja', nuevo
    from jsonb_array_elements(coalesce(datos -> 'gastos', '[]')) g
   cross join public.categorias_de_gasto c
   where c.local_id = el_local and c.de_sistema;
  return nuevo;
end
$$;

-- Lo que quedo en la caja en el ultimo cierre anterior: precarga el fondo inicial.
create or replace function public.cierres_fondo_sugerido(la_fecha date)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.cierres_exigir_quien_carga();
  return (select c.queda_en_caja_centavos from public.cierres_de_caja c
           where c.local_id = public.local_del_usuario() and not c.anulado and c.fecha < la_fecha
           order by c.fecha desc limit 1);
end
$$;

-- Reglas de un cierre guardado: se revisa o se anula, nada mas

create or replace function public.reglas_de_cierres()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.anulado then
    raise exception 'Un cierre anulado no se cambia' using errcode = 'PC303';
  end if;
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PC304';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
    new.estado := 'anulado';
  elsif new.revisado and not old.revisado then
    new.revisado_por := (select auth.uid());
    new.fecha_revision := now();
    new.estado := 'revisado';
  end if;
  return new;
end
$$;

-- Anular un cierre anula los gastos que salieron de el.
create or replace function public.anular_gastos_del_cierre()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.anulado and not old.anulado then
    perform set_config('manteca.anulando_cierre', 'si', true);
    update public.gastos
       set anulado = true, motivo_anulacion = 'Se anulo el cierre de caja: ' || new.motivo_anulacion
     where cierre_id = new.id and not anulado;
    perform set_config('manteca.anulando_cierre', '', true);
  end if;
  return new;
end
$$;

-- Gastos: el que salio de un cierre se clasifica, pero su plata se corrige desde el cierre.
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
  -- Lo que genera un recurrente o un cierre entra tal cual, aunque sea "Sin clasificar".
  if tg_op = 'INSERT' and (new.recurrente_id is not null or new.cierre_id is not null) then
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

-- Triggers

drop trigger if exists reglas on public.cierres_de_caja;
create trigger reglas before update on public.cierres_de_caja
  for each row execute function public.reglas_de_cierres();
drop trigger if exists anular_gastos on public.cierres_de_caja;
create trigger anular_gastos after update on public.cierres_de_caja
  for each row execute function public.anular_gastos_del_cierre();

drop trigger if exists marcar_actualizacion on public.cierres_de_caja;
create trigger marcar_actualizacion before update on public.cierres_de_caja
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.retiros_de_caja;
create trigger marcar_actualizacion before update on public.retiros_de_caja
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.configuracion_de_caja;
create trigger marcar_actualizacion before update on public.configuracion_de_caja
  for each row execute function public.marcar_actualizacion();

drop trigger if exists auditar on public.cierres_de_caja;
create trigger auditar after insert or update on public.cierres_de_caja
  for each row execute function public.auditar('anulado_por', 'fecha_anulacion', 'revisado_por', 'fecha_revision', 'estado');
drop trigger if exists auditar on public.retiros_de_caja;
create trigger auditar after insert or update on public.retiros_de_caja
  for each row execute function public.auditar();
drop trigger if exists auditar on public.configuracion_de_caja;
create trigger auditar after insert or update on public.configuracion_de_caja
  for each row execute function public.auditar();

revoke all on function
  public.cierres_exigir_quien_carga(),
  public.cierres_insertar(uuid, jsonb),
  public.reglas_de_cierres(),
  public.anular_gastos_del_cierre(),
  public.reglas_de_gastos()
  from public, anon, authenticated;
revoke all on function public.cierres_guardar(jsonb) from public, anon;
revoke all on function public.cierres_fondo_sugerido(date) from public, anon;
revoke all on function public.es_caja_activa() from public, anon;
grant execute on function public.cierres_guardar(jsonb) to authenticated;
grant execute on function public.cierres_fondo_sugerido(date) to authenticated;
grant execute on function public.es_caja_activa() to authenticated;

-- Permisos

alter table public.cierres_de_caja enable row level security;
alter table public.retiros_de_caja enable row level security;
alter table public.configuracion_de_caja enable row level security;

revoke all on table public.cierres_de_caja, public.retiros_de_caja, public.configuracion_de_caja
  from anon, authenticated;
grant select on table public.cierres_de_caja, public.retiros_de_caja, public.configuracion_de_caja
  to authenticated;
grant update (revisado, comentario_revision, anulado, motivo_anulacion)
  on table public.cierres_de_caja to authenticated;
grant update (tolerancia_centavos) on table public.configuracion_de_caja to authenticated;

drop policy if exists "cierres_de_caja: el admin ve los de su local y caja los suyos" on public.cierres_de_caja;
create policy "cierres_de_caja: el admin ve los de su local y caja los suyos" on public.cierres_de_caja
  for select to authenticated
  using (
    ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
    or (cargado_por = (select auth.uid()) and (select public.es_caja_activa()))
  );
drop policy if exists "cierres_de_caja: el admin activo revisa y anula los de su local" on public.cierres_de_caja;
create policy "cierres_de_caja: el admin activo revisa y anula los de su local" on public.cierres_de_caja
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Los retiros se ven si se ve su cierre.
drop policy if exists "retiros_de_caja: se ven con su cierre" on public.retiros_de_caja;
create policy "retiros_de_caja: se ven con su cierre" on public.retiros_de_caja
  for select to authenticated
  using (exists (select 1 from public.cierres_de_caja c where c.id = cierre_id));

drop policy if exists "configuracion_de_caja: el admin activo ve la de su local" on public.configuracion_de_caja;
create policy "configuracion_de_caja: el admin activo ve la de su local" on public.configuracion_de_caja
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "configuracion_de_caja: el admin activo la cambia" on public.configuracion_de_caja;
create policy "configuracion_de_caja: el admin activo la cambia" on public.configuracion_de_caja
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- La tolerancia de arranque, $500, en cada local.
insert into public.configuracion_de_caja (local_id)
select l.id from public.locales l
on conflict (local_id) do nothing;
