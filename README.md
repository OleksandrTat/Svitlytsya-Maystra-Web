# Svitlytsya Maystra — MVP (Etap 1)

Next.js платформа для прийому заявок, каталогу робіт та базової адмін-панелі.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Resend (transactional email)
- PostHog (analytics)

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
