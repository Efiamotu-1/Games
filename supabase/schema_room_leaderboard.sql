-- Per-room leaderboard: standard race finishes + tournament final placements
-- Run this in the Supabase SQL Editor after schema_elimination_rounds.sql

create table if not exists room_leaderboard (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  game_id text not null,
  player_id text not null,
  nickname text not null,
  entry_type text not null check (entry_type in ('race', 'tournament')),
  wpm int,
  accuracy_char numeric,
  placement int,
  rounds_played int,
  mode jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists room_leaderboard_room_code_idx on room_leaderboard(room_code);

alter table room_leaderboard enable row level security;

create policy "room_leaderboard is publicly readable" on room_leaderboard
  for select using (true);

create policy "room_leaderboard is publicly insertable" on room_leaderboard
  for insert with check (true);

alter publication supabase_realtime add table room_leaderboard;
