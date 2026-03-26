-- ============================================================
-- BLOG: RLS, POLICIES, FUNCTIONS, INDEXES, TRIGGERS
-- ============================================================

-- 1. УВІМКНУТИ RLS
-- ============================================================
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES
-- ============================================================

-- Публічний читач може бачити тільки опубліковані пости
CREATE POLICY "blog_posts_public_read"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Адміни (service role) можуть робити все
CREATE POLICY "blog_posts_admin_all"
  ON public.blog_posts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. INDEXES для швидкого пошуку
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON public.blog_posts (is_published, published_at DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_blog_posts_category
  ON public.blog_posts (category, is_published, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_featured
  ON public.blog_posts (is_featured, is_published, published_at DESC)
  WHERE is_featured = true AND is_published = true;

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug
  ON public.blog_posts (slug);

-- Full text search індекс (українська мова)
CREATE INDEX IF NOT EXISTS idx_blog_posts_fts
  ON public.blog_posts
  USING gin(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')));

-- 4. ФУНКЦІЯ: Збільшити лічильник переглядів
-- ============================================================
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.blog_posts
  SET views_count = views_count + 1
  WHERE slug = post_slug
    AND is_published = true;
END;
$$;

-- Дати доступ анонімним користувачам до функції
GRANT EXECUTE ON FUNCTION increment_blog_post_views(text) TO anon, authenticated;

-- 5. ФУНКЦІЯ: Збільшити лічильник лайків
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_blog_post_like(post_slug text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.blog_posts
  SET likes_count = likes_count + 1
  WHERE slug = post_slug
    AND is_published = true
  RETURNING likes_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_blog_post_like(text) TO anon, authenticated;

-- 6. ФУНКЦІЯ: Повнотекстовий пошук
-- ============================================================
CREATE OR REPLACE FUNCTION search_blog_posts(search_query text, result_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  cover_image text,
  category text,
  tags text[],
  reading_time_min integer,
  published_at timestamptz,
  author_name text,
  rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.id,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.cover_image,
    bp.category,
    bp.tags,
    bp.reading_time_min,
    bp.published_at,
    bp.author_name,
    ts_rank(
      to_tsvector('simple', coalesce(bp.title, '') || ' ' || coalesce(bp.excerpt, '') || ' ' || coalesce(bp.content, '')),
      plainto_tsquery('simple', search_query)
    ) AS rank
  FROM public.blog_posts bp
  WHERE
    bp.is_published = true
    AND to_tsvector('simple', coalesce(bp.title, '') || ' ' || coalesce(bp.excerpt, '') || ' ' || coalesce(bp.content, ''))
      @@ plainto_tsquery('simple', search_query)
  ORDER BY rank DESC, bp.published_at DESC
  LIMIT result_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION search_blog_posts(text, int) TO anon, authenticated;

-- 7. TRIGGER: автоматично встановлювати published_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_blog_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Якщо пост щойно опублікований і published_at не встановлено
  IF NEW.is_published = true AND OLD.is_published = false AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  -- Завжди оновлювати updated_at
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_blog_published_at ON public.blog_posts;
CREATE TRIGGER trigger_blog_published_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_blog_published_at();

-- 8. TRIGGER для INSERT: встановити published_at при створенні одразу опублікованого поста
-- ============================================================
CREATE OR REPLACE FUNCTION set_blog_published_at_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_published = true AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_blog_published_at_insert ON public.blog_posts;
CREATE TRIGGER trigger_blog_published_at_insert
  BEFORE INSERT ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_blog_published_at_on_insert();

-- 9. ФУНКЦІЯ: Отримати схожі пости (по тегах та категорії)
-- ============================================================
CREATE OR REPLACE FUNCTION get_related_blog_posts(
  current_slug text,
  post_category text,
  post_tags text[],
  result_limit int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  cover_image text,
  category text,
  reading_time_min integer,
  published_at timestamptz,
  author_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.id, bp.title, bp.slug, bp.excerpt,
    bp.cover_image, bp.category, bp.reading_time_min,
    bp.published_at, bp.author_name
  FROM public.blog_posts bp
  WHERE
    bp.is_published = true
    AND bp.slug != current_slug
    AND (
      bp.category = post_category
      OR bp.tags && post_tags  -- перетин масивів тегів
    )
  ORDER BY
    (CASE WHEN bp.category = post_category THEN 1 ELSE 0 END +
     array_length(ARRAY(SELECT unnest(bp.tags) INTERSECT SELECT unnest(post_tags)), 1)) DESC,
    bp.published_at DESC
  LIMIT result_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_related_blog_posts(text, text, text[], int) TO anon, authenticated;

-- 10. VIEWS — статистика для адмін дашборду
-- ============================================================
CREATE OR REPLACE VIEW public.blog_stats AS
SELECT
  COUNT(*) FILTER (WHERE is_published = true) as published_count,
  COUNT(*) FILTER (WHERE is_published = false) as draft_count,
  COUNT(*) FILTER (WHERE is_featured = true AND is_published = true) as featured_count,
  SUM(views_count) as total_views,
  SUM(likes_count) as total_likes,
  COUNT(DISTINCT category) as categories_count
FROM public.blog_posts;
