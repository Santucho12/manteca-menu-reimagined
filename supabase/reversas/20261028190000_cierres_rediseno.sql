-- Reversa de 20261028190000_cierres_rediseno: vuelven las columnas (vacias) y el tipo de estado.
-- Los estados y lo revisado que se tenia no se recuperan.

drop function if exists public.cierres_editar(uuid, jsonb);
drop function if exists public.cierres_con_resultado(date, date, uuid);

do $$
begin
  create type public.estado_de_cierre as enum
    ('esperando_ventas', 'cierra', 'con_diferencia', 'revisado', 'anulado');
exception
  when duplicate_object then null;
end
$$;

alter table public.cierres_de_caja
  add column if not exists estado public.estado_de_cierre not null default 'esperando_ventas',
  add column if not exists esperado_efectivo_centavos bigint,
  add column if not exists esperado_credito_centavos bigint,
  add column if not exists esperado_debito_centavos bigint,
  add column if not exists esperado_qr_centavos bigint,
  add column if not exists esperado_transferencia_centavos bigint,
  add column if not exists revisado boolean not null default false,
  add column if not exists revisado_por uuid references public.perfiles (id) on delete set null,
  add column if not exists fecha_revision timestamptz,
  add column if not exists comentario_revision text
    check (comentario_revision is null or char_length(comentario_revision) <= 500);

update public.cierres_de_caja set estado = 'anulado' where anulado;

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

drop trigger if exists auditar on public.cierres_de_caja;
create trigger auditar after insert or update on public.cierres_de_caja
  for each row execute function public.auditar('anulado_por', 'fecha_anulacion', 'revisado_por', 'fecha_revision', 'estado');

revoke update on table public.cierres_de_caja from authenticated;
grant update (revisado, comentario_revision, anulado, motivo_anulacion)
  on table public.cierres_de_caja to authenticated;
