-- 0013: Orders -> Projects -> Products hierarchy + company info

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_project_id
  ON public.orders(project_id)
  WHERE project_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_service_role" ON public.order_items;
CREATE POLICY "order_items_service_role" ON public.order_items
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "order_items_client_read" ON public.order_items;
CREATE POLICY "order_items_client_read" ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Світлиця Майстра',
  tagline TEXT,
  description TEXT,
  founded_year INTEGER,
  email TEXT,
  phone TEXT,
  phone_secondary TEXT,
  address TEXT,
  city TEXT DEFAULT 'Київ',
  country TEXT DEFAULT 'Україна',
  working_hours TEXT DEFAULT 'Пн-Пт 9:00-18:00',
  logo_url TEXT,
  og_image_url TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_youtube TEXT,
  social_tiktok TEXT,
  team_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  certificates JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_info_public_read" ON public.company_info;
CREATE POLICY "company_info_public_read" ON public.company_info
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "company_info_service_role" ON public.company_info;
CREATE POLICY "company_info_service_role" ON public.company_info
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

INSERT INTO public.company_info (
  name,
  tagline,
  description,
  founded_year,
  city,
  country,
  working_hours
)
SELECT
  'Світлиця Майстра',
  'Авторські двері та меблі з натурального дерева',
  'Майстерня Світлиця Майстра створює двері, меблі та вікна, які служать десятиліттями.',
  2015,
  'Київ',
  'Україна',
  'Пн-Пт 9:00-18:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.company_info
);
