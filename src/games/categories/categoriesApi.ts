import { supabase } from '../../shared/supabase'
import type { CategoryPrompt } from './wordBank'
import type { CategoriesSubmission } from './types'

const START_COUNTDOWN_SECONDS = 3

function futureStartTime(): string {
  return new Date(Date.now() + START_COUNTDOWN_SECONDS * 1000).toISOString()
}

/** Starts round 1: sets the room in-game with the first prompt and a synced countdown. */
export async function startCategoriesRound(code: string, prompt: CategoryPrompt): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'in-game',
      round_payload: prompt,
      started_at: futureStartTime(),
      round_number: 1,
    })
    .eq('code', code)
  if (error) throw error
}

/** Advances to the next round with a fresh prompt. `expectedRound` guards against duplicate advances. */
export async function advanceCategoriesRound(
  code: string,
  expectedRound: number,
  nextPrompt: CategoryPrompt,
): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({
      round_payload: nextPrompt,
      started_at: futureStartTime(),
      round_number: expectedRound + 1,
    })
    .eq('code', code)
    .eq('round_number', expectedRound)
  if (error) throw error
}

export async function finishCategoriesGame(code: string): Promise<void> {
  const { error } = await supabase.from('rooms').update({ status: 'finished' }).eq('code', code)
  if (error) throw error
}

export async function resetCategoriesForRematch(code: string, prompt: CategoryPrompt): Promise<void> {
  const { error: roomError } = await supabase
    .from('rooms')
    .update({ status: 'in-game', round_payload: prompt, started_at: futureStartTime(), round_number: 1 })
    .eq('code', code)
  if (roomError) throw roomError

  const { error: subsError } = await supabase.from('categories_submissions').delete().eq('room_code', code)
  if (subsError) throw subsError
}

export async function submitCategoriesAnswer(
  roomCode: string,
  playerId: string,
  roundNumber: number,
  answer: string,
  isValid: boolean,
): Promise<void> {
  const { error } = await supabase.from('categories_submissions').upsert({
    room_code: roomCode,
    player_id: playerId,
    round_number: roundNumber,
    answer,
    is_valid: isValid,
    is_unique: true,
    score: 0,
    submitted: true,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

/** Marks a player as having submitted no answer for the round (used when the timer runs out). */
export async function submitCategoriesTimeout(roomCode: string, playerId: string, roundNumber: number): Promise<void> {
  const { error } = await supabase.from('categories_submissions').upsert({
    room_code: roomCode,
    player_id: playerId,
    round_number: roundNumber,
    answer: '',
    is_valid: false,
    is_unique: true,
    score: 0,
    submitted: true,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

/**
 * Scores a completed round: an answer earns a point if it's valid and no other
 * player in the room submitted the exact same (case-insensitive) answer this round.
 */
export async function scoreCategoriesRound(
  roundNumber: number,
  submissions: CategoriesSubmission[],
): Promise<void> {
  const validAnswerCounts = new Map<string, number>()
  for (const s of submissions) {
    if (!s.isValid) continue
    const key = s.answer.trim().toLowerCase()
    validAnswerCounts.set(key, (validAnswerCounts.get(key) ?? 0) + 1)
  }

  const updates = submissions.map((s) => {
    const key = s.answer.trim().toLowerCase()
    const isUnique = s.isValid ? (validAnswerCounts.get(key) ?? 0) === 1 : true
    const score = s.isValid && isUnique ? 1 : 0
    return supabase
      .from('categories_submissions')
      .update({ is_unique: isUnique, score, scored: true })
      .eq('player_id', s.playerId)
      .eq('round_number', roundNumber)
  })

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}
