-- ============================================================
-- Columnas storage_path para servicios y trabajos.
-- Ejecutar UNA SOLA VEZ después de `storage-galeria.sql`.
-- (El bucket `galeria-ncg` y sus policies se reutilizan.)
-- ============================================================

alter table public.ncg_servicios
  add column if not exists imagen_storage_path text;

alter table public.ncg_trabajos
  add column if not exists imagen_principal_storage_path text,
  add column if not exists antes_storage_path            text,
  add column if not exists despues_storage_path          text;
