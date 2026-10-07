-- Usuarios y auditoria (2 de 3): las funciones de las politicas, la auditoria generica y
-- las reglas de las cuentas: primera cuenta admin, acciones anotadas por el servidor y ultimo
-- admin activo de cada local.

-- Funciones que usan las politicas

create or replace function public.local_del_usuario()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select local_id from public.perfiles where id = (select auth.uid())
$$;

create or replace function public.es_admin_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'admin' and activo
  )
$$;

create or replace function public.rol_de_cuenta_nueva(cuentas bigint)
returns public.rol_usuario
language sql
immutable
set search_path = ''
as $$
  select case
    when cuentas = 0 then 'admin'::public.rol_usuario
    else 'invitado'::public.rol_usuario
  end
$$;

-- Auditoria y fecha de actualizacion

create or replace function public.marcar_actualizacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.fecha_actualizacion := now();
  return new;
end
$$;

create or replace function public.auditar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ignoradas text[] := array_append(tg_argv, 'fecha_actualizacion');
  fila jsonb := to_jsonb(new);
  autor uuid := coalesce(
    (select auth.uid()),
    nullif(current_setting('manteca.usuario', true), '')::uuid
  );
  antes jsonb;
  despues jsonb;
  accion text;
begin
  if tg_op = 'INSERT' then
    despues := fila - ignoradas;
    accion := 'alta';
  else
    select jsonb_object_agg(n.key, o.value), jsonb_object_agg(n.key, n.value)
      into antes, despues
      from jsonb_each(fila) n
      join jsonb_each(to_jsonb(old)) o on o.key = n.key
     where n.value is distinct from o.value
       and not (n.key = any (ignoradas));
    if antes is null then
      return new;
    end if;
    accion := case
      when despues ? 'anulado' and (despues ->> 'anulado')::boolean then 'anulacion'
      when despues ? 'activo' and not (despues ->> 'activo')::boolean then 'desactivacion'
      when despues ? 'activo' then 'reactivacion'
      else 'cambio'
    end;
  end if;
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion, antes, despues, motivo)
  values (
    coalesce(fila ->> 'local_id', case when tg_table_name = 'locales' then fila ->> 'id' end)::uuid,
    autor,
    tg_table_name,
    fila ->> 'id',
    accion,
    antes,
    despues,
    case when accion = 'anulacion' then fila ->> 'motivo_anulacion' end
  );
  return new;
end
$$;

-- Cuentas de Supabase Auth

create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cuentas bigint;
begin
  -- Serializa las altas: dos cuentas nuevas a la vez no pueden quedar las dos como admin.
  perform pg_advisory_xact_lock(hashtext('manteca.crear_perfil'));
  select count(*) into cuentas from public.perfiles;
  -- Quien se registra es el autor de su propia alta.
  perform set_config('manteca.usuario', new.id::text, true);
  insert into public.perfiles (id, local_id, nombre, email, rol)
  values (
    new.id,
    (select id from public.locales order by fecha_creacion, id limit 1),
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)), 100),
    lower(new.email),
    public.rol_de_cuenta_nueva(cuentas)
  );
  perform set_config('manteca.usuario', '', true);
  return new;
end
$$;

create or replace function public.usar_accion(cuenta uuid, tipos text[], out tipo text, out por uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Vale una sola vez y solo si es reciente: una que quedo sin usar no habilita cambios despues.
  update public.acciones_de_cuenta a
     set fecha_uso = now()
   where a.id = (
     select b.id from public.acciones_de_cuenta b
      where b.cuenta_id = cuenta
        and b.tipo = any (tipos)
        and b.fecha_uso is null
        and b.fecha_creacion > now() - interval '10 minutes'
      order by b.fecha_creacion desc
      limit 1
      for update skip locked
   )
  returning a.tipo, a.por into tipo, por;
end
$$;

create or replace function public.registrar_cambio_de_contrasena(cuenta uuid, tipo text, por uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  es_reseteo boolean := coalesce(tipo = 'reseteo', false);
  -- Sin accion anotada la cambio la propia persona. La siembra queda a nombre del sistema.
  autor uuid := case when tipo is null then cuenta else por end;
begin
  update public.perfiles set debe_cambiar_contrasena = es_reseteo where id = cuenta;
  insert into public.auditoria (local_id, usuario_id, tabla, registro_id, accion)
  select p.local_id, autor, 'perfiles', cuenta::text,
         case when es_reseteo then 'reseteo_de_contrasena' else 'cambio_de_contrasena' end
    from public.perfiles p
   where p.id = cuenta;
end
$$;

create or replace function public.sincronizar_cuenta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  usada record;
begin
  if new.email is distinct from old.email then
    select * into usada from public.usar_accion(new.id, array['correccion']);
    if usada.tipo is null then
      raise exception 'El email de una cuenta lo cambia un administrador' using errcode = 'PM003';
    end if;
    perform set_config('manteca.usuario', coalesce(usada.por::text, ''), true);
    update public.perfiles set email = lower(new.email) where id = new.id;
  end if;
  -- Sin contrasena anterior no es un cambio: es la primera que se pone.
  if new.encrypted_password is distinct from old.encrypted_password
     and coalesce(old.encrypted_password, '') <> '' then
    select * into usada from public.usar_accion(new.id, array['reseteo', 'siembra']);
    perform public.registrar_cambio_de_contrasena(new.id, usada.tipo, usada.por);
  end if;
  perform set_config('manteca.usuario', '', true);
  return new;
end
$$;

-- Reglas de los perfiles

create or replace function public.reglas_de_perfiles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  otros_admins bigint;
begin
  if (select auth.uid()) = new.id
     and (new.rol is distinct from old.rol or new.activo is distinct from old.activo) then
    raise exception 'No podes cambiar tu propio rol ni desactivarte' using errcode = 'PM001';
  end if;
  if old.rol = 'admin' and old.activo and not (new.rol = 'admin' and new.activo) then
    -- Un bloqueo por local: dos admins que se bajan a la vez no lo dejan sin ninguno.
    perform pg_advisory_xact_lock(hashtext('manteca.admins'), hashtext(old.local_id::text));
    select count(*) into otros_admins
      from public.perfiles
     where local_id = old.local_id and rol = 'admin' and activo and id <> old.id;
    if otros_admins = 0 then
      raise exception 'Tiene que quedar al menos un administrador activo' using errcode = 'PM002';
    end if;
  end if;
  return new;
end
$$;
