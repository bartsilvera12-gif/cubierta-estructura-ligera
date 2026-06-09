-- ============================================================
-- Vincular el primer usuario admin a su perfil + store.
-- Ejecutar DESPUÉS de:
--   1) Haber corrido migration.sql
--   2) Haber creado el usuario en Authentication → Users → Add user
--      (Add user → "Create new user" → email + password → Auto-confirm)
--
-- Pasos:
--   - Cambia <TU_EMAIL_AQUI> por el email exacto del usuario que acabas
--     de crear en el panel de Authentication.
--   - Ejecuta la consulta.
-- ============================================================

insert into public.profiles (id, store_id, email, role)
select
  u.id,
  (select id from public.stores where slug = 'constructora-ncg' limit 1),
  u.email,
  'admin'
from auth.users u
where u.email = '<TU_EMAIL_AQUI>'
on conflict (id) do update
  set email   = excluded.email,
      role    = excluded.role,
      updated_at = now();

-- Verificación rápida (debería devolver 1 fila):
select p.id, p.email, p.role, s.nombre as store
from public.profiles p
join public.stores s on s.id = p.store_id
where p.email = '<TU_EMAIL_AQUI>';
