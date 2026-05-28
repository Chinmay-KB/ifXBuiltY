-- Admin model testing: model catalog + per-model test runs (superadmin-only)

-- ---------------------------------------------------------------------------
-- Helper: superadmin check (email-based, matches src/lib/admin-constants.ts)
-- ---------------------------------------------------------------------------

create or replace function public.is_superadmin_email ()
returns boolean
language sql
stable
set search_path = ''
as $$
  select (auth.jwt() ->> 'email') = 'chinmaykabi@gmail.com'
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.admin_image_models (
  id bigint generated always as identity primary key,
  provider_model text not null,
  label text not null default '',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint admin_image_models_provider_model_unique unique (provider_model),
  constraint admin_image_models_provider_model_nonempty check (char_length(trim(provider_model)) > 0)
);

create table public.admin_model_test_runs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,

  -- prompt inputs (mirrors generations)
  builder text not null default '',
  target text not null default '',
  tone text not null default '',
  screen_type text not null default '',
  extra_details text not null default '',
  generated_prompt text,

  -- model execution
  model text not null,
  quality text not null default 'high'
    constraint admin_model_test_runs_quality_ck check (quality in ('low', 'medium', 'high')),
  status text not null default 'queued'
    constraint admin_model_test_runs_status_ck check (status in ('queued', 'processing', 'completed', 'failed')),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,

  -- image output (stored in same bucket as normal generations)
  image_path text,
  image_ready boolean not null default false,

  -- publishing linkage
  publish_state text not null default 'draft'
    constraint admin_model_test_runs_publish_state_ck check (publish_state in ('draft', 'published')),
  published_generation_id bigint references public.generations (id) on delete set null,

  created_at timestamptz not null default now()
);

comment on table public.admin_image_models is 'Admin-managed list of available image models for comparison runs.';
comment on table public.admin_model_test_runs is 'Admin-only per-model test runs with prompt + timing; can be promoted to public.generations.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index admin_image_models_enabled_sort_idx
  on public.admin_image_models (enabled desc, sort_order asc, id asc);

create index admin_model_test_runs_created_at_idx
  on public.admin_model_test_runs (created_at desc);

create index admin_model_test_runs_status_idx
  on public.admin_model_test_runs (status);

create index admin_model_test_runs_publish_state_idx
  on public.admin_model_test_runs (publish_state);

create index admin_model_test_runs_model_idx
  on public.admin_model_test_runs (model);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.admin_image_models enable row level security;
alter table public.admin_model_test_runs enable row level security;

create policy admin_image_models_all_superadmin
  on public.admin_image_models
  for all
  to authenticated
  using (public.is_superadmin_email())
  with check (public.is_superadmin_email());

create policy admin_model_test_runs_all_superadmin
  on public.admin_model_test_runs
  for all
  to authenticated
  using (public.is_superadmin_email())
  with check (public.is_superadmin_email());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on table public.admin_image_models to authenticated;
grant all on table public.admin_image_models to service_role;

grant select, insert, update, delete on table public.admin_model_test_runs to authenticated;
grant all on table public.admin_model_test_runs to service_role;

grant usage, select on sequence public.admin_image_models_id_seq to authenticated;
grant all on sequence public.admin_image_models_id_seq to service_role;

-- ---------------------------------------------------------------------------
-- Seed initial model list
-- ---------------------------------------------------------------------------

insert into public.admin_image_models (provider_model, label, enabled, sort_order)
values
  ('google/gemini-3.1-flash-image-preview', 'Gemini 3.1 Flash (preview)', true, 10),
  ('openai/gpt-image-2', 'GPT Image 2', true, 20),
  ('google/gemini-2.5-flash-image', 'Gemini 2.5 Flash Image', true, 30),
  ('bytedance/seedream-5.0-lite', 'Seedream 5.0 Lite', true, 40),
  ('xai/grok-imagine-image', 'Grok Imagine', true, 50)
on conflict (provider_model) do nothing;

