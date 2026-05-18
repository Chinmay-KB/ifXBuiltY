-- Add product-level metadata columns to company_profiles.
-- Products are stored as first-class company_profiles rows with parent_company_id
-- pointing to their parent company (also a company_profiles row).
--
-- This implements Option A from the product expansion plan:
-- products behave exactly like companies, with parent context stored inline.

-- ---------------------------------------------------------------------------
-- New columns
-- ---------------------------------------------------------------------------

-- Parent company reference (nullable — companies have no parent)
alter table public.company_profiles
  add column parent_company_id text
    references public.company_profiles (id) on delete set null;

-- Profile type: 'company' or 'product'
alter table public.company_profiles
  add column profile_type text not null default 'company'
    constraint company_profiles_profile_type_check
      check (profile_type in ('company', 'product'));

-- Product category (search, video, maps, payments, docs, IDE, etc.)
alter table public.company_profiles
  add column category text not null default ''
    constraint company_profiles_category_length
      check (char_length(category) <= 50);

-- Popularity tier: 1 = core, 2 = strong, 3 = niche-but-memeable
alter table public.company_profiles
  add column popularity_tier integer not null default 2
    constraint company_profiles_popularity_tier_check
      check (popularity_tier in (1, 2, 3));

-- Research status: seed, researched, reviewed, approved, rejected
alter table public.company_profiles
  add column research_status text not null default 'approved'
    constraint company_profiles_research_status_check
      check (research_status in ('seed', 'researched', 'reviewed', 'approved', 'rejected'));

-- Source URLs used during research (JSONB array of strings)
alter table public.company_profiles
  add column source_urls jsonb not null default '[]'::jsonb;

-- Meme strength score (1-5, higher = more meme potential)
alter table public.company_profiles
  add column meme_strength integer not null default 3
    constraint company_profiles_meme_strength_check
      check (meme_strength between 1 and 5);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Fast lookup by parent company
create index company_profiles_parent_company_id_idx
  on public.company_profiles (parent_company_id);

-- Filter by profile type
create index company_profiles_profile_type_idx
  on public.company_profiles (profile_type);

-- Filter by research status
create index company_profiles_research_status_idx
  on public.company_profiles (research_status);

-- Filter by category
create index company_profiles_category_idx
  on public.company_profiles (category);

-- ---------------------------------------------------------------------------
-- Seed: mark existing rows as 'company' type with approved status
-- ---------------------------------------------------------------------------

update public.company_profiles
set profile_type = 'company',
    research_status = 'approved'
where profile_type = 'company';

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

comment on column public.company_profiles.parent_company_id is 'Parent company for product profiles; null for company-level profiles.';
comment on column public.company_profiles.profile_type is 'Either "company" or "product".';
comment on column public.company_profiles.category is 'Product category: search, video, maps, payments, docs, IDE, OS, commerce, social, etc.';
comment on column public.company_profiles.popularity_tier is '1 = core product, 2 = strong, 3 = niche-but-memeable.';
comment on column public.company_profiles.research_status is 'Research pipeline status: seed, researched, reviewed, approved, rejected.';
comment on column public.company_profiles.source_urls is 'JSONB array of URLs used as research sources.';
comment on column public.company_profiles.meme_strength is 'Meme potential score 1-5, higher = more meme-worthy.';
