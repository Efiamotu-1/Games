import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { fetchRoom } from './roomApi'
import type { Room } from './types'

export function useRoom(code: string | null): Room | null {
  const [room, setRoom] = useState<Room | null>(null)

  useEffect(() => {
    if (!code) {
      setRoom(null)
      return
    }

    const roomCode = code
    let cancelled = false

    function refresh() {
      fetchRoom(roomCode).then((r) => {
        if (!cancelled) setRoom(r)
      })
    }

    refresh()

    const channel = supabase
      .channel(`room:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` }, refresh)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_code=eq.${code}` },
        refresh,
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [code])

  return room
}
