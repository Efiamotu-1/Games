import { useRef, useState, useEffect } from 'react'
import { raceScore, scoreAttempt } from './scoring'
import { saveAttempt } from './storage'
import type { Room } from '../../shared/types'
import {
  finishRace,
  initRaceProgress,
  leaveRoom,
  resetRoomForRematch,
  updateRaceProgress,
} from '../../shared/roomApi'
import { useRaceProgress } from '../../shared/useRaceProgress'
import { getRandomPassage } from './passages'
import { toRaceMode, type RaceMode } from './types'
import EliminationTournament from './EliminationTournament'

interface MultiplayerRaceProps {
  room: Room
  selfId: string
  onExit: () => void
}

const PROGRESS_THROTTLE_MS = 250

export default function MultiplayerRace({ room, selfId, onExit }: MultiplayerRaceProps) {
  const mode = toRaceMode(room.mode)

  if (mode.eliminationRounds) {
    return <EliminationTournament room={room} selfId={selfId} onExit={onExit} />
  }

  if (!room.passage || !room.startedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-neutral-400 animate-pulse">Preparing the race…</p>
      </div>
    )
  }

  return <RaceScreen room={room} selfId={selfId} onExit={onExit} />
}

function RaceScreen({ room, selfId, onExit }: { room: Room; selfId: string; onExit: () => void }) {
  const mode: RaceMode = toRaceMode(room.mode)
  const target = room.passage ?? ''
  const [typed, setTyped] = useState('')
  const [startedAt] = useState(() => room.startedAt ?? Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [eliminated, setEliminated] = useState(false)
  const backspaces = useRef(0)
  const correctionAttempts = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const finished = useRef(false)
  const lastProgressSent = useRef(0)
  const progress = useRaceProgress(room.code)

  useEffect(() => {
    initRaceProgress(room.code, selfId).catch(() => {})
    inputRef.current?.focus()

    function handleUnload() {
      leaveRoom(selfId).catch(() => {})
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (finished.current) return
    const interval = setInterval(() => {
      setElapsed((Date.now() - startedAt) / 1000)
    }, 100)
    return () => clearInterval(interval)
  }, [startedAt])

  async function eliminate(elapsedSeconds: number, finalTyped: string) {
    if (finished.current) return
    finished.current = true
    setEliminated(true)
    const result = scoreAttempt({
      target,
      typed: finalTyped,
      elapsedSeconds,
      backspaces: backspaces.current,
      deletes: 0,
      correctionAttempts: correctionAttempts.current,
      config: { blind: mode.blind, noBackspace: mode.noBackspace },
    })
    await finishRace(selfId, {
      wpm: 0,
      rawWpm: result.rawWpm,
      accuracyChar: result.accuracyChar,
      accuracyWord: result.accuracyWord,
      correctWords: result.correctWords,
      incorrectWords: result.incorrectWords,
      correctChars: result.correctChars,
      incorrectChars: result.incorrectChars,
      durationSeconds: result.durationSeconds,
      backspaces: result.backspaces,
      correctionAttempts: result.correctionAttempts,
      eliminated: true,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return
    if (mode.noBackspace) {
      e.preventDefault()
    }
    correctionAttempts.current++
    if (e.key === 'Backspace') backspaces.current++
  }

  async function finish(elapsedSeconds: number, finalTyped: string) {
    if (finished.current) return
    finished.current = true
    const result = scoreAttempt({
      target,
      typed: finalTyped,
      elapsedSeconds,
      backspaces: backspaces.current,
      deletes: 0,
      correctionAttempts: correctionAttempts.current,
      config: { blind: mode.blind, noBackspace: mode.noBackspace },
    })

    saveAttempt(result)

    await finishRace(selfId, {
      wpm: result.wpm,
      rawWpm: result.rawWpm,
      accuracyChar: result.accuracyChar,
      accuracyWord: result.accuracyWord,
      correctWords: result.correctWords,
      incorrectWords: result.incorrectWords,
      correctChars: result.correctChars,
      incorrectChars: result.incorrectChars,
      durationSeconds: result.durationSeconds,
      backspaces: result.backspaces,
      correctionAttempts: result.correctionAttempts,
      eliminated: false,
    })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (finished.current) return
    const value = e.target.value
    const elapsedNow = (Date.now() - startedAt) / 1000

    if (mode.suddenDeath) {
      const lastIndex = value.length - 1
      if (lastIndex >= 0 && value[lastIndex] !== target[lastIndex]) {
        setTyped(value)
        eliminate(elapsedNow, value)
        return
      }
    }

    setTyped(value)

    let correct = 0
    for (let i = 0; i < value.length; i++) {
      if (value[i] === target[i]) correct++
    }
    const wpmNow = value.length > 0 ? Math.round(value.length / 5 / Math.max(elapsedNow / 60, 1 / 600)) : 0
    const accuracyNow = value.length > 0 ? Math.round((correct / value.length) * 100) : 100

    const now = Date.now()
    if (now - lastProgressSent.current > PROGRESS_THROTTLE_MS) {
      lastProgressSent.current = now
      updateRaceProgress(selfId, { charsTyped: value.length, wpm: wpmNow, accuracy: accuracyNow }).catch(() => {})
    }

    if (value.length >= target.length) {
      finish(elapsedNow, value)
    }
  }

  const selfProgress = progress.find((p) => p.playerId === selfId)
  const allDone =
    room.players.length > 0 && room.players.every((p) => progress.find((pr) => pr.playerId === p.id)?.finished)

  if (selfProgress?.finished || allDone) {
    return <RaceResults room={room} progress={progress} selfId={selfId} mode={mode} onExit={onExit} />
  }

  const progressPct = target.length > 0 ? (typed.length / target.length) * 100 : 0

  let liveCorrect = 0
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) liveCorrect++
  }
  const liveAccuracy = typed.length > 0 ? Math.round((liveCorrect / typed.length) * 100) : 100
  const liveWpm = typed.length > 0 ? Math.round(typed.length / 5 / Math.max(elapsed / 60, 1 / 600)) : 0

  if (eliminated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-3">
        <p className="text-2xl font-semibold">💀 Eliminated</p>
        <p className="text-neutral-400 text-sm">One mistake, sudden death. Watching the rest of the race…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <header className="w-full max-w-3xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.7)]" />
          Typing Wars
        </div>
        <div className="flex items-center gap-2">
          {mode.blind && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-medium">
              Blind
            </span>
          )}
          {mode.noBackspace && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-medium">
              No Backspace
            </span>
          )}
          {mode.suddenDeath && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-medium">
              Sudden Death
            </span>
          )}
          <button
            onClick={() => {
              leaveRoom(selfId).catch(() => {})
              onExit()
            }}
            className="text-xs text-neutral-500 hover:text-neutral-300 ml-2"
          >
            Leave race
          </button>
        </div>
      </header>

      <main className="w-full max-w-3xl flex-1 space-y-6 animate-pop-in">
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <Stat label="Time" value={`${elapsed.toFixed(1)}s`} />
            <Stat label="WPM" value={String(liveWpm)} />
            <Stat label="Accuracy" value={`${liveAccuracy}%`} />
          </div>
        </div>

        <div className="space-y-2">
          {room.players.map((p) => {
            const pr = progress.find((x) => x.playerId === p.id)
            const pct = target.length > 0 ? ((pr?.charsTyped ?? 0) / target.length) * 100 : 0
            const eliminatedPlayer = pr?.result?.eliminated ?? false
            return (
              <div key={p.id} className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.color, boxShadow: `0 0 6px 1px ${p.color}66` }}
                />
                <span className="text-xs text-neutral-400 w-20 shrink-0 truncate">{p.nickname}</span>
                <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{ width: `${Math.min(100, pct)}%`, backgroundColor: p.color }}
                  />
                </div>
                <span className="text-xs text-neutral-500 w-10 text-right shrink-0">{pr?.wpm ?? 0}</span>
                {pr?.finished && <span className="text-xs">{eliminatedPlayer ? '💀' : '🏁'}</span>}
              </div>
            )
          })}
        </div>

        <div
          className={`relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 text-xl leading-relaxed font-mono-test select-none ${
            mode.blind ? 'blur-md hover:blur-none focus-within:blur-none transition-all duration-300' : ''
          }`}
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
        </div>

        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => inputRef.current?.focus()}
          className="absolute opacity-0 pointer-events-none"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />

        <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
          <div className="h-full bg-violet-400 transition-all duration-100" style={{ width: `${progressPct}%` }} />
        </div>
      </main>
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

