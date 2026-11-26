import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORIES, dealDaily, type Question } from './questions'
import { fetchBatch, fetchLatestBatch, todayKey } from './generatedApi'
import {
  fetchLeaderboard,
  fetchMyEntry,
  fetchRank,
  getDeviceId,
  loadNickname,
  saveNickname,
  submitDailyScore,
  type DailyEntry,
} from './dailyApi'
import { rankFor } from './rank'
import { TIME_LIMITS } from './types'
import RunPlayer, { Stat, type RunResult } from './RunPlayer'

type Phase = 'loading' | 'unavailable' | 'ready' | 'playing' | 'done'
type Saving = 'saving' | 'saved' | 'failed'

const NICKNAME_MAX = 20

/** Players with this nickname get a button to review every answer once they have finished. */
const REVIEWER_NICKNAME = 'abanikanda'
const NO_TIMER_MS = 24 * 60 * 60 * 1000

function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** Solo play is the daily trivia: one set of questions for everyone, one scored attempt, a top-10 board. */
export default function RapidRunGame({ onExit }: { onExit: () => void }) {
  const playerId = useMemo(() => getDeviceId(), [])
  const [phase, setPhase] = useState<Phase>('loading')
  const [day, setDay] = useState('')
  const [deck, setDeck] = useState<Question[]>([])
  const [nickname, setNickname] = useState(loadNickname)
  const [board, setBoard] = useState<DailyEntry[]>([])
  const [mine, setMine] = useState<DailyEntry | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [run, setRun] = useState<RunResult | null>(null)
  const [saving, setSaving] = useState<Saving>('saved')
  const [limitSeconds, setLimitSeconds] = useState(0)

  const refreshBoard = useCallback(async (forDay: string) => {
    const entries = await fetchLeaderboard(forDay).catch(() => null)
    if (entries) setBoard(entries)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const batch = await fetchLatestBatch().catch(() => null)
      const questions = batch ? await fetchBatch(batch).catch(() => null) : null
      if (cancelled) return
      if (!batch || !questions || questions.length === 0) {
        setPhase('unavailable')
        return
      }
      setDay(batch.day)
      setDeck(dealDaily(batch.day, questions))
      const [entry, entries] = await Promise.all([
        fetchMyEntry(batch.day, playerId).catch(() => null),
        fetchLeaderboard(batch.day).catch(() => [] as DailyEntry[]),
      ])
      if (cancelled) return
      setBoard(entries)
      if (entry) {
        setMine(entry)
        setRank(await fetchRank(batch.day, entry.score, entry.seconds).catch(() => null))
        setPhase('done')
      } else {
        setPhase('ready')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [playerId])

  const submit = useCallback(
    async (result: RunResult, name: string) => {
      setSaving('saving')
      try {
        const saved = await submitDailyScore({ day, playerId, nickname: name, deck, run: result, limitSeconds })
        setMine({ nickname: name, score: saved.score, answered: saved.answered, seconds: saved.seconds })
        setRank(await fetchRank(day, saved.score, saved.seconds).catch(() => null))
        await refreshBoard(day)
        setSaving('saved')
      } catch {
        setSaving('failed')
      }
    },
    [day, playerId, deck, limitSeconds, refreshBoard],
  )

  const start = useCallback(() => {
    const name = nickname.trim().slice(0, NICKNAME_MAX)
    if (!name) return
    saveNickname(name)
    setNickname(name)
    setPhase('playing')
  }, [nickname])

  const handleFinish = useCallback(
    (result: RunResult) => {
      setRun(result)
      setPhase('done')
      void submit(result, nickname.trim() || 'Player')
    },
    [submit, nickname],
  )

  const getQuestion = useCallback((i: number) => deck[i] ?? null, [deck])

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-3xl flex items-center justify-between gap-3 mb-6 sm:mb-10">
        <button onClick={onExit} className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.7)]" />
          Party Arcade
        </button>
        <span className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400">
          Daily trivia{day ? ` · ${dayLabel(day)}` : ''}
        </span>
      </header>

      <main className="w-full max-w-3xl flex-1 flex flex-col items-center">
        {phase === 'loading' && <p className="mt-24 text-neutral-400 animate-pulse">Loading today&apos;s trivia…</p>}
        {phase === 'unavailable' && <Unavailable onExit={onExit} />}
        {phase === 'ready' && (
          <Ready
            day={day}
            questionCount={deck.length}
            stale={day !== todayKey()}
            nickname={nickname}
            setNickname={setNickname}
            limitSeconds={limitSeconds}
            setLimitSeconds={setLimitSeconds}
            board={board}
            onStart={start}
          />
        )}
        {phase === 'playing' && (
          <RunPlayer
            getQuestion={getQuestion}
            totalQuestions={deck.length}
            durationMs={limitSeconds ? limitSeconds * 1000 : NO_TIMER_MS}
            untimed={limitSeconds === 0}
            onFinish={handleFinish}
          />
        )}
        {phase === 'done' && (
          <Results
            deck={deck}
            nickname={mine?.nickname ?? nickname}
            run={run}
            mine={mine}
            rank={rank}
            board={board}
            saving={saving}
            onRetry={() => run && void submit(run, nickname.trim() || 'Player')}
            onExit={onExit}
          />
        )}
      </main>
    </div>
  )
}

