create table if not exists public.rate_limit_store (
  key text primary key,
  timestamps timestamptz[] not null default '{}',
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.cleanup_rate_limit_store()
returns void as $$
begin
  delete from public.rate_limit_store
  where updated_at < timezone('utc', now()) - interval '1 hour';
end;
$$ language plpgsql security definer set search_path = public;

alter table public.rate_limit_store enable row level security;

create policy "rate_limit_service_role"
  on public.rate_limit_store for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.update_chat_session_messages_count()
returns trigger as $$
begin
  update public.ai_chat_sessions
  set
    messages_count = (
      select count(*)
      from public.ai_chat_messages
      where chat_session_id = new.chat_session_id
    ),
    last_message_at = new.created_at
  where id = new.chat_session_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists update_chat_messages_count on public.ai_chat_messages;
create trigger update_chat_messages_count
  after insert on public.ai_chat_messages
  for each row execute procedure public.update_chat_session_messages_count();
