-- Dodo Payments integration: customer mapping + webhook idempotency receipts

-- 1) Customer mapping: public.dodo_customers
--    Maps Supabase user_id -> Dodo customer_id and stores latest email for convenience.
create table if not exists public.dodo_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  customer_id text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.dodo_customers_set_updated_at ()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists dodo_customers_set_updated_at on public.dodo_customers;
create trigger dodo_customers_set_updated_at
  before update on public.dodo_customers
  for each row execute function public.dodo_customers_set_updated_at();

-- 2) Webhook idempotency: public.dodo_webhook_receipts
--    Stores 'webhook-id' header to make processing idempotent.
create table if not exists public.dodo_webhook_receipts (
  id text primary key,              -- the 'webhook-id' header value
  received_at timestamptz not null default now()
);

-- RLS and grants
alter table public.dodo_customers enable row level security;
alter table public.dodo_webhook_receipts enable row level security;

-- Allow authenticated users to read their own mapping (for UI).
create policy dodo_customers_select_own
  on public.dodo_customers
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Only service_role should write mappings via server handlers/webhooks.
create policy dodo_customers_modify_service
  on public.dodo_customers
  for insert
  to service_role
  with check (true);

create policy dodo_customers_update_service
  on public.dodo_customers
  for update
  to service_role
  using (true)
  with check (true);

-- Webhook receipts are only touched by service_role
create policy dodo_webhook_receipts_rw_service
  on public.dodo_webhook_receipts
  for all
  to service_role
  using (true)
  with check (true);

-- Grants
grant select on table public.dodo_customers to authenticated;
grant all on table public.dodo_customers to service_role;

grant all on table public.dodo_webhook_receipts to service_role;

-- Helpful indexes
create index if not exists dodo_customers_customer_id_idx on public.dodo_customers (customer_id);