function Unavailable({ onExit }: { onExit: () => void }) {
  return (
    <div className="mt-20 w-full max-w-md space-y-4 text-center animate-pop-in">
      <h1 className="text-2xl font-semibold tracking-tight">Today&apos;s trivia isn&apos;t ready yet</h1>
      <p className="text-sm text-neutral-400">New questions are prepared every night. Check back in a little while.</p>
      <button
        onClick={onExit}
        className="rounded-xl border border-neutral-700 px-5 py-3 text-sm font-medium transition-colors hover:border-neutral-500"
      >
        Back to arcade
      </button>
    </div>
  )
}

function Ready({
  day,
  questionCount,
  stale,
  nickname,
  setNickname,
  limitSeconds,
  setLimitSeconds,
  board,
  onStart,
}: {
  day: string
  questionCount: number
  /** True when this is an older set because today's isn't available yet. */
  stale: boolean
  nickname: string
  setNickname: (value: string) => void
  limitSeconds: number
  setLimitSeconds: (seconds: number) => void
  board: DailyEntry[]
  onStart: () => void
}) {
  return (
    <div className="w-full max-w-xl space-y-6 animate-pop-in">
      {stale && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200">
          Today&apos;s new questions aren&apos;t ready yet, so this is the {dayLabel(day)} set.
        </p>
      )}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Daily Trivia</h1>
        <p className="text-sm sm:text-base text-neutral-400">
          {questionCount} questions today. Four answers each. One point for every correct answer.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs text-neutral-500">Your name on the leaderboard</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, NICKNAME_MAX))}
            onKeyDown={(e) => e.key === 'Enter' && onStart()}
            placeholder="Enter a nickname"
            maxLength={NICKNAME_MAX}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-base outline-none focus:border-violet-400"
          />
        </label>
        <div className="space-y-1.5">
          <span className="text-xs text-neutral-500">How long do you want to play?</span>
          <div className="grid grid-cols-4 gap-2">
            {TIME_LIMITS.map((o) => (
              <button
                key={o.seconds}
                onClick={() => setLimitSeconds(o.seconds)}
                className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                  limitSeconds === o.seconds
                    ? 'border-violet-400 bg-violet-500/15 text-violet-100'
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500">
            {limitSeconds === 0
              ? `No timer: answer all ${questionCount} questions. Ties are broken by who finishes faster.`
              : 'The run stops when the time is up. Ties are broken by who finishes faster.'}
          </p>
        </div>
        <button
          onClick={onStart}
          disabled={!nickname.trim()}
          className="w-full rounded-xl bg-violet-500 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start today&apos;s run
        </button>
        <p className="text-center text-xs text-neutral-500">
          You get one scored attempt per day. Everyone plays the same {dayLabel(day)} questions.
        </p>
      </div>

      <Leaderboard board={board} />
    </div>
  )
}

function Results({
  deck,
  nickname,
  run,
  mine,
  rank,
  board,
  saving,
  onRetry,
  onExit,
}: {
  deck: Question[]
  nickname: string
  run: RunResult | null
  mine: DailyEntry | null
  rank: number | null
  board: DailyEntry[]
  saving: Saving
  onRetry: () => void
  onExit: () => void
}) {
  const score = mine?.score ?? run?.score ?? 0
  const answered = mine?.answered ?? run?.total ?? 0
  const accuracy = answered ? Math.round((score / answered) * 100) : 0
  const [showAnswers, setShowAnswers] = useState(false)
  const isReviewer = nickname.trim().toLowerCase() === REVIEWER_NICKNAME

  return (
    <div className="w-full max-w-xl space-y-5 animate-pop-in">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 text-center">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <span className="inline-block rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
            {rank ? `#${rank} today` : rankFor(score)}
          </span>
          <p className="mt-4 text-6xl sm:text-7xl font-semibold tabular-nums tracking-tight bg-gradient-to-b from-white to-violet-300 bg-clip-text text-transparent">
            {score}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {run ? 'correct answers' : "You've played today's trivia. New questions arrive tomorrow."}
          </p>
        </div>
      </div>

      {saving === 'failed' && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span>Couldn&apos;t save your score.</span>
          <button onClick={onRetry} className="rounded-lg bg-rose-400 px-3 py-1 text-xs font-semibold text-neutral-950">
            Try again
          </button>
        </div>
      )}
      {saving === 'saving' && <p className="text-center text-xs text-neutral-500">Saving your score…</p>}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Correct" value={`${score}/${answered}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Time" value={clock(mine?.seconds ?? run?.seconds ?? 0)} />
      </div>

      <Leaderboard board={board} mine={mine} />

      {isReviewer && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAnswers((v) => !v)}
            className="w-full rounded-xl border border-violet-500/50 py-3 text-sm font-medium text-violet-200 transition-colors hover:border-violet-400"
          >
            {showAnswers ? 'Hide all answers' : `See all answers (${deck.length})`}
          </button>
          {showAnswers && <AnswerReview deck={deck} picks={run?.picks ?? []} />}
        </div>
      )}

      <button
        onClick={onExit}
        className="w-full rounded-xl border border-neutral-700 py-3 text-sm font-medium transition-colors hover:border-neutral-500"
      >
        Back to arcade
      </button>
    </div>
  )
}

