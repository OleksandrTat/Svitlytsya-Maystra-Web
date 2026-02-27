create extension if not exists pgcrypto;

create type project_category as enum ('doors', 'furniture', 'windows');
create type project_status as enum ('public', 'nda', 'concept');
create type inquiry_status as enum ('new', 'in_progress', 'done', 'archived');

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  category project_category not null,
  style text[] not null default '{}',
  materials text[] not null default '{}',
  dimensions text,
  location text,
  completed_at date,
  duration_days integer,
  status project_status not null default 'public',
  is_featured boolean not null default false,
  cover_image text not null,
  images text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null,
  description text not null,
  process_steps jsonb not null default '[]'::jsonb,
  cover_image text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_location text,
  content text not null,
  rating integer not null check (rating between 1 and 5),
  project_id uuid references projects(id) on delete set null,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  service_type text not null,
  message text,
  source_page text,
  project_ref_id uuid references projects(id) on delete set null,
  status inquiry_status not null default 'new',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity text not null,
  entity_id text,
  payload jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_projects_updated_at on projects;
create trigger set_projects_updated_at
before update on projects
for each row execute procedure public.set_updated_at();

drop trigger if exists set_services_updated_at on services;
create trigger set_services_updated_at
before update on services
for each row execute procedure public.set_updated_at();

drop trigger if exists set_site_settings_updated_at on site_settings;
create trigger set_site_settings_updated_at
before update on site_settings
for each row execute procedure public.set_updated_at();

create index if not exists idx_projects_category on projects(category);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_projects_featured on projects(is_featured);
create index if not exists idx_services_sort on services(sort_order);
create index if not exists idx_testimonials_visible on testimonials(is_visible);
create index if not exists idx_inquiries_status_created on inquiries(status, created_at desc);

alter table projects enable row level security;
alter table services enable row level security;
alter table testimonials enable row level security;
alter table inquiries enable row level security;
alter table site_settings enable row level security;
alter table activity_logs enable row level security;

-- projects policies
create policy "projects_public_read"
  on projects for select
  using (true);

create policy "projects_owner_write"
  on projects for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- services policies
create policy "services_public_read"
  on services for select
  using (true);

create policy "services_owner_write"
  on services for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- testimonials policies
create policy "testimonials_public_read_visible"
  on testimonials for select
  using (is_visible = true or auth.role() = 'authenticated');

create policy "testimonials_owner_write"
  on testimonials for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- inquiries policies
create policy "inquiries_public_insert"
  on inquiries for insert
  with check (true);

create policy "inquiries_owner_read_update"
  on inquiries for select
  using (auth.role() = 'authenticated');

create policy "inquiries_owner_update"
  on inquiries for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "inquiries_owner_delete"
  on inquiries for delete
  using (auth.role() = 'authenticated');

-- site settings policies
create policy "site_settings_owner_all"
  on site_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- activity logs policies
create policy "activity_logs_owner_read"
  on activity_logs for select
  using (auth.role() = 'authenticated');

create policy "activity_logs_owner_insert"
  on activity_logs for insert
  with check (auth.role() = 'authenticated');
