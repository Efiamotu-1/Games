import { useEffect, useRef, useState } from 'react'
import { raceScore, scoreAttempt } from './scoring'
import type { Room } from '../../shared/types'
import {
  advanceEliminationRound,
  finishRace,
  finishTournament,
  initRaceProgress,
  leaveRoom,
  resetRoomForRematch,
  updateRaceProgress,
} from '../../shared/roomApi'
import { useRaceProgress } from '../../shared/useRaceProgress'
import { saveTournamentLeaderboardEntry } from '../../shared/roomLeaderboard'
import RoomLeaderboard from '../../arcade/RoomLeaderboard'
import { getRandomPassage } from './passages'
import { toRaceMode, type RaceMode } from './types'
import PeekablePassage from './PeekablePassage'

interface EliminationTournamentProps {
  room: Room
  selfId: string
  onExit: () => void
}

const PROGRESS_THROTTLE_MS = 250

export default function EliminationTournament({ room, selfId, onExit }: EliminationTournamentProps) {
  const mode: RaceMode = toRaceMode(room.mode)
  const target = room.passage ?? ''
  const survivors = room.players.filter((p) => !room.eliminatedIds.includes(p.id))
  const selfEliminated = room.eliminatedIds.includes(selfId)

  if (room.status === 'finished') {
    return <TournamentResults room={room} selfId={selfId} onExit={onExit} />
  }

  if (!room.passage || !room.startedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-neutral-400 animate-pulse">Preparing round {room.roundNumber}…</p>
      </div>
    )
  }

  if (survivors.length <= 1) {
    return <FinishingUp room={room} selfId={selfId} winner={survivors[0] ?? null} />
  }

  if (selfEliminated) {
    return <SpectatorView room={room} mode={mode} target={target} selfId={selfId} onExit={onExit} />
  }

  return (
    <RoundScreen
      key={room.roundNumber}
      room={room}
      selfId={selfId}
      mode={mode}
      target={target}
      survivors={survivors}
      onExit={onExit}
    />
  )
}

