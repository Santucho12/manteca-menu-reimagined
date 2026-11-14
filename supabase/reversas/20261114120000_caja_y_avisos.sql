-- Reversa del pedido 85. Borra la tabla de los dias sin abrir (se pierden las marcas; su
-- auditoria queda) y devuelve a Caja la edicion de sus propios cierres.

drop trigger if exists desmarcar_sin_abrir on public.cierres_de_caja;
drop function if exists public.cierres_desmarcar_sin_abrir();
drop function if exists public.cierres_marcar_sin_abrir(date, boolean);
drop table if exists public.dias_sin_abrir;

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
  perform public.cierres_exigir_quien_carga();
  select * into el_cierre from public.cierres_de_caja where id = el_id;
  if not found or not ((public.es_admin_activo() and el_cierre.local_id = public.local_del_usuario())
                       or (el_cierre.cargado_por = (select auth.uid()) and public.es_caja_activa())) then
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
