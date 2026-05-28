-- Make generated images publicly readable so they can be served straight from
-- Supabase's CDN (the public object endpoint) instead of being proxied through a
-- Next.js route handler. Writes remain service_role-only (server uploads bypass RLS).
--
-- Object layout per generation (keys stored in public.generations.image_path):
--   <image_path>              original bytes
--   <image_path>.card.webp    560w  display variant
--   <image_path>.detail.webp  1280w display variant
--   <image_path>.og.jpg       1200w social/crawler variant

update storage.buckets
set public = true
where id = 'generation-images';

-- Public buckets serve reads via /storage/v1/object/public/... without consulting
-- RLS, so the per-object SELECT policy is no longer needed. Removing it also stops
-- the (now pointless) per-request join against public.generations on every read.
drop policy if exists "generation_images_select_public_or_own" on storage.objects;
