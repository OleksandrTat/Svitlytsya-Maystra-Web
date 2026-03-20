-- 0016: remove subscriptions, analytics/content finance, and constructor modules

begin;

delete from storage.objects where bucket_id = 'blog-images';
delete from storage.buckets where id = 'blog-images';
delete from storage.objects where bucket_id = 'product-images' and name like 'constructor/%';

update public.user_profiles
set account_types = array_remove(coalesce(account_types, '{}'::text[]), 'email_subscriber')
where coalesce(account_types, '{}'::text[]) @> array['email_subscriber']::text[];

alter table if exists public.user_profiles
  drop column if exists email_preferences;

create or replace function public.handle_new_user_profile()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name, account_types)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    '{}'::text[]
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
drop trigger if exists set_cultural_blog_posts_updated_at on public.cultural_blog_posts;
drop trigger if exists blog_set_published_at on public.blog_posts;
drop trigger if exists set_email_subscribers_updated_at on public.email_subscribers;
drop trigger if exists set_email_campaigns_updated_at on public.email_campaigns;
drop trigger if exists set_email_sequences_updated_at on public.email_sequences;
drop trigger if exists set_invoices_updated_at on public.invoices;
drop trigger if exists after_payment_insert on public.payments;
drop trigger if exists set_product_configurations_updated_at on public.product_configurations;

drop function if exists public.set_blog_post_metadata() cascade;
drop function if exists public.generate_invoice_number() cascade;
drop function if exists public.update_invoice_after_payment() cascade;
drop sequence if exists public.invoice_number_seq;

drop table if exists public.blog_comments cascade;
drop table if exists public.cultural_blog_posts cascade;
drop table if exists public.blog_posts cascade;
drop table if exists public.email_sends cascade;
drop table if exists public.email_campaigns cascade;
drop table if exists public.email_sequences cascade;
drop table if exists public.email_subscribers cascade;
drop table if exists public.payments cascade;
drop table if exists public.invoices cascade;
drop table if exists public.admin_push_subscriptions cascade;
drop table if exists public.saved_configurations cascade;
drop table if exists public.product_configurations cascade;

drop type if exists public.blog_comment_status;
drop type if exists public.email_subscriber_status;
drop type if exists public.email_campaign_status;
drop type if exists public.invoice_status;
drop type if exists public.payment_method;

commit;
