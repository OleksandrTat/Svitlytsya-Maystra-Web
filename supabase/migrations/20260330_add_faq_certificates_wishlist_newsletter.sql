-- ═══════════════════════════════════════════════════════════
-- FAQ Items
-- ═══════════════════════════════════════════════════════════
create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'general',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faq_items enable row level security;
create policy "Public read published faq" on public.faq_items
  for select using (is_published = true);
create policy "Service role full access faq" on public.faq_items
  using (true) with check (true);

create index on public.faq_items (category, sort_order);

-- ═══════════════════════════════════════════════════════════
-- Certificates
-- ═══════════════════════════════════════════════════════════
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text not null,
  issued_year integer,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.certificates enable row level security;
create policy "Public read published certificates" on public.certificates
  for select using (is_published = true);
create policy "Service role full access certificates" on public.certificates
  using (true) with check (true);

-- ═══════════════════════════════════════════════════════════
-- Wishlist Items
-- ═══════════════════════════════════════════════════════════
create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

alter table public.wishlist_items enable row level security;
create policy "Users manage own wishlist" on public.wishlist_items
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- Newsletter Subscribers
-- ═══════════════════════════════════════════════════════════
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  status text not null default 'active' check (status in ('active', 'unsubscribed', 'bounced')),
  source text default 'website',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

alter table public.newsletter_subscribers enable row level security;
create policy "Service role full access newsletter" on public.newsletter_subscribers
  using (true) with check (true);

create index on public.newsletter_subscribers (status);
create index on public.newsletter_subscribers (subscribed_at desc);
