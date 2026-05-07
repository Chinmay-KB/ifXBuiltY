-- ifXBuiltY initial schema: generations, votes, reports, generation_events
-- Indexes: FK columns + partial index for public feed (newest).
-- RLS: public read of published+visible generations; owners manage drafts; votes/reports server-only (no policies for anon/auth).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.generations (
  id bigint generated always as identity primary key,
  creator_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  builder text not null default '',
  target text not null default '',
  tone text not null default '',
  screen_type text not null default '',
  region text not null default '',
  extra_details text not null default '',
  generated_prompt text,
  image_path text,
  visibility text not null default 'draft'
    constraint generations_visibility_ck check (visibility in ('draft', 'published')),
  moderation_status text not null default 'visible'
    constraint generations_moderation_status_ck check (moderation_status in ('visible', 'hidden', 'pending')),
  upvote_count integer not null default 0,
  downvote_count integer not null default 0,
  net_score integer generated always as (upvote_count - downvote_count) stored,
  report_count integer not null default 0,
  remix_parent_id bigint references public.generations (id) on delete set null,
  remix_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint generations_slug_unique unique (slug)
);

create table public.votes (
  id bigint generated always as identity primary key,
  generation_id bigint not null references public.generations (id) on delete cascade,
  anon_session_id text not null,
  vote_value smallint not null
    constraint votes_value_ck check (vote_value in (1, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint votes_one_per_session unique (generation_id, anon_session_id)
);

create table public.reports (
  id bigint generated always as identity primary key,
  generation_id bigint not null references public.generations (id) on delete cascade,
  anon_session_id text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.generation_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  constraint generation_events_event_type_nonempty check (char_length(trim(event_type)) > 0)
);

comment on table public.generations is 'Screenshot-style generations; slugs power /g/[slug].';
comment on table public.votes is 'Anonymous session votes; write via API with service_role after cookie verification.';
comment on table public.reports is 'Anonymous reports; write via API with service_role.';
comment on table public.generation_events is 'Quota and audit events per authenticated user.';

-- ---------------------------------------------------------------------------
-- Indexes (FK + feed)
-- ---------------------------------------------------------------------------

create index generations_creator_id_idx on public.generations (creator_id);
create index generations_remix_parent_id_idx on public.generations (remix_parent_id);
create index generations_feed_newest_idx on public.generations (created_at desc)
  where visibility = 'published' and moderation_status = 'visible';
create index generations_feed_trending_idx on public.generations (net_score desc, created_at desc)
  where visibility = 'published' and moderation_status = 'visible';

create index votes_generation_id_idx on public.votes (generation_id);
create index reports_generation_id_idx on public.reports (generation_id);
create index generation_events_user_id_idx on public.generation_events (user_id);
create index generation_events_created_at_idx on public.generation_events (created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers: updated_at, vote denorm, remix_parent count, report_count
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at ()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger generations_set_updated_at
  before update on public.generations
  for each row execute function public.set_updated_at();

create trigger votes_set_updated_at
  before update on public.votes
  for each row execute function public.set_updated_at();

create or replace function public.refresh_generation_vote_counts (p_generation_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  up_c integer;
  down_c integer;
begin
  select
    count(*) filter (where vote_value = 1),
    count(*) filter (where vote_value = -1)
  into up_c, down_c
  from public.votes
  where generation_id = p_generation_id;

  update public.generations
  set
    upvote_count = coalesce(up_c, 0),
    downvote_count = coalesce(down_c, 0)
  where id = p_generation_id;
end;
$$;

create or replace function public.votes_tg_refresh_counts ()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_generation_vote_counts (old.generation_id);
  else
    perform public.refresh_generation_vote_counts (new.generation_id);
    if tg_op = 'UPDATE' and old.generation_id is distinct from new.generation_id then
      perform public.refresh_generation_vote_counts (old.generation_id);
    end if;
  end if;
  return coalesce (new, old);
end;
$$;

create trigger votes_refresh_generation_counts
  after insert or update or delete on public.votes
  for each row execute function public.votes_tg_refresh_counts();

create or replace function public.generations_tg_bump_remix_count ()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.remix_parent_id is not null then
    update public.generations
    set remix_count = remix_count + 1
    where id = new.remix_parent_id;
  end if;
  return new;
end;
$$;

create trigger generations_bump_remix_count
  after insert on public.generations
  for each row execute function public.generations_tg_bump_remix_count();

create or replace function public.generations_tg_trim_remix_count ()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.remix_parent_id is not null then
    update public.generations
    set remix_count = greatest (0, remix_count - 1)
    where id = old.remix_parent_id;
  end if;
  return old;
end;
$$;

create trigger generations_trim_remix_count
  after delete on public.generations
  for each row execute function public.generations_tg_trim_remix_count();

create or replace function public.reports_tg_increment_count ()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.generations
  set report_count = report_count + 1
  where id = new.generation_id;
  return new;
end;
$$;

create trigger reports_increment_generation_report_count
  after insert on public.reports
  for each row execute function public.reports_tg_increment_count();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.generations enable row level security;
alter table public.votes enable row level security;
alter table public.reports enable row level security;
alter table public.generation_events enable row level security;

-- Published + visible generations: readable by everyone using the anon key.
create policy generations_select_public
  on public.generations
  for select
  to anon, authenticated
  using (
    visibility = 'published'
    and moderation_status = 'visible'
  );

-- Owners can read their drafts and non-public rows.
create policy generations_select_own
  on public.generations
  for select
  to authenticated
  using ((select auth.uid ()) = creator_id);

create policy generations_insert_own
  on public.generations
  for insert
  to authenticated
  with check ((select auth.uid ()) = creator_id);

create policy generations_update_own
  on public.generations
  for update
  to authenticated
  using ((select auth.uid ()) = creator_id)
  with check ((select auth.uid ()) = creator_id);

-- No policies for anon/authenticated on votes or reports: use service_role from API after validation.

create policy generation_events_select_own
  on public.generation_events
  for select
  to authenticated
  using ((select auth.uid ()) = user_id);

create policy generation_events_insert_own
  on public.generation_events
  for insert
  to authenticated
  with check ((select auth.uid ()) = user_id);

-- ---------------------------------------------------------------------------
-- Grants (Supabase roles)
-- ---------------------------------------------------------------------------

grant select on table public.generations to anon, authenticated;
grant insert, update, delete on table public.generations to authenticated;
grant all on table public.generations to service_role;

grant all on table public.votes to service_role;
grant all on table public.reports to service_role;

grant select, insert on table public.generation_events to authenticated;
grant all on table public.generation_events to service_role;

grant usage, select on sequence public.generations_id_seq to authenticated;
grant usage, select on sequence public.generation_events_id_seq to authenticated;

grant all on sequence public.generations_id_seq to service_role;
grant all on sequence public.votes_id_seq to service_role;
grant all on sequence public.reports_id_seq to service_role;
grant all on sequence public.generation_events_id_seq to service_role;
