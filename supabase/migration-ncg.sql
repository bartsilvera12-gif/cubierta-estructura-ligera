-- ============================================================
-- NCG · Esquema definitivo (en public con prefijo ncg_)
-- Pegar entero en SQL Editor → Run. Idempotente.
-- No interfiere con otras apps del mismo proyecto.
-- ============================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------
-- Trigger updated_at
-- ----------------------------------------------------------------
create or replace function public.ncg_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ============================================================
-- TABLAS
-- ============================================================

create table if not exists public.ncg_stores (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  slug        text unique not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_ncg_stores_touch on public.ncg_stores;
create trigger trg_ncg_stores_touch before update on public.ncg_stores
  for each row execute function public.ncg_touch_updated_at();

insert into public.ncg_stores (nombre, slug)
values ('Constructora NCG','constructora-ncg')
on conflict (slug) do nothing;

create table if not exists public.ncg_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  store_id    uuid not null references public.ncg_stores(id),
  email       text,
  role        text not null default 'admin',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_ncg_profiles_touch on public.ncg_profiles;
create trigger trg_ncg_profiles_touch before update on public.ncg_profiles
  for each row execute function public.ncg_touch_updated_at();

create or replace function public.ncg_current_store_id()
returns uuid language sql stable security definer set search_path = public as $$
  select store_id from public.ncg_profiles where id = auth.uid()
$$;

create table if not exists public.ncg_servicios (
  id              uuid primary key default gen_random_uuid(),
  store_id        uuid not null references public.ncg_stores(id),
  titulo          text not null,
  slug            text unique not null,
  descripcion     text,
  contenido_largo text,
  icono           text,
  imagen_url      text,
  orden           int  not null default 0,
  destacado       boolean not null default false,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists ncg_servicios_store_idx  on public.ncg_servicios(store_id);
create index if not exists ncg_servicios_orden_idx  on public.ncg_servicios(orden);
drop trigger if exists trg_ncg_servicios_touch on public.ncg_servicios;
create trigger trg_ncg_servicios_touch before update on public.ncg_servicios
  for each row execute function public.ncg_touch_updated_at();

create table if not exists public.ncg_trabajos (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid not null references public.ncg_stores(id),
  titulo               text not null,
  slug                 text unique not null,
  descripcion          text,
  ubicacion            text,
  tipo_trabajo         text,
  fecha_trabajo        date,
  imagen_principal_url text,
  antes_url            text,
  despues_url          text,
  destacado            boolean not null default false,
  activo               boolean not null default true,
  orden                int     not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists ncg_trabajos_store_idx on public.ncg_trabajos(store_id);
create index if not exists ncg_trabajos_tipo_idx  on public.ncg_trabajos(tipo_trabajo);
drop trigger if exists trg_ncg_trabajos_touch on public.ncg_trabajos;
create trigger trg_ncg_trabajos_touch before update on public.ncg_trabajos
  for each row execute function public.ncg_touch_updated_at();

create table if not exists public.ncg_galeria (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.ncg_stores(id),
  titulo       text,
  descripcion  text,
  imagen_url   text not null,
  categoria    text,
  trabajo_id   uuid references public.ncg_trabajos(id) on delete set null,
  orden        int  not null default 0,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists ncg_galeria_store_idx     on public.ncg_galeria(store_id);
create index if not exists ncg_galeria_categoria_idx on public.ncg_galeria(categoria);
drop trigger if exists trg_ncg_galeria_touch on public.ncg_galeria;
create trigger trg_ncg_galeria_touch before update on public.ncg_galeria
  for each row execute function public.ncg_touch_updated_at();

create table if not exists public.ncg_mensajes_contacto (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.ncg_stores(id),
  nombre              text not null,
  telefono            text,
  email               text,
  servicio_requerido  text,
  zona_ciudad         text,
  mensaje             text,
  estado              text not null default 'nuevo',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint ncg_mensajes_estado_chk check (estado in
    ('nuevo','contactado','presupuesto_enviado','cerrado','descartado'))
);
create index if not exists ncg_mensajes_store_idx   on public.ncg_mensajes_contacto(store_id);
create index if not exists ncg_mensajes_estado_idx  on public.ncg_mensajes_contacto(estado);
create index if not exists ncg_mensajes_created_idx on public.ncg_mensajes_contacto(created_at desc);
drop trigger if exists trg_ncg_mensajes_touch on public.ncg_mensajes_contacto;
create trigger trg_ncg_mensajes_touch before update on public.ncg_mensajes_contacto
  for each row execute function public.ncg_touch_updated_at();

create table if not exists public.ncg_configuracion (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.ncg_stores(id),
  clave       text not null,
  valor       text,
  tipo        text not null default 'text',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (store_id, clave)
);
drop trigger if exists trg_ncg_config_touch on public.ncg_configuracion;
create trigger trg_ncg_config_touch before update on public.ncg_configuracion
  for each row execute function public.ncg_touch_updated_at();

-- ============================================================
-- RLS
-- ============================================================

alter table public.ncg_stores            enable row level security;
alter table public.ncg_profiles          enable row level security;
alter table public.ncg_servicios         enable row level security;
alter table public.ncg_trabajos          enable row level security;
alter table public.ncg_galeria           enable row level security;
alter table public.ncg_mensajes_contacto enable row level security;
alter table public.ncg_configuracion     enable row level security;

drop policy if exists ncg_stores_select on public.ncg_stores;
create policy ncg_stores_select on public.ncg_stores
  for select to authenticated using (id = public.ncg_current_store_id());

drop policy if exists ncg_profiles_select on public.ncg_profiles;
create policy ncg_profiles_select on public.ncg_profiles
  for select to authenticated using (id = auth.uid());
drop policy if exists ncg_profiles_update on public.ncg_profiles;
create policy ncg_profiles_update on public.ncg_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists ncg_servicios_select_pub on public.ncg_servicios;
create policy ncg_servicios_select_pub on public.ncg_servicios
  for select to anon using (activo = true);
drop policy if exists ncg_servicios_all on public.ncg_servicios;
create policy ncg_servicios_all on public.ncg_servicios
  for all to authenticated
  using (store_id = public.ncg_current_store_id())
  with check (store_id = public.ncg_current_store_id());

drop policy if exists ncg_trabajos_select_pub on public.ncg_trabajos;
create policy ncg_trabajos_select_pub on public.ncg_trabajos
  for select to anon using (activo = true);
drop policy if exists ncg_trabajos_all on public.ncg_trabajos;
create policy ncg_trabajos_all on public.ncg_trabajos
  for all to authenticated
  using (store_id = public.ncg_current_store_id())
  with check (store_id = public.ncg_current_store_id());

drop policy if exists ncg_galeria_select_pub on public.ncg_galeria;
create policy ncg_galeria_select_pub on public.ncg_galeria
  for select to anon using (activo = true);
drop policy if exists ncg_galeria_all on public.ncg_galeria;
create policy ncg_galeria_all on public.ncg_galeria
  for all to authenticated
  using (store_id = public.ncg_current_store_id())
  with check (store_id = public.ncg_current_store_id());

drop policy if exists ncg_mensajes_insert_pub on public.ncg_mensajes_contacto;
create policy ncg_mensajes_insert_pub on public.ncg_mensajes_contacto
  for insert to anon with check (true);
drop policy if exists ncg_mensajes_all on public.ncg_mensajes_contacto;
create policy ncg_mensajes_all on public.ncg_mensajes_contacto
  for all to authenticated
  using (store_id = public.ncg_current_store_id())
  with check (store_id = public.ncg_current_store_id());

drop policy if exists ncg_config_select_pub on public.ncg_configuracion;
create policy ncg_config_select_pub on public.ncg_configuracion
  for select to anon using (true);
drop policy if exists ncg_config_all on public.ncg_configuracion;
create policy ncg_config_all on public.ncg_configuracion
  for all to authenticated
  using (store_id = public.ncg_current_store_id())
  with check (store_id = public.ncg_current_store_id());

-- ============================================================
-- SEEDS
-- ============================================================

with s as (select id from public.ncg_stores where slug = 'constructora-ncg' limit 1)
insert into public.ncg_configuracion (store_id, clave, valor, tipo)
select s.id, x.clave, x.valor, x.tipo
from s, (values
  ('empresa_nombre',       'Constructora NCG',                                                             'text'),
  ('empresa_descripcion',  'Especialistas en cubiertas y tejados.',                                        'text'),
  ('telefono_whatsapp',    '34638769281',                                                                  'phone'),
  ('email_contacto',       'Ncgtrans@gmail.com',                                                           'email'),
  ('direccion',            '',                                                                             'text'),
  ('ciudad',               '',                                                                             'text'),
  ('instagram_url',        '',                                                                             'url'),
  ('facebook_url',         '',                                                                             'url'),
  ('logo_url',             '/assets/logo-banner.jpg',                                                      'text'),
  ('hero_titulo',          'Tejados y cubiertas que duran décadas',                                        'text'),
  ('hero_subtitulo',       'Reparación, rehabilitación y mantenimiento. Materiales de primera calidad.',   'text'),
  ('texto_confianza',      'Técnicos certificados · Garantía en mano de obra y materiales',                'text'),
  ('garantia_mano_obra',   '10',                                                                           'number'),
  ('garantia_materiales',  '20',                                                                           'number')
) as x(clave, valor, tipo)
on conflict (store_id, clave) do nothing;

with s as (select id from public.ncg_stores where slug = 'constructora-ncg' limit 1)
insert into public.ncg_servicios (store_id, titulo, slug, descripcion, orden, destacado, activo)
select s.id, x.titulo, x.slug, x.descripcion, x.orden, false, true
from s, (values
  ('Reparación y mantenimiento de tejados',  'reparacion-mantenimiento-tejados', 'Reparación, rehabilitación y mantenimiento integral de tejados y cubiertas.', 1),
  ('Retejados y sustitución de tejas',       'retejados-sustitucion-tejas',      'Retejados completos y sustitución de tejas dañadas o envejecidas.', 2),
  ('Especialistas en tejas curvas',          'tejas-curvas',                     'Colocación experta de teja curva tradicional con acabado duradero.', 3),
  ('Impermeabilización y aislamiento',       'impermeabilizacion-aislamiento',   'Impermeabilización avanzada y aislamientos con tecnología de última generación.', 4),
  ('Sistemas ventilados en cubiertas',       'sistemas-ventilados',              'Instalación de cubiertas ventiladas para mejorar el rendimiento térmico.', 5),
  ('Paneles sándwich grecados',              'paneles-sandwich',                 'Cubiertas con panel sándwich grecado, ligeras, aislantes y resistentes.', 6),
  ('Canalones y bajantes',                   'canalones-bajantes',               'Colocación de canalones e instalación de bajantes para una evacuación perfecta.', 7),
  ('Ventanas y claraboyas Velux',            'ventanas-claraboyas-velux',        'Instalación de ventanas de tejado y claraboyas tipo Velux con garantía de estanqueidad.', 8),
  ('Cubiertas ligeras',                      'cubiertas-ligeras',                'Especialistas en cubiertas ligeras: solución eficiente para naves y viviendas.', 9),
  ('Cálculo y montaje de cubiertas',         'calculo-montaje-cubiertas',        'Montaje y cálculo estructural de cubiertas adaptado a cada proyecto.', 10),
  ('Cubiertas de madera · GL24',             'cubiertas-madera-gl24',            'Rehabilitación de cubiertas de madera, laminado GL24 y madera antigua.', 11),
  ('Accesorios certificados',                'accesorios-certificados',          'Montaje de accesorios para cubiertas con certificación y máxima seguridad.', 12)
) as x(titulo, slug, descripcion, orden)
on conflict (slug) do nothing;

-- ============================================================
-- VINCULAR usuario test@ncg.local al store (si ya existe en auth.users)
-- ============================================================
insert into public.ncg_profiles (id, store_id, email, role)
select u.id,
       (select id from public.ncg_stores where slug = 'constructora-ncg' limit 1),
       u.email,
       'admin'
from auth.users u
where u.email = 'test@ncg.local'
on conflict (id) do update
  set store_id   = excluded.store_id,
      email      = excluded.email,
      role       = excluded.role,
      updated_at = now();
