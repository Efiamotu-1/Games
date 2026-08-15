import { supabase } from './supabase'
import type { Player, RaceResult, Room } from './types'
import { colorForIndex, makeRoomCode } from './room'

/** Seconds between "start" being triggered and the race actually beginning, so every player sees a synced countdown. */
export const START_COUNTDOWN_SECONDS = 3

function futureStartTime(): string {
  return new Date(Date.now() + START_COUNTDOWN_SECONDS * 1000).toISOString()
}

interface RoomRow {
  code: string
  game_id: string
  status: Room['status']
  passage: string | null
  round_payload: unknown
  started_at: string | null
  mode: Record<string, unknown>
  round_number: number
  eliminated_ids: string[]
}

interface PlayerRow {
  id: string
  room_code: string
  nickname: string
  color: string
  is_host: boolean
  ready: boolean
}

function playerFromRow(row: PlayerRow): Player {
  return {
    id: row.id,
    nickname: row.nickname,
    color: row.color,
    isHost: row.is_host,
    ready: row.ready,
  }
}

async function fetchRoom(code: string): Promise<Room | null> {
  const [{ data: roomRow, error: roomError }, { data: playerRows, error: playersError }] = await Promise.all([
    supabase
      .from('rooms')
      .select('code, game_id, status, passage, round_payload, started_at, mode, round_number, eliminated_ids')
      .eq('code', code)
      .maybeSingle(),
    supabase.from('room_players').select('*').eq('room_code', code).order('joined_at', { ascending: true }),
  ])

  if (roomError) throw roomError
  if (playersError) throw playersError
  if (!roomRow) return null

  const room = roomRow as RoomRow
  return {
    code: room.code,
    gameId: room.game_id,
    status: room.status,
    passage: room.passage,
    roundPayload: room.round_payload ?? null,
    startedAt: room.started_at ? new Date(room.started_at).getTime() : null,
    mode: room.mode ?? {},
    roundNumber: room.round_number ?? 1,
    eliminatedIds: room.eliminated_ids ?? [],
    players: ((playerRows ?? []) as PlayerRow[]).map(playerFromRow),
  }
}

export async function createRoomOnServer(gameId: string, hostId: string, hostNickname: string): Promise<Room> {
  let code = makeRoomCode()

  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from('rooms').insert({ code, game_id: gameId, status: 'lobby' })
    if (!error) break
    if (error.code === '23505') {
      code = makeRoomCode()
      continue
    }
    throw error
  }

  const host: PlayerRow = {
    id: hostId,
    room_code: code,
    nickname: hostNickname,
    color: colorForIndex(0),
    is_host: true,
    ready: true,
  }
  const { error: playerError } = await supabase.from('room_players').insert(host)
  if (playerError) throw playerError

  const room = await fetchRoom(code)
  if (!room) throw new Error('Failed to create room')
  return room
}

export async function joinRoomOnServer(code: string, playerId: string, nickname: string): Promise<Room> {
  const room = await fetchRoom(code)
  if (!room) throw new Error('Room not found')
  if (room.status !== 'lobby') throw new Error('This game has already started')

  const player: PlayerRow = {
    id: playerId,
    room_code: code,
    nickname,
    color: colorForIndex(room.players.length),
    is_host: false,
    ready: false,
  }
  const { error } = await supabase.from('room_players').insert(player)
  if (error) throw error

  const updated = await fetchRoom(code)
  if (!updated) throw new Error('Failed to join room')
  return updated
}

export async function setPlayerReady(playerId: string, ready: boolean): Promise<void> {
  const { error } = await supabase.from('room_players').update({ ready }).eq('id', playerId)
  if (error) throw error
}

export async function setRoomStatus(code: string, status: Room['status']): Promise<void> {
  const { error } = await supabase.from('rooms').update({ status }).eq('code', code)
  if (error) throw error
}

export async function setRoomMode(code: string, mode: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('rooms').update({ mode }).eq('code', code)
  if (error) throw error
}

export async function startRace(code: string, passage: string): Promise<void> {
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'in-game', passage, started_at: futureStartTime(), round_number: 1, eliminated_ids: [] })
    .eq('code', code)
  if (error) throw error
}

export async function resetRoomForRematch(code: string, passage: string): Promise<void> {
  const { error: roomError } = await supabase
    .from('rooms')
    .update({ status: 'in-game', passage, started_at: futureStartTime(), round_number: 1, eliminated_ids: [] })
    .eq('code', code)
  if (roomError) throw roomError

  const { error: progressError } = await supabase.from('race_progress').delete().eq('room_code', code)
  if (progressError) throw progressError
}

/**
 * Advance an Elimination Rounds tournament: mark a player eliminated,
 * bump the round counter, and seed a fresh passage/start time for the
 * next round. Progress rows are cleared so the next round starts clean.
 *
 * Any surviving player's client may call this (not just the host) so the
 * tournament doesn't stall if the host is the one eliminated, or their
 * tab is slow/backgrounded. `expectedRound` guards against duplicate
 * advances if more than one client races to call this simultaneously —
 * the update only applies if the room is still on that round.
 */
export async function advanceEliminationRound(
  code: string,
  expectedRound: number,
  eliminatedIds: string[],
  nextPassage: string,
): Promise<void> {
  const { error: roomError } = await supabase
    .from('rooms')
    .update({
      eliminated_ids: eliminatedIds,
      passage: nextPassage,
      started_at: futureStartTime(),
      round_number: eliminatedIds.length + 1,
    })
    .eq('code', code)
    .eq('round_number', expectedRound)
  if (roomError) throw roomError

  const { error: progressError } = await supabase.from('race_progress').delete().eq('room_code', code)
  if (progressError) throw progressError
}

export async function finishTournament(code: string): Promise<void> {
  const { error } = await supabase.from('rooms').update({ status: 'finished' }).eq('code', code)
  if (error) throw error
}

export async function leaveRoom(playerId: string): Promise<void> {
  const { error } = await supabase.from('room_players').delete().eq('id', playerId)
  if (error) throw error
}

export async function initRaceProgress(roomCode: string, playerId: string): Promise<void> {
  const { error } = await supabase.from('race_progress').upsert({
    player_id: playerId,
    room_code: roomCode,
    chars_typed: 0,
    wpm: 0,
    accuracy: 100,
    finished: false,
    finished_at: null,
    result: null,
  })
  if (error) throw error
}

export async function updateRaceProgress(
  playerId: string,
  data: { charsTyped: number; wpm: number; accuracy: number },
): Promise<void> {
  const { error } = await supabase
    .from('race_progress')
    .update({ chars_typed: data.charsTyped, wpm: data.wpm, accuracy: data.accuracy, updated_at: new Date().toISOString() })
    .eq('player_id', playerId)
  if (error) throw error
}

export async function finishRace(playerId: string, result: RaceResult): Promise<void> {
  const { error } = await supabase
    .from('race_progress')
    .update({
      finished: true,
      finished_at: new Date().toISOString(),
      result,
      wpm: result.wpm,
      accuracy: result.accuracyChar,
    })
    .eq('player_id', playerId)
  if (error) throw error
}

export { fetchRoom }
