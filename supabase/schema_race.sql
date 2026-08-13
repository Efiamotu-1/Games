-- Typing Wars multiplayer race: passage sync + live progress
-- Run this in the Supabase SQL Editor after schema.sql

alter table rooms add column if not exists passage text;
alter table rooms add column if not exists started_at timestamptz;

create table if not exists race_progress (
  player_id text primary key references room_players(id) on delete cascade,
  room_code text not null references rooms(code) on delete cascade,
  chars_typed int not null default 0,
  wpm int not null default 0,
  accuracy numeric not null default 100,
  finished boolean not null default false,
  finished_at timestamptz,
  result jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists race_progress_room_code_idx on race_progress(room_code);

alter table race_progress enable row level security;

create policy "race_progress is publicly readable" on race_progress
  for select using (true);

create policy "race_progress is publicly insertable" on race_progress
  for insert with check (true);

create policy "race_progress is publicly updatable" on race_progress
  for update using (true);

alter publication supabase_realtime add table race_progress;
