-- ─────────────────────────────────────────────────────────────────────────────
-- 0014: Services & Blog posts (FINAL SAFE VERSION)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── SERVICES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT, -- ❗ вже НЕ NOT NULL
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS gallery TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'production',
  ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS process_steps JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS price_from NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS price_unit TEXT DEFAULT 'грн',
  ADD COLUMN IF NOT EXISTS duration_days_from INT,
  ADD COLUMN IF NOT EXISTS duration_days_to INT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- ❗ гарантуємо що description НЕ має NOT NULL
ALTER TABLE public.services
  ALTER COLUMN description DROP NOT NULL;

-- UNIQUE slug
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_slug_key'
  ) THEN
    ALTER TABLE public.services ADD CONSTRAINT services_slug_key UNIQUE (slug);
  END IF;
END $$;

-- RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_public_read" ON public.services;
CREATE POLICY "services_public_read"
  ON public.services FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "services_service_role" ON public.services;
CREATE POLICY "services_service_role"
  ON public.services FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_services_active
  ON public.services(is_active, sort_order);

-- Seed (тепер НЕ падає)
INSERT INTO public.services 
(title, slug, tagline, short_description, description, icon, category, sort_order, is_featured)
VALUES
('Авторські двері', 'dveri', 'Двері, що говорять про вас', 'Виготовляємо двері...', 'Індивідуальне виготовлення дерев''яних дверей.', '🚪', 'production', 1, TRUE),
('Меблі на замовлення', 'mebli', 'Кожна деталь — ваш задум', 'Меблі під замовлення...', 'Виготовлення меблів з масиву дерева.', '🪑', 'production', 2, TRUE),
('Вікна з дерева', 'vikna', 'Тепло та краса', 'Дерев''яні вікна...', 'Сучасні дерев''яні вікна.', '🪟', 'production', 3, FALSE),
('Реставрація', 'restavratsiya', 'Нове життя', 'Реставрація виробів...', 'Відновлення дерев''яних виробів.', '🔧', 'restoration', 4, FALSE),
('Консультація', 'konsultatsiya', 'Допоможемо', 'Консультація...', 'Допомога у виборі дизайну.', '💬', 'consultation', 5, FALSE),
('Монтаж', 'montazh', 'Професійно', 'Монтаж...', 'Встановлення виробів.', '🔩', 'installation', 6, FALSE)
ON CONFLICT (slug) DO NOTHING;


-- ── BLOG POSTS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS excerpt TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'tips',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL DEFAULT 'Команда Світлиці',
  ADD COLUMN IF NOT EXISTS author_avatar TEXT,
  ADD COLUMN IF NOT EXISTS reading_time_min INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS related_service_id UUID,
  ADD COLUMN IF NOT EXISTS related_product_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

-- FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blog_posts_related_service_id_fkey'
  ) THEN
    ALTER TABLE public.blog_posts
      ADD CONSTRAINT blog_posts_related_service_id_fkey
      FOREIGN KEY (related_service_id) REFERENCES public.services(id) ON DELETE SET NULL;
  END IF;
END $$;

-- RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_public_read" ON public.blog_posts;
CREATE POLICY "blog_public_read"
  ON public.blog_posts FOR SELECT
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "blog_service_role" ON public.blog_posts;
CREATE POLICY "blog_service_role"
  ON public.blog_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_published
  ON public.blog_posts(is_published, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_category
  ON public.blog_posts(category, is_published);

CREATE INDEX IF NOT EXISTS idx_blog_slug
  ON public.blog_posts(slug);

-- ── TRIGGERS ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published AND (OLD IS NULL OR NOT OLD.is_published) THEN
    NEW.published_at := COALESCE(NEW.published_at, timezone('utc', now()));
  END IF;
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_set_published_at ON public.blog_posts;

CREATE TRIGGER blog_set_published_at
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_published_at();


CREATE OR REPLACE FUNCTION public.services_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_updated_at ON public.services;

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.services_set_updated_at();