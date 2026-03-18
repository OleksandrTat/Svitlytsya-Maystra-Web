-- 0011: Admin UX improvements
-- - product_attributes: styles/materials library per category
-- - products.priority: 1-10 int priority field
-- - projects: SEO fields for admin popup

create table if not exists public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  type text not null check (type in ('style', 'material')),
  value text not null,
  usage_count integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (category, type, value)
);

alter table public.product_attributes enable row level security;

create policy "product_attributes_public_read"
  on public.product_attributes for select
  to anon, authenticated using (true);

create policy "product_attributes_service_role_write"
  on public.product_attributes for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists idx_product_attributes_category_type
  on public.product_attributes (category, type, usage_count desc);

insert into public.product_attributes (category, type, value) values
  ('doors', 'style', 'класика'),
  ('doors', 'style', 'модерн'),
  ('doors', 'style', 'мінімалізм'),
  ('doors', 'style', 'скандинавський'),
  ('doors', 'style', 'лофт'),
  ('doors', 'material', 'дуб'),
  ('doors', 'material', 'ясен'),
  ('doors', 'material', 'сосна'),
  ('doors', 'material', 'метал'),
  ('doors', 'material', 'скло'),
  ('furniture', 'style', 'класика'),
  ('furniture', 'style', 'мінімалізм'),
  ('furniture', 'style', 'лофт'),
  ('furniture', 'material', 'дуб'),
  ('furniture', 'material', 'ясен'),
  ('furniture', 'material', 'МДФ'),
  ('furniture', 'material', 'метал'),
  ('windows', 'style', 'класика'),
  ('windows', 'style', 'мінімалізм'),
  ('windows', 'material', 'ПВХ'),
  ('windows', 'material', 'алюміній'),
  ('windows', 'material', 'дерево'),
  ('restoration', 'style', 'класика'),
  ('restoration', 'material', 'дуб'),
  ('restoration', 'material', 'сосна')
on conflict (category, type, value) do nothing;

alter table public.products
  add column if not exists priority integer not null default 5
    check (priority between 1 and 10);

create index if not exists idx_products_priority
  on public.products (priority desc, created_at desc);

alter table public.projects
  add column if not exists seo_title text,
  add column if not exists seo_description text;

create or replace function public.sync_product_attributes()
returns trigger as $$
declare
  v_category text;
  v_style text;
  v_material text;
begin
  v_category := new.category;

  foreach v_style in array new.style loop
    insert into public.product_attributes (category, type, value, usage_count)
    values (v_category, 'style', v_style, 1)
    on conflict (category, type, value)
    do update set
      usage_count = product_attributes.usage_count + 1,
      updated_at = timezone('utc', now());
  end loop;

  foreach v_material in array new.materials loop
    insert into public.product_attributes (category, type, value, usage_count)
    values (v_category, 'material', v_material, 1)
    on conflict (category, type, value)
    do update set
      usage_count = product_attributes.usage_count + 1,
      updated_at = timezone('utc', now());
  end loop;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists sync_product_attributes_trigger on public.products;
create trigger sync_product_attributes_trigger
  after insert or update of style, materials, category on public.products
  for each row execute procedure public.sync_product_attributes();
