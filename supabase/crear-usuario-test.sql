-- ============================================================
-- Usuario de prueba para el panel admin
-- Ejecutar DESPUÉS de migration.sql.
-- Pegar entero en: Supabase Dashboard → SQL Editor → New query → Run.
--
-- Credenciales que se crean:
--   email:    test@ncg.local
--   password: Test1234!
--
-- Puedes cambiar el email/password editando las dos variables de abajo
-- antes de ejecutar. Si vuelves a ejecutar con el mismo email, se
-- actualiza la contraseña y se reasegura el vínculo con la tienda.
-- ============================================================

do $$
declare
  v_email     text := 'test@ncg.local';
  v_password  text := 'Test1234!';
  v_user_id   uuid;
  v_store_id  uuid;
begin
  -- 1. Localizar el store de Constructora NCG (lo creó migration.sql).
  select id into v_store_id
  from public.stores
  where slug = 'constructora-ncg'
  limit 1;

  if v_store_id is null then
    raise exception 'No se encontró el store "constructora-ncg". Ejecuta primero migration.sql.';
  end if;

  -- 2. Crear o actualizar el usuario en auth.users.
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      jsonb_build_object('provider','email','providers', jsonb_build_array('email')),
      '{}'::jsonb,
      now(), now(),
      '', '', '', ''
    );

    -- Identidad asociada (necesaria para login email/password).
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  else
    -- Si ya existía: actualiza la contraseña y reafirma email confirmado.
    update auth.users
       set encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at         = now()
     where id = v_user_id;
  end if;

  -- 3. Vincular el perfil al store.
  insert into public.profiles (id, store_id, email, role)
  values (v_user_id, v_store_id, v_email, 'admin')
  on conflict (id) do update
    set store_id = excluded.store_id,
        email    = excluded.email,
        role     = excluded.role,
        updated_at = now();

  raise notice 'OK · Usuario test creado/actualizado: % (id=%)', v_email, v_user_id;
end $$;

-- Verificación: debería devolver 1 fila con el email y el store.
select u.email,
       p.role,
       s.nombre as store,
       u.email_confirmed_at is not null as confirmado
from auth.users u
join public.profiles p on p.id = u.id
join public.stores   s on s.id = p.store_id
where u.email = 'test@ncg.local';
