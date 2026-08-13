-- Party Arcade schema: rooms + players
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

create table if not exists rooms (
  code text primary key,
  game_id text not null,
  status text not null default 'lobby' check (status in ('lobby', 'in-game', 'finished')),
  created_at timestamptz not null default now()
);

create table if not exists room_players (
  id text primary key,
  room_code text not null references rooms(code) on delete cascade,
  nickname text not null,
  color text not null,
  is_host boolean not null default false,
  ready boolean not null default false,
  joined_at timestamptz not null default now()
);

create index if not exists room_players_room_code_idx on room_players(room_code);

-- Row Level Security: rooms/players are readable and writable by anyone
-- with the room code (no auth in the MVP). This is a casual party-game
-- app, not handling sensitive data, so this is intentionally permissive.
alter table rooms enable row level security;
alter table room_players enable row level security;

create policy "rooms are publicly readable" on rooms
  for select using (true);

create policy "rooms are publicly insertable" on rooms
  for insert with check (true);

create policy "rooms are publicly updatable" on rooms
  for update using (true);

create policy "room_players are publicly readable" on room_players
  for select using (true);

create policy "room_players are publicly insertable" on room_players
  for insert with check (true);

create policy "room_players are publicly updatable" on room_players
  for update using (true);

create policy "room_players are publicly deletable" on room_players
  for delete using (true);

-- Enable Realtime (Postgres Changes) on both tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_players;
