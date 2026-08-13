-- Elimination Rounds tournament state for Typing Wars
-- Run this in the Supabase SQL Editor after schema_mode.sql

alter table rooms add column if not exists round_number int not null default 1;
alter table rooms add column if not exists eliminated_ids text[] not null default '{}';
