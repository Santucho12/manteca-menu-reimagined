-- Reversa de menu (2 de 5). Saca la policy. El bucket se borra a mano desde Supabase si hace
-- falta: Storage no deja borrarlo por SQL con fotos adentro.
drop policy if exists "fotos-del-menu: el admin activo sube a su local" on storage.objects;
