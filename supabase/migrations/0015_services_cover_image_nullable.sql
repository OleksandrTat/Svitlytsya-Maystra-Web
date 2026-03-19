-- 0015: allow services without a cover image

alter table public.services
  alter column cover_image drop not null;
