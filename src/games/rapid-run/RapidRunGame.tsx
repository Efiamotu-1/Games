import { useCallback, useEffect, useRef, useState } from 'react'
import { LEVELS, createDeck, type Level, type Question } from './questions'
import { rankFor } from './rank'
import RunPlayer, { Stat, type RunResult } from './RunPlayer'

const hiScoreKey = (level: Level) => `rapid-run:hi:${level}`

function loadHiScore(level: Level): number {
  try {
    return Number(localStorage.getItem(hiScoreKey(level))) || 0
  } catch {
    return 0
  }
}

function saveHiScore(level: Level, score: number) {
  try {
    localStorage.setItem(hiScoreKey(level), String(score))
  } catch {
    // storage unavailable; the record just won't persist
  }
}

type Phase = 'ready' | 'playing' | 'done'

export default function RapidRunGame({ onExit }: { onExit: () => void }) {
  const [level, setLevel] = useState<Level>('normal')
  const [phase, setPhase] = useState<Phase>('ready')
  const [hiScores, setHiScores] = useState<Record<Level, number>>(() => ({
    normal: loadHiScore('normal'),
    expert: loadHiScore('expert'),
  }))
  const [getQuestion, setGetQuestion] = useState<((i: number) => Question | null) | null>(null)
  const [result, setResult] = useState<(RunResult & { isRecord: boolean }) | null>(null)
  const levelRef = useRef(level)
  levelRef.current = level

  const start = useCallback(() => {
    // Practice deals endlessly; cache by index so re-renders never skip a question.
    const next = createDeck(levelRef.current)
    const dealt: Question[] = []
    setGetQuestion(() => (i: number) => (dealt[i] ??= next()))
    setResult(null)
    setPhase('playing')
  }, [])

  const handleFinish = useCallback((run: RunResult) => {
    const lv = levelRef.current
    const isRecord = run.score > loadHiScore(lv)
    if (isRecord) {
      saveHiScore(lv, run.score)
      setHiScores((h) => ({ ...h, [lv]: run.score }))
    }
    setResult({ ...run, isRecord })
    setPhase('done')
  }, [])

  useEffect(() => {
    if (phase === 'playing') return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, start])

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-3xl flex items-center justify-between gap-3 mb-6 sm:mb-10">
        <button onClick={onExit} className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.7)]" />
          Party Arcade
        </button>
        <span className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400">Solo practice</span>
      </header>

      <main className="w-full max-w-3xl flex-1 flex flex-col items-center">
        {phase === 'ready' && <Ready level={level} setLevel={setLevel} best={hiScores[level]} onStart={start} />}
        {phase === 'playing' && getQuestion && <RunPlayer getQuestion={getQuestion} onFinish={handleFinish} />}
        {phase === 'done' && result && (
          <PracticeResults summary={result} level={level} hi={hiScores[level]} onAgain={start} onExit={onExit} />
        )}
      </main>
    </div>
  )
}

function Ready({
  level,
  setLevel,
  best,
  onStart,
}: {
  level: Level
  setLevel: (l: Level) => void
  best: number
  onStart: () => void
}) {
  return (
    <div className="w-full max-w-xl space-y-6 animate-pop-in">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Rapid-Run Trivia</h1>
        <p className="text-sm sm:text-base text-neutral-400">
          60 seconds. Five answers. Chain correct ones to stack your multiplier.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
        <p className="text-xs text-neutral-500">
          Pick your heat · best <span className="font-semibold text-violet-300 tabular-nums">{best}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                level === l.id
                  ? l.id === 'expert'
                    ? 'border-amber-400 bg-amber-500/10 text-amber-100'
                    : 'border-violet-400 bg-violet-500/15 text-violet-100'
                  : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <span className="block font-semibold">{l.label}</span>
              <span className="text-xs opacity-70">{l.points} pts a hit</span>
            </button>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full rounded-xl bg-violet-500 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
        >
          Start run
        </button>
      </div>

      <ul className="grid grid-cols-3 gap-3 text-center text-xs text-neutral-500">
        <li className="rounded-xl border border-neutral-900 py-3">Keys A–E or 1–5</li>
        <li className="rounded-xl border border-neutral-900 py-3">×2 at 5 · ×5 at 20</li>
        <li className="rounded-xl border border-neutral-900 py-3">Miss and combo resets</li>
      </ul>
    </div>
  )
}

function PracticeResults({
  summary,
  level,
  hi,
  onAgain,
  onExit,
}: {
  summary: RunResult & { isRecord: boolean }
  level: Level
  hi: number
  onAgain: () => void
  onExit: () => void
}) {
  const accuracy = summary.total ? Math.round((summary.correct / summary.total) * 100) : 0
  return (
    <div className="w-full max-w-xl space-y-5 animate-pop-in">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 text-center">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <span className="inline-block rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">
            {summary.isRecord ? 'New personal best' : rankFor(summary.correct)}
          </span>
          <p className="mt-4 text-6xl sm:text-7xl font-semibold tabular-nums tracking-tight bg-gradient-to-b from-white to-violet-300 bg-clip-text text-transparent">
            {summary.score}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {level === 'expert' ? 'Expert' : 'Normal'} · best {hi}
            {summary.isRecord ? '' : ` · ${rankFor(summary.correct)}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Correct" value={`${summary.correct}/${summary.total}`} />
        <Stat label="Per second" value={summary.qps.toFixed(2)} />
        <Stat label="Best combo" value={`${summary.bestStreak}`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onExit}
          className="rounded-xl border border-neutral-700 py-3 text-sm font-medium transition-colors hover:border-neutral-500"
        >
          Back to arcade
        </button>
        <button
          onClick={onAgain}
          className="rounded-xl bg-violet-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
        >
          Run it back
        </button>
      </div>
    </div>
  )
}

