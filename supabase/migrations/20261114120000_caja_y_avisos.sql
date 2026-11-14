-- Caja y avisos (pedido 85): Caja deja de editar su cierre (lo corrige el admin) y el admin puede
-- marcar un dia sin cierre como que el local no abrio, para que deje de figurar pendiente.
-- No borra ni reescribe datos.

-- Editar un cierre pasa a ser solo del admin activo del local del cierre: Caja podia acomodar
-- lo declarado despues de ver la diferencia.
create or replace function public.cierres_editar(el_id uuid, datos jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_cierre public.cierres_de_caja;
  retiros_viejos jsonb;
  retiros_nuevos jsonb := coalesce(datos -> 'retiros', '[]');
begin
  select * into el_cierre from public.cierres_de_caja where id = el_id;
  if not found or not (public.es_admin_activo() and el_cierre.local_id = public.local_del_usuario()) then
    raise exception 'No tenes permiso para editar este cierre' using errcode = '42501';
  end if;
  if el_cierre.anulado then
    raise exception 'Un cierre anulado no se cambia' using errcode = 'PC303';
  end if;
  update public.cierres_de_caja set
    fondo_inicial_centavos = (datos ->> 'fondo_inicial_centavos')::bigint,
    efectivo_centavos = (datos ->> 'efectivo_centavos')::bigint,
    credito_centavos = coalesce((datos ->> 'credito_centavos')::bigint, 0),
    debito_centavos = coalesce((datos ->> 'debito_centavos')::bigint, 0),
    qr_centavos = coalesce((datos ->> 'qr_centavos')::bigint, 0),
    transferencia_centavos = coalesce((datos ->> 'transferencia_centavos')::bigint, 0),
    queda_en_caja_centavos = (datos ->> 'queda_en_caja_centavos')::bigint,
    comentario = nullif(trim(datos ->> 'comentario'), '')
  where id = el_id;
  select coalesce(jsonb_agg(jsonb_build_object('monto_centavos', monto_centavos, 'quien', quien)), '[]')
    into retiros_viejos from public.retiros_de_caja where cierre_id = el_id;
  delete from public.retiros_de_caja where cierre_id = el_id;
  insert into public.retiros_de_caja (local_id, cierre_id, monto_centavos, quien)
  select el_cierre.local_id, el_id, (r ->> 'monto_centavos')::bigint, trim(r ->> 'quien')
    from jsonb_array_elements(retiros_nuevos) r;
  if retiros_viejos is distinct from retiros_nuevos then
    insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes, despues)
    values (el_cierre.local_id, (select auth.uid()), 'cierres_de_caja', el_id::text, 'cambio',
            jsonb_build_object('retiros', retiros_viejos), jsonb_build_object('retiros', retiros_nuevos));
  end if;
  perform set_config('manteca.anulando_cierre', 'si', true);
  update public.gastos set anulado = true, motivo_anulacion = 'Se edito el cierre de caja'
   where cierre_id = el_id and not anulado;
  perform set_config('manteca.anulando_cierre', '', true);
  insert into public.gastos (local_id, fecha, categoria_id, monto_centavos, descripcion, medio_de_pago, cierre_id)
  select el_cierre.local_id, el_cierre.fecha, c.id, (g ->> 'monto_centavos')::bigint, trim(g ->> 'descripcion'),
         'efectivo_caja', el_id
    from jsonb_array_elements(coalesce(datos -> 'gastos', '[]')) g
   cross join public.categorias_de_gasto c
   where c.local_id = el_cierre.local_id and c.de_sistema;
end
$$;

-- Los dias que el local no abrio: sin esta marca, un dia sin cierre queda pendiente para siempre.
-- No se borra: se desactiva, y volver a marcar lo reactiva.
create table if not exists public.dias_sin_abrir (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null default public.local_del_usuario() references public.locales (id),
  -- El dia en Argentina en que el local no abrio.
  fecha date not null,
  activo boolean not null default true,
  marcado_por uuid not null default auth.uid() references public.perfiles (id),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  -- Una marca por dia y por local; su indice sirve tambien para buscar por local y fecha.
  unique (local_id, fecha)
);

drop trigger if exists marcar_actualizacion on public.dias_sin_abrir;
create trigger marcar_actualizacion before update on public.dias_sin_abrir
  for each row execute function public.marcar_actualizacion();

drop trigger if exists auditar on public.dias_sin_abrir;
create trigger auditar after insert or update on public.dias_sin_abrir
  for each row execute function public.auditar();

-- Se lee con la sesion del admin y se escribe solo con cierres_marcar_sin_abrir.
alter table public.dias_sin_abrir enable row level security;
revoke all on table public.dias_sin_abrir from anon, authenticated;
grant select on table public.dias_sin_abrir to authenticated;

drop policy if exists "dias sin abrir: el admin activo ve los de su local" on public.dias_sin_abrir;
create policy "dias sin abrir: el admin activo ve los de su local" on public.dias_sin_abrir
  for select to authenticated
  using ((select public.es_admin_activo()) and local_id = (select public.local_del_usuario()));

-- Marca un dia como que el local no abrio, o deshace la marca. Solo el admin activo, en su local.
create or replace function public.cierres_marcar_sin_abrir(la_fecha date, marcar boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  el_local uuid := public.local_del_usuario();
begin
  if not public.es_admin_activo() then
    raise exception 'No tenes permiso para marcar los dias sin abrir' using errcode = '42501';
  end if;
  if not marcar then
    update public.dias_sin_abrir set activo = false
     where local_id = el_local and fecha = la_fecha and activo;
    return;
  end if;
  if la_fecha > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    raise exception 'Ese dia todavia no llego' using errcode = 'PC308';
  end if;
  if exists (select 1 from public.cierres_de_caja c
              where c.local_id = el_local and c.fecha = la_fecha and not c.anulado) then
    raise exception 'Ese dia tiene un cierre cargado' using errcode = 'PC307';
  end if;
  insert into public.dias_sin_abrir (local_id, fecha, marcado_por)
  values (el_local, la_fecha, (select auth.uid()))
  on conflict (local_id, fecha) do update set activo = true, marcado_por = excluded.marcado_por;
end
$$;

-- Si se carga el cierre de un dia marcado, el local abrio: la marca se desactiva sola.
create or replace function public.cierres_desmarcar_sin_abrir()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.dias_sin_abrir set activo = false
   where local_id = new.local_id and fecha = new.fecha and activo;
  return new;
end
$$;

drop trigger if exists desmarcar_sin_abrir on public.cierres_de_caja;
create trigger desmarcar_sin_abrir after insert on public.cierres_de_caja
  for each row execute function public.cierres_desmarcar_sin_abrir();

revoke all on function public.cierres_marcar_sin_abrir(date, boolean) from public, anon;
grant execute on function public.cierres_marcar_sin_abrir(date, boolean) to authenticated;
revoke all on function public.cierres_desmarcar_sin_abrir() from public, anon, authenticated;
