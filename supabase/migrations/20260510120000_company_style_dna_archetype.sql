-- Restructure company_profiles: replace flat fields (tone, screen_type, region,
-- builder_style, target_domain) with two JSONB columns: style_dna and archetype.
--
-- style_dna: visual/UX traits (tone, colors, visual_traits, ux_traits)
-- archetype: structural/content patterns (type, sections, layout, content_style)

-- Add new JSONB columns
alter table public.company_profiles
  add column style_dna jsonb not null default '{}'::jsonb,
  add column archetype jsonb not null default '{}'::jsonb;

-- Migrate existing data into the new columns
update public.company_profiles set
  style_dna = jsonb_build_object(
    'tone', array[tone],
    'colors', array[]::text[],
    'visual_traits', array[builder_style],
    'ux_traits', array[]::text[]
  ),
  archetype = jsonb_build_object(
    'type', target_domain,
    'sections', array[]::text[],
    'layout', screen_type,
    'content_style', array[]::text[]
  );

-- Drop old columns
alter table public.company_profiles
  drop column tone,
  drop column screen_type,
  drop column region,
  drop column builder_style,
  drop column target_domain;

-- Drop old constraints that referenced removed columns
-- (they were dropped automatically with the columns)
