-- Phase 7: support messaging and admin push subscriptions

do $$ begin
  create type support_channel as enum (
    'internal',
    'email',
    'viber',
    'whatsapp'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type support_chat_status as enum (
    'open',
    'waiting',
    'resolved',
    'closed'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.support_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  subject text,
  channel support_channel not null default 'internal',
  status support_chat_status not null default 'open',
  preferred_contact text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_message_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz
);

do $$ begin
  create type support_message_sender as enum ('client', 'admin', 'system');
exception when duplicate_object then null; end $$;

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.support_chats(id) on delete cascade,
  sender_type support_message_sender not null,
  sender_id uuid references auth.users(id) on delete set null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Triggers

drop trigger if exists set_support_chats_updated_at on public.support_chats;
create trigger set_support_chats_updated_at
  before update on public.support_chats
  for each row execute procedure public.set_updated_at();

create or replace function public.update_support_chat_last_message()
returns trigger as $$
begin
  update public.support_chats
  set last_message_at = new.created_at, status = 'waiting'
  where id = new.chat_id and new.sender_type = 'client';
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists after_support_message_insert on public.support_messages;
create trigger after_support_message_insert
  after insert on public.support_messages
  for each row execute procedure public.update_support_chat_last_message();

-- Indexes
create index if not exists idx_support_chats_user on public.support_chats(user_id, status);
create index if not exists idx_support_chats_status on public.support_chats(status, last_message_at desc);
create index if not exists idx_support_messages_chat on public.support_messages(chat_id, created_at asc);
create index if not exists idx_support_messages_unread on public.support_messages(chat_id, is_read) where is_read = false;

-- RLS
alter table public.support_chats enable row level security;
alter table public.support_messages enable row level security;
alter table public.admin_push_subscriptions enable row level security;

create policy "support_chats_owner_select"
  on public.support_chats for select
  to authenticated
  using (auth.uid() = user_id);

create policy "support_chats_owner_insert"
  on public.support_chats for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "support_chats_owner_update"
  on public.support_chats for update
  to authenticated
  using (auth.uid() = user_id);

create policy "support_chats_service_role"
  on public.support_chats for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "support_messages_owner_select"
  on public.support_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.support_chats
      where support_chats.id = support_messages.chat_id
        and support_chats.user_id = auth.uid()
    )
  );

create policy "support_messages_owner_insert"
  on public.support_messages for insert
  to authenticated
  with check (
    sender_type = 'client'
    and sender_id = auth.uid()
    and exists (
      select 1 from public.support_chats
      where support_chats.id = support_messages.chat_id
        and support_chats.user_id = auth.uid()
    )
  );

create policy "support_messages_service_role"
  on public.support_messages for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "push_subscriptions_owner"
  on public.admin_push_subscriptions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
