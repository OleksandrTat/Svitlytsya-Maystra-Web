create type chat_role as enum ('user', 'assistant');
create type product_type as enum ('door', 'furniture', 'window');
create type blog_comment_status as enum ('pending', 'approved', 'rejected');
create type email_subscriber_status as enum ('subscribed', 'unsubscribed', 'bounced', 'complained');
create type email_campaign_status as enum ('draft', 'scheduled', 'sending', 'sent', 'failed');

create table if not exists ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  language text not null default 'uk',
  messages_count integer not null default 0 check (messages_count >= 0),
  resulted_in_inquiry boolean not null default false,
  inquiry_id uuid references inquiries(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz not null default timezone('utc', now())
);

create table if not exists ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_session_id uuid not null references ai_chat_sessions(id) on delete cascade,
  role chat_role not null,
  content text not null,
  tokens_used integer not null default 0 check (tokens_used >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists product_configurations (
  id uuid primary key default gen_random_uuid(),
  product_type product_type not null,
  configuration_key text not null unique,
  parameters jsonb not null default '{}'::jsonb,
  image_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists saved_configurations (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  user_id uuid references auth.users(id) on delete set null,
  product_type product_type not null,
  configuration jsonb not null default '{}'::jsonb,
  name text,
  created_at timestamptz not null default timezone('utc', now()),
  check (session_id is not null or user_id is not null)
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  cover_image text,
  category text not null,
  tags text[] not null default '{}',
  reading_time_min integer not null default 1 check (reading_time_min > 0),
  is_published boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists cultural_blog_posts (
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

create table if not exists blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references cultural_blog_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references blog_comments(id) on delete cascade,
  content text not null,
  status blog_comment_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  account_types text[] not null default '{}'::text[],
  email_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now())
);

create table if not exists email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  preferences jsonb not null default '{}'::jsonb,
  status email_subscriber_status not null default 'subscribed',
  subscribed_at timestamptz not null default timezone('utc', now()),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  html_content text not null,
  status email_campaign_status not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists email_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references email_campaigns(id) on delete cascade,
  subscriber_id uuid not null references email_subscribers(id) on delete cascade,
  status text not null default 'queued',
  opened_at timestamptz,
  clicked_at timestamptz,
  sent_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (campaign_id, subscriber_id)
);

create table if not exists email_sequences (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  trigger_type text not null,
  steps jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table inquiries add column if not exists configuration jsonb;
alter table inquiries add column if not exists chat_session_id uuid references ai_chat_sessions(id) on delete set null;

create index if not exists idx_ai_chat_sessions_user on ai_chat_sessions(user_id);
create index if not exists idx_ai_chat_sessions_last_message_at on ai_chat_sessions(last_message_at desc);
create index if not exists idx_ai_chat_sessions_resulted_in_inquiry on ai_chat_sessions(resulted_in_inquiry);
create index if not exists idx_ai_chat_messages_session_created on ai_chat_messages(chat_session_id, created_at);

create index if not exists idx_product_configurations_type_active on product_configurations(product_type, is_active);
create index if not exists idx_saved_configurations_user on saved_configurations(user_id, created_at desc);
create index if not exists idx_saved_configurations_session on saved_configurations(session_id, created_at desc);

create index if not exists idx_blog_posts_published on blog_posts(is_published, published_at desc);
create index if not exists idx_blog_posts_category on blog_posts(category);
create index if not exists idx_cultural_blog_posts_published on cultural_blog_posts(is_published, published_at desc);
create index if not exists idx_blog_comments_post_status on blog_comments(post_id, status, created_at);

create index if not exists idx_email_subscribers_status on email_subscribers(status);
create index if not exists idx_email_campaigns_status_schedule on email_campaigns(status, scheduled_at);
create index if not exists idx_email_sends_campaign_status on email_sends(campaign_id, status);
create index if not exists idx_email_sends_opened_clicked on email_sends(opened_at, clicked_at);
create index if not exists idx_inquiries_chat_session_id on inquiries(chat_session_id);

drop trigger if exists set_product_configurations_updated_at on product_configurations;
create trigger set_product_configurations_updated_at
before update on product_configurations
for each row execute procedure public.set_updated_at();

drop trigger if exists set_blog_posts_updated_at on blog_posts;
create trigger set_blog_posts_updated_at
before update on blog_posts
for each row execute procedure public.set_updated_at();

drop trigger if exists set_cultural_blog_posts_updated_at on cultural_blog_posts;
create trigger set_cultural_blog_posts_updated_at
before update on cultural_blog_posts
for each row execute procedure public.set_updated_at();

drop trigger if exists set_email_subscribers_updated_at on email_subscribers;
create trigger set_email_subscribers_updated_at
before update on email_subscribers
for each row execute procedure public.set_updated_at();

drop trigger if exists set_email_campaigns_updated_at on email_campaigns;
create trigger set_email_campaigns_updated_at
before update on email_campaigns
for each row execute procedure public.set_updated_at();

drop trigger if exists set_email_sequences_updated_at on email_sequences;
create trigger set_email_sequences_updated_at
before update on email_sequences
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name, account_types, email_preferences)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    array['email_subscriber']::text[],
    '{}'::jsonb
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

insert into site_settings (key, value, description)
values (
  'ai_chat_system_prompt',
  to_jsonb(
    'You are Mykola, digital assistant of Svitlytsya Maystra. Be warm and professional. Reply in Ukrainian or user language, but never in Russian. Give only approximate price ranges, never exact prices. Do not promise deadlines. If unsure, advise to contact +380 XX XXX XXXX. After 3+ messages, gently suggest leaving an inquiry.'
  ),
  'System prompt for AI chat widget'
)
on conflict (key) do nothing;

alter table ai_chat_sessions enable row level security;
alter table ai_chat_messages enable row level security;
alter table product_configurations enable row level security;
alter table saved_configurations enable row level security;
alter table blog_posts enable row level security;
alter table cultural_blog_posts enable row level security;
alter table blog_comments enable row level security;
alter table user_profiles enable row level security;
alter table email_subscribers enable row level security;
alter table email_campaigns enable row level security;
alter table email_sends enable row level security;
alter table email_sequences enable row level security;

drop policy if exists "ai_chat_sessions_owner_read" on ai_chat_sessions;
create policy "ai_chat_sessions_owner_read"
  on ai_chat_sessions for select
  using (auth.role() = 'authenticated');

drop policy if exists "ai_chat_messages_owner_read" on ai_chat_messages;
create policy "ai_chat_messages_owner_read"
  on ai_chat_messages for select
  using (auth.role() = 'authenticated');

drop policy if exists "product_configurations_public_read" on product_configurations;
create policy "product_configurations_public_read"
  on product_configurations for select
  using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "product_configurations_owner_write" on product_configurations;
create policy "product_configurations_owner_write"
  on product_configurations for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "saved_configurations_owner_select" on saved_configurations;
create policy "saved_configurations_owner_select"
  on saved_configurations for select
  using (auth.uid() = user_id);

drop policy if exists "saved_configurations_insert" on saved_configurations;
create policy "saved_configurations_insert"
  on saved_configurations for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "saved_configurations_owner_update" on saved_configurations;
create policy "saved_configurations_owner_update"
  on saved_configurations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_configurations_owner_delete" on saved_configurations;
create policy "saved_configurations_owner_delete"
  on saved_configurations for delete
  using (auth.uid() = user_id);

drop policy if exists "blog_posts_public_read" on blog_posts;
create policy "blog_posts_public_read"
  on blog_posts for select
  using (is_published = true or auth.role() = 'authenticated');

drop policy if exists "blog_posts_owner_write" on blog_posts;
create policy "blog_posts_owner_write"
  on blog_posts for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "cultural_blog_posts_public_read" on cultural_blog_posts;
create policy "cultural_blog_posts_public_read"
  on cultural_blog_posts for select
  using (is_published = true or auth.role() = 'authenticated');

drop policy if exists "cultural_blog_posts_owner_write" on cultural_blog_posts;
create policy "cultural_blog_posts_owner_write"
  on cultural_blog_posts for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "blog_comments_public_approved_read" on blog_comments;
create policy "blog_comments_public_approved_read"
  on blog_comments for select
  using (status = 'approved' or auth.role() = 'authenticated');

drop policy if exists "blog_comments_auth_insert" on blog_comments;
create policy "blog_comments_auth_insert"
  on blog_comments for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "blog_comments_owner_or_admin_update" on blog_comments;
create policy "blog_comments_owner_or_admin_update"
  on blog_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_profiles_public_read" on user_profiles;
create policy "user_profiles_public_read"
  on user_profiles for select
  using (true);

drop policy if exists "user_profiles_owner_insert" on user_profiles;
create policy "user_profiles_owner_insert"
  on user_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "user_profiles_owner_update" on user_profiles;
create policy "user_profiles_owner_update"
  on user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "email_subscribers_owner_all" on email_subscribers;
create policy "email_subscribers_owner_all"
  on email_subscribers for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "email_campaigns_owner_all" on email_campaigns;
create policy "email_campaigns_owner_all"
  on email_campaigns for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "email_sends_owner_all" on email_sends;
create policy "email_sends_owner_all"
  on email_sends for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "email_sequences_owner_all" on email_sequences;
create policy "email_sequences_owner_all"
  on email_sequences for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
