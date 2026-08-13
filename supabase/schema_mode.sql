-- Room mode config: generic per-game settings, chosen in the lobby
-- Run this in the Supabase SQL Editor after schema_race.sql

alter table rooms add column if not exists mode jsonb not null default '{}'::jsonb;
