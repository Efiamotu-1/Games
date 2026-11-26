-- AI-generated daily trivia for Rapid-Run. Run in the Supabase SQL Editor.
-- Rows are written only by the generate-trivia Edge Function (service role); everyone can read them.

create table if not exists generated_questions (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  category text not null,
  difficulty text not null check (difficulty in ('normal', 'expert')),
  text text not null,
  answer text not null,
  wrong jsonb not null,
  created_at timestamptz not null default now(),
  unique (day, text)
);

create index if not exists generated_questions_day_idx on generated_questions(day);

alter table generated_questions enable row level security;

drop policy if exists "generated_questions readable" on generated_questions;
create policy "generated_questions readable" on generated_questions
  for select using (true);

-- No insert/update/delete policy on purpose: the anon key can't write here.

-- ---------------------------------------------------------------------------------------------
-- OPTIONAL: prepare tomorrow's questions every night. One category every 5 minutes from 21:00 UTC
-- (22:00 in Lagos), so the new set is complete well before the day changes at midnight in Lagos.
-- (One category per call keeps each run inside Supabase's Edge Function limits.)
-- Replace YOUR-CRON-SECRET with the value of your CRON_SECRET secret, then run it once. Running it again
-- updates the existing jobs.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  cats text[] := array['Science','History','Geography','Mathematics','Technology','Sports','Pop Culture','Literature'];
  i int;
begin
  for i in 1..array_length(cats, 1) loop
    perform cron.schedule(
      'trivia-' || lower(replace(cats[i], ' ', '-')),
      ((i - 1) * 5) || ' 21 * * *',
      format(
        $job$select net.http_post(
          url := 'https://sxvftcevakpassorpwcc.supabase.co/functions/v1/generate-trivia',
          headers := '{"Content-Type": "application/json", "x-cron-secret": "YOUR-CRON-SECRET"}'::jsonb,
          body := '{"category": "%s"}'::jsonb
        )$job$, cats[i]));
  end loop;
end $$;
-- ---------------------------------------------------------------------------------------------
