-- 1. Переконатись що всі таблиці мають updated_at тригери
-- Перевірка (виконай вручну у Supabase SQL Editor):
SELECT
  t.table_name,
  CASE WHEN tr.trigger_name IS NOT NULL THEN 'ТАК' ELSE 'НІ' END as has_updated_at_trigger
FROM information_schema.tables t
LEFT JOIN information_schema.triggers tr
  ON tr.event_object_table = t.table_name
  AND tr.trigger_name LIKE '%updated_at%'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- 2. Переконатись що всі таблиці мають RLS увімкнений
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Додати відсутні індекси для продуктивності
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_inquiries_created_at on public.inquiries(created_at desc);
create index if not exists idx_blog_posts_updated_at on public.blog_posts(updated_at desc);
create index if not exists idx_cultural_posts_updated_at on public.cultural_blog_posts(updated_at desc);
create index if not exists idx_products_category on public.products(category, status, sort_order);
create index if not exists idx_support_chats_user_status on public.support_chats(user_id, status, last_message_at desc);

-- 4. Перевірка і виправлення nullable phone у inquiries
-- (має бути вже зроблено у міграції 0006, але перевіряємо)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'inquiries'
      and column_name = 'phone'
      and is_nullable = 'NO'
  ) then
    alter table public.inquiries alter column phone drop not null;
    raise notice 'phone column made nullable';
  else
    raise notice 'phone column already nullable';
  end if;
end $$;

-- 5. View для зручного перегляду замовлень з клієнтами
create or replace view public.orders_with_clients as
select
  o.id,
  o.order_number,
  o.status,
  o.priority,
  o.expected_date,
  o.actual_date,
  o.internal_notes,
  o.created_at,
  o.updated_at,
  i.name as client_name,
  i.phone as client_phone,
  i.email as client_email,
  i.service_type,
  up.display_name as registered_client_name,
  p.title as product_title
from public.orders o
left join public.inquiries i on i.id = o.inquiry_id
left join public.user_profiles up on up.id = o.user_id
left join public.products p on p.id = o.product_id;

-- 6. Функція для отримання статистики по замовленнях (для дашборду)
create or replace function public.get_orders_summary()
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total', count(*),
    'active', count(*) filter (where status not in ('completed', 'archived')),
    'completed_this_month', count(*) filter (
      where status = 'completed'
      and date_trunc('month', updated_at) = date_trunc('month', now())
    ),
    'urgent', count(*) filter (where priority = 'urgent' and status not in ('completed', 'archived'))
  )
  into result
  from public.orders;

  return result;
end;
$$ language plpgsql security definer set search_path = public;
