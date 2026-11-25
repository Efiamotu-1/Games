import { useEffect, useState } from 'react'
import type { MultiplayerGameProps } from '../registry'
import type { Player } from '../../shared/types'
import { leaveRoom } from '../../shared/roomApi'
import { pickPenalty, pickPrompt, type PromptKind } from './prompts'
import { endTruthOrDareGame, endTurn, rematchTruthOrDare, updateTurn } from './todApi'
import {
  EMPTY_STATS,
  MAX_TRUTH_STREAK,
  isTodPayload,
  newTodPayload,
  toTodMode,
  type PlayerStats,
  type TodPayload,
} from './types'

export default function MultiplayerTruthOrDare({ room, selfId, onExit }: MultiplayerGameProps) {
  const mode = toTodMode(room.mode)
  const payload: TodPayload = isTodPayload(room.roundPayload) ? room.roundPayload : newTodPayload()
  const self = room.players.find((p) => p.id === selfId)
  const isHost = self?.isHost ?? false

  if (room.status === 'finished') {
    return <FinalResults room={room} payload={payload} selfId={selfId} isHost={isHost} onExit={onExit} />
  }

  const order = payload.order.length > 0 ? payload.order : room.players.map((p) => p.id)
  const totalTurns = order.length * mode.turnsEach
  const turn = room.roundNumber
  const activeId = order[(turn - 1) % order.length]
  const active = room.players.find((p) => p.id === activeId) ?? null
  const isMyTurn = activeId === selfId

  return (
    <TurnScreen
      key={turn}
      roomCode={room.code}
      players={room.players}
      payload={payload}
      turn={turn}
      totalTurns={totalTurns}
      active={active}
      isMyTurn={isMyTurn}
      isHost={isHost}
      level={mode.level}
      maxSkips={mode.maxSkips}
      selfId={selfId}
      onExit={onExit}
    />
  )
}

