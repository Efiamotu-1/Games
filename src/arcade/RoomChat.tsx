import { useEffect, useRef, useState } from 'react'
import type { Room } from '../shared/types'
import { sendChatMessage, useRoomChat, useTyping, type ReplyTarget } from '../shared/roomChat'

/** Floating chat bubble + panel for a room. Mount it only where chatting is allowed. */
export default function RoomChat({ room, selfId }: { room: Room; selfId: string }) {
  const { messages, add } = useRoomChat(room.code)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [seen, setSeen] = useState(0)
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const self = room.players.find((p) => p.id === selfId)
  const { typingNames, notifyTyping, stopTyping } = useTyping(room.code, selfId, self?.nickname ?? 'Someone')

  const unread = open ? 0 : Math.max(0, messages.filter((m) => m.playerId !== selfId).length - seen)

  useEffect(() => {
    if (open) setSeen(messages.filter((m) => m.playerId !== selfId).length)
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [open, messages, selfId, typingNames.length])

  async function send() {
    const body = text.trim()
    if (!body || !self) return
    const reply = replyTo
    setText('')
    setReplyTo(null)
    setEmojiOpen(false)
    stopTyping()
    setError(null)
    try {
      const sent = await sendChatMessage({ roomCode: room.code, playerId: self.id, nickname: self.nickname, color: self.color, body, replyTo: reply })
      if (sent) add(sent)
    } catch (e) {
      setText(body)
      setReplyTo(reply)
      setError((e as { message?: string } | null)?.message || 'Could not send.')
    }
  }

  function jumpTo(id: string) {
    const el = document.getElementById(`msg-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.classList.add('ring-2', 'ring-violet-300')
    setTimeout(() => el?.classList.remove('ring-2', 'ring-violet-300'), 1200)
  }

  function startReply(m: { id: string; nickname: string; body: string }) {
    setReplyTo({ id: m.id, nickname: m.nickname, body: m.body })
    inputRef.current?.focus()
  }

  function addEmoji(e: string) {
    setText((t) => (t + e).slice(0, 300))
    notifyTyping()
    inputRef.current?.focus()
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-[min(22rem,calc(100vw-2rem))] h-[min(26rem,70vh)] flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur shadow-2xl animate-pop-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <p className="text-sm font-medium text-neutral-200">Room chat</p>
            <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-neutral-300 text-sm" aria-label="Close chat">
              ✕
            </button>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-neutral-600 text-center mt-6">No messages yet. Say hi 👋</p>
            )}
            {messages.map((m) => {
              const mine = m.playerId === selfId
              return (
                <div key={m.id} className={`group flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {!mine && (
                    <span className="text-[11px] font-medium mb-0.5" style={{ color: m.color }}>
                      {m.nickname}
                    </span>
                  )}
                  <div className={`flex items-center gap-1.5 max-w-[92%] ${mine ? 'flex-row-reverse' : ''}`}>
                    <div
                      id={`msg-${m.id}`}
                      className={`flow-root min-w-[4.5rem] rounded-2xl px-3 py-1.5 text-sm break-words transition-shadow ${
                        mine ? 'bg-violet-500 text-white' : 'bg-neutral-800 text-neutral-100'
                      }`}
                    >
                      {m.replyTo && (
                        <button
                          type="button"
                          onClick={() => jumpTo(m.replyTo!.id)}
                          className={`block w-full text-left mb-1 rounded-lg border-l-2 px-2 py-1 text-xs ${
                            mine ? 'bg-violet-600/60 border-violet-200' : 'bg-neutral-900/70 border-violet-400'
                          }`}
                        >
                          <span className="font-semibold block">{m.replyTo.nickname}</span>
                          <span className="opacity-80 line-clamp-2">{m.replyTo.body}</span>
                        </button>
                      )}
                      {m.body}
                      <span className="float-right ml-3 mt-1.5 -mb-0.5 text-[10px] leading-none whitespace-nowrap opacity-60">
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startReply(m)}
                      aria-label={`Reply to ${m.nickname}`}
                      className="shrink-0 text-neutral-500 hover:text-violet-300 opacity-40 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    >
                      ↩
                    </button>
                  </div>
                </div>
              )
            })}
            {typingNames.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span className="flex gap-0.5">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </span>
                {typingLabel(typingNames)}
              </div>
            )}
          </div>
          {error && <p className="px-4 pb-1 text-xs text-rose-400">{error}</p>}
          {replyTo && (
            <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg border-l-2 border-violet-400 bg-neutral-900 px-2 py-1.5 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-violet-300">Replying to {replyTo.nickname}</p>
                <p className="truncate text-neutral-400">{replyTo.body}</p>
              </div>
              <button type="button" onClick={() => setReplyTo(null)} className="text-neutral-500 hover:text-neutral-300" aria-label="Cancel reply">
                ✕
              </button>
            </div>
          )}
          {emojiOpen && (
            <div className="mx-3 mt-2 grid grid-cols-8 gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-2 max-h-32 overflow-y-auto">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => addEmoji(e)} className="text-xl rounded-md hover:bg-neutral-800 py-0.5">
                  {e}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            className="flex gap-2 p-3"
          >
            <button
              type="button"
              onClick={() => setEmojiOpen((o) => !o)}
              aria-label="Add emoji"
              className={`shrink-0 w-10 rounded-xl border text-lg ${
                emojiOpen ? 'border-violet-400 bg-violet-500/15' : 'border-neutral-700 hover:border-neutral-500'
              }`}
            >
              😊
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                if (e.target.value.trim()) notifyTyping()
                else stopTyping()
              }}
              maxLength={300}
              placeholder="Message the room…"
              className="flex-1 min-w-0 rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-violet-400"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-4 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-sm font-semibold text-white"
            >
              Send
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-2 rounded-full bg-violet-500 hover:bg-violet-400 text-white px-4 py-3 text-sm font-semibold shadow-[0_8px_30px_-8px_rgba(167,139,250,0.7)]"
      >
        💬 Chat
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-[11px] flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}

const EMOJIS = [
  '😀','😂','🤣','😊','😍','😎','🥳','😜','🤔','😅','😭','😡',
  '🤯','😴','🙄','😏','👍','👎','👏','🙌','🙏','💪','🔥','💯',
  '🎉','🏆','🥇','⚡','💀','👀','❤️','💔','😈','🤝','🫡','🤡',
  '🧠','⌨️','🚀','✅','❌','😬','🥶','🥵','🤞','👋','🍕','☕',
]

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function typingLabel(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing…`
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`
  return `${names[0]} and ${names.length - 1} others are typing…`
}
