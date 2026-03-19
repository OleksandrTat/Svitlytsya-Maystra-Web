-- 0014: enrich services and blog posts for the new admin UX

alter table public.services
  add column if not exists tagline text,
  add column if not exists icon text,
  add column if not exists gallery text[] not null default '{}',
  add column if not exists category text not null default 'production',
  add column if not exists features jsonb not null default '[]'::jsonb,
  add column if not exists price_from numeric(12,2),
  add column if not exists price_unit text default 'грн',
  add column if not exists duration_days_from integer,
  add column if not exists duration_days_to integer,
  add column if not exists is_active boolean not null default true,
  add column if not exists is_featured boolean not null default false,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

update public.services
set
  category = coalesce(nullif(category, ''), 'production'),
  features = coalesce(features, '[]'::jsonb),
  gallery = coalesce(gallery, '{}'),
  price_unit = coalesce(nullif(price_unit, ''), 'грн'),
  is_active = coalesce(is_active, true),
  is_featured = coalesce(is_featured, false);

update public.services
set process_steps = '[]'::jsonb
where process_steps is null;

alter table public.services
  alter column category set default 'production',
  alter column features set default '[]'::jsonb,
  alter column gallery set default '{}',
  alter column price_unit set default 'грн',
  alter column is_active set default true,
  alter column is_featured set default false,
  alter column process_steps set default '[]'::jsonb;

alter table public.services enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'services'
      and policyname = 'services_public_read'
  ) then
    create policy services_public_read
      on public.services
      for select
      using (coalesce(is_active, true) = true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'services'
      and policyname = 'services_service_role'
  ) then
    create policy services_service_role
      on public.services
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

create index if not exists idx_services_active_sort on public.services(is_active, sort_order);
create index if not exists idx_services_featured_sort on public.services(is_featured, sort_order);
create index if not exists idx_services_category on public.services(category);

create or replace function public.services_set_updated_at()
returns trigger as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at
  before update on public.services
  for each row
  execute function public.services_set_updated_at();

alter table public.blog_posts
  add column if not exists author_name text default 'Команда Світлиці',
  add column if not exists author_avatar text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists views_count integer not null default 0,
  add column if not exists likes_count integer not null default 0,
  add column if not exists related_service_id uuid references public.services(id) on delete set null,
  add column if not exists related_product_id uuid references public.products(id) on delete set null;

update public.blog_posts
set
  author_name = coalesce(nullif(author_name, ''), 'Команда Світлиці'),
  is_featured = coalesce(is_featured, false),
  views_count = coalesce(views_count, 0),
  likes_count = coalesce(likes_count, 0);

alter table public.blog_posts
  alter column author_name set default 'Команда Світлиці',
  alter column author_name set not null,
  alter column is_featured set default false,
  alter column views_count set default 0,
  alter column likes_count set default 0;

alter table public.blog_posts enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'blog_posts'
      and policyname = 'blog_public_read'
  ) then
    create policy blog_public_read
      on public.blog_posts
      for select
      using (is_published = true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'blog_posts'
      and policyname = 'blog_service_role'
  ) then
    create policy blog_service_role
      on public.blog_posts
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

create index if not exists idx_blog_posts_published_at on public.blog_posts(is_published, published_at desc);
create index if not exists idx_blog_posts_category_published on public.blog_posts(category, is_published);
create index if not exists idx_blog_posts_featured on public.blog_posts(is_featured, published_at desc);

create or replace function public.set_blog_post_metadata()
returns trigger as $$
begin
  if new.is_published and (tg_op = 'INSERT' or not coalesce(old.is_published, false)) then
    new.published_at := coalesce(new.published_at, timezone('utc', now()));
  end if;

  if not new.is_published then
    new.published_at := null;
  end if;

  new.updated_at := timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists blog_set_published_at on public.blog_posts;
create trigger blog_set_published_at
  before insert or update on public.blog_posts
  for each row
  execute function public.set_blog_post_metadata();
