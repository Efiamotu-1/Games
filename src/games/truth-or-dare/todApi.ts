import { supabase } from '../../shared/supabase'
import { newTodPayload, type TodPayload } from './types'

/** Starts a game: turn order is everyone currently in the room, in join order. */
export async function startTruthOrDare(code: string, payload: TodPayload): Promise<void> {
  const { data, error: playersError } = await supabase
    .from('room_players')
    .select('id')
    .eq('room_code', code)
    .order('joined_at', { ascending: true })
  if (playersError) throw playersError

  const order = (data ?? []).map((p: { id: string }) => p.id)
  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'in-game',
      round_payload: { ...payload, order },
      started_at: new Date().toISOString(),
      round_number: 1,
      eliminated_ids: [],
    })
    .eq('code', code)
  if (error) throw error
}

export function rematchTruthOrDare(code: string): Promise<void> {
  return startTruthOrDare(code, newTodPayload())
}

/**
 * Writes the next state of the current turn. The round_number guard means a double-click or two clients
 * racing can't apply the same step twice. Returns false if the turn had already moved on.
 */
export async function updateTurn(code: string, expectedTurn: number, payload: TodPayload): Promise<boolean> {
  const { data, error } = await supabase
    .from('rooms')
    .update({ round_payload: payload })
    .eq('code', code)
    .eq('round_number', expectedTurn)
    .eq('status', 'in-game')
    .select('code')
  if (error) throw error
  return !!data && data.length > 0
}

/** Moves to the next player's turn, or finishes the game after the last turn. */
export async function endTurn(code: string, expectedTurn: number, payload: TodPayload, isLastTurn: boolean): Promise<boolean> {
  const cleared: TodPayload = { ...payload, phase: 'choose', kind: null, prompt: null }
  const update = isLastTurn
    ? { status: 'finished', round_payload: cleared }
    : { round_number: expectedTurn + 1, round_payload: cleared }
  const { data, error } = await supabase
    .from('rooms')
    .update(update)
    .eq('code', code)
    .eq('round_number', expectedTurn)
    .eq('status', 'in-game')
    .select('code')
  if (error) throw error
  return !!data && data.length > 0
}

export async function endTruthOrDareGame(code: string): Promise<void> {
  const { error } = await supabase.from('rooms').update({ status: 'finished' }).eq('code', code)
  if (error) throw error
}
