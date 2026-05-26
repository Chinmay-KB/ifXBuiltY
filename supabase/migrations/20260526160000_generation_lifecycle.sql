-- Generation lifecycle: durable async jobs with status tracking

alter table public.generations
  add column if not exists status text not null default 'completed'
    constraint generations_status_ck check (
      status in ('queued', 'processing', 'completed', 'failed')
    ),
  add column if not exists error_message text,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists workflow_run_id text;

-- Existing rows already have images; mark them completed.
update public.generations
set
  status = 'completed',
  completed_at = coalesce(completed_at, created_at)
where image_path is not null
  and trim(image_path) <> ''
  and status = 'completed';

comment on column public.generations.status is 'Job lifecycle: queued -> processing -> completed|failed';
comment on column public.generations.workflow_run_id is 'Vercel Workflow run id for durable image generation';

create index if not exists generations_creator_created_idx
  on public.generations (creator_id, created_at desc);

create index if not exists generations_creator_status_idx
  on public.generations (creator_id, status, created_at desc);