function RoundScreen({
  room,
  selfId,
  mode,
  target,
  survivors,
  onExit,
}: {
  room: Room
  selfId: string
  mode: RaceMode
  target: string
  survivors: Room['players']
  onExit: () => void
}) {
  const [typed, setTyped] = useState('')
  const [startedAt] = useState(() => room.startedAt ?? Date.now())
  const [elapsed, setElapsed] = useState(0)
  const backspaces = useRef(0)
  const correctionAttempts = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const finished = useRef(false)
  const lastProgressSent = useRef(0)
  const advancing = useRef(false)
  const progress = useRaceProgress(room.code)

  const self = room.players.find((p) => p.id === selfId)
  const isHost = self?.isHost ?? false
  const timeLeft = Math.max(0, mode.roundSeconds - elapsed)
  const timeUp = timeLeft <= 0

  useEffect(() => {
    initRaceProgress(room.code, selfId).catch(() => {})
    inputRef.current?.focus()

    function handleUnload() {
      leaveRoom(selfId).catch(() => {})
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.roundNumber])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((Date.now() - startedAt) / 1000)
    }, 100)
    return () => clearInterval(interval)
  }, [startedAt])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return
    if (mode.noBackspace) {
      e.preventDefault()
    }
    correctionAttempts.current++
    if (e.key === 'Backspace') backspaces.current++
  }

  async function submitResult(elapsedSeconds: number, finalTyped: string) {
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
    if (finished.current || timeUp) return
    const value = e.target.value
    const elapsedNow = (Date.now() - startedAt) / 1000

    if (mode.suddenDeath) {
      const lastIndex = value.length - 1
      if (lastIndex >= 0 && value[lastIndex] !== target[lastIndex]) {
        setTyped(value)
        submitResult(elapsedNow, value)
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
      submitResult(elapsedNow, value)
    }
  }

  // If time runs out and this player hasn't finished, submit whatever they have.
  useEffect(() => {
    if (timeUp && !finished.current) {
      submitResult(mode.roundSeconds, typed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp])

  // Host: once every survivor has a progress row marked finished (or time is up for everyone),
  // rank the round and advance — eliminate last place, seed next round or finish tournament.
  useEffect(() => {
    if (!isHost || advancing.current) return
    if (!timeUp) return

    const survivorIds = survivors.map((p) => p.id)
    const allSubmitted = survivorIds.every((id) => progress.find((pr) => pr.playerId === id)?.finished)
    if (!allSubmitted) return

    advancing.current = true
    ;(async () => {
      const ranked = [...survivors].sort((a, b) => {
        const ap = progress.find((pr) => pr.playerId === a.id)
        const bp = progress.find((pr) => pr.playerId === b.id)
        const aScore = raceScore(ap?.result?.wpm ?? 0, ap?.result?.accuracyChar ?? 0)
        const bScore = raceScore(bp?.result?.wpm ?? 0, bp?.result?.accuracyChar ?? 0)
        if (aScore !== bScore) return bScore - aScore
        return (bp?.charsTyped ?? 0) - (ap?.charsTyped ?? 0)
      })

      const eliminatedThisRound = ranked[ranked.length - 1]
      const nextEliminatedIds = [...room.eliminatedIds, eliminatedThisRound.id]
      const remaining = survivors.length - 1

      if (remaining <= 1) {
        await advanceEliminationRound(room.code, nextEliminatedIds, room.passage ?? '')
        await finishTournament(room.code)
      } else {
        await advanceEliminationRound(room.code, nextEliminatedIds, getRandomPassage())
      }
    })()
  }, [isHost, timeUp, progress, survivors, room.code, room.eliminatedIds, room.passage])

  const roundResults = [...survivors]
    .map((p) => ({ player: p, progress: progress.find((pr) => pr.playerId === p.id) }))
    .sort((a, b) => {
      const aScore = raceScore(a.progress?.result?.wpm ?? a.progress?.wpm ?? 0, a.progress?.result?.accuracyChar ?? a.progress?.accuracy ?? 0)
      const bScore = raceScore(b.progress?.result?.wpm ?? b.progress?.wpm ?? 0, b.progress?.result?.accuracyChar ?? b.progress?.accuracy ?? 0)
      return bScore - aScore
    })

  if (timeUp) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-10">
        <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
          <div className="text-center space-y-2">
            <p className="text-sm text-neutral-500 uppercase tracking-widest">Round {room.roundNumber} Results</p>
            <h1 className="text-2xl font-semibold tracking-tight">Time&apos;s up!</h1>
          </div>
          <RoundRankingList results={roundResults} selfId={selfId} eliminateLast />
          <p className="text-center text-xs text-neutral-500 animate-pulse">
            {isHost ? 'Starting next round…' : 'Waiting for the host to advance…'}
          </p>
        </main>
      </div>
    )
  }

  const progressPct = target.length > 0 ? (typed.length / target.length) * 100 : 0

  let liveCorrect = 0
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) liveCorrect++
  }
  const liveAccuracy = typed.length > 0 ? Math.round((liveCorrect / typed.length) * 100) : 100
  const liveWpm = typed.length > 0 ? Math.round(typed.length / 5 / Math.max(elapsed / 60, 1 / 600)) : 0

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-3xl flex items-center justify-between gap-3 mb-6 sm:mb-8 flex-wrap">
        <div className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.7)]" />
          Round {room.roundNumber}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-medium">
            {survivors.length} left
          </span>
          <button
            onClick={() => {
              leaveRoom(selfId).catch(() => {})
              onExit()
            }}
            className="text-xs text-neutral-500 hover:text-neutral-300 ml-1 sm:ml-2"
          >
            Leave
          </button>
        </div>
      </header>

      <main className="w-full max-w-3xl flex-1 space-y-5 sm:space-y-6 animate-pop-in">
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <Stat label="Time left" value={`${Math.ceil(timeLeft)}s`} warn={timeLeft <= 10} />
            <Stat label="WPM" value={String(liveWpm)} />
            <Stat label="Accuracy" value={`${liveAccuracy}%`} />
          </div>
        </div>

        <div className="space-y-2">
          {survivors.map((p) => {
            const pr = progress.find((x) => x.playerId === p.id)
            const pct = target.length > 0 ? ((pr?.charsTyped ?? 0) / target.length) * 100 : 0
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
                {pr?.finished && <span className="text-xs">🏁</span>}
              </div>
            )
          })}
        </div>

        <div onClick={() => inputRef.current?.focus()} className="cursor-text">
          {mode.noPeek ? (
            <PeekablePassage target={target} typed={typed} />
          ) : (
            <div className="relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6 text-base sm:text-xl leading-relaxed font-mono-test select-none">
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
          )}
        </div>

        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => inputRef.current?.focus()}
          className="absolute opacity-0 w-px h-px"
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

function SpectatorView({
  room,
  mode,
  target,
  selfId,
  onExit,
}: {
  room: Room
  mode: RaceMode
  target: string
  selfId: string
  onExit: () => void
}) {
  const progress = useRaceProgress(room.code)
  const survivors = room.players.filter((p) => !room.eliminatedIds.includes(p.id))

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-3xl flex items-center justify-between gap-3 mb-6 sm:mb-8 flex-wrap">
        <div className="flex items-center gap-2 text-sm sm:text-lg font-semibold tracking-tight">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-neutral-600 shrink-0" />
          Spectating Round {room.roundNumber}
        </div>
        <button
          onClick={() => {
            leaveRoom(selfId).catch(() => {})
            onExit()
          }}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Leave
        </button>
      </header>

      <main className="w-full max-w-3xl flex-1 space-y-6 animate-pop-in">
        <p className="text-center text-2xl">💀 You were eliminated</p>
        <div className="space-y-2">
          {survivors.map((p) => {
            const pr = progress.find((x) => x.playerId === p.id)
            const pct = target.length > 0 ? ((pr?.charsTyped ?? 0) / target.length) * 100 : 0
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
              </div>
            )
          })}
        </div>
        {mode.noPeek && <p className="text-center text-xs text-neutral-600">(Passages stay hidden while spectating)</p>}
      </main>
    </div>
  )
}

