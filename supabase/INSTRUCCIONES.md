# Configuración de Supabase — Constructora NCG

Sigue estos pasos una sola vez. Tiempo total: ~5-7 minutos.

---

## 1. Crear el proyecto Supabase

1. Entra a **https://supabase.com** y haz click en **Start your project**.
2. Sign up con GitHub (o email).
3. Click en **New project** y rellena:
   - **Name**: `constructora-ncg`
   - **Database Password**: genera una contraseña fuerte y **guárdala** (la necesitarás si algún día accedes a la DB directamente).
   - **Region**: la más cercana a tus clientes. Para España: **West EU (London)** o **Central EU (Frankfurt)**.
   - **Pricing plan**: Free (suficiente para empezar).
4. Click **Create new project**. Espera ~2 minutos a que se provisione.

---

## 2. Ejecutar la migración

1. En el menú izquierdo del dashboard, ve a **SQL Editor**.
2. Click en **New query**.
3. Abre el archivo `supabase/migration.sql` de este proyecto, copia TODO su contenido y pégalo en el editor.
4. Click en **Run** (o `Ctrl+Enter`).
5. Debería decir **Success. No rows returned**.

Si ves error: tómale captura y mándamela.

### Qué se creó

- **7 tablas**: `stores`, `profiles`, `servicios`, `trabajos`, `galeria`, `mensajes_contacto`, `configuracion_web`.
- **RLS activado** en todas. Cada usuario admin solo ve datos de su `store_id`.
- **Seeds**: 1 store (`Constructora NCG`), 14 filas de `configuracion_web`, 12 servicios iniciales.

---

## 3. Crear tu usuario admin

1. En el menú izquierdo: **Authentication** → **Users**.
2. Click en **Add user** → **Create new user**.
3. Rellena:
   - **Email**: el que vas a usar para entrar al panel (ej. `bart@constructora-ncg.com`).
   - **Password**: una contraseña fuerte (la usarás cada vez que entres).
   - ✅ **Auto Confirm User** (marca esta casilla para que no te pida confirmar por email).
4. Click **Create user**.

---

## 4. Vincular tu usuario al store

1. Vuelve al **SQL Editor** → **New query**.
2. Abre `supabase/crear-primer-admin.sql`.
3. Reemplaza `<TU_EMAIL_AQUI>` (aparece 2 veces) por el email exacto que usaste en el paso 3.
4. Click **Run**.
5. Al final verás una fila con tu email y `store = Constructora NCG`. Si sale vacío, revisa que el email coincida exactamente.

---

## 5. Copiar las credenciales

Las necesito para conectar la web y el panel.

1. En el menú izquierdo: **Project Settings** (icono engranaje abajo) → **API**.
2. Copia estos dos valores y pégamelos en el chat:
   - **Project URL** (algo como `https://xxxxxxxx.supabase.co`)
   - **anon public** (una cadena larga que empieza por `eyJhbG...`)

⚠️ NO me mandes la **service_role** key. Esa es secreta y NO se usa en frontend.

---

## 6. Configurar URL del sitio (importante para login)

1. **Authentication** → **URL Configuration**.
2. En **Site URL** pon: `http://localhost` (provisional, lo cambiamos cuando despleguemos a Hostinger).
3. En **Redirect URLs** añade:
   - `http://localhost/*`
   - `http://127.0.0.1/*`
   - Cuando despliegues, añadiremos también la URL de Hostinger.
4. Click **Save**.

---

## Listo

Cuando termines los 5 pasos, mándame en el chat:

```
SUPABASE_URL = https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY = eyJhbG...
EMAIL_ADMIN = el email que usaste
```

Con eso paso a la **Fase 2**: construyo el login, el dashboard, el sidebar y el tema oscuro del panel.
