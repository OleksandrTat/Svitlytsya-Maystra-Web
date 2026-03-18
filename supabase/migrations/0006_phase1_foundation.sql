-- Phase 1: Foundation (products, project_products, invoices, payments)

do $$ begin
  create type product_status as enum ('active', 'draft', 'archived');
exception when duplicate_object then null; end $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  short_description text,
  category text not null, -- 'doors' | 'furniture' | 'windows' | 'restoration'
  materials text[] not null default '{}',
  style text[] not null default '{}',
  cover_image text,
  images text[] not null default '{}',
  price_from numeric(12, 2),
  formula_id uuid references public.price_formulas(id) on delete set null,
  status product_status not null default 'draft',
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

create index if not exists idx_products_category_status on public.products(category, status);
create index if not exists idx_products_sort on public.products(sort_order asc);
create index if not exists idx_products_featured on public.products(is_featured) where is_featured = true;

-- project_products (many-to-many)
create table if not exists public.project_products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique(project_id, product_id)
);

create index if not exists idx_project_products_project on public.project_products(project_id);
create index if not exists idx_project_products_product on public.project_products(product_id);

-- invoices & payments

do $$ begin
  create type invoice_status as enum ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cash', 'bank_transfer', 'card', 'other');
exception when duplicate_object then null; end $$;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  order_id uuid not null references public.orders(id) on delete restrict,
  total numeric(12, 2) not null check (total >= 0),
  paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0),
  status invoice_status not null default 'draft',
  due_date date,
  notes text,
  issued_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create sequence if not exists invoice_number_seq start 1;

create or replace function public.generate_invoice_number()
returns text as $$
declare
  current_year text;
  seq_number bigint;
begin
  current_year := to_char(timezone('utc', now()), 'YYYY');
  seq_number := nextval('invoice_number_seq');
  return format('INV-%s-%s', current_year, lpad(seq_number::text, 4, '0'));
end;
$$ language plpgsql;

alter table public.invoices alter column invoice_number set default public.generate_invoice_number();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  method payment_method not null default 'bank_transfer',
  notes text,
  paid_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
  before update on public.invoices
  for each row execute procedure public.set_updated_at();

-- Auto-update paid_amount and status in invoice after payment
create or replace function public.update_invoice_after_payment()
returns trigger as $$
declare
  total_paid numeric(12, 2);
  inv record;
begin
  select sum(amount) into total_paid
  from public.payments
  where invoice_id = new.invoice_id;

  select total, due_date into inv
  from public.invoices
  where id = new.invoice_id;

  update public.invoices set
    paid_amount = coalesce(total_paid, 0),
    status = case
      when coalesce(total_paid, 0) >= inv.total then 'paid'
      when coalesce(total_paid, 0) > 0 then 'partial'
      when inv.due_date is not null and inv.due_date < current_date then 'overdue'
      else status
    end,
    paid_at = case
      when coalesce(total_paid, 0) >= inv.total then now()
      else null
    end
  where id = new.invoice_id;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists after_payment_insert on public.payments;
create trigger after_payment_insert
  after insert on public.payments
  for each row execute procedure public.update_invoice_after_payment();

create index if not exists idx_invoices_order on public.invoices(order_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_payments_invoice on public.payments(invoice_id);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_payments_paid_at on public.payments(paid_at desc);

-- updates to existing tables
-- projects: add sort_order
alter table public.projects add column if not exists sort_order integer not null default 0;
create index if not exists idx_projects_sort on public.projects(sort_order asc);

-- inquiries: phone nullable, add channel
alter table public.inquiries alter column phone drop not null;

do $$ begin
  create type inquiry_channel as enum ('web_form', 'ai_chat', 'phone', 'direct', 'referral');
exception when duplicate_object then null; end $$;

alter table public.inquiries add column if not exists channel inquiry_channel not null default 'web_form';

create index if not exists idx_inquiries_phone on public.inquiries(phone) where phone is not null;
create index if not exists idx_inquiries_email on public.inquiries(email) where email is not null;

-- orders: product link
alter table public.orders add column if not exists product_id uuid references public.products(id) on delete set null;
create index if not exists idx_orders_product on public.orders(product_id) where product_id is not null;

-- formula_components: add updated_at
alter table public.formula_components add column if not exists updated_at timestamptz not null default timezone('utc', now());

drop trigger if exists set_formula_components_updated_at on public.formula_components;
create trigger set_formula_components_updated_at
  before update on public.formula_components
  for each row execute procedure public.set_updated_at();

-- user_profiles: index for last_seen_at
create index if not exists idx_user_profiles_last_seen on public.user_profiles(last_seen_at desc);

-- RLS fixes
-- projects: only service_role or admin can write
-- remove old broad policy

drop policy if exists "projects_owner_write" on public.projects;

create policy "projects_service_role_write"
  on public.projects for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- products RLS
alter table public.products enable row level security;

create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (status = 'active');

create policy "products_authenticated_read_all"
  on public.products for select
  to authenticated
  using (true);

create policy "products_service_role_write"
  on public.products for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- project_products RLS
alter table public.project_products enable row level security;

create policy "project_products_public_read"
  on public.project_products for select
  to anon, authenticated
  using (true);

create policy "project_products_service_role_write"
  on public.project_products for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- invoices RLS
alter table public.invoices enable row level security;

create policy "invoices_client_read"
  on public.invoices for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = invoices.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "invoices_service_role_all"
  on public.invoices for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- payments RLS
alter table public.payments enable row level security;

create policy "payments_client_read"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "payments_service_role_all"
  on public.payments for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
