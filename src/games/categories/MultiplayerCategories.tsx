import { useEffect, useRef, useState } from 'react'
import type { Room } from '../../shared/types'
import { leaveRoom } from '../../shared/roomApi'
import { saveCategoriesLeaderboardEntry } from '../../shared/roomLeaderboard'
import RoomLeaderboard from '../../arcade/RoomLeaderboard'
import RaceCountdown, { isCountingDown } from '../typing-wars/RaceCountdown'
import {
  advanceCategoriesRound,
  finishCategoriesGame,
  resetCategoriesForRematch,
  scoreCategoriesRound,
  submitCategoriesAnswer,
  submitCategoriesTimeout,
} from './categoriesApi'
import { useCategoriesSubmissions } from './useCategoriesSubmissions'
import { getRandomPrompt, isValidAnswer, type CategoryPrompt } from './wordBank'
import { ROUND_SECONDS, toCategoriesMode } from './types'

interface MultiplayerCategoriesProps {
  room: Room
  selfId: string
  onExit: () => void
}

function isCategoryPrompt(value: unknown): value is CategoryPrompt {
  return !!value && typeof value === 'object' && 'category' in value && 'letter' in value
}

export default function MultiplayerCategories({ room, selfId, onExit }: MultiplayerCategoriesProps) {
  const [, forceTick] = useState(0)
  const prompt = isCategoryPrompt(room.roundPayload) ? room.roundPayload : null

  if (!prompt || !room.startedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-neutral-400 animate-pulse">Preparing the round…</p>
      </div>
    )
  }

  if (isCountingDown(room.startedAt)) {
    return (
      <RaceCountdown startedAt={room.startedAt} label={`Round ${room.roundNumber} starting`} onDone={() => forceTick((n) => n + 1)} />
    )
  }

  return <RoundScreen key={`${room.roundNumber}-${room.startedAt}`} room={room} prompt={prompt} selfId={selfId} onExit={onExit} />
}

