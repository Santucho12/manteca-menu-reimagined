-- Menu (2 de 5): el bucket de las fotos de las categorias. Se lee publico (son las fotos del
-- menu); sube solo el admin activo, a la carpeta de su local. Nadie cambia ni borra: una foto
-- reemplazada queda guardada.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-del-menu', 'fotos-del-menu', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "fotos-del-menu: el admin activo sube a su local" on storage.objects;
create policy "fotos-del-menu: el admin activo sube a su local" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos-del-menu'
    and (select public.es_admin_activo())
    and (storage.foldername(name))[1] = (select public.local_del_usuario())::text
  );