function AnswerReview({ deck, picks }: { deck: Question[]; picks: number[] }) {
  const [tab, setTab] = useState('All')
  const played = picks.length > 0

  // Per category: how many questions there were, how many were answered, and how many were right.
  const stats = useMemo(() => {
    const map = new Map<string, { total: number; answered: number; correct: number }>()
    deck.forEach((q, i) => {
      const entry = map.get(q.category) ?? { total: 0, answered: 0, correct: 0 }
      entry.total += 1
      if (picks[i] !== undefined) {
        entry.answered += 1
        if (picks[i] === q.correct) entry.correct += 1
      }
      map.set(q.category, entry)
    })
    return map
  }, [deck, picks])

  const categories = CATEGORIES.filter((c) => stats.has(c))
  const overall = [...stats.values()].reduce(
    (sum, e) => ({ total: sum.total + e.total, answered: sum.answered + e.answered, correct: sum.correct + e.correct }),
    { total: 0, answered: 0, correct: 0 },
  )
  const tabs = [
    { id: 'All', stat: overall },
    ...categories.map((c) => ({ id: c, stat: stats.get(c)! })),
  ]
  const visible = deck.map((q, i) => ({ q, i })).filter(({ q }) => tab === 'All' || q.category === tab)

  return (
    <div className="space-y-3">
      <div role="tablist" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map(({ id, stat }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-xl border px-3.5 py-2 text-left transition-colors ${
              tab === id
                ? 'border-violet-400 bg-violet-500/15 text-violet-100'
                : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            <span className="block text-xs font-medium">{id}</span>
            <span className="block text-sm font-semibold tabular-nums">
              {played ? `${stat.correct}/${stat.answered}` : stat.total}
            </span>
          </button>
        ))}
      </div>

      <ol className="space-y-3">
        {visible.map(({ q, i }) => {
          const picked = picks[i]
          return (
            <li key={q.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">
                {i + 1} · {q.category}
                {played && picked === undefined ? ' · not answered' : ''}
              </p>
              <p className="mt-1 font-medium">{q.text}</p>
              <ul className="mt-2 space-y-1">
                {q.options.map((option, j) => {
                  const right = j === q.correct
                  const wrongPick = j === picked && !right
                  return (
                    <li
                      key={j}
                      className={`rounded-lg px-3 py-1.5 ${
                        right
                          ? 'bg-emerald-500/15 text-emerald-200'
                          : wrongPick
                            ? 'bg-rose-500/15 text-rose-200'
                            : 'text-neutral-400'
                      }`}
                    >
                      {option}
                      {right ? ' ✓' : ''}
                      {j === picked ? ' (your pick)' : ''}
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Leaderboard({ board, mine }: { board: DailyEntry[]; mine?: DailyEntry | null }) {
  const youIndex = mine ? board.findIndex((e) => e.nickname === mine.nickname && e.score === mine.score) : -1
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <h2 className="mb-3 text-sm font-semibold tracking-tight">Today&apos;s top 10</h2>
      {board.length === 0 ? (
        <p className="py-2 text-sm text-neutral-500">No scores yet. Be the first.</p>
      ) : (
        <ol className="space-y-1.5">
          {board.map((entry, i) => (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                i === youIndex ? 'bg-violet-500/15 text-violet-100' : 'text-neutral-300'
              }`}
            >
              <span className="w-6 text-right tabular-nums text-neutral-500">{i + 1}</span>
              <span className="flex-1 truncate">
                {entry.nickname}
                {i === youIndex ? ' (you)' : ''}
              </span>
              <span className="text-xs tabular-nums text-neutral-500">{clock(entry.seconds)}</span>
              <span className="w-8 text-right font-semibold tabular-nums">{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
