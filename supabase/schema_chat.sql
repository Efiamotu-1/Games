-- Room chat (lobby + post-game). Run in the Supabase SQL Editor.

create table if not exists room_messages (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  player_id text not null,
  nickname text not null,
  color text not null default '#a78bfa',
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists room_messages_room_idx on room_messages(room_code, created_at);

alter table room_messages enable row level security;

drop policy if exists "room_messages readable" on room_messages;
create policy "room_messages readable" on room_messages
  for select using (true);

drop policy if exists "room_messages insertable" on room_messages;
create policy "room_messages insertable" on room_messages
  for insert with check (true);

do $$
begin
  alter publication supabase_realtime add table room_messages;
exception when duplicate_object then null;
end $$;

-- Replies: store which message is being answered, with a snapshot of its text
alter table room_messages add column if not exists reply_to_id uuid;
alter table room_messages add column if not exists reply_nickname text;
alter table room_messages add column if not exists reply_body text;
