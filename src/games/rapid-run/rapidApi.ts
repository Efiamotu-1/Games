import { supabase } from '../../shared/supabase'
import { START_COUNTDOWN_SECONDS } from '../../shared/roomApi'
import type { RapidPayload, RunSummary } from './types'

function futureStartTime(): string {
  return new Date(Date.now() + START_COUNTDOWN_SECONDS * 1000).toISOString()
}

export async function startRapidRun(code: string, payload: RapidPayload): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'in-game',
      round_payload: payload,
      started_at: futureStartTime(),
      round_number: 1,
      eliminated_ids: [],
    })
    .eq('code', code)
  if (error) throw error
}

export async function resetRapidForRematch(code: string, payload: RapidPayload): Promise<void> {
  await startRapidRun(code, payload)
  const { error } = await supabase.from('race_progress').delete().eq('room_code', code)
  if (error) throw error
}

/**
 * Moves the room to the next round (eliminating a player, in the elimination format). Any survivor's client
 * may call this once everyone has submitted. Any survivor's client may call this once everyone has
 * submitted. Returns false if another client already advanced the round, so only one caller goes on to
 * clean up (or, after the last round, save results).
 */
export async function advanceRapidRound(
  code: string,
  expectedRound: number,
  eliminatedIds: string[],
  nextPayload: RapidPayload,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('rooms')
    .update({
      eliminated_ids: eliminatedIds,
      round_payload: nextPayload,
      started_at: futureStartTime(),
      round_number: expectedRound + 1,
    })
    .eq('code', code)
    .eq('round_number', expectedRound)
    .select('code')
  if (error) throw error
  if (!data || data.length === 0) return false

  const { error: progressError } = await supabase.from('race_progress').delete().eq('room_code', code)
  if (progressError) throw progressError
  return true
}

/** Ends a classic game, storing the final totals. Returns false if another client already did. */
export async function finishRapidGame(code: string, expectedRound: number, finalPayload: RapidPayload): Promise<boolean> {
  const { data, error } = await supabase
    .from('rooms')
    .update({ status: 'finished', round_payload: finalPayload })
    .eq('code', code)
    .eq('round_number', expectedRound)
    .eq('status', 'in-game')
    .select('code')
  if (error) throw error
  return !!data && data.length > 0
}

/**
 * Rapid-Run reuses the race_progress table: chars_typed holds questions answered, wpm holds the running
 * score, accuracy holds accuracy %, and result holds the final RunSummary.
 */
export async function publishLiveScore(
  playerId: string,
  live: { score: number; answered: number; accuracy: number },
): Promise<void> {
  const { error } = await supabase
    .from('race_progress')
    .update({
      chars_typed: live.answered,
      wpm: live.score,
      accuracy: live.accuracy,
      updated_at: new Date().toISOString(),
    })
    .eq('player_id', playerId)
  if (error) throw error
}

export async function submitRunSummary(playerId: string, summary: RunSummary): Promise<void> {
  // The round can't end until every survivor's result lands, so a dropped request gets a few retries.
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase
      .from('race_progress')
      .update({
        finished: true,
        finished_at: new Date().toISOString(),
        chars_typed: summary.total,
        wpm: summary.score,
        accuracy: summary.accuracy,
        result: summary,
      })
      .eq('player_id', playerId)
    if (!error) return
    lastError = error
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  throw lastError
}
