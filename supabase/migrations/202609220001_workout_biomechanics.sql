-- Additive sidecar. Existing exercise rows and identifiers are untouched.
create table if not exists public.exercise_biomechanics (
  exercise_id text primary key,
  movement_tags text[] not null default '{}',
  primary_movement boolean not null default false,
  primary_muscle text,
  glute_priority_score smallint not null default 0 check (glute_priority_score between 0 and 3),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists exercise_biomechanics_movement_tags_idx
  on public.exercise_biomechanics using gin (movement_tags);

alter table public.exercise_biomechanics enable row level security;
-- Metadata is public; only trusted backend/migration roles may write it.
create policy "Read workout biomechanics" on public.exercise_biomechanics
  for select to authenticated, anon using (true);