function FinishingUp({ room, selfId, winner }: { room: Room; selfId: string; winner: Room['players'][number] | null }) {
  const advancing = useRef(false)
  const self = room.players.find((p) => p.id === selfId)
  const isHost = self?.isHost ?? false

  useEffect(() => {
    if (!isHost || advancing.current || room.status === 'finished') return
    advancing.current = true
    ;(async () => {
      const placements = [
        ...(winner ? [winner] : []),
        ...[...room.eliminatedIds].reverse().map((id) => room.players.find((p) => p.id === id)).filter(Boolean),
      ] as Room['players']

      await Promise.all(
        placements.map((p, i) =>
          saveTournamentLeaderboardEntry({
            roomCode: room.code,
            gameId: room.gameId,
            playerId: p.id,
            nickname: p.nickname,
            placement: i + 1,
            roundsPlayed: room.roundNumber,
            mode: room.mode,
          }).catch(() => {}),
        ),
      )

      await finishTournament(room.code)
    })()
  }, [isHost, room.code, room.status, room.eliminatedIds, room.players, room.gameId, room.mode, room.roundNumber, winner])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div className="space-y-2">
        <p className="text-2xl font-semibold">🏆 {winner?.nickname ?? 'Champion'} wins the tournament!</p>
        <p className="text-neutral-500 text-sm animate-pulse">Finalizing results…</p>
      </div>
    </div>
  )
}

function TournamentResults({ room, selfId, onExit }: { room: Room; selfId: string; onExit: () => void }) {
  const self = room.players.find((p) => p.id === selfId)
  const isHost = self?.isHost ?? false
  const [rematching, setRematching] = useState(false)

  // Elimination order: last eliminated = runner-up, first eliminated = last place.
  // Anyone never eliminated (the winner) ranks first.
  const eliminationOrder = room.eliminatedIds
  const winner = room.players.find((p) => !eliminationOrder.includes(p.id))
  const ranked = [
    ...(winner ? [winner] : []),
    ...[...eliminationOrder].reverse().map((id) => room.players.find((p) => p.id === id)).filter(Boolean),
  ] as Room['players']

  const medals = ['🥇', '🥈', '🥉']

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
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
        <div className="text-center space-y-2">
          <p className="text-sm text-neutral-500 uppercase tracking-widest">Tournament Results</p>
          {winner && (
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              🏆 {winner.nickname} is the champion{winner.id === selfId ? " — that's you!" : ''}
            </h1>
          )}
          <p className="text-xs text-neutral-500">{room.roundNumber} rounds played</p>
        </div>

        <div className="space-y-2">
          {ranked.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                i < 3 ? 'border-amber-400/20 bg-amber-400/5' : 'border-neutral-800 bg-neutral-900/40'
              } ${p.id === selfId ? 'ring-1 ring-violet-400/40' : ''}`}
            >
              <span className="w-7 text-center text-sm font-semibold text-neutral-500 shrink-0">
                {medals[i] ?? i + 1}
              </span>
              <p className="font-medium flex-1 min-w-0">
                {p.nickname}
                {p.id === selfId && <span className="text-neutral-500 font-normal"> (you)</span>}
              </p>
            </div>
          ))}
        </div>

        <RoomLeaderboard roomCode={room.code} />

        <div className="flex flex-col sm:flex-row gap-3">
          {isHost && (
            <button
              onClick={rematch}
              disabled={rematching}
              className="flex-1 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {rematching ? 'Starting…' : 'New Tournament'}
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

function RoundRankingList({
  results,
  selfId,
  eliminateLast,
}: {
  results: { player: Room['players'][number]; progress: ReturnType<typeof useRaceProgress>[number] | undefined }[]
  selfId: string
  eliminateLast: boolean
}) {
  return (
    <div className="space-y-2">
      {results.map((r, i) => {
        const isLast = eliminateLast && i === results.length - 1
        return (
          <div
            key={r.player.id}
            className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
              isLast ? 'border-rose-500/30 bg-rose-500/5' : 'border-neutral-800 bg-neutral-900/40'
            } ${r.player.id === selfId ? 'ring-1 ring-violet-400/40' : ''}`}
          >
            <span className="w-7 text-center text-sm font-semibold text-neutral-500 shrink-0">
              {isLast ? '💀' : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                {r.player.nickname}
                {r.player.id === selfId && <span className="text-neutral-500 font-normal"> (you)</span>}
              </p>
              <p className="text-xs text-neutral-500">
                {r.progress?.result
                  ? `${r.progress.result.wpm} WPM · ${r.progress.result.accuracyChar}% accuracy`
                  : `${r.progress?.wpm ?? 0} WPM (in progress) · ${r.progress?.accuracy ?? 0}% accuracy`}
              </p>
            </div>
            {isLast && <span className="text-xs text-rose-400 font-medium shrink-0">Eliminated</span>}
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <span className="text-neutral-500">{label} </span>
      <span className={`font-semibold ${warn ? 'text-rose-400' : 'text-neutral-100'}`}>{value}</span>
    </div>
  )
}
