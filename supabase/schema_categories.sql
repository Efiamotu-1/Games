-- Categories: round prompt storage + per-player free-text submissions
-- Run this in the Supabase SQL Editor after schema_room_leaderboard.sql

alter table rooms add column if not exists round_payload jsonb;

create table if not exists categories_submissions (
  room_code text not null references rooms(code) on delete cascade,
  player_id text not null references room_players(id) on delete cascade,
  round_number int not null,
  answer text not null default '',
  is_valid boolean not null default false,
  is_unique boolean not null default true,
  score int not null default 0,
  scored boolean not null default false,
  submitted boolean not null default false,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (player_id, round_number)
);

create index if not exists categories_submissions_room_code_idx on categories_submissions(room_code);

alter table categories_submissions enable row level security;

create policy "categories_submissions is publicly readable" on categories_submissions
  for select using (true);

create policy "categories_submissions is publicly insertable" on categories_submissions
  for insert with check (true);

create policy "categories_submissions is publicly updatable" on categories_submissions
  for update using (true);

alter publication supabase_realtime add table categories_submissions;

alter table room_leaderboard drop constraint if exists room_leaderboard_entry_type_check;
alter table room_leaderboard add constraint room_leaderboard_entry_type_check
  check (entry_type in ('race', 'tournament', 'categories'));
