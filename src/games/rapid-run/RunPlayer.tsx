import { useCallback, useEffect, useRef, useState } from 'react'
import type { Question } from './questions'

const DEFAULT_DURATION_MS = 60_000
const VELOCITY_WINDOW_MS = 10_000
const REVEAL_RIGHT_MS = 220
const REVEAL_WRONG_MS = 650
const LETTERS = ['A', 'B', 'C', 'D', 'E']

const multiplierFor = (streak: number) => Math.min(5, 1 + Math.floor(streak / 5))

export interface RunResult {
  score: number
  correct: number
  total: number
  bestStreak: number
  qps: number
  /** Picked option index per answered question, in order (the server re-scores from this). */
  picks: number[]
}

interface RunPlayerProps {
  /** Idempotent: the same index must always return the same question. Null means the set is finished. */
  getQuestion: (index: number) => Question | null
  /** Shown as "n / total" when the set is finite. */
  totalQuestions?: number
  onFinish: (result: RunResult) => void
  /** Shared start time in ms (a room's synced timestamp). Defaults to mount time. */
  startedAt?: number
  durationMs?: number
  /** Fires after every answer, so a room can show live standings. */
  onProgress?: (progress: { score: number; answered: number; accuracy: number }) => void
  /** Wrong answers allowed before the run ends early. Omit for unlimited. */
  maxStrikes?: number
  /** Rendered between the HUD and the question card. */
  aside?: React.ReactNode
}

