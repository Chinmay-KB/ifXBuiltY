-- Company profiles and screenshots tables for the admin panel.
-- Migrates company data from static JSON to a managed Supabase table.
-- RLS: public read (anon/authenticated); writes restricted to service_role.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.company_profiles (
  id text primary key
    constraint company_profiles_id_length check (char_length(id) <= 64),
  name text not null
    constraint company_profiles_name_length check (char_length(name) <= 100),
  tone text not null default ''
    constraint company_profiles_tone_length check (char_length(tone) <= 50),
  screen_type text not null default ''
    constraint company_profiles_screen_type_length check (char_length(screen_type) <= 50),
  region text not null default ''
    constraint company_profiles_region_length check (char_length(region) <= 10),
  builder_style text not null default ''
    constraint company_profiles_builder_style_length check (char_length(builder_style) <= 500),
  target_domain text not null default ''
    constraint company_profiles_target_domain_length check (char_length(target_domain) <= 500),
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_screenshots (
  id bigint generated always as identity primary key,
  company_id text not null
    references public.company_profiles (id) on delete cascade,
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.company_profiles is 'Company profiles used in the image generation prompt flow. Managed via /admin.';
comment on table public.company_screenshots is 'Reference screenshots per company, passed as visual context during generation.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index company_screenshots_company_id_sort_idx
  on public.company_screenshots (company_id, sort_order);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger company_profiles_set_updated_at
  before update on public.company_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.company_profiles enable row level security;
alter table public.company_screenshots enable row level security;

-- SELECT: anon and authenticated can read (needed by generation flow)
create policy company_profiles_select
  on public.company_profiles
  for select
  to anon, authenticated
  using (true);

create policy company_screenshots_select
  on public.company_screenshots
  for select
  to anon, authenticated
  using (true);

-- INSERT/UPDATE/DELETE: service_role only (no policies needed; service_role bypasses RLS)
-- Explicitly deny write access to anon/authenticated by not creating any write policies.

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select on table public.company_profiles to anon, authenticated;
grant all on table public.company_profiles to service_role;

grant select on table public.company_screenshots to anon, authenticated;
grant all on table public.company_screenshots to service_role;

grant all on sequence public.company_screenshots_id_seq to service_role;


-- ---------------------------------------------------------------------------
-- Storage Buckets
-- ---------------------------------------------------------------------------

-- company-logos: private bucket for company logo images (max 2 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-logos',
  'company-logos',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- company-screenshots: private bucket for reference screenshots (max 5 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-screenshots',
  'company-screenshots',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Storage RLS Policies
-- ---------------------------------------------------------------------------

-- SELECT: authenticated users can read logos (for admin panel preview)
create policy "company_logos_select_authenticated"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'company-logos');

-- SELECT: authenticated users can read screenshots (for admin panel preview)
create policy "company_screenshots_select_authenticated"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'company-screenshots');

-- INSERT/DELETE for company-logos and company-screenshots is handled by
-- service_role client in API routes (service_role bypasses RLS).
-- No explicit INSERT/DELETE policies needed for anon/authenticated.

-- ---------------------------------------------------------------------------
-- Seed Data: 12 company profiles from src/data/company-profiles.json
-- ---------------------------------------------------------------------------

insert into public.company_profiles (id, name, tone, screen_type, region, builder_style, target_domain)
values
  (
    'duolingo',
    'Duolingo',
    'absurdly polished',
    'mobile app',
    'US',
    'Playful mascot energy, streaks, hearts, gentle guilt-trip microcopy, bright green accents, rounded cards.',
    'Learning and habit loops with gamified progress.'
  ),
  (
    'ikea',
    'IKEA',
    'unhinged',
    'desktop web',
    'EU',
    'Swedish product names, flat illustration, numbered assembly steps, warehouse scale typography.',
    'Self-serve shopping with impossible optimism.'
  ),
  (
    'robinhood',
    'Robinhood',
    'unhinged',
    'mobile app',
    'US',
    'Neon green/black, confetti, streaks, crypto-grade hype, simple big buttons.',
    'Trading and instant gratification UX.'
  ),
  (
    'linkedin',
    'LinkedIn',
    'dead serious',
    'desktop web',
    'US',
    'Blue corporate chrome, endorsements, humble-brag prompts, "Say congrats" patterns, MY NETWORK cues.',
    'Professional identity and networking rituals.'
  ),
  (
    'spotify',
    'Spotify',
    'unhinged',
    'mobile app',
    'EU',
    'Dark mode, lime accent, playlists and recommendations, rounded cards, audio-first IA.',
    'Streaming libraries and discovery.'
  ),
  (
    'apple',
    'Apple',
    'absurdly polished',
    'mobile app',
    'US',
    'Large SF-style type, generous whitespace, frosted glass, subtle motion, premium restraint.',
    'Consumer hardware and services ecosystem.'
  ),
  (
    'google',
    'Google',
    'absurdly polished',
    'mobile app',
    'US',
    'Material You cards, colorful accents, chip filters, helpful microcopy, dense settings.',
    'Search and horizontal consumer utilities.'
  ),
  (
    'airbnb',
    'Airbnb',
    'absurdly polished',
    'mobile app',
    'US',
    'Rausch coral, rounded photography-forward listings, trust badges, trip storytelling.',
    'Marketplace listings and hosted stays.'
  ),
  (
    'microsoft',
    'Microsoft',
    'dead serious',
    'desktop web',
    'US',
    'Fluent / Office-family density, ribbon-era cues, neutral blues and greys, enterprise grids and pivot tables.',
    'Productivity suites and B2B admin consoles.'
  ),
  (
    'linear',
    'Linear',
    'dead serious',
    'desktop web',
    'US',
    'Ultra-fast minimal UI, dark graphite, keyboard-shortcut hints, cycle/issue metaphors, razor-sharp typography.',
    'Issue tracking and engineering workflows.'
  ),
  (
    'twitter',
    'Twitter',
    'unhinged',
    'mobile app',
    'US',
    'Short-post timeline, bird-era or minimal social chrome, reply chains, trending sidebar, compose prominence.',
    'Public conversation and real-time feed.'
  ),
  (
    'facebook',
    'Facebook',
    'absurdly polished',
    'mobile app',
    'US',
    'Classic Facebook blue, reactions row, groups and Marketplace tiles, algorithmic feed density.',
    'Personal network feed and social engagement.'
  );
