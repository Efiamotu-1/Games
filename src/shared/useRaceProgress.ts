import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { RaceProgress } from './types'

interface RaceProgressRow {
  player_id: string
  chars_typed: number
  wpm: number
  accuracy: number
  finished: boolean
  finished_at: string | null
  result: RaceProgress['result']
}

function fromRow(row: RaceProgressRow): RaceProgress {
  return {
    playerId: row.player_id,
    charsTyped: row.chars_typed,
    wpm: row.wpm,
    accuracy: row.accuracy,
    finished: row.finished,
    finishedAt: row.finished_at ? new Date(row.finished_at).getTime() : null,
    result: row.result,
  }
}

export function useRaceProgress(roomCode: string | null): RaceProgress[] {
  const [progress, setProgress] = useState<RaceProgress[]>([])

  useEffect(() => {
    if (!roomCode) {
      setProgress([])
      return
    }

    const code = roomCode
    let cancelled = false

    function refresh() {
      supabase
        .from('race_progress')
        .select('*')
        .eq('room_code', code)
        .then(({ data }) => {
          if (!cancelled && data) setProgress((data as RaceProgressRow[]).map(fromRow))
        })
    }

    refresh()

    const channel = supabase
      .channel(`race:${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'race_progress', filter: `room_code=eq.${code}` },
        refresh,
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [roomCode])

  return progress
}
