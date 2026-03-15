do $$
begin
  create extension if not exists pgcrypto;

  if to_regclass('public.cultural_blog_posts') is null then
    create table public.cultural_blog_posts (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      slug text not null unique,
      excerpt text not null,
      content text not null,
      cover_image text,
      category text not null default 'culture',
      tags text[] not null default '{}',
      reading_time_min integer not null default 1 check (reading_time_min > 0),
      is_published boolean not null default false,
      published_at timestamptz,
      seo_title text,
      seo_description text,
      guest_author_name text,
      guest_author_bio text,
      allow_comments boolean not null default true,
      comments_count integer not null default 0 check (comments_count >= 0),
      created_at timestamptz not null default timezone('utc', now()),
      updated_at timestamptz not null default timezone('utc', now())
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'blog_comment_status'
  ) then
    create type public.blog_comment_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  account_types text[] not null default '{}'::text[],
  email_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now())
);

alter table public.user_profiles add column if not exists display_name text;
alter table public.user_profiles add column if not exists avatar_url text;
alter table public.user_profiles add column if not exists bio text;
alter table public.user_profiles add column if not exists account_types text[] not null default '{}'::text[];
alter table public.user_profiles add column if not exists email_preferences jsonb not null default '{}'::jsonb;
alter table public.user_profiles add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.user_profiles add column if not exists last_seen_at timestamptz not null default timezone('utc', now());

grant select on public.user_profiles to anon, authenticated, service_role;
grant insert, update on public.user_profiles to authenticated, service_role;

alter table if exists public.user_profiles enable row level security;

drop policy if exists "user_profiles_public_read" on public.user_profiles;
create policy "user_profiles_public_read"
  on public.user_profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "user_profiles_owner_insert" on public.user_profiles;
create policy "user_profiles_owner_insert"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "user_profiles_owner_update" on public.user_profiles;
create policy "user_profiles_owner_update"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table if exists public.cultural_blog_posts enable row level security;

drop policy if exists "cultural_blog_posts_public_read" on public.cultural_blog_posts;
create policy "cultural_blog_posts_public_read"
  on public.cultural_blog_posts
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "cultural_blog_posts_authenticated_read_all" on public.cultural_blog_posts;
create policy "cultural_blog_posts_authenticated_read_all"
  on public.cultural_blog_posts
  for select
  to authenticated
  using (true);

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.cultural_blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.blog_comments(id) on delete cascade,
  content text not null,
  status public.blog_comment_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_blog_comments_post_status
  on public.blog_comments(post_id, status, created_at);

grant select on public.cultural_blog_posts to anon, authenticated, service_role;
grant select on public.blog_comments to anon, authenticated, service_role;
grant insert, update, delete on public.blog_comments to authenticated, service_role;

alter table if exists public.blog_comments enable row level security;

drop policy if exists "blog_comments_public_approved_read" on public.blog_comments;
create policy "blog_comments_public_approved_read"
  on public.blog_comments
  for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "blog_comments_authenticated_read_own" on public.blog_comments;
create policy "blog_comments_authenticated_read_own"
  on public.blog_comments
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "blog_comments_auth_insert" on public.blog_comments;
drop policy if exists "blog_comments_authenticated_insert" on public.blog_comments;
create policy "blog_comments_authenticated_insert"
  on public.blog_comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and exists (
      select 1
      from public.cultural_blog_posts p
      where p.id = post_id
        and p.is_published = true
        and p.allow_comments = true
    )
  );

drop policy if exists "blog_comments_owner_or_admin_update" on public.blog_comments;
drop policy if exists "blog_comments_owner_update_pending" on public.blog_comments;
create policy "blog_comments_owner_update_pending"
  on public.blog_comments
  for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "blog_comments_owner_delete_pending" on public.blog_comments;
create policy "blog_comments_owner_delete_pending"
  on public.blog_comments
  for delete
  to authenticated
  using (auth.uid() = user_id and status = 'pending');
