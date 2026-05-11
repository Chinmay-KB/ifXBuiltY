-- Add vibe_tags column to generations table
alter table public.generations
  add column vibe_tags text[] not null default '{}'::text[];

-- GIN index for efficient array-overlap queries (e.g. WHERE vibe_tags && ARRAY['Chaotic'])
create index generations_vibe_tags_gin_idx
  on public.generations using gin (vibe_tags);

-- Add default_vibe_tags column to company_profiles table
alter table public.company_profiles
  add column default_vibe_tags text[] not null default '{}'::text[];

-- Seed default vibe tags for the 12 known companies
update public.company_profiles set default_vibe_tags = array['Chaotic','Wholesome'] where lower(name) = lower('Duolingo');
update public.company_profiles set default_vibe_tags = array['Chaotic','Bureaucratic'] where lower(name) = lower('IKEA');
update public.company_profiles set default_vibe_tags = array['Scammy','Chaotic'] where lower(name) = lower('Robinhood');
update public.company_profiles set default_vibe_tags = array['Bureaucratic','Scammy'] where lower(name) = lower('LinkedIn');
update public.company_profiles set default_vibe_tags = array['Premium'] where lower(name) = lower('Spotify');
update public.company_profiles set default_vibe_tags = array['Premium'] where lower(name) = lower('Apple');
update public.company_profiles set default_vibe_tags = array['Bureaucratic'] where lower(name) = lower('Google');
update public.company_profiles set default_vibe_tags = array['Scammy','Premium'] where lower(name) = lower('Airbnb');
update public.company_profiles set default_vibe_tags = array['Bureaucratic'] where lower(name) = lower('Microsoft');
update public.company_profiles set default_vibe_tags = array['Premium'] where lower(name) = lower('Linear');
update public.company_profiles set default_vibe_tags = array['Chaotic','Cursed'] where lower(name) = lower('Twitter');
update public.company_profiles set default_vibe_tags = array['Scammy','Bureaucratic'] where lower(name) = lower('Facebook');
