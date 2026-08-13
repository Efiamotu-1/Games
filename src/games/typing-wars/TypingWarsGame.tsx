import { useEffect, useMemo, useRef, useState } from 'react'
import type { AttemptResult, TestConfig } from './types'
import { getRandomPassage } from './passages'
import { scoreAttempt, modeLabel } from './scoring'
import { loadAttempts, saveAttempt, clearAttempts } from './storage'

type Screen = 'setup' | 'typing' | 'results' | 'history'

export default function TypingWarsGame({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>('setup')
  const [config, setConfig] = useState<TestConfig>({ noBackspace: false })
  const [lastResult, setLastResult] = useState<AttemptResult | null>(null)
  const [attempts, setAttempts] = useState<AttemptResult[]>(() => loadAttempts())

  const personalBest = useMemo(() => {
    if (attempts.length === 0) return null
    return attempts.reduce((best, a) => (a.wpm > best.wpm ? a : best), attempts[0])
  }, [attempts])

  function handleFinish(result: AttemptResult) {
    setLastResult(result)
    setAttempts(saveAttempt(result))
    setScreen('results')
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-3xl flex items-center justify-between gap-3 mb-6 sm:mb-10">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight"
        >
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.7)]" />
          Typing Wars
        </button>
        <nav className="flex gap-1 text-sm">
          <NavButton active={screen === 'setup' || screen === 'typing'} onClick={() => setScreen('setup')}>
            Test
          </NavButton>
          <NavButton active={screen === 'history'} onClick={() => setScreen('history')}>
            Leaderboard
          </NavButton>
        </nav>
      </header>

      <main className="w-full max-w-3xl flex-1">
        {screen === 'setup' && (
          <SetupScreen
            config={config}
            setConfig={setConfig}
            personalBest={personalBest}
            onStart={() => setScreen('typing')}
          />
        )}
        {screen === 'typing' && (
          <TypingScreen config={config} onFinish={handleFinish} onCancel={() => setScreen('setup')} />
        )}
        {screen === 'results' && lastResult && (
          <ResultsScreen
            result={lastResult}
            isPersonalBest={personalBest?.id === lastResult.id}
            onRetry={() => setScreen('typing')}
            onNewTest={() => setScreen('setup')}
          />
        )}
        {screen === 'history' && (
          <HistoryScreen
            attempts={attempts}
            onClear={() => {
              clearAttempts()
              setAttempts([])
            }}
          />
        )}
      </main>

      <footer className="text-xs text-neutral-500 mt-16">
        Don&apos;t just tell me how good I am. Show me the evidence.
      </footer>
    </div>
  )
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full transition-colors ${
        active ? 'bg-violet-500/15 text-violet-300' : 'text-neutral-400 hover:text-neutral-200'
      }`}
    >
      {children}
    </button>
  )
}

function SetupScreen({
  config,
  setConfig,
  personalBest,
  onStart,
}: {
  config: TestConfig
  setConfig: (c: TestConfig) => void
  personalBest: AttemptResult | null
  onStart: () => void
}) {
  return (
    <div className="animate-pop-in space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Prove your typing speed.</h1>
        <p className="text-neutral-400">Objective WPM, accuracy, and correction data — every attempt, verified.</p>
      </div>

      {personalBest && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/5 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-300/80 mb-1">Personal Record</p>
            <p className="text-lg font-medium">
              🏆 {personalBest.wpm} WPM — {personalBest.accuracyChar}% accuracy
            </p>
            <p className="text-sm text-neutral-400">{modeLabel(personalBest.config)}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <ModeToggle
            label="No Backspace"
            description="Corrections are recorded, not applied."
            checked={config.noBackspace}
            onChange={(v) => setConfig({ ...config, noBackspace: v })}
          />
        </div>

        {config.noBackspace && (
          <div className="text-sm text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2.5">
            Mode: <span className="font-semibold">{modeLabel(config)}</span> — the ultimate bragging-rights test.
          </div>
        )}
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 rounded-2xl bg-violet-500 hover:bg-violet-400 active:bg-violet-600 transition-colors text-white font-semibold text-lg shadow-[0_8px_30px_-8px_rgba(167,139,250,0.6)]"
      >
        Start Test
      </button>
    </div>
  )
}

function ModeToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`text-left p-4 rounded-xl border transition-all ${
        checked ? 'border-violet-400 bg-violet-500/10' : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{label}</span>
        <span
          className={`w-9 h-5 rounded-full relative transition-colors ${checked ? 'bg-violet-500' : 'bg-neutral-700'}`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </span>
      </div>
      <p className="text-xs text-neutral-500">{description}</p>
    </button>
  )
}

