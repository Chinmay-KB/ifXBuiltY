-- Private bucket for generated images. Store object keys in public.generations.image_path
-- (must equal storage.objects.name for this bucket). Server uploads use service_role (bypasses RLS).
-- Anon/authenticated reads: published + visible, or owner draft/preview.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generation-images',
  'generation-images',
  false,
  52428800,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Speed storage RLS checks that join on image_path
create unique index if not exists generations_image_path_unique
  on public.generations (image_path)
  where image_path is not null and image_path <> '';

-- Private bucket: clients still pass apikey + Bearer (anon or user JWT). Crawlers / raw <img> without auth need signed URLs (e.g. OG tags).
create policy "generation_images_select_public_or_own"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'generation-images'
    and (
      exists (
        select 1
        from public.generations g
        where g.image_path = storage.objects.name
          and g.visibility = 'published'
          and g.moderation_status = 'visible'
      )
      or exists (
        select 1
        from public.generations g
        where g.image_path = storage.objects.name
          and g.creator_id = (select auth.uid())
      )
    )
  );
