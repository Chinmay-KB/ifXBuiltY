-- Hide generations from public feeds until image bytes exist in storage.

alter table public.generations
  add column if not exists image_ready boolean not null default false;

comment on column public.generations.image_ready is
  'True after generated image was uploaded to storage; false excludes row from public feeds';

create index if not exists generations_public_feed_idx
  on public.generations (created_at desc)
  where visibility = 'published'
    and moderation_status = 'visible'
    and status = 'completed'
    and image_ready = true;

-- Optimistic backfill for legacy rows (broken media corrected via media route or sync script).
update public.generations
set image_ready = true
where status = 'completed'
  and image_path is not null
  and trim(image_path) <> '';
