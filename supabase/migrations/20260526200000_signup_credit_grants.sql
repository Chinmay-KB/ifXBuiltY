-- One-time credit grant audit log (signup bonus, promos, etc.)

create table if not exists public.credit_grants (
  user_id uuid not null references auth.users (id) on delete cascade,
  grant_type text not null,
  amount integer not null check (amount > 0),
  dodo_customer_id text,
  dodo_ledger_entry_id text,
  granted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, grant_type)
);

comment on table public.credit_grants is 'Tracks one-time credit grants per user (e.g. signup_bonus).';
comment on column public.credit_grants.grant_type is 'Grant identifier, e.g. signup_bonus.';

create index if not exists credit_grants_grant_type_idx on public.credit_grants (grant_type);

alter table public.credit_grants enable row level security;

-- Users may read their own grant history (optional UI/debug).
create policy credit_grants_select_own
  on public.credit_grants
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Only service_role writes grants via server handlers.
create policy credit_grants_modify_service
  on public.credit_grants
  for all
  to service_role
  using (true)
  with check (true);

grant select on table public.credit_grants to authenticated;
grant all on table public.credit_grants to service_role;
