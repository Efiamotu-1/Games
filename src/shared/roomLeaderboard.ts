import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface RoomLeaderboardEntry {
  id: string
  roomCode: string
  gameId: string
  playerId: string
  nickname: string
  entryType: 'race' | 'tournament' | 'categories'
  wpm: number | null
  accuracyChar: number | null
  placement: number | null
  roundsPlayed: number | null
  mode: Record<string, unknown>
  createdAt: number
}

interface RoomLeaderboardRow {
  id: string
  room_code: string
  game_id: string
  player_id: string
  nickname: string
  entry_type: 'race' | 'tournament' | 'categories'
  wpm: number | null
  accuracy_char: number | null
  placement: number | null
  rounds_played: number | null
  mode: Record<string, unknown>
  created_at: string
}

function fromRow(row: RoomLeaderboardRow): RoomLeaderboardEntry {
  return {
    id: row.id,
    roomCode: row.room_code,
    gameId: row.game_id,
    playerId: row.player_id,
    nickname: row.nickname,
    entryType: row.entry_type,
    wpm: row.wpm,
    accuracyChar: row.accuracy_char,
    placement: row.placement,
    roundsPlayed: row.rounds_played,
    mode: row.mode ?? {},
    createdAt: new Date(row.created_at).getTime(),
  }
}

export async function saveRaceLeaderboardEntry(params: {
  roomCode: string
  gameId: string
  playerId: string
  nickname: string
  wpm: number
  accuracyChar: number
  mode: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabase.from('room_leaderboard').insert({
    room_code: params.roomCode,
    game_id: params.gameId,
    player_id: params.playerId,
    nickname: params.nickname,
    entry_type: 'race',
    wpm: params.wpm,
    accuracy_char: params.accuracyChar,
    mode: params.mode,
  })
  if (error) throw error
}

export async function saveTournamentLeaderboardEntry(params: {
  roomCode: string
  gameId: string
  playerId: string
  nickname: string
  placement: number
  roundsPlayed: number
  mode: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabase.from('room_leaderboard').insert({
    room_code: params.roomCode,
    game_id: params.gameId,
    player_id: params.playerId,
    nickname: params.nickname,
    entry_type: 'tournament',
    placement: params.placement,
    rounds_played: params.roundsPlayed,
    mode: params.mode,
  })
  if (error) throw error
}

export async function saveCategoriesLeaderboardEntry(params: {
  roomCode: string
  gameId: string
  playerId: string
  nickname: string
  placement: number
  roundsPlayed: number
  mode: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabase.from('room_leaderboard').insert({
    room_code: params.roomCode,
    game_id: params.gameId,
    player_id: params.playerId,
    nickname: params.nickname,
    entry_type: 'categories',
    placement: params.placement,
    rounds_played: params.roundsPlayed,
    mode: params.mode,
  })
  if (error) throw error
}

export function useRoomLeaderboard(roomCode: string | null): RoomLeaderboardEntry[] {
  const [entries, setEntries] = useState<RoomLeaderboardEntry[]>([])

  useEffect(() => {
    if (!roomCode) {
      setEntries([])
      return
    }

    const code = roomCode
    let cancelled = false

    function refresh() {
      supabase
        .from('room_leaderboard')
        .select('*')
        .eq('room_code', code)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (!cancelled && data) setEntries((data as RoomLeaderboardRow[]).map(fromRow))
        })
    }

    refresh()

    const channel = supabase
      .channel(`leaderboard:${code}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_leaderboard', filter: `room_code=eq.${code}` },
        refresh,
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [roomCode])

  return entries
}
