do $$ begin
  create type order_status as enum (
    'new',
    'consulting',
    'design',
    'approved',
    'production',
    'ready',
    'installation',
    'completed',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type order_priority as enum ('normal', 'urgent');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type order_message_sender_type as enum ('client', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type order_document_type as enum ('contract', 'act');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type order_notification_type as enum (
    'status_changed',
    'photo_added',
    'message_received',
    'order_ready'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type price_preset_category as enum ('material', 'consumable', 'labor', 'overhead');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type pricing_product_type as enum ('door', 'furniture', 'window', 'restoration');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type formula_component_type as enum (
    'material',
    'consumable',
    'labor',
    'overhead',
    'tax',
    'margin'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type project_privacy_level as enum ('public', 'nda_partial', 'nda_full');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type audit_actor_type as enum ('admin', 'client', 'system', 'anonymous');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type audit_action as enum ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT');
exception
  when duplicate_object then null;
end $$;

create sequence if not exists order_number_seq start 1;

create or replace function public.generate_order_number()
returns text as $$
declare
  current_year text;
  seq_number bigint;
begin
  current_year := to_char(timezone('utc', now()), 'YYYY');
  seq_number := nextval('order_number_seq');
  return format('SM-%s-%s', current_year, lpad(seq_number::text, 3, '0'));
end;
$$ language plpgsql;

alter table projects
  add column if not exists privacy_level project_privacy_level not null default 'public',
  add column if not exists blurred_images text[] not null default '{}'::text[],
  add column if not exists private_client_name text,
  add column if not exists private_location text,
  add column if not exists private_notes text;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default public.generate_order_number(),
  inquiry_id uuid references inquiries(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  status order_status not null default 'new',
  expected_date date,
  actual_date date,
  internal_notes text,
  priority order_priority not null default 'normal',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  comment text,
  is_visible_to_client boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists order_photos (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  image_url text not null,
  caption text,
  stage order_status not null default 'production',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists order_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  type order_document_type not null,
  file_url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  sender_type order_message_sender_type not null,
  sender_id uuid references auth.users(id) on delete set null,
  content text not null,
  attachment_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type order_notification_type not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists price_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category price_preset_category not null,
  unit text not null,
  value numeric(12, 2) not null check (value >= 0),
  currency text not null default 'UAH',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists price_formulas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  product_type pricing_product_type not null,
  description text,
  input_schema jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists formula_components (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references price_formulas(id) on delete cascade,
  type formula_component_type not null,
  label text not null,
  preset_id uuid references price_presets(id) on delete set null,
  expression text not null,
  condition text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists order_calculations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  formula_id uuid not null references price_formulas(id) on delete restrict,
  input_params jsonb not null default '{}'::jsonb,
  breakdown jsonb not null default '[]'::jsonb,
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_type audit_actor_type not null default 'system',
  action audit_action not null,
  table_name text not null,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_projects_privacy_level on projects(privacy_level);
create index if not exists idx_orders_user_status on orders(user_id, status, created_at desc);
create index if not exists idx_orders_priority on orders(priority, created_at desc);
create index if not exists idx_order_status_history_order on order_status_history(order_id, created_at);
create index if not exists idx_order_messages_order_created on order_messages(order_id, created_at);
create index if not exists idx_order_notifications_user_read on order_notifications(user_id, is_read, created_at desc);
create index if not exists idx_order_documents_order_type on order_documents(order_id, type);
create index if not exists idx_price_presets_category on price_presets(category);
create index if not exists idx_price_formulas_active on price_formulas(product_type, is_active);
create index if not exists idx_formula_components_formula_order on formula_components(formula_id, sort_order);
create index if not exists idx_order_calculations_order_created on order_calculations(order_id, created_at desc);
create index if not exists idx_audit_log_table_created on audit_log(table_name, created_at desc);
create index if not exists idx_audit_log_actor_created on audit_log(actor_id, created_at desc);

drop trigger if exists set_orders_updated_at on orders;
create trigger set_orders_updated_at
before update on orders
for each row execute procedure public.set_updated_at();

drop trigger if exists set_price_presets_updated_at on price_presets;
create trigger set_price_presets_updated_at
before update on price_presets
for each row execute procedure public.set_updated_at();

drop trigger if exists set_price_formulas_updated_at on price_formulas;
create trigger set_price_formulas_updated_at
before update on price_formulas
for each row execute procedure public.set_updated_at();

create or replace function public.log_order_status_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into order_status_history (
      order_id, from_status, to_status, comment, is_visible_to_client, created_by, created_at
    ) values (
      new.id, null, new.status, 'Order created', true, auth.uid(), timezone('utc', now())
    );
    return new;
  end if;

  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into order_status_history (
      order_id, from_status, to_status, comment, is_visible_to_client, created_by, created_at
    ) values (
      new.id, old.status, new.status, null, new.status <> 'archived', auth.uid(), timezone('utc', now())
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists order_status_history_log_insert on orders;
create trigger order_status_history_log_insert
after insert on orders
for each row execute procedure public.log_order_status_change();

drop trigger if exists order_status_history_log_update on orders;
create trigger order_status_history_log_update
after update of status on orders
for each row execute procedure public.log_order_status_change();

create or replace function public.audit_trigger_function()
returns trigger as $$
declare
  actor_kind audit_actor_type;
begin
  actor_kind := case
    when auth.uid() is null then 'system'
    else 'admin'
  end;

  insert into audit_log (
    actor_id,
    actor_type,
    action,
    table_name,
    record_id,
    old_value,
    new_value,
    ip_address,
    user_agent,
    created_at
  ) values (
    auth.uid(),
    actor_kind,
    tg_op::audit_action,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    null,
    null,
    timezone('utc', now())
  );

  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists audit_orders_trigger on orders;
create trigger audit_orders_trigger
after insert or update or delete on orders
for each row execute procedure public.audit_trigger_function();

drop trigger if exists audit_projects_trigger on projects;
create trigger audit_projects_trigger
after insert or update or delete on projects
for each row execute procedure public.audit_trigger_function();

drop trigger if exists audit_inquiries_trigger on inquiries;
create trigger audit_inquiries_trigger
after insert or update or delete on inquiries
for each row execute procedure public.audit_trigger_function();

drop trigger if exists audit_price_formulas_trigger on price_formulas;
create trigger audit_price_formulas_trigger
after insert or update or delete on price_formulas
for each row execute procedure public.audit_trigger_function();

drop trigger if exists audit_price_presets_trigger on price_presets;
create trigger audit_price_presets_trigger
after insert or update or delete on price_presets
for each row execute procedure public.audit_trigger_function();

drop view if exists projects_public;
create view projects_public as
select
  id,
  title,
  slug,
  description,
  category,
  style,
  materials,
  dimensions,
  case
    when privacy_level = 'public' then location
    else null
  end as location,
  case
    when privacy_level = 'nda_full' then null
    else cover_image
  end as cover_image,
  case
    when privacy_level = 'public' then images
    when privacy_level = 'nda_partial' then coalesce(nullif(blurred_images, '{}'::text[]), images)
    else '{}'::text[]
  end as images,
  status,
  privacy_level,
  is_featured,
  completed_at,
  date_trunc('year', completed_at)::date as completed_year,
  created_at,
  updated_at
from projects
where status <> 'concept' or is_featured = true;

alter table orders enable row level security;
alter table order_status_history enable row level security;
alter table order_photos enable row level security;
alter table order_documents enable row level security;
alter table order_messages enable row level security;
alter table order_notifications enable row level security;
alter table price_presets enable row level security;
alter table price_formulas enable row level security;
alter table formula_components enable row level security;
alter table order_calculations enable row level security;
alter table audit_log enable row level security;

drop policy if exists "orders_client_read" on orders;
create policy "orders_client_read"
  on orders for select
  using (auth.uid() = user_id and status <> 'archived');

drop policy if exists "orders_client_update_self" on orders;
create policy "orders_client_update_self"
  on orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "order_status_history_client_read" on order_status_history;
create policy "order_status_history_client_read"
  on order_status_history for select
  using (
    is_visible_to_client = true and exists (
      select 1
      from orders
      where orders.id = order_status_history.order_id
        and orders.user_id = auth.uid()
        and orders.status <> 'archived'
    )
  );

drop policy if exists "order_photos_client_read" on order_photos;
create policy "order_photos_client_read"
  on order_photos for select
  using (
    exists (
      select 1
      from orders
      where orders.id = order_photos.order_id
        and orders.user_id = auth.uid()
        and orders.status <> 'archived'
    )
  );

drop policy if exists "order_documents_client_read" on order_documents;
create policy "order_documents_client_read"
  on order_documents for select
  using (
    exists (
      select 1
      from orders
      where orders.id = order_documents.order_id
        and orders.user_id = auth.uid()
        and orders.status <> 'archived'
    )
  );

drop policy if exists "order_messages_client_read" on order_messages;
create policy "order_messages_client_read"
  on order_messages for select
  using (
    exists (
      select 1
      from orders
      where orders.id = order_messages.order_id
        and orders.user_id = auth.uid()
        and orders.status <> 'archived'
    )
  );

drop policy if exists "order_messages_client_insert" on order_messages;
create policy "order_messages_client_insert"
  on order_messages for insert
  with check (
    sender_type = 'client' and
    sender_id = auth.uid() and
    exists (
      select 1
      from orders
      where orders.id = order_messages.order_id
        and orders.user_id = auth.uid()
        and orders.status <> 'archived'
    )
  );

drop policy if exists "order_notifications_client_read" on order_notifications;
create policy "order_notifications_client_read"
  on order_notifications for select
  using (auth.uid() = user_id);

drop policy if exists "order_notifications_client_update" on order_notifications;
create policy "order_notifications_client_update"
  on order_notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
