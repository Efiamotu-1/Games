import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface ChatMessage {
  id: string
  playerId: string
  nickname: string
  color: string
  body: string
  createdAt: number
  replyTo: { id: string; nickname: string; body: string } | null
}

export interface ReplyTarget {
  id: string
  nickname: string
  body: string
}

interface ChatRow {
  id: string
  player_id: string
  nickname: string
  color: string
  body: string
  created_at: string
  reply_to_id: string | null
  reply_nickname: string | null
  reply_body: string | null
}

function fromRow(r: ChatRow): ChatMessage {
  return {
    id: r.id,
    playerId: r.player_id,
    nickname: r.nickname,
    color: r.color,
    body: r.body,
    createdAt: new Date(r.created_at).getTime(),
    replyTo: r.reply_to_id
      ? { id: r.reply_to_id, nickname: r.reply_nickname ?? 'Someone', body: r.reply_body ?? '' }
      : null,
  }
}

export async function sendChatMessage(params: {
  roomCode: string
  playerId: string
  nickname: string
  color: string
  body: string
  replyTo?: ReplyTarget | null
}): Promise<ChatMessage | null> {
  const body = params.body.trim().slice(0, 300)
  if (!body) return null
  const { data, error } = await supabase
    .from('room_messages')
    .insert({
      room_code: params.roomCode,
      player_id: params.playerId,
      nickname: params.nickname,
      color: params.color,
      body,
      ...(params.replyTo
        ? {
            reply_to_id: params.replyTo.id,
            reply_nickname: params.replyTo.nickname,
            reply_body: params.replyTo.body.slice(0, 120),
          }
        : {}),
    })
    .select()
    .single()
  if (error) throw error
  return fromRow(data as ChatRow)
}

export function useRoomChat(roomCode: string): { messages: ChatMessage[]; add: (m: ChatMessage) => void } {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    let cancelled = false

    function merge(incoming: ChatMessage[]) {
      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]))
        for (const m of incoming) map.set(m.id, m)
        return [...map.values()].sort((a, b) => a.createdAt - b.createdAt).slice(-200)
      })
    }

    function load() {
      supabase
        .from('room_messages')
        .select('*')
        .eq('room_code', roomCode)
        .order('created_at', { ascending: true })
        .limit(200)
        .then(({ data }) => {
          if (!cancelled && data) merge((data as ChatRow[]).map(fromRow))
        })
    }

    load()
    // Fallback in case realtime isn't delivering for this table.
    const poll = setInterval(load, 3000)

    const channel = supabase
      .channel(`chat:${roomCode}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_code=eq.${roomCode}` },
        (payload) => merge([fromRow(payload.new as ChatRow)]),
      )
      .subscribe()

    return () => {
      cancelled = true
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [roomCode])

  const add = (m: ChatMessage) =>
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m].sort((a, b) => a.createdAt - b.createdAt)))

  return { messages, add }
}

const TYPING_TTL_MS = 3000
const TYPING_THROTTLE_MS = 1500

/** Live "who is typing" via Realtime broadcast (nothing is stored in the database). */
export function useTyping(
  roomCode: string,
  selfId: string,
  selfName: string,
): { typingNames: string[]; notifyTyping: () => void; stopTyping: () => void } {
  const [typing, setTyping] = useState<Record<string, { name: string; until: number }>>({})
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastSent = useRef(0)

  useEffect(() => {
    const channel = supabase
      .channel(`typing:${roomCode}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { id, name, typing: isTyping } = payload as { id: string; name: string; typing: boolean }
        if (id === selfId) return
        setTyping((prev) => {
          const next = { ...prev }
          if (isTyping) next[id] = { name, until: Date.now() + TYPING_TTL_MS }
          else delete next[id]
          return next
        })
      })
      .subscribe()
    channelRef.current = channel

    const sweep = setInterval(() => {
      setTyping((prev) => {
        const now = Date.now()
        const entries = Object.entries(prev)
        if (entries.every(([, v]) => v.until > now)) return prev
        return Object.fromEntries(entries.filter(([, v]) => v.until > now))
      })
    }, 1000)

    return () => {
      clearInterval(sweep)
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [roomCode, selfId])

  const send = useCallback(
    (isTyping: boolean) => {
      channelRef.current
        ?.send({ type: 'broadcast', event: 'typing', payload: { id: selfId, name: selfName, typing: isTyping } })
        .catch(() => {})
    },
    [selfId, selfName],
  )

  const notifyTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastSent.current < TYPING_THROTTLE_MS) return
    lastSent.current = now
    send(true)
  }, [send])

  const stopTyping = useCallback(() => {
    lastSent.current = 0
    send(false)
  }, [send])

  return { typingNames: Object.values(typing).map((v) => v.name), notifyTyping, stopTyping }
}