function TurnScreen({
  roomCode,
  players,
  payload,
  turn,
  totalTurns,
  active,
  isMyTurn,
  isHost,
  level,
  maxSkips,
  selfId,
  onExit,
}: {
  roomCode: string
  players: Player[]
  payload: TodPayload
  turn: number
  totalTurns: number
  active: Player | null
  isMyTurn: boolean
  isHost: boolean
  level: ReturnType<typeof toTodMode>['level']
  maxSkips: number
  selfId: string
  onExit: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLastTurn = turn >= totalTurns
  const activeStats: PlayerStats = (active && payload.stats[active.id]) || EMPTY_STATS
  const skipsLeft = Math.max(0, maxSkips - activeStats.skips)
  const truthLocked = activeStats.truthStreak >= MAX_TRUTH_STREAK

  // If the player whose turn it is has left the room, the host moves play along.
  useEffect(() => {
    if (active || !isHost) return
    endTurn(roomCode, turn, payload, isLastTurn).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isHost, turn])

  async function run(action: () => Promise<unknown>) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError((e as { message?: string } | null)?.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function choose(requested: PromptKind | 'random') {
    if (!active) return
    let kind: PromptKind = requested === 'random' ? (Math.random() < 0.5 ? 'truth' : 'dare') : requested
    if (kind === 'truth' && truthLocked) kind = 'dare'
    const prompt = pickPrompt(kind, level, payload.seen)
    const stats: PlayerStats = {
      ...activeStats,
      truths: activeStats.truths + (kind === 'truth' ? 1 : 0),
      dares: activeStats.dares + (kind === 'dare' ? 1 : 0),
      truthStreak: kind === 'truth' ? activeStats.truthStreak + 1 : 0,
    }
    run(() =>
      updateTurn(roomCode, turn, {
        ...payload,
        phase: 'prompt',
        kind,
        prompt,
        seen: [...payload.seen, prompt].slice(-60),
        stats: { ...payload.stats, [active.id]: stats },
      }),
    )
  }

  function pass() {
    if (!active || skipsLeft <= 0) return
    const penalty = pickPenalty(payload.seen)
    run(() =>
      updateTurn(roomCode, turn, {
        ...payload,
        phase: 'penalty',
        prompt: penalty,
        seen: [...payload.seen, penalty].slice(-60),
        stats: { ...payload.stats, [active.id]: { ...activeStats, skips: activeStats.skips + 1 } },
      }),
    )
  }

  function done() {
    run(() => endTurn(roomCode, turn, payload, isLastTurn))
  }

  function endGame() {
    if (window.confirm('End the game for everyone?')) run(() => endTruthOrDareGame(roomCode))
  }

  const name = active?.nickname ?? 'Someone'
  const phase = payload.phase

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-2xl flex items-center justify-between mb-6">
        <p className="text-sm font-semibold tracking-tight">Truth or Dare</p>
        <p className="text-xs text-neutral-500">
          Turn {turn} of {totalTurns}
        </p>
        <button
          onClick={() => {
            leaveRoom(selfId).catch(() => {})
            onExit()
          }}
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Leave
        </button>
      </header>

      <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
        <div className="flex flex-wrap justify-center gap-2">
          {players.map((p) => (
            <span
              key={p.id}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                p.id === active?.id ? 'border-violet-400 bg-violet-500/15 text-violet-200' : 'border-neutral-800 text-neutral-400'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.nickname}
              {p.id === selfId && ' (you)'}
            </span>
          ))}
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-10 text-center space-y-5">
          {phase === 'choose' && (
            <>
              <p className="text-sm uppercase tracking-widest text-neutral-500">
                {isMyTurn ? 'Your turn' : `${name}'s turn`}
              </p>
              {isMyTurn ? (
                <>
                  <h1 className="text-2xl sm:text-3xl font-semibold">Truth or Dare?</h1>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => choose('truth')}
                      disabled={busy || truthLocked}
                      className="rounded-2xl bg-sky-500/90 py-5 text-lg font-semibold text-white hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Truth
                    </button>
                    <button
                      onClick={() => choose('dare')}
                      disabled={busy}
                      className="rounded-2xl bg-rose-500/90 py-5 text-lg font-semibold text-white hover:bg-rose-400 disabled:opacity-40"
                    >
                      Dare
                    </button>
                  </div>
                  <button
                    onClick={() => choose('random')}
                    disabled={busy}
                    className="text-sm text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
                  >
                    🎲 Surprise me
                  </button>
                  {truthLocked && (
                    <p className="text-xs text-amber-300/80">
                      That's {MAX_TRUTH_STREAK} truths in a row. Time for a dare!
                    </p>
                  )}
                </>
              ) : (
                <h1 className="text-2xl font-semibold animate-pulse">{name} is choosing…</h1>
              )}
            </>
          )}

          {(phase === 'prompt' || phase === 'penalty') && (
            <>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
                  phase === 'penalty'
                    ? 'bg-amber-500/20 text-amber-300'
                    : payload.kind === 'truth'
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {phase === 'penalty' ? 'Forfeit' : payload.kind}
              </span>
              <p className="text-sm text-neutral-500">{isMyTurn ? 'For you' : `For ${name}`}</p>
              <h1 className="text-xl sm:text-3xl font-semibold leading-snug">{payload.prompt}</h1>

              {isMyTurn ? (
                <div className="flex flex-col gap-3 sm:flex-row pt-2">
                  <button
                    onClick={done}
                    disabled={busy}
                    className="flex-1 rounded-2xl bg-violet-500 py-3 font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
                  >
                    {isLastTurn ? 'Done — finish game' : 'Done ✓'}
                  </button>
                  {phase === 'prompt' && skipsLeft > 0 && (
                    <button
                      onClick={pass}
                      disabled={busy}
                      className="flex-1 rounded-2xl border border-neutral-700 py-3 text-sm font-medium hover:border-neutral-500 disabled:opacity-50"
                    >
                      Pass (forfeit) · {skipsLeft} left
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 animate-pulse">Waiting for {name} to finish…</p>
              )}
            </>
          )}

          {error && <p className="text-sm text-rose-400">{error}</p>}
        </div>

        {isHost && (
          <div className="text-center">
            <button onClick={endGame} className="text-xs text-neutral-600 hover:text-neutral-400">
              End game
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function FinalResults({
  room,
  payload,
  selfId,
  isHost,
  onExit,
}: {
  room: { code: string; players: Player[] }
  payload: TodPayload
  selfId: string
  isHost: boolean
  onExit: () => void
}) {
  const [busy, setBusy] = useState(false)
  const rows = room.players.map((p) => ({ player: p, stats: payload.stats[p.id] ?? EMPTY_STATS }))

  async function playAgain() {
    setBusy(true)
    try {
      await rematchTruthOrDare(room.code)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
        <div className="text-center space-y-1">
          <p className="text-sm uppercase tracking-widest text-neutral-500">Game over</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Thanks for playing! 🎉</h1>
        </div>

        <div className="space-y-2">
          {rows.map(({ player, stats }) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3 ${
                player.id === selfId ? 'ring-1 ring-violet-400/40' : ''
              }`}
            >
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: player.color }} />
              <p className="min-w-0 flex-1 truncate font-medium">{player.nickname}</p>
              <p className="text-xs text-neutral-400 tabular-nums">
                {stats.truths} truth{stats.truths === 1 ? '' : 's'} · {stats.dares} dare{stats.dares === 1 ? '' : 's'}
                {stats.skips > 0 && ` · ${stats.skips} pass${stats.skips === 1 ? '' : 'es'}`}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {isHost && (
            <button
              onClick={playAgain}
              disabled={busy}
              className="flex-1 rounded-xl border border-neutral-700 py-3 text-sm font-medium hover:border-neutral-500 disabled:opacity-50"
            >
              {busy ? 'Starting…' : 'Play again'}
            </button>
          )}
          <button
            onClick={() => {
              leaveRoom(selfId).catch(() => {})
              onExit()
            }}
            className="flex-1 rounded-2xl bg-violet-500 py-3 font-semibold text-white hover:bg-violet-400"
          >
            Back to Arcade
          </button>
        </div>
      </main>
    </div>
  )
}
