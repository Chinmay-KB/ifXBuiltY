-- Add Tinder as a standalone company profile so it surfaces in the picker.
-- Tinder already exists as a product row (parent_company_id = 'tinder') with rich
-- style_dna + archetype, but getSelectableCompanyGroups() filters out products
-- whose parent company has no company row. Mirror the existing product profile
-- to a company row using the same id pattern as other single-brand companies
-- (e.g. how `google` exists alongside `google-youtube`, `google-search`, etc.).

insert into public.company_profiles (
  id,
  name,
  profile_type,
  parent_company_id,
  category,
  popularity_tier,
  research_status,
  meme_strength,
  style_dna,
  archetype,
  default_vibe_tags,
  source_urls,
  logo_path
)
values (
  'tinder-co',
  'Tinder',
  'company',
  null,
  'dating',
  1,
  'approved',
  4,
  jsonb_build_object(
    'tone', jsonb_build_array('casual', 'gamified', 'swipe-obsessed'),
    'colors', jsonb_build_array(
      '#FE3C72 Tinder pink/red',
      'white cards',
      'gradient backgrounds',
      'green/blue action buttons'
    ),
    'visual_traits', jsonb_build_array(
      'full-screen photo cards',
      'swipe gesture',
      'action buttons (nope/like/super like)',
      'match animation',
      'chat list'
    ),
    'ux_traits', jsonb_build_array(
      'right swipe = like, left = nope',
      'Super Like (blue star)',
      'Boost feature',
      'Gold subscriptions upsell',
      'match notification with confetti'
    ),
    'meme_exaggeration', jsonb_build_array(
      'swiping for hours then matching with nobody',
      'bio says ''just ask'' with zero info',
      'group photos where you can''t tell who the person is',
      'premium upsells at every turn'
    ),
    'iconic_elements', jsonb_build_array(
      'flame logo',
      'card stack UI',
      'swipe animation',
      'match screen with confetti',
      'Super Like blue border'
    ),
    'behavioral_stereotypes', jsonb_build_array(
      'swiping while on the toilet',
      'matching and never messaging',
      'unmatching without explanation'
    ),
    'satirical_patterns', jsonb_build_array(
      'You have 3 new likes! (pay $30 to see who)',
      'Your bio: ''fluent in sarcasm'' — truly a unique individual'
    )
  ),
  jsonb_build_object(
    'type', 'card-based discovery with gesture interaction',
    'sections', jsonb_build_array(
      'full-screen photo card',
      'swipe gesture area',
      'action buttons bottom',
      'match notification overlay',
      'chat list'
    ),
    'layout', 'mobile app',
    'content_style', jsonb_build_array(
      'photos',
      'name/age/distance',
      'bio text',
      'interest tags',
      'Spotify anthem'
    )
  ),
  ARRAY['Chaotic', 'Scammy']::text[],
  '["https://tinder.com"]'::jsonb,
  null
)
on conflict (id) do update set
  name = excluded.name,
  profile_type = excluded.profile_type,
  parent_company_id = excluded.parent_company_id,
  category = excluded.category,
  popularity_tier = excluded.popularity_tier,
  research_status = excluded.research_status,
  meme_strength = excluded.meme_strength,
  style_dna = excluded.style_dna,
  archetype = excluded.archetype,
  default_vibe_tags = excluded.default_vibe_tags,
  source_urls = excluded.source_urls;

-- Re-parent the existing 'tinder' product row to the new company so it shows
-- up under Tinder in the picker rail.
update public.company_profiles
set parent_company_id = 'tinder-co'
where id = 'tinder' and profile_type = 'product';
