-- Gastos: lo que sale, con sus categorias y las plantillas de los recurrentes. El admin activo
-- lee, carga y cambia lo de su local; el local sale de la sesion y nadie borra: un gasto se
-- anula con motivo. Las reglas que no se pueden saltear viven en los triggers.

do $$
begin
  create type public.medio_de_pago as enum ('efectivo_caja', 'transferencia', 'tarjeta', 'otro');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.frecuencia_de_gasto as enum ('mensual', 'bimestral', 'anual');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.categorias_de_gasto (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  nombre text not null check (char_length(nombre) between 1 and 60),
  pide_proveedor boolean not null default false,
  -- Sin clasificar: la usan los gastos que llegan de un cierre. No se elige ni se toca a mano.
  de_sistema boolean not null default false,
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create unique index if not exists categorias_de_gasto_nombre
  on public.categorias_de_gasto (local_id, lower(nombre));

create table if not exists public.gastos_recurrentes (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  categoria_id uuid not null references public.categorias_de_gasto (id),
  monto_centavos bigint not null check (monto_centavos > 0),
  descripcion text check (descripcion is null or char_length(descripcion) between 1 and 200),
  proveedor_id uuid references public.proveedores (id),
  medio_de_pago public.medio_de_pago not null,
  frecuencia public.frecuencia_de_gasto not null,
  -- Se repite cada 1, 2 o 12 meses desde aca, el mismo dia (o el ultimo del mes).
  primer_vencimiento date not null,
  activo boolean not null default true,
  creado_por uuid references public.perfiles (id) on delete set null default auth.uid(),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists gastos_recurrentes_local on public.gastos_recurrentes (local_id);

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  -- El dia en Argentina: define a que mes cuenta.
  fecha date not null,
  categoria_id uuid not null references public.categorias_de_gasto (id),
  monto_centavos bigint not null check (monto_centavos > 0),
  descripcion text check (descripcion is null or char_length(descripcion) between 1 and 200),
  proveedor_id uuid references public.proveedores (id),
  medio_de_pago public.medio_de_pago not null,
  comprobante text check (comprobante is null or char_length(comprobante) between 1 and 60),
  recurrente_id uuid references public.gastos_recurrentes (id),
  vencimiento date,
  anulado boolean not null default false,
  motivo_anulacion text check (motivo_anulacion is null or char_length(motivo_anulacion) <= 300),
  anulado_por uuid references public.perfiles (id) on delete set null,
  fecha_anulacion timestamptz,
  creado_por uuid references public.perfiles (id) on delete set null default auth.uid(),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  -- Un recurrente no se genera dos veces para el mismo vencimiento, aunque se haya anulado.
  constraint gastos_recurrente_vencimiento unique (recurrente_id, vencimiento)
);

create index if not exists gastos_local_fecha on public.gastos (local_id, fecha desc);
create index if not exists gastos_proveedor_fecha on public.gastos (proveedor_id, fecha);
create index if not exists gastos_categoria on public.gastos (categoria_id);

-- Reglas

create or replace function public.gastos_validar_categoria_y_proveedor(
  el_local uuid, la_categoria uuid, el_proveedor uuid, proveedor_anterior uuid
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.categorias_de_gasto c
                  where c.id = la_categoria and c.local_id = el_local and c.activo and not c.de_sistema) then
    raise exception 'Esa categoria no esta disponible' using errcode = 'PG201';
  end if;
  if el_proveedor is null and exists (select 1 from public.categorias_de_gasto c
                                       where c.id = la_categoria and c.pide_proveedor) then
    raise exception 'Esta categoria pide un proveedor' using errcode = 'PG202';
  end if;
  if el_proveedor is not null and el_proveedor is distinct from proveedor_anterior
     and not exists (select 1 from public.proveedores p
                      where p.id = el_proveedor and p.local_id = el_local and p.activo) then
    raise exception 'Ese proveedor no esta disponible' using errcode = 'PG203';
  end if;
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
  if new.anulado then
    if coalesce(trim(new.motivo_anulacion), '') = '' then
      raise exception 'Escribi el motivo de la anulacion' using errcode = 'PG205';
    end if;
    new.anulado_por := (select auth.uid());
    new.fecha_anulacion := now();
    return new;
  end if;
  -- Lo que genera un recurrente se copia de su plantilla, aunque la categoria ya no se use.
  if tg_op = 'INSERT' and new.recurrente_id is not null then
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

create or replace function public.reglas_de_recurrentes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.categoria_id = old.categoria_id
     and new.proveedor_id is not distinct from old.proveedor_id then
    return new;
  end if;
  perform public.gastos_validar_categoria_y_proveedor(new.local_id, new.categoria_id, new.proveedor_id,
    case when tg_op = 'UPDATE' then old.proveedor_id end);
  return new;
end
$$;

create or replace function public.reglas_de_categorias_de_gasto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.de_sistema and (new.nombre is distinct from old.nombre or new.activo is distinct from old.activo) then
    raise exception 'Sin clasificar no se cambia' using errcode = 'PG206';
  end if;
  return new;
end
$$;

-- Triggers

drop trigger if exists reglas on public.gastos;
create trigger reglas before insert or update on public.gastos
  for each row execute function public.reglas_de_gastos();
drop trigger if exists reglas on public.gastos_recurrentes;
create trigger reglas before insert or update on public.gastos_recurrentes
  for each row execute function public.reglas_de_recurrentes();
drop trigger if exists reglas on public.categorias_de_gasto;
create trigger reglas before update on public.categorias_de_gasto
  for each row execute function public.reglas_de_categorias_de_gasto();

drop trigger if exists marcar_actualizacion on public.gastos;
create trigger marcar_actualizacion before update on public.gastos
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.gastos_recurrentes;
create trigger marcar_actualizacion before update on public.gastos_recurrentes
  for each row execute function public.marcar_actualizacion();
drop trigger if exists marcar_actualizacion on public.categorias_de_gasto;
create trigger marcar_actualizacion before update on public.categorias_de_gasto
  for each row execute function public.marcar_actualizacion();

drop trigger if exists auditar on public.gastos;
create trigger auditar after insert or update on public.gastos
  for each row execute function public.auditar('anulado_por', 'fecha_anulacion');
drop trigger if exists auditar on public.gastos_recurrentes;
create trigger auditar after insert or update on public.gastos_recurrentes
  for each row execute function public.auditar();
drop trigger if exists auditar on public.categorias_de_gasto;
create trigger auditar after insert or update on public.categorias_de_gasto
  for each row execute function public.auditar();

revoke all on function
  public.gastos_validar_categoria_y_proveedor(uuid, uuid, uuid, uuid),
  public.reglas_de_gastos(),
  public.reglas_de_recurrentes(),
  public.reglas_de_categorias_de_gasto()
  from public, anon, authenticated;

-- Permisos

alter table public.categorias_de_gasto enable row level security;
alter table public.gastos_recurrentes enable row level security;
alter table public.gastos enable row level security;

revoke all on table public.categorias_de_gasto, public.gastos_recurrentes, public.gastos
  from anon, authenticated;
grant select on table public.categorias_de_gasto, public.gastos_recurrentes, public.gastos
  to authenticated;
grant insert (nombre, pide_proveedor) on table public.categorias_de_gasto to authenticated;
grant update (nombre, pide_proveedor, activo) on table public.categorias_de_gasto to authenticated;
grant insert (categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago, frecuencia,
              primer_vencimiento)
  on table public.gastos_recurrentes to authenticated;
grant update (categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago, frecuencia,
              primer_vencimiento, activo)
  on table public.gastos_recurrentes to authenticated;
grant insert (fecha, categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago, comprobante)
  on table public.gastos to authenticated;
grant update (fecha, categoria_id, monto_centavos, descripcion, proveedor_id, medio_de_pago, comprobante,
              anulado, motivo_anulacion)
  on table public.gastos to authenticated;

drop policy if exists "categorias_de_gasto: el admin activo ve las de su local" on public.categorias_de_gasto;
create policy "categorias_de_gasto: el admin activo ve las de su local" on public.categorias_de_gasto
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "categorias_de_gasto: el admin activo carga en su local" on public.categorias_de_gasto;
create policy "categorias_de_gasto: el admin activo carga en su local" on public.categorias_de_gasto
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "categorias_de_gasto: el admin activo cambia las de su local" on public.categorias_de_gasto;
create policy "categorias_de_gasto: el admin activo cambia las de su local" on public.categorias_de_gasto
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "gastos_recurrentes: el admin activo ve los de su local" on public.gastos_recurrentes;
create policy "gastos_recurrentes: el admin activo ve los de su local" on public.gastos_recurrentes
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos_recurrentes: el admin activo carga en su local" on public.gastos_recurrentes;
create policy "gastos_recurrentes: el admin activo carga en su local" on public.gastos_recurrentes
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos_recurrentes: el admin activo cambia los de su local" on public.gastos_recurrentes;
create policy "gastos_recurrentes: el admin activo cambia los de su local" on public.gastos_recurrentes
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

drop policy if exists "gastos: el admin activo ve los de su local" on public.gastos;
create policy "gastos: el admin activo ve los de su local" on public.gastos
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos: el admin activo carga en su local" on public.gastos;
create policy "gastos: el admin activo carga en su local" on public.gastos
  for insert to authenticated
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));
drop policy if exists "gastos: el admin activo cambia los de su local" on public.gastos;
create policy "gastos: el admin activo cambia los de su local" on public.gastos
  for update to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()))
  with check ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Las categorias de arranque, en cada local. Un local nuevo las recibe al crearse con la
-- misma consulta (cuando exista el alta de locales).
insert into public.categorias_de_gasto (local_id, nombre, pide_proveedor, de_sistema)
select l.id, c.nombre, c.pide_proveedor, c.de_sistema
  from public.locales l
 cross join (values
   ('Mercadería', true, false), ('Alquiler', false, false), ('Servicios', false, false),
   ('Sueldos', false, false), ('Impuestos', false, false), ('Mantenimiento', false, false),
   ('Otros', false, false), ('Sin clasificar', false, true)
 ) as c (nombre, pide_proveedor, de_sistema)
on conflict do nothing;