function RoundScreen({
  room,
  prompt,
  selfId,
  onExit,
}: {
  room: Room
  prompt: CategoryPrompt
  selfId: string
  onExit: () => void
}) {
  const mode = toCategoriesMode(room.mode)
  const roundNumber = room.roundNumber
  const [startedAt] = useState(() => room.startedAt ?? Date.now())
  const [remaining, setRemaining] = useState(ROUND_SECONDS)
  const [answer, setAnswer] = useState('')
  const answerRef = useRef('')
  const submitted = useRef(false)
  const scoringStarted = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const submissions = useCategoriesSubmissions(room.code)

  const roundSubmissions = submissions.filter((s) => s.roundNumber === roundNumber)
  const allSubmitted = room.players.length > 0 && room.players.every((p) => roundSubmissions.find((s) => s.playerId === p.id)?.submitted)
  const roundScored = allSubmitted && room.players.every((p) => roundSubmissions.find((s) => s.playerId === p.id)?.scored)

  useEffect(() => {
    inputRef.current?.focus()
    function handleUnload() {
      leaveRoom(selfId).catch(() => {})
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (submitted.current) return
    const interval = setInterval(() => {
      const left = ROUND_SECONDS - (Date.now() - startedAt) / 1000
      setRemaining(Math.max(0, left))
      if (left <= 0) submit()
    }, 100)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt])

  async function submit() {
    if (submitted.current) return
    submitted.current = true
    const currentAnswer = answerRef.current
    const valid = isValidAnswer(prompt.category, prompt.letter, currentAnswer)
    try {
      if (currentAnswer.trim()) {
        await submitCategoriesAnswer(room.code, selfId, roundNumber, currentAnswer.trim(), valid)
      } else {
        await submitCategoriesTimeout(room.code, selfId, roundNumber)
      }
    } catch {
      submitted.current = false
    }
  }

  // Once everyone has submitted, any client can trigger scoring (idempotent: recomputes deterministically).
  useEffect(() => {
    if (!allSubmitted || scoringStarted.current) return
    scoringStarted.current = true
    scoreCategoriesRound(roundNumber, roundSubmissions).catch(() => {
      scoringStarted.current = false
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubmitted])

  if (allSubmitted && roundScored) {
    return (
      <RoundResults room={room} prompt={prompt} roundSubmissions={roundSubmissions} allSubmissions={submissions} selfId={selfId} onExit={onExit} />
    )
  }

  if (allSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-neutral-400 animate-pulse">Scoring round…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-2xl flex items-center justify-between gap-3 mb-6 sm:mb-8 flex-wrap">
        <div className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.7)]" />
          Categories
        </div>
        <p className="text-xs text-neutral-500">
          Round {roundNumber} of {mode.totalRounds}
        </p>
      </header>

      <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-neutral-500">{prompt.category}</p>
          <p className="text-6xl font-bold tracking-widest text-violet-300">{prompt.letter}</p>
          <p className={`text-2xl font-semibold ${remaining <= 10 ? 'text-rose-400' : 'text-neutral-300'}`}>
            {remaining.toFixed(1)}s
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6 space-y-3">
          <input
            ref={inputRef}
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value)
              answerRef.current = e.target.value
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            disabled={submitted.current}
            placeholder={`${prompt.category} starting with ${prompt.letter}...`}
            maxLength={40}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-lg outline-none focus:border-violet-400 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={submit}
            disabled={submitted.current}
            className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white font-semibold"
          >
            {submitted.current ? 'Waiting for others…' : 'Submit'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {room.players.map((p) => {
            const hasSubmitted = roundSubmissions.find((s) => s.playerId === p.id)?.submitted
            return (
              <span
                key={p.id}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  hasSubmitted ? 'border-emerald-400/30 text-emerald-300 bg-emerald-400/5' : 'border-neutral-800 text-neutral-500'
                }`}
              >
                {p.nickname} {hasSubmitted ? '✓' : '…'}
              </span>
            )
          })}
        </div>
      </main>
    </div>
  )
}

function RoundResults({
  room,
  prompt,
  roundSubmissions,
  allSubmissions,
  selfId,
  onExit,
}: {
  room: Room
  prompt: CategoryPrompt
  roundSubmissions: ReturnType<typeof useCategoriesSubmissions>
  allSubmissions: ReturnType<typeof useCategoriesSubmissions>
  selfId: string
  onExit: () => void
}) {
  const mode = toCategoriesMode(room.mode)
  const isLastRound = room.roundNumber >= mode.totalRounds
  const self = room.players.find((p) => p.id === selfId)
  const isHost = self?.isHost ?? false
  const [advancing, setAdvancing] = useState(false)

  const totals = room.players.map((p) => ({
    player: p,
    total: allSubmissions.filter((s) => s.playerId === p.id).reduce((sum, s) => sum + s.score, 0),
  }))
  const ranked = [...totals].sort((a, b) => b.total - a.total)

  async function next() {
    setAdvancing(true)
    try {
      if (isLastRound) {
        const finalRanked = [...totals].sort((a, b) => b.total - a.total)
        await Promise.all(
          finalRanked.map((r, i) =>
            saveCategoriesLeaderboardEntry({
              roomCode: room.code,
              gameId: room.gameId,
              playerId: r.player.id,
              nickname: r.player.nickname,
              placement: i + 1,
              roundsPlayed: mode.totalRounds,
              mode: room.mode,
            }).catch(() => {}),
          ),
        )
        await finishCategoriesGame(room.code)
      } else {
        await advanceCategoriesRound(room.code, room.roundNumber, getRandomPrompt())
      }
    } finally {
      setAdvancing(false)
    }
  }

  function handleExit() {
    leaveRoom(selfId).catch(() => {})
    onExit()
  }

  async function rematch() {
    setAdvancing(true)
    try {
      await resetCategoriesForRematch(room.code, getRandomPrompt())
    } finally {
      setAdvancing(false)
    }
  }

  if (room.status === 'finished') {
    const medals = ['🥇', '🥈', '🥉']
    const winner = ranked[0]
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
        <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
          <div className="text-center space-y-2">
            <p className="text-sm text-neutral-500 uppercase tracking-widest">Final Results</p>
            {winner && (
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                🏆 {winner.player.nickname} wins{winner.player.id === selfId ? " — that's you!" : ''}
              </h1>
            )}
          </div>

          <div className="space-y-2">
            {ranked.map((r, i) => (
              <div
                key={r.player.id}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                  i < 3 ? 'border-amber-400/20 bg-amber-400/5' : 'border-neutral-800 bg-neutral-900/40'
                } ${r.player.id === selfId ? 'ring-1 ring-violet-400/40' : ''}`}
              >
                <span className="w-7 text-center text-sm font-semibold text-neutral-500 shrink-0">{medals[i] ?? i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {r.player.nickname}
                    {r.player.id === selfId && <span className="text-neutral-500 font-normal"> (you)</span>}
                  </p>
                  <p className="text-xs text-neutral-500">{r.total} points</p>
                </div>
              </div>
            ))}
          </div>

          <RoomLeaderboard roomCode={room.code} />

          <div className="flex flex-col sm:flex-row gap-3">
            {isHost && (
              <button
                onClick={rematch}
                disabled={advancing}
                className="flex-1 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {advancing ? 'Starting…' : 'Rematch'}
              </button>
            )}
            <button
              onClick={handleExit}
              className="flex-1 py-3 rounded-2xl bg-violet-500 hover:bg-violet-400 transition-colors text-white font-semibold"
            >
              Back to Arcade
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
        <div className="text-center space-y-2">
          <p className="text-sm text-neutral-500 uppercase tracking-widest">
            Round {room.roundNumber} of {mode.totalRounds}
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {prompt.category} — {prompt.letter}
          </h1>
        </div>

        <div className="space-y-2">
          {room.players.map((p) => {
            const s = roundSubmissions.find((sub) => sub.playerId === p.id)
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  s?.score ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-neutral-800 bg-neutral-900/40'
                } ${p.id === selfId ? 'ring-1 ring-violet-400/40' : ''}`}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.nickname}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {s?.answer ? `"${s.answer}"` : 'No answer'}
                    {s?.answer && !s.isValid && ' · not valid'}
                    {s?.answer && s.isValid && !s.isUnique && ' · not unique'}
                  </p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ml-3 ${s?.score ? 'text-emerald-400' : 'text-neutral-600'}`}>
                  {s?.score ? '+1' : '+0'}
                </span>
              </div>
            )
          })}
        </div>

        {isHost && (
          <button
            onClick={next}
            disabled={advancing}
            className="w-full py-4 rounded-2xl bg-violet-500 hover:bg-violet-400 disabled:opacity-40 transition-colors text-white font-semibold text-lg shadow-[0_8px_30px_-8px_rgba(167,139,250,0.6)]"
          >
            {advancing ? 'Loading…' : isLastRound ? 'See Final Results' : 'Next Round'}
          </button>
        )}
        {!isHost && <p className="text-center text-sm text-neutral-500">Waiting for host to continue…</p>}
      </main>
    </div>
  )
}