/** One 60-second run. Mount it to start the clock; it calls onFinish once, when time runs out or the set does. */
export default function RunPlayer({
  getQuestion,
  totalQuestions,
  onFinish,
  startedAt: startedAtProp,
  durationMs = DEFAULT_DURATION_MS,
  onProgress,
  maxStrikes,
  aside,
}: RunPlayerProps) {
  const [question, setQuestion] = useState<Question | null>(() => getQuestion(0))
  const [picked, setPicked] = useState<number | null>(null)
  const [asked, setAsked] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [msLeft, setMsLeft] = useState(durationMs)
  const [qps, setQps] = useState(0)
  const [strikes, setStrikes] = useState(0)
  const [gain, setGain] = useState<{ id: number; amount: number } | null>(null)

  const stats = useRef({ score: 0, streak: 0, best: 0, correct: 0, wrong: 0, total: 0, stamps: [] as number[], picks: [] as number[] })
  const startedAt = useRef(startedAtProp ?? Date.now())
  const advanceTimer = useRef<number | undefined>(undefined)
  const finished = useRef(false)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    window.clearTimeout(advanceTimer.current)
    const s = stats.current
    const seconds = Math.min(durationMs, Date.now() - startedAt.current) / 1000
    onFinishRef.current({
      score: s.score,
      correct: s.correct,
      total: s.total,
      bestStreak: s.best,
      qps: s.total / (seconds || 1),
      picks: s.picks,
    })
  }, [durationMs])

  const answer = useCallback(
    (index: number) => {
      // Locked while the previous answer is still being revealed.
      if (finished.current || !question || picked !== null) return
      const s = stats.current
      const right = index === question.correct
      s.total += 1
      s.picks.push(index)
      s.stamps.push(Date.now())
      if (right) {
        s.correct += 1
        s.streak += 1
        s.best = Math.max(s.best, s.streak)
        const amount = question.points * multiplierFor(s.streak)
        s.score += amount
        setGain({ id: s.total, amount })
      } else {
        s.streak = 0
        s.wrong += 1
        setStrikes(s.wrong)
      }
      setScore(s.score)
      setStreak(s.streak)
      setPicked(index)
      onProgressRef.current?.({
        score: s.score,
        answered: s.total,
        accuracy: Math.round((s.correct / s.total) * 100),
      })
      advanceTimer.current = window.setTimeout(
        () => {
          const next = getQuestion(s.total)
          if (!next || (maxStrikes !== undefined && s.wrong >= maxStrikes)) {
            finish()
            return
          }
          setPicked(null)
          setAsked(s.total + 1)
          setQuestion(next)
        },
        right ? REVEAL_RIGHT_MS : REVEAL_WRONG_MS,
      )
    },
    [question, picked, getQuestion, finish, maxStrikes],
  )

  // Countdown + velocity, driven by wall-clock time so tab throttling can't stretch the round.
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now()
      const elapsed = now - startedAt.current
      setMsLeft(Math.max(0, durationMs - elapsed))

      const s = stats.current
      s.stamps = s.stamps.filter((t) => now - t <= VELOCITY_WINDOW_MS)
      setQps(s.stamps.length / (Math.min(elapsed, VELOCITY_WINDOW_MS) / 1000 || 1))

      if (elapsed >= durationMs) finish()
    }, 100)
    return () => window.clearInterval(id)
  }, [finish, durationMs])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toUpperCase()
      const index = LETTERS.indexOf(key) >= 0 ? LETTERS.indexOf(key) : Number(key) - 1
      if (index >= 0 && index < LETTERS.length) {
        e.preventDefault()
        answer(index)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer])

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  if (!question) return null

  const secondsLeft = Math.ceil(msLeft / 1000)
  const multiplier = multiplierFor(streak)
  const wrongPicked = picked !== null && picked !== question.correct

  return (
    <div className="w-full max-w-2xl space-y-4 sm:space-y-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-3">
        <ComboMeter streak={streak} multiplier={multiplier} />
        <TimerRing msLeft={msLeft} durationMs={durationMs} secondsLeft={secondsLeft} />
        <div className="relative text-right">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Score</p>
          <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-violet-200">{score}</p>
          <p className="text-[10px] text-neutral-500">
            <span className="text-sky-400 tabular-nums">{qps.toFixed(1)}</span> q/s
          </p>
          {maxStrikes !== undefined && (
            <p className="mt-0.5 text-xs tracking-widest" aria-label={`${maxStrikes - strikes} strikes left`}>
              {Array.from({ length: maxStrikes }, (_, i) => (
                <span key={i} className={i < maxStrikes - strikes ? 'text-rose-400' : 'text-neutral-700'}>
                  ♥
                </span>
              ))}
            </p>
          )}
          {gain && (
            <span
              key={gain.id}
              className="animate-score-float pointer-events-none absolute right-0 -top-1 text-sm font-bold text-emerald-400"
            >
              +{gain.amount}
            </span>
          )}
        </div>
      </div>

      {aside}

      <div
        key={asked}
        className={`relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-8 ${
          wrongPicked ? 'animate-shake' : 'animate-pop-in'
        }`}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-500">
            <span className="rounded-full bg-violet-500/15 px-2.5 py-1 font-semibold text-violet-300">
              {question.category}
            </span>
            <span>{totalQuestions ? `${asked} / ${totalQuestions}` : `#${asked}`}</span>
          </div>

          <h2 className="flex min-h-28 sm:min-h-36 items-center justify-center py-6 text-center text-xl sm:text-3xl font-semibold leading-snug tracking-tight">
            {question.text}
          </h2>

          <div className="grid gap-3 sm:grid-cols-6">
            {question.options.map((option, i) => (
              <OptionKey
                key={i}
                index={i}
                label={option}
                state={optionState(i, picked, question.correct)}
                onClick={() => answer(i)}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="hidden sm:block text-center text-xs text-neutral-600">Hit A B C D E or 1 2 3 4 5</p>
    </div>
  )
}

type OptionState = 'idle' | 'right' | 'wrong' | 'reveal' | 'dim'

function optionState(index: number, picked: number | null, correct: number): OptionState {
  if (picked === null) return 'idle'
  if (index === picked) return index === correct ? 'right' : 'wrong'
  if (index === correct) return 'reveal'
  return 'dim'
}

/** Each slot keeps its own hue so players can find "their" key by color, like arcade buttons. */
const KEY_HUES = [
  { idle: 'hover:border-violet-400/70 hover:bg-violet-500/10', cap: 'bg-violet-500/20 text-violet-200 border-violet-400/40' },
  { idle: 'hover:border-sky-400/70 hover:bg-sky-500/10', cap: 'bg-sky-500/20 text-sky-200 border-sky-400/40' },
  { idle: 'hover:border-amber-400/70 hover:bg-amber-500/10', cap: 'bg-amber-500/20 text-amber-200 border-amber-400/40' },
  { idle: 'hover:border-pink-400/70 hover:bg-pink-500/10', cap: 'bg-pink-500/20 text-pink-200 border-pink-400/40' },
  { idle: 'hover:border-teal-400/70 hover:bg-teal-500/10', cap: 'bg-teal-500/20 text-teal-200 border-teal-400/40' },
]

const STATE_STYLES: Record<Exclude<OptionState, 'idle'>, { box: string; cap: string }> = {
  right: {
    box: 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_24px_-4px_rgba(52,211,153,0.6)]',
    cap: 'bg-emerald-400 text-neutral-950 border-emerald-300',
  },
  wrong: { box: 'border-rose-400 bg-rose-500/20', cap: 'bg-rose-400 text-neutral-950 border-rose-300' },
  reveal: { box: 'border-emerald-400/70 bg-emerald-500/10', cap: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/60' },
  dim: { box: 'border-neutral-900 opacity-30', cap: 'bg-neutral-800 text-neutral-600 border-neutral-800' },
}

function OptionKey({
  index,
  label,
  state,
  onClick,
}: {
  index: number
  label: string
  state: OptionState
  onClick: () => void
}) {
  const hue = KEY_HUES[index]
  const box = state === 'idle' ? `border-neutral-800 bg-neutral-950/60 active:scale-[0.985] ${hue.idle}` : STATE_STYLES[state].box
  const cap = state === 'idle' ? hue.cap : STATE_STYLES[state].cap
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-100 ${box} ${index < 3 ? 'sm:col-span-2' : 'sm:col-span-3'}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-b-4 text-sm font-bold ${cap}`}
      >
        {LETTERS[index]}
      </span>
      <span className="text-base sm:text-lg leading-tight">{label}</span>
    </button>
  )
}

function ComboMeter({ streak, multiplier }: { streak: number; multiplier: number }) {
  const maxed = multiplier >= 5
  const filled = maxed ? 5 : streak % 5
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-neutral-500">Combo</p>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={`rounded-lg px-2 py-0.5 text-sm font-bold tabular-nums transition-colors ${
            multiplier > 1
              ? 'bg-amber-400 text-neutral-950 shadow-[0_0_14px_rgba(251,191,36,0.55)]'
              : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          ×{multiplier}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-2.5 rounded-sm transition-colors ${
                i < filled ? (maxed ? 'bg-amber-400' : 'bg-violet-400') : 'bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="mt-1 text-[10px] text-neutral-500 tabular-nums">{streak} in a row</p>
    </div>
  )
}

function TimerRing({ msLeft, durationMs, secondsLeft }: { msLeft: number; durationMs: number; secondsLeft: number }) {
  const pct = (msLeft / durationMs) * 100
  const low = secondsLeft <= Math.min(10, Math.ceil(durationMs / 4000))
  return (
    <div className="relative h-20 w-20 sm:h-24 sm:w-24">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="44" fill="none" stroke="#262626" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={low ? '#fb7185' : '#a78bfa'}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
          style={{ filter: `drop-shadow(0 0 6px ${low ? 'rgba(251,113,133,0.6)' : 'rgba(167,139,250,0.6)'})` }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-semibold tabular-nums ${
          low ? 'text-rose-300' : ''
        }`}
      >
        {secondsLeft}
      </span>
    </div>
  )
}


export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 py-4 text-center">
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-neutral-500">{label}</p>
    </div>
  )
}
