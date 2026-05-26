-- Research pipeline tables for agent-led product discovery and review.

create table public.product_research_runs (
  id uuid primary key default gen_random_uuid(),
  seed_company_name text,
  seed_category text,
  max_products integer not null default 5,
  status text not null default 'queued'
    constraint product_research_runs_status_check
      check (status in (
        'queued', 'discovering', 'researching', 'screenshots',
        'needs_review', 'approved', 'rejected', 'published', 'failed'
      )),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_research_runs_status_idx on public.product_research_runs (status);

create table public.product_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.product_research_runs (id) on delete cascade,
  product_slug text not null,
  name text not null,
  parent_company_id text references public.company_profiles (id) on delete set null,
  category text not null default '',
  screen_type_guess text not null default '',
  official_url text,
  popularity_score numeric(4, 2),
  meme_score numeric(4, 2),
  rejection_reason text,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_candidates_run_slug_unique unique (run_id, product_slug)
);

create table public.product_profile_drafts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.product_research_runs (id) on delete set null,
  candidate_id uuid references public.product_candidates (id) on delete set null,
  product_slug text not null,
  name text not null,
  parent_company_id text references public.company_profiles (id) on delete set null,
  category text not null default '',
  screen_type text not null default '',
  popularity_tier integer not null default 2,
  meme_strength integer not null default 3,
  style_dna jsonb not null default '{}'::jsonb,
  archetype jsonb not null default '{}'::jsonb,
  default_vibe_tags jsonb not null default '[]'::jsonb,
  research_status text not null default 'needs_review',
  rejection_reason text,
  published_profile_id text references public.company_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_profile_drafts_run_slug_unique unique (run_id, product_slug)
);

create table public.product_draft_citations (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.product_profile_drafts (id) on delete cascade,
  url text not null,
  citation_type text not null default 'official',
  snippet text,
  confidence numeric(4, 2),
  created_at timestamptz not null default now()
);

create table public.product_screenshot_candidates (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.product_profile_drafts (id) on delete cascade,
  source_url text not null,
  storage_path text,
  viewport text,
  capture_status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

alter table public.product_research_runs enable row level security;
alter table public.product_candidates enable row level security;
alter table public.product_profile_drafts enable row level security;
alter table public.product_draft_citations enable row level security;
alter table public.product_screenshot_candidates enable row level security;