function TypingScreen({
  config,
  onFinish,
  onCancel,
}: {
  config: TestConfig
  onFinish: (r: AttemptResult) => void
  onCancel: () => void
}) {
  const [target] = useState(() => getRandomPassage())
  const [typed, setTyped] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const backspaces = useRef(0)
  const deletes = useRef(0)
  const correctionAttempts = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const finished = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (startedAt === null) return
    if (finished.current) return
    const interval = setInterval(() => {
      setElapsed((Date.now() - startedAt) / 1000)
    }, 100)
    return () => clearInterval(interval)
  }, [startedAt])

  function finish(elapsedSeconds: number) {
    if (finished.current) return
    finished.current = true
    const result = scoreAttempt({
      target,
      typed,
      elapsedSeconds,
      backspaces: backspaces.current,
      deletes: deletes.current,
      correctionAttempts: correctionAttempts.current,
      config,
    })
    onFinish(result)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return

    if (config.noBackspace) {
      e.preventDefault()
    }
    correctionAttempts.current++
    if (e.key === 'Backspace') backspaces.current++
    else deletes.current++
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (startedAt === null && value.length > 0) {
      setStartedAt(Date.now())
    }
    setTyped(value)
    if (value.length >= target.length) {
      const elapsed = startedAt ? (Date.now() - startedAt) / 1000 : 0
      finish(elapsed)
    }
  }

  const progress = target.length > 0 ? (typed.length / target.length) * 100 : 0
  const currentWpm =
    startedAt && typed.length > 0
      ? Math.round(typed.length / 5 / Math.max(elapsed / 60, 1 / 600))
      : 0

  let liveCorrect = 0
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) liveCorrect++
  }
  const liveAccuracy = typed.length > 0 ? Math.round((liveCorrect / typed.length) * 100) : 100

  return (
    <div className="animate-pop-in space-y-6">
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <Stat label="Time" value={`${elapsed.toFixed(1)}s`} />
          <Stat label="WPM" value={String(currentWpm)} />
          <Stat label="Accuracy" value={`${liveAccuracy}%`} />
        </div>
        <div className="flex gap-2">
          {config.noBackspace && (
            <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 text-xs font-medium">
              No Backspace
            </span>
          )}
          <button onClick={onCancel} className="text-neutral-500 hover:text-neutral-300 text-xs">
            Cancel
          </button>
        </div>
      </div>

      <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
        <div className="h-full bg-violet-400 transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>

      <div
        onClick={() => inputRef.current?.focus()}
        className="relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6 text-base sm:text-xl leading-relaxed font-mono-test select-none cursor-text"
      >
        {target.split('').map((char, i) => {
          let cls = 'text-neutral-500'
          if (i < typed.length) {
            cls = typed[i] === char ? 'text-emerald-400' : 'text-rose-400 bg-rose-500/15 rounded'
          } else if (i === typed.length) {
            cls = 'text-neutral-200 border-b-2 border-violet-400 caret'
          }
          return (
            <span key={i} className={cls}>
              {char}
            </span>
          )
        })}
        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => inputRef.current?.focus()}
          className="absolute inset-0 w-full h-full opacity-0 cursor-text"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>

      <p className="text-center text-xs text-neutral-500">
        Tap the text and start typing — the timer begins on your first keystroke.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-neutral-500">{label} </span>
      <span className="font-semibold text-neutral-100">{value}</span>
    </div>
  )
}

function ResultsScreen({
  result,
  isPersonalBest,
  onRetry,
  onNewTest,
}: {
  result: AttemptResult
  isPersonalBest: boolean
  onRetry: () => void
  onNewTest: () => void
}) {
  const shareText = `${isPersonalBest ? '🏆 ' : ''}${result.wpm} WPM — ${result.accuracyChar}% accuracy\n${modeLabel(
    result.config,
  )}\nVerified Attempt #${result.id}`

  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="animate-pop-in space-y-6">
      {isPersonalBest && (
        <div className="text-center text-amber-300 font-medium text-sm">🏆 New Personal Record!</div>
      )}

      <div className="text-center rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8">
        <p className="text-6xl font-bold tracking-tight text-violet-300">{result.wpm}</p>
        <p className="text-neutral-400 mt-1">Words Per Minute (net)</p>
        <p className="text-sm text-neutral-500 mt-4">{modeLabel(result.config)}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultTile label="Accuracy" value={`${result.accuracyChar}%`} />
        <ResultTile label="Raw WPM" value={String(result.rawWpm)} />
        <ResultTile label="Duration" value={`${result.durationSeconds}s`} />
        <ResultTile label="Word Acc." value={`${result.accuracyWord}%`} />
        <ResultTile label="Correct Words" value={String(result.correctWords)} />
        <ResultTile label="Incorrect Words" value={String(result.incorrectWords)} />
        <ResultTile label="Backspaces" value={String(result.backspaces)} />
        <ResultTile label="Correction Attempts" value={String(result.correctionAttempts)} />
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-500 space-y-1 font-mono-test">
        <p>Attempt ID: {result.id}</p>
        <p>Timestamp: {new Date(result.timestamp).toLocaleString()}</p>
        <p>WPM methodology: (correct chars ÷ 5) ÷ elapsed minutes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={copy}
          className="flex-1 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 transition-colors text-sm font-medium"
        >
          {copied ? 'Copied!' : 'Copy Shareable Result'}
        </button>
        <button
          onClick={onRetry}
          className="flex-1 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 transition-colors text-sm font-medium"
        >
          Retry Same Settings
        </button>
        <button
          onClick={onNewTest}
          className="flex-1 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 transition-colors text-sm font-semibold"
        >
          New Test
        </button>
      </div>
    </div>
  )
}

function ResultTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
    </div>
  )
}

type SortKey = 'wpm' | 'accuracy' | 'consistency' | 'recent'

const SORTERS: Record<SortKey, { label: string; sort: (a: AttemptResult[]) => AttemptResult[] }> = {
  wpm: {
    label: 'Speed (WPM)',
    sort: (a) => [...a].sort((x, y) => y.wpm - x.wpm || y.accuracyChar - x.accuracyChar),
  },
  accuracy: {
    label: 'Accuracy',
    sort: (a) => [...a].sort((x, y) => y.accuracyChar - x.accuracyChar || y.wpm - x.wpm),
  },
  consistency: {
    label: 'Fewest Corrections',
    sort: (a) =>
      [...a].sort((x, y) => x.correctionAttempts - y.correctionAttempts || y.wpm - x.wpm),
  },
  recent: {
    label: 'Most Recent',
    sort: (a) => [...a].sort((x, y) => y.timestamp - x.timestamp),
  },
}

const MEDALS = ['🥇', '🥈', '🥉']

function HistoryScreen({ attempts, onClear }: { attempts: AttemptResult[]; onClear: () => void }) {
  const [sortKey, setSortKey] = useState<SortKey>('wpm')

  if (attempts.length === 0) {
    return (
      <div className="animate-pop-in text-center text-neutral-500 py-20">
        <p>No attempts yet. Complete a test to see your leaderboard here.</p>
      </div>
    )
  }

  const avgWpm = Math.round(attempts.reduce((s, a) => s + a.wpm, 0) / attempts.length)
  const bestWpm = Math.max(...attempts.map((a) => a.wpm))
  const avgAcc = Math.round((attempts.reduce((s, a) => s + a.accuracyChar, 0) / attempts.length) * 10) / 10

  const ranked = SORTERS[sortKey].sort(attempts).slice(0, 10)

  return (
    <div className="animate-pop-in space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <ResultTile label="Avg WPM" value={String(avgWpm)} />
        <ResultTile label="Best WPM" value={String(bestWpm)} />
        <ResultTile label="Avg Accuracy" value={`${avgAcc}%`} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(SORTERS) as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sortKey === key
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                  : 'text-neutral-400 border border-transparent hover:text-neutral-200'
              }`}
            >
              {SORTERS[key].label}
            </button>
          ))}
        </div>
        <button onClick={onClear} className="text-xs text-neutral-500 hover:text-rose-400 transition-colors">
          Clear history
        </button>
      </div>

      {attempts.length > 10 && (
        <p className="text-xs text-neutral-500 text-center -mt-2">
          Showing top 10 of {attempts.length} attempts.
        </p>
      )}

      <div className="space-y-2">
        {ranked.map((a, i) => (
          <div
            key={a.id}
            className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
              i < 3 ? 'border-amber-400/20 bg-amber-400/5' : 'border-neutral-800 bg-neutral-900/40'
            }`}
          >
            <span className="w-7 text-center text-sm font-semibold text-neutral-500 shrink-0">
              {MEDALS[i] ?? i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                {a.wpm} WPM <span className="text-neutral-500 font-normal">· {a.accuracyChar}% acc</span>
              </p>
              <p className="text-xs text-neutral-500">
                {modeLabel(a.config)} · {a.durationSeconds}s · {a.incorrectWords} wrong words ·{' '}
                {a.correctionAttempts} corrections · {new Date(a.timestamp).toLocaleString()}
              </p>
            </div>
            <span className="text-xs font-mono-test text-neutral-600 shrink-0">{a.id}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