function RaceResults({
  room,
  progress,
  selfId,
  mode,
  onExit,
}: {
  room: Room
  progress: ReturnType<typeof useRaceProgress>
  selfId: string
  mode: RaceMode
  onExit: () => void
}) {
  const self = room.players.find((p) => p.id === selfId)
  const isHost = self?.isHost ?? false
  const [copied, setCopied] = useState(false)
  const [rematching, setRematching] = useState(false)

  const ranked = [...room.players]
    .map((p) => ({ player: p, progress: progress.find((pr) => pr.playerId === p.id) }))
    .sort((a, b) => {
      const aFinished = a.progress?.finished ?? false
      const bFinished = b.progress?.finished ?? false
      const aEliminated = a.progress?.result?.eliminated ?? false
      const bEliminated = b.progress?.result?.eliminated ?? false

      // finished-with-a-result beats eliminated beats still-typing
      if (aFinished && !aEliminated && (!bFinished || bEliminated)) return -1
      if (bFinished && !bEliminated && (!aFinished || aEliminated)) return 1

      if (aFinished && !aEliminated && bFinished && !bEliminated) {
        const aScore = raceScore(a.progress?.result?.wpm ?? 0, a.progress?.result?.accuracyChar ?? 0)
        const bScore = raceScore(b.progress?.result?.wpm ?? 0, b.progress?.result?.accuracyChar ?? 0)
        return bScore - aScore
      }

      return (b.progress?.charsTyped ?? 0) - (a.progress?.charsTyped ?? 0)
    })

  const medals = ['🥇', '🥈', '🥉']
  const winner = ranked[0]
  const selfResult = progress.find((p) => p.playerId === selfId)?.result

  const shareText = selfResult
    ? `${winner?.player.id === selfId ? '🏆 ' : ''}${selfResult.wpm} WPM — ${selfResult.accuracyChar}% accuracy\nTyping Wars · Room ${room.code}`
    : ''

  function copyShare() {
    if (!shareText) return
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  async function rematch() {
    setRematching(true)
    try {
      await resetRoomForRematch(room.code, getRandomPassage())
    } finally {
      setRematching(false)
    }
  }

  function handleExit() {
    leaveRoom(selfId).catch(() => {})
    onExit()
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
        <div className="text-center space-y-2">
          <p className="text-sm text-neutral-500 uppercase tracking-widest">Race Results</p>
          {winner && (
            <h1 className="text-3xl font-semibold tracking-tight">
              🏆 {winner.player.nickname} wins{winner.player.id === selfId ? " — that's you!" : ''}
            </h1>
          )}
          {(mode.blind || mode.noBackspace || mode.suddenDeath) && (
            <p className="text-xs text-neutral-500">
              {[mode.blind && 'Blind', mode.noBackspace && 'No Backspace', mode.suddenDeath && 'Sudden Death']
                .filter(Boolean)
                .join(' + ')}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {ranked.map((r, i) => {
            const eliminatedPlayer = r.progress?.result?.eliminated ?? false
            return (
              <div
                key={r.player.id}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                  i < 3 && !eliminatedPlayer ? 'border-amber-400/20 bg-amber-400/5' : 'border-neutral-800 bg-neutral-900/40'
                } ${r.player.id === selfId ? 'ring-1 ring-violet-400/40' : ''}`}
              >
                <span className="w-7 text-center text-sm font-semibold text-neutral-500 shrink-0">
                  {!eliminatedPlayer ? (medals[i] ?? i + 1) : '💀'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {r.player.nickname}
                    {r.player.id === selfId && <span className="text-neutral-500 font-normal"> (you)</span>}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {eliminatedPlayer
                      ? `Eliminated · ${r.progress?.result?.accuracyChar ?? 0}% accuracy before mistake`
                      : r.progress?.result
                        ? `${r.progress.result.wpm} WPM · ${r.progress.result.accuracyChar}% accuracy`
                        : 'Did not finish'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {selfResult && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-500 space-y-1 font-mono-test">
            <p>Room: {room.code}</p>
            <p>WPM methodology: (correct chars ÷ 5) ÷ elapsed minutes</p>
          </div>
        )}

        <div className="flex gap-3">
          {selfResult && (
            <button
              onClick={copyShare}
              className="flex-1 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 transition-colors text-sm font-medium"
            >
              {copied ? 'Copied!' : 'Copy Result'}
            </button>
          )}
          {isHost && (
            <button
              onClick={rematch}
              disabled={rematching}
              className="flex-1 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {rematching ? 'Starting…' : 'Rematch'}
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
