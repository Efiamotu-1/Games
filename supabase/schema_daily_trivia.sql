-- Daily trivia leaderboard. Run in the Supabase SQL Editor after schema_generated_trivia.sql.
-- Safe to run again: it also upgrades an earlier version of this table and function.
--
-- One scored attempt per player per day. Scores are never written directly by the browser: the
-- submit_daily_score function re-scores the submitted answers against generated_questions, so a
-- made-up score number is ignored.

create table if not exists daily_scores (
  day date not null,
  player_id text not null,
  nickname text not null,
  score int not null check (score >= 0),
  answered int not null check (answered >= 0),
  seconds int not null default 0,
  limit_seconds int not null default 0,
  created_at timestamptz not null default now(),
  primary key (day, player_id)
);

-- Upgrade from the first version, which had no time columns.
alter table daily_scores add column if not exists seconds int not null default 0;
alter table daily_scores add column if not exists limit_seconds int not null default 0;

drop index if exists daily_scores_board_idx;
create index daily_scores_board_idx on daily_scores (day, score desc, seconds asc, created_at asc);

alter table daily_scores enable row level security;

drop policy if exists "daily_scores readable" on daily_scores;
create policy "daily_scores readable" on daily_scores for select using (true);
-- No insert/update/delete policy on purpose.

drop function if exists submit_daily_score(date, text, text, jsonb);

create or replace function submit_daily_score(
  p_day date,
  p_player_id text,
  p_nickname text,
  p_answers jsonb,
  p_seconds int,
  p_limit_seconds int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nick text;
  v_answered int;
  v_score int;
  v_inserted int;
  v_seconds int;
begin
  if p_player_id is null or length(p_player_id) < 8 or length(p_player_id) > 64 then
    raise exception 'invalid player';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) > 200 then
    raise exception 'invalid answers';
  end if;
  if not exists (select 1 from generated_questions where day = p_day) then
    raise exception 'unknown day';
  end if;

  v_seconds := least(greatest(coalesce(p_seconds, 0), 0), 86400);
  v_nick := left(btrim(coalesce(p_nickname, '')), 20);
  if v_nick = '' then v_nick := 'Player'; end if;

  -- Each question counts once, and only if it belongs to that day's batch.
  select count(*), count(*) filter (where q.answer = a.picked)
    into v_answered, v_score
  from (
    select distinct on (e ->> 'id') (e ->> 'id')::uuid as id, e ->> 'picked' as picked
    from jsonb_array_elements(p_answers) e
  ) a
  join generated_questions q on q.id = a.id and q.day = p_day;

  insert into daily_scores (day, player_id, nickname, score, answered, seconds, limit_seconds)
  values (p_day, p_player_id, v_nick, v_score, v_answered, v_seconds, least(greatest(coalesce(p_limit_seconds, 0), 0), 3600))
  on conflict (day, player_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    select score, answered, seconds into v_score, v_answered, v_seconds from daily_scores where day = p_day and player_id = p_player_id;
  end if;

  return jsonb_build_object('accepted', v_inserted > 0, 'score', v_score, 'answered', v_answered, 'seconds', v_seconds);
end;
$$;

grant execute on function submit_daily_score(date, text, text, jsonb, int, int) to anon, authenticated;
