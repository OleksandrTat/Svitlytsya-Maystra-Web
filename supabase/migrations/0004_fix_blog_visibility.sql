alter table if exists blog_posts enable row level security;
alter table if exists cultural_blog_posts enable row level security;

drop policy if exists "blog_posts_public_read" on blog_posts;
create policy "blog_posts_public_read"
  on blog_posts
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "blog_posts_authenticated_read_all" on blog_posts;
create policy "blog_posts_authenticated_read_all"
  on blog_posts
  for select
  to authenticated
  using (true);

drop policy if exists "blog_posts_owner_write" on blog_posts;
create policy "blog_posts_owner_write"
  on blog_posts
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "cultural_blog_posts_public_read" on cultural_blog_posts;
create policy "cultural_blog_posts_public_read"
  on cultural_blog_posts
  for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "cultural_blog_posts_authenticated_read_all" on cultural_blog_posts;
create policy "cultural_blog_posts_authenticated_read_all"
  on cultural_blog_posts
  for select
  to authenticated
  using (true);

drop policy if exists "cultural_blog_posts_owner_write" on cultural_blog_posts;
create policy "cultural_blog_posts_owner_write"
  on cultural_blog_posts
  for all
  to authenticated
  using (true)
  with check (true);

