-- Phase 6: inquiry status extensions and client invitations

-- Extend inquiry_status enum with new values
alter type inquiry_status add value if not exists 'contacted';
alter type inquiry_status add value if not exists 'quoted';
alter type inquiry_status add value if not exists 'won';
alter type inquiry_status add value if not exists 'lost';

-- Client invitations table
create table if not exists public.client_invitations (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references public.inquiries(id) on delete set null,
  email text not null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  status text not null default 'pending',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '7 days'),
  accepted_at timestamptz
);

create index if not exists idx_client_invitations_token on public.client_invitations(token);
create index if not exists idx_client_invitations_email on public.client_invitations(email);
create index if not exists idx_client_invitations_inquiry on public.client_invitations(inquiry_id);

alter table public.client_invitations enable row level security;

create policy "client_invitations_service_role"
  on public.client_invitations for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
