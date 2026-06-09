-- ============================================================
-- NCG · Cubierta Estructura Ligera — Migración inicial
-- Pegar entero en: Supabase Dashboard → SQL Editor → New query → Run
-- Idempotente: se puede re-ejecutar; usa "if not exists" donde aplica.
-- ============================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- Trigger genérico para updated_at
-- ----------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- TABLAS
-- ============================================================

-- ---------- stores ----------
create table if not exists public.stores (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  slug        text unique not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_stores_touch on public.stores;
create trigger trg_stores_touch before update on public.stores
  for each row execute function public.touch_updated_at();

insert into public.stores (nombre, slug)
values ('Constructora NCG', 'constructora-ncg')
on conflict (slug) do nothing;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  store_id    uuid not null references public.stores(id),
  email       text,
  role        text not null default 'admin',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Helper SECURITY DEFINER para usar en RLS sin recursión
create or replace function public.current_store_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select store_id from public.profiles where id = auth.uid()
$$;

-- ---------- servicios ----------
create table if not exists public.servicios (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores(id),
  titulo           text not null,
  slug             text unique not null,
  descripcion      text,
  contenido_largo  text,
  icono            text,
  imagen_url       text,
  orden            int  not null default 0,
  destacado        boolean not null default false,
  activo           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists servicios_store_idx  on public.servicios(store_id);
create index if not exists servicios_orden_idx  on public.servicios(orden);
create index if not exists servicios_activo_idx on public.servicios(activo) where activo = true;
drop trigger if exists trg_servicios_touch on public.servicios;
create trigger trg_servicios_touch before update on public.servicios
  for each row execute function public.touch_updated_at();

-- ---------- trabajos ----------
create table if not exists public.trabajos (
  id                    uuid primary key default gen_random_uuid(),
  store_id              uuid not null references public.stores(id),
  titulo                text not null,
  slug                  text unique not null,
  descripcion           text,
  ubicacion             text,
  tipo_trabajo          text,
  fecha_trabajo         date,
  imagen_principal_url  text,
  antes_url             text,
  despues_url           text,
  destacado             boolean not null default false,
  activo                boolean not null default true,
  orden                 int     not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists trabajos_store_idx     on public.trabajos(store_id);
create index if not exists trabajos_activo_idx    on public.trabajos(activo) where activo = true;
create index if not exists trabajos_destacado_idx on public.trabajos(destacado) where destacado = true;
create index if not exists trabajos_tipo_idx      on public.trabajos(tipo_trabajo);
drop trigger if exists trg_trabajos_touch on public.trabajos;
create trigger trg_trabajos_touch before update on public.trabajos
  for each row execute function public.touch_updated_at();

-- ---------- galeria ----------
create table if not exists public.galeria (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id),
  titulo       text,
  descripcion  text,
  imagen_url   text not null,
  categoria    text,
  trabajo_id   uuid references public.trabajos(id) on delete set null,
  orden        int  not null default 0,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists galeria_store_idx     on public.galeria(store_id);
create index if not exists galeria_categoria_idx on public.galeria(categoria);
create index if not exists galeria_trabajo_idx   on public.galeria(trabajo_id);
drop trigger if exists trg_galeria_touch on public.galeria;
create trigger trg_galeria_touch before update on public.galeria
  for each row execute function public.touch_updated_at();

-- ---------- mensajes_contacto ----------
create table if not exists public.mensajes_contacto (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores(id),
  nombre              text not null,
  telefono            text,
  email               text,
  servicio_requerido  text,
  zona_ciudad         text,
  mensaje             text,
  estado              text not null default 'nuevo',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint mensajes_estado_chk check (estado in
    ('nuevo','contactado','presupuesto_enviado','cerrado','descartado'))
);
create index if not exists mensajes_store_idx   on public.mensajes_contacto(store_id);
create index if not exists mensajes_estado_idx  on public.mensajes_contacto(estado);
create index if not exists mensajes_created_idx on public.mensajes_contacto(created_at desc);
drop trigger if exists trg_mensajes_touch on public.mensajes_contacto;
create trigger trg_mensajes_touch before update on public.mensajes_contacto
  for each row execute function public.touch_updated_at();

-- ---------- configuracion_web ----------
create table if not exists public.configuracion_web (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id),
  clave       text not null,
  valor       text,
  tipo        text not null default 'text',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (store_id, clave)
);
create index if not exists config_store_idx on public.configuracion_web(store_id);
drop trigger if exists trg_config_touch on public.configuracion_web;
create trigger trg_config_touch before update on public.configuracion_web
  for each row execute function public.touch_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.stores            enable row level security;
alter table public.profiles          enable row level security;
alter table public.servicios         enable row level security;
alter table public.trabajos          enable row level security;
alter table public.galeria           enable row level security;
alter table public.mensajes_contacto enable row level security;
alter table public.configuracion_web enable row level security;

-- ---------- stores: el admin solo ve su propio store ----------
drop policy if exists stores_select_own on public.stores;
create policy stores_select_own on public.stores
  for select to authenticated
  using (id = public.current_store_id());

-- ---------- profiles: cada usuario ve y edita SOLO su propio perfil ----------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- servicios: público ve activos, admin gestiona todo ----------
drop policy if exists servicios_select_public on public.servicios;
create policy servicios_select_public on public.servicios
  for select to anon
  using (activo = true);

drop policy if exists servicios_admin_all on public.servicios;
create policy servicios_admin_all on public.servicios
  for all to authenticated
  using (store_id = public.current_store_id())
  with check (store_id = public.current_store_id());

-- ---------- trabajos: público ve activos, admin gestiona todo ----------
drop policy if exists trabajos_select_public on public.trabajos;
create policy trabajos_select_public on public.trabajos
  for select to anon
  using (activo = true);

drop policy if exists trabajos_admin_all on public.trabajos;
create policy trabajos_admin_all on public.trabajos
  for all to authenticated
  using (store_id = public.current_store_id())
  with check (store_id = public.current_store_id());

-- ---------- galeria: público ve activos, admin gestiona todo ----------
drop policy if exists galeria_select_public on public.galeria;
create policy galeria_select_public on public.galeria
  for select to anon
  using (activo = true);

drop policy if exists galeria_admin_all on public.galeria;
create policy galeria_admin_all on public.galeria
  for all to authenticated
  using (store_id = public.current_store_id())
  with check (store_id = public.current_store_id());

-- ---------- mensajes_contacto: público SOLO inserta, admin lee/edita ----------
drop policy if exists mensajes_insert_public on public.mensajes_contacto;
create policy mensajes_insert_public on public.mensajes_contacto
  for insert to anon
  with check (true);

drop policy if exists mensajes_admin_all on public.mensajes_contacto;
create policy mensajes_admin_all on public.mensajes_contacto
  for all to authenticated
  using (store_id = public.current_store_id())
  with check (store_id = public.current_store_id());

-- ---------- configuracion_web: público lee, admin escribe ----------
drop policy if exists configuracion_select_public on public.configuracion_web;
create policy configuracion_select_public on public.configuracion_web
  for select to anon
  using (true);

drop policy if exists configuracion_admin_all on public.configuracion_web;
create policy configuracion_admin_all on public.configuracion_web
  for all to authenticated
  using (store_id = public.current_store_id())
  with check (store_id = public.current_store_id());

-- ============================================================
-- SEEDS
-- ============================================================

-- ---------- configuración inicial ----------
with s as (select id from public.stores where slug = 'constructora-ncg' limit 1)
insert into public.configuracion_web (store_id, clave, valor, tipo)
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

-- ---------- servicios iniciales (12, tomados de la web actual) ----------
with s as (select id from public.stores where slug = 'constructora-ncg' limit 1)
insert into public.servicios (store_id, titulo, slug, descripcion, orden, destacado, activo)
select s.id, x.titulo, x.slug, x.descripcion, x.orden, false, true
from s, (values
  ('Reparación y mantenimiento de tejados',  'reparacion-mantenimiento-tejados', 'Reparación, rehabilitación y mantenimiento integral de tejados y cubiertas.',                  1),
  ('Retejados y sustitución de tejas',       'retejados-sustitucion-tejas',      'Retejados completos y sustitución de tejas dañadas o envejecidas.',                            2),
  ('Especialistas en tejas curvas',          'tejas-curvas',                     'Colocación experta de teja curva tradicional con acabado duradero.',                           3),
  ('Impermeabilización y aislamiento',       'impermeabilizacion-aislamiento',   'Impermeabilización avanzada y aislamientos con tecnología de última generación.',              4),
  ('Sistemas ventilados en cubiertas',       'sistemas-ventilados',              'Instalación de cubiertas ventiladas para mejorar el rendimiento térmico.',                     5),
  ('Paneles sándwich grecados',              'paneles-sandwich',                 'Cubiertas con panel sándwich grecado, ligeras, aislantes y resistentes.',                      6),
  ('Canalones y bajantes',                   'canalones-bajantes',               'Colocación de canalones e instalación de bajantes para una evacuación perfecta.',              7),
  ('Ventanas y claraboyas Velux',            'ventanas-claraboyas-velux',        'Instalación de ventanas de tejado y claraboyas tipo Velux con garantía de estanqueidad.',     8),
  ('Cubiertas ligeras',                      'cubiertas-ligeras',                'Especialistas en cubiertas ligeras: solución eficiente para naves y viviendas.',               9),
  ('Cálculo y montaje de cubiertas',         'calculo-montaje-cubiertas',        'Montaje y cálculo estructural de cubiertas adaptado a cada proyecto.',                        10),
  ('Cubiertas de madera · GL24',             'cubiertas-madera-gl24',            'Rehabilitación de cubiertas de madera, laminado GL24 y madera antigua.',                      11),
  ('Accesorios certificados',                'accesorios-certificados',          'Montaje de accesorios para cubiertas con certificación y máxima seguridad.',                  12)
) as x(titulo, slug, descripcion, orden)
on conflict (slug) do nothing;
