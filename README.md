# Svitlytsya Maystra — MVP (Etap 1)

Next.js платформа для прийому заявок, каталогу робіт та базової адмін-панелі.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Resend (transactional email)

## Local start

1. Встановіть залежності:

```bash
npm install
```

2. Створіть `.env.local` на основі `.env.example`.

3. Запустіть dev server:

```bash
npm run dev
```

## Supabase

1. Застосуйте SQL міграцію з `supabase/migrations/0001_init.sql`.
2. За потреби заповніть тестовими даними:

```bash
npm run seed
```

## Scripts

- `npm run dev` — development
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm run seed` — seed даних у Supabase

## Основні маршрути

- `/` — головна
- `/catalog` і `/catalog/[slug]` — каталог і картка проєкту
- `/services` і `/services/[slug]` — послуги
- `/contact` — контакти + форма
- `/privacy`, `/terms`, `/cookies` — юридичні сторінки
- `/admin/*` — адмін-панель

## Важливо

- Без налаштованого Supabase публічна частина працює з fallback mock-даними.
- Для реальних заявок потрібні `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Для email-повідомлень потрібні `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL`.



# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gwgbwjvenoezifzpuafw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3Z2J3anZlbm9lemlmenB1YWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxODEzODcsImV4cCI6MjA4Nzc1NzM4N30.aQVzIfxxXL850V3IDQF9q9Ewq6QGxAgpv-Kp4PisMmc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3Z2J3anZlbm9lemlmenB1YWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE4MTM4NywiZXhwIjoyMDg3NzU3Mzg3fQ.AorQctV6HFv3XcGq1eX1YrnpH0is-f63A1EfpDD-UhU
SUPABASE_PROJECT_REF=gwgbwjvenoezifzpuafw

# OpenAI
OPENAI_API_KEY=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

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=0x4AAAAAACrp5cFIhmwghhtDpdwDG6uO_Qo
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACrp5f0d3-JpAmhj

# Resend
RESEND_API_KEY=re_AFJPh3Fz_Daqz6k33mw5kVoGvTCLrWS34
RESEND_FROM_EMAIL=ifpoleksandrtataryn@gmail.com
ADMIN_EMAIL=ifpoleksandrtataryn@gmail.com

# Backup
BACKUP_CRON_TOKEN=dev-backup-token
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=svitlytsya-backups
BACKUP_S3_REGION=eu-central-1
BACKUP_S3_ENDPOINT=https://s3.eu-central-1.amazonaws.com
BACKUP_S3_ACCESS_KEY=EXAMPLEACCESSKEY
BACKUP_S3_SECRET_KEY=EXAMPLESECRETKEY
BACKUP_S3_PREFIX=prod/
BACKUP_NOTIFY_EMAIL=ifpoleksandrtataryn@gmail.com

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
