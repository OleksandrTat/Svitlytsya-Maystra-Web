# Svitlytsya Maystra — Web

Plataforma web para una carpintería artesanal: catálogo de productos, gestión
de pedidos y consultas, blog, panel de administración con CRM, asistente
conversacional con IA y autenticación de clientes.

**Demo en producción:** https://svitlytsya-maystra-web.vercel.app

---

## Tabla de contenidos

1. [Stack tecnológico](#stack-tecnológico)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Instalación de dependencias](#1-instalación-de-dependencias)
4. [Entorno de desarrollo](#2-entorno-de-desarrollo)
5. [Despliegue con Docker Compose](#3-despliegue-con-docker-compose)
6. [Despliegue de la base de datos](#4-despliegue-de-la-base-de-datos)
7. [Despliegue en Vercel](#5-despliegue-en-vercel-producción)
8. [Variables de entorno](#variables-de-entorno)
9. [Scripts disponibles](#scripts-disponibles)
10. [Rutas principales](#rutas-principales)

---

## Stack tecnológico

| Capa            | Tecnología                                              |
| --------------- | ------------------------------------------------------- |
| Framework       | Next.js 16 (App Router) + React 19 + TypeScript        |
| Estilos         | Tailwind CSS 4                                          |
| i18n            | next-intl (UK / EN)                                    |
| Base de datos   | Supabase (PostgreSQL 16, Auth, Storage, RLS)           |
| Email           | Resend                                                  |
| IA              | OpenAI (`gpt-4o-mini`) — chatbot, traducciones, sugerencias |
| Antibot         | Cloudflare Turnstile                                    |
| Analítica       | PostHog (proxy `/ingest`)                              |
| Backups         | AWS S3 (cron diario)                                   |
| Hosting         | Vercel (Edge + Node runtime)                           |

---

## Estructura del proyecto

```
src/
├── app/                       # App Router de Next.js
│   ├── [locale]/(site)/       # Sitio público (uk, en)
│   ├── admin/                 # Panel de administración
│   └── api/                   # Route handlers (chat, inquiries, etc.)
├── components/
│   ├── shared/                # Header, footer, chatbot
│   ├── products/              # Catálogo, filtros, configurador 3D
│   ├── admin/                 # CRM, kanban, formularios
│   └── ui/                    # Primitivos reutilizables
├── lib/
│   ├── supabase/              # Clientes browser/server/service
│   ├── data/                  # Queries tipadas
│   └── i18n/                  # Helpers de localización
├── actions/                   # Server actions
└── hooks/                     # React hooks (wishlist, comparación, etc.)
supabase/
├── migrations/                # Migraciones SQL versionadas
├── seeds/                     # Semilla de FAQ
└── seed.ts                    # Script de seeding via service role
```

---

## 1. Instalación de dependencias

Requisitos: **Node.js 20+** y **npm 10+**.

```bash
git clone https://github.com/OleksandrTat/Svitlytsya-Maystra-Web.git
cd Svitlytsya-Maystra-Web
npm install
```

> El postinstall ejecuta `scripts/fix-hookform-resolvers.js` para parchar
> `@hookform/resolvers` con un export que falta en la versión publicada.

---

## 2. Entorno de desarrollo

1. Copia el fichero de ejemplo y rellena tus credenciales:

   ```bash
   cp .env.example .env.local
   ```

   Las únicas variables **obligatorias** para que arranque el sitio público son:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

   El resto (OpenAI, Resend, Turnstile, S3, PostHog) son opcionales — sin
   ellas las funcionalidades correspondientes quedan deshabilitadas con un
   mensaje claro y el resto del sitio sigue funcionando.

2. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Visita http://localhost:3000.

3. Comprobaciones de calidad:

   ```bash
   npm run typecheck    # tsc --noEmit
   npm run lint         # eslint
   npm run build        # build de producción
   ```

---

## 3. Despliegue con Docker Compose

El proyecto incluye `Dockerfile` (multi-stage) y `docker-compose.yml`.

### 3.1 Solo la app (con Supabase remoto)

```bash
cp .env.example .env.local        # rellena tus secretos
docker compose up --build         # http://localhost:3000
```

Para parar:

```bash
docker compose down
```

### 3.2 Stack completo con Postgres local

Si prefieres no depender de Supabase Cloud, levanta también una base de
datos Postgres local con el perfil `db`:

```bash
docker compose --profile db up --build
```

Esto arranca:

- `sm-web` → la aplicación Next.js en `localhost:3000`
- `sm-db`  → Postgres 16 en `localhost:5432`
            (`postgres` / `postgres`, base `svitlytsya`)

Para apuntar la app al Postgres local, en tu `.env.local` cambia
`NEXT_PUBLIC_SUPABASE_URL` por la URL de un Supabase auto-alojado o
adapta `src/lib/supabase/server.ts`. (En la versión publicada se asume
Supabase Cloud — el contenedor `db` se incluye sobre todo para correr las
migraciones aisladas y validarlas.)

---

## 4. Despliegue de la base de datos

Toda la base de datos vive como **migraciones SQL versionadas** en
`supabase/migrations/`. Cada fichero es idempotente y se nombra por fecha:

```
supabase/migrations/
├── 0001_init.sql
├── 20260330_add_faq_certificates_wishlist_newsletter.sql
├── 20260401_add_en_columns.sql
├── 20260410_crm_contacts_deals.sql
├── 20260411_seed_initial_data.sql
└── ... (10+ migraciones más)
```

### 4.1 Sobre Supabase Cloud

1. Crea un proyecto nuevo en https://supabase.com.
2. Abre **SQL Editor** y ejecuta cada `.sql` en orden alfabético.
   Alternativamente, usa la Supabase CLI:

   ```bash
   npx supabase link --project-ref <tu-project-ref>
   npx supabase db push
   ```

3. (Opcional) carga datos de ejemplo:

   ```bash
   npm run seed
   ```

   Este script lee `.env.local` y usa el `SUPABASE_SERVICE_ROLE_KEY` para
   insertar productos, servicios, FAQ, certificados y testimonios de demo.

### 4.2 Sobre el Postgres del docker-compose

```bash
docker compose --profile db up -d db

for f in supabase/migrations/*.sql; do
  echo "→ aplicando $f"
  docker compose exec -T db psql -U postgres -d svitlytsya < "$f"
done
```

### 4.3 Estructura principal

| Tabla              | Para qué sirve                                |
| ------------------ | --------------------------------------------- |
| `products`         | Catálogo (con campos `_en` para EN)          |
| `services`         | Servicios ofrecidos                           |
| `inquiries`        | Solicitudes del formulario público            |
| `orders`           | Pedidos confirmados                           |
| `contacts`, `deals`| CRM ligero estilo kanban                      |
| `blog_posts`       | Blog editable desde el admin                  |
| `testimonials`     | Reseñas de clientes                           |
| `certificates`     | Certificados de la empresa                    |
| `faq_items`        | FAQ                                           |
| `wishlist_items`   | Wishlist por usuario                          |
| `user_profiles`    | Perfil extendido (sobre `auth.users`)        |
| `company_info`     | Datos editables de la empresa                 |

Todas las tablas tienen **Row Level Security activo** y políticas mínimas
(lectura pública, escritura solo para el rol `service_role` o el dueño del
recurso).

---

## 5. Despliegue en Vercel (producción)

1. Haz fork o conecta este repositorio en https://vercel.com.
2. Configura **Settings → Environment Variables** con todas las claves
   marcadas como obligatorias en `.env.example`.
3. Especialmente importante: define
   **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** (32 bytes random base64).
   Sin ella, los IDs de Server Action cambian en cada deploy y rompen las
   páginas estáticas en caché del CDN.

   ```bash
   openssl rand -base64 32
   ```

4. Push a `main` (o tu rama de despliegue) y Vercel construye y despliega
   automáticamente.

---

## Variables de entorno

| Variable                              | Obligatoria | Para qué                                                |
| ------------------------------------- | :---------: | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`            | ✅          | URL del proyecto Supabase                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | ✅          | Anon key (cliente de navegador)                         |
| `SUPABASE_SERVICE_ROLE_KEY`           | ✅          | Service role (server only)                              |
| `NEXT_PUBLIC_SITE_URL`                | ✅          | URL pública del sitio                                   |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`  | ✅ en prod  | Estabiliza IDs de Server Actions entre deploys          |
| `OPENAI_API_KEY`                      |             | Habilita el chatbot y la generación de sugerencias      |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL`|             | Envío de emails transaccionales                         |
| `ADMIN_EMAIL`                         |             | Destino de las notificaciones internas                  |
| `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | | Antibot del formulario        |
| `NEXT_PUBLIC_POSTHOG_KEY`             |             | Analítica (proxy `/ingest`)                            |
| `BACKUP_S3_*`, `BACKUP_CRON_TOKEN`    |             | Backups diarios a S3                                    |

---

## Scripts disponibles

```bash
npm run dev          # next dev (servidor de desarrollo)
npm run build        # next build
npm run start        # next start (producción local)
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run seed         # carga datos demo en Supabase
npm run backup       # backup manual a S3
```

---

## Rutas principales

### Público

| Ruta                              | Descripción                          |
| --------------------------------- | ------------------------------------ |
| `/`                               | Home                                 |
| `/products`                       | Catálogo con filtros, grid/lista     |
| `/products/[slug]`                | Ficha de producto                    |
| `/services` · `/services/[slug]`  | Servicios                            |
| `/blog` · `/blog/[slug]`          | Blog                                 |
| `/contact`                        | Formulario de contacto               |
| `/auth/login` · `/auth/register`  | Autenticación                        |
| `/profile`                        | Área de cliente (pedidos, soporte)  |
| `/privacy`, `/terms`, `/cookies`  | Páginas legales                      |

Todas las rutas públicas están internacionalizadas con prefijo `/uk` y `/en`.

### Admin (`/admin/*`, requiere rol)

CRM, gestión de productos/servicios/blog, FAQ, pedidos, inbox de mensajes,
ajustes de empresa y backups.

---

## Notas de seguridad

- **Nunca** commitear `.env.local`. Está en `.gitignore`.
- Todas las tablas usan **RLS**; el `service_role` solo se usa server-side.
- La clave `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` debe rotarse de forma
  coordinada con el siguiente deploy (no antes — invalidaría las páginas
  cacheadas).
- Si has clonado el repo y vas a hacerlo público, **rota cualquier clave
  que pueda estar en el historial de Git** (Supabase service role, OpenAI,
  Resend, Turnstile).

---

## Licencia

Proyecto académico — código entregado tal cual con fines educativos.
