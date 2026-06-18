-- ============================================================
-- Bucket de Storage para la galería del panel admin.
-- Ejecutar UNA SOLA VEZ en: Supabase Dashboard → SQL Editor → Run.
--
-- Hace 3 cosas:
--   0. Agrega la columna `storage_path` a `ncg_galeria` (para
--      poder borrar el archivo del bucket al eliminar la fila).
--   1. Crea el bucket público `galeria-ncg`.
--   2. Define policies:
--        - Cualquiera puede LEER (para que la web pública vea las fotos).
--        - Solo usuarios autenticados pueden INSERTAR / ACTUALIZAR / BORRAR.
-- ============================================================

-- 0. Columna nueva en la tabla
alter table public.ncg_galeria
  add column if not exists storage_path text;

-- 1. Bucket público
insert into storage.buckets (id, name, public)
values ('galeria-ncg', 'galeria-ncg', true)
on conflict (id) do update set public = excluded.public;

-- 2. Policies (drop + create para que sea re-ejecutable)
drop policy if exists "galeria-ncg public read"   on storage.objects;
drop policy if exists "galeria-ncg auth insert"   on storage.objects;
drop policy if exists "galeria-ncg auth update"   on storage.objects;
drop policy if exists "galeria-ncg auth delete"   on storage.objects;

create policy "galeria-ncg public read"
  on storage.objects for select
  using (bucket_id = 'galeria-ncg');

create policy "galeria-ncg auth insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'galeria-ncg');

create policy "galeria-ncg auth update"
  on storage.objects for update to authenticated
  using (bucket_id = 'galeria-ncg')
  with check (bucket_id = 'galeria-ncg');

create policy "galeria-ncg auth delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'galeria-ncg');
