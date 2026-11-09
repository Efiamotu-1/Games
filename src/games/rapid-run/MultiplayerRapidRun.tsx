import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Room } from '../../shared/types'
import { finishTournament, initRaceProgress, leaveRoom } from '../../shared/roomApi'
import { saveTournamentLeaderboardEntry } from '../../shared/roomLeaderboard'
import RoomLeaderboard from '../../arcade/RoomLeaderboard'
import RaceCountdown, { isCountingDown } from '../typing-wars/RaceCountdown'
import RunPlayer, { type RunResult } from './RunPlayer'
import { dealSeeded } from './questions'
import { advanceRapidRound, finishRapidGame, publishLiveScore, resetRapidForRematch, submitRunSummary } from './rapidApi'
import {
  STRIKE_LIMIT,
  isRapidPayload,
  newRapidPayload,
  toRapidMode,
  type RapidMode,
  type RapidPayload,
} from './types'
import { compareProgress, useRapidProgress, type RapidProgress } from './useRapidProgress'

interface MultiplayerRapidRunProps {
  room: Room
  selfId: string
  onExit: () => void
}

type RoomPlayer = Room['players'][number]
type Totals = Record<string, number>

const LIVE_THROTTLE_MS = 350

export default function MultiplayerRapidRun({ room, selfId, onExit }: MultiplayerRapidRunProps) {
  const mode = toRapidMode(room.mode)
  const isElimination = mode.format === 'elimination'
  const payload = isRapidPayload(room.roundPayload) ? room.roundPayload : null
  const survivors = isElimination ? room.players.filter((p) => !room.eliminatedIds.includes(p.id)) : room.players
  const [, forceTick] = useState(0)

  if (room.status === 'finished') {
    return <FinalResults room={room} mode={mode} totals={payload?.totals ?? {}} selfId={selfId} onExit={onExit} />
  }

  if (!payload || !room.startedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-neutral-400 animate-pulse">Preparing round {room.roundNumber}…</p>
      </div>
    )
  }

  if (isElimination && survivors.length <= 1) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="space-y-2">
          <p className="text-2xl font-semibold">🏆 {survivors[0]?.nickname ?? 'Champion'} wins!</p>
          <p className="text-neutral-500 text-sm animate-pulse">Finalizing results…</p>
        </div>
      </div>
    )
  }

  if (isCountingDown(room.startedAt)) {
    return (
      <RaceCountdown
        startedAt={room.startedAt}
        label={room.roundNumber === 1 ? 'Rapid-Run starting' : `Round ${room.roundNumber} starting`}
        hint="Get ready to answer…"
        onDone={() => forceTick((n) => n + 1)}
      />
    )
  }

  if (isElimination && room.eliminatedIds.includes(selfId)) {
    return <SpectatorView room={room} selfId={selfId} onExit={onExit} />
  }

  return (
    <RoundScreen
      key={`${room.roundNumber}-${room.startedAt}`}
      room={room}
      payload={payload}
      mode={mode}
      startedAt={room.startedAt}
      survivors={survivors}
      selfId={selfId}
      onExit={onExit}
    />
  )
}

function liveScore(progress: RapidProgress[], playerId: string): number {
  const p = progress.find((x) => x.playerId === playerId)
  return p?.summary?.score ?? p?.score ?? 0
}

/** Everyone's cumulative score: totals from finished rounds plus the round in progress. */
function runningTotal(carry: Totals, progress: RapidProgress[], playerId: string): number {
  return (carry[playerId] ?? 0) + liveScore(progress, playerId)
}

function rankPlayers(players: RoomPlayer[], progress: RapidProgress[], carry: Totals): RoomPlayer[] {
  const byId = (id: string) => progress.find((p) => p.playerId === id)
  return [...players].sort((a, b) => {
    const diff = runningTotal(carry, progress, b.id) - runningTotal(carry, progress, a.id)
    return diff !== 0 ? diff : compareProgress(byId(a.id), byId(b.id), a.id, b.id)
  })
}

function RoundScreen({
  room,
  payload,
  mode,
  startedAt,
  survivors,
  selfId,
  onExit,
}: {
  room: Room
  payload: RapidPayload
  mode: RapidMode
  startedAt: number
  survivors: RoomPlayer[]
  selfId: string
  onExit: () => void
}) {
  const isElimination = mode.format === 'elimination'
  const carry = useMemo(() => payload.totals ?? {}, [payload.totals])
  const categoryKey = mode.categories.join('|')
  const deck = useMemo(
    () => dealSeeded(payload.seed, { difficulty: mode.difficulty, categories: mode.categories }),
    // categoryKey stands in for the categories array, which is rebuilt on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [payload.seed, mode.difficulty, categoryKey],
  )
  const getQuestion = useCallback((i: number) => deck[i] ?? null, [deck])
  const progress = useRapidProgress(room.code)
  const [ended, setEnded] = useState(false)
  const lastSent = useRef(0)
  const advancing = useRef(false)
  const isLastRound = !isElimination && room.roundNumber >= mode.rounds

  useEffect(() => {
    initRaceProgress(room.code, selfId).catch(() => {})
    function handleUnload() {
      leaveRoom(selfId).catch(() => {})
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [room.code, selfId])

  const handleProgress = useCallback(
    (live: { score: number; answered: number; accuracy: number }) => {
      const now = Date.now()
      if (now - lastSent.current < LIVE_THROTTLE_MS) return
      lastSent.current = now
      publishLiveScore(selfId, live).catch(() => {})
    },
    [selfId],
  )

  const handleFinish = useCallback(
    (run: RunResult) => {
      setEnded(true)
      submitRunSummary(selfId, {
        score: run.score,
        correct: run.correct,
        total: run.total,
        bestStreak: run.bestStreak,
        accuracy: run.total ? Math.round((run.correct / run.total) * 100) : 0,
      }).catch(() => {})
    },
    [selfId],
  )

  const allSubmitted = survivors.every((p) => progress.find((x) => x.playerId === p.id)?.finished)

  // Any client may close out the round once everyone has submitted. The round-number guards in rapidApi mean
  // only the first write applies, and only that client goes on to save the final results.
  useEffect(() => {
    if (!ended || !allSubmitted || advancing.current) return
    advancing.current = true

    const ranked = rankPlayers(survivors, progress, carry)
    const nextTotals: Totals = { ...carry }
    for (const p of survivors) nextTotals[p.id] = runningTotal(carry, progress, p.id)

    async function saveStandings(placements: RoomPlayer[]) {
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
    }

    ;(async () => {
      try {
        if (isElimination) {
          const nextEliminated = [...room.eliminatedIds, ranked[ranked.length - 1].id]
          const won = await advanceRapidRound(room.code, room.roundNumber, nextEliminated, newRapidPayload())
          if (!won || survivors.length - 1 > 1) return
          await saveStandings(
            [ranked[0], ...[...nextEliminated].reverse().map((id) => room.players.find((p) => p.id === id))].filter(
              Boolean,
            ) as RoomPlayer[],
          )
          await finishTournament(room.code)
        } else if (isLastRound) {
          const won = await finishRapidGame(room.code, room.roundNumber, { seed: payload.seed, totals: nextTotals })
          if (won) await saveStandings(ranked)
        } else {
          await advanceRapidRound(room.code, room.roundNumber, room.eliminatedIds, newRapidPayload(nextTotals))
        }
      } catch {
        advancing.current = false
      }
    })()
  }, [ended, allSubmitted, survivors, progress, carry, isElimination, isLastRound, payload.seed, room.code, room.eliminatedIds, room.players, room.roundNumber, room.gameId, room.mode])

  const header = (
    <header className="w-full max-w-2xl flex items-center justify-between gap-3 mb-5 sm:mb-8 flex-wrap">
      <div className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight">
        <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_2px_rgba(167,139,250,0.7)]" />
        {isElimination || mode.rounds === 1 ? `Round ${room.roundNumber}` : `Round ${room.roundNumber} of ${mode.rounds}`}
      </div>
      <div className="flex items-center gap-2">
        {isElimination && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
            {survivors.length} left
          </span>
        )}
        <button
          onClick={() => {
            leaveRoom(selfId).catch(() => {})
            onExit()
          }}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Leave
        </button>
      </div>
    </header>
  )

  if (ended) {
    const status = !allSubmitted
      ? 'Waiting for everyone to finish…'
      : isElimination
        ? 'Starting next round…'
        : isLastRound
          ? 'Tallying the final standings…'
          : 'Starting next round…'
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
        {header}
        <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
          <div className="text-center space-y-2">
            <p className="text-sm text-neutral-500 uppercase tracking-widest">Round {room.roundNumber} results</p>
            <h1 className="text-2xl font-semibold tracking-tight">Time&apos;s up!</h1>
          </div>
          <RoundRankingList
            players={survivors}
            progress={progress}
            carry={carry}
            selfId={selfId}
            showRoundTotals={!isElimination && mode.rounds > 1}
            revealElimination={isElimination && allSubmitted}
          />
          <p className="text-center text-xs text-neutral-500 animate-pulse">{status}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      {header}
      <RunPlayer
        getQuestion={getQuestion}
        startedAt={startedAt}
        durationMs={mode.roundSeconds * 1000}
        maxStrikes={mode.threeStrikes ? STRIKE_LIMIT : undefined}
        onProgress={handleProgress}
        onFinish={handleFinish}
        aside={
          <LiveStandings
            players={survivors}
            progress={progress}
            carry={carry}
            selfId={selfId}
            showDanger={isElimination}
          />
        }
      />
    </div>
  )
}

function LiveStandings({
  players,
  progress,
  carry,
  selfId,
  showDanger,
}: {
  players: RoomPlayer[]
  progress: RapidProgress[]
  carry: Totals
  selfId: string
  showDanger: boolean
}) {
  const rows = rankPlayers(players, progress, carry).map((player) => ({
    player,
    score: runningTotal(carry, progress, player.id),
  }))
  const top = Math.max(1, rows[0]?.score ?? 0)
  const lastRow =
    showDanger && rows.length > 1 && rows[rows.length - 1].score < rows[rows.length - 2].score
      ? rows[rows.length - 1]
      : null
  const selfInDanger = lastRow?.player.id === selfId

  return (
    <div
      className={`rounded-2xl border bg-neutral-900/60 p-3 sm:p-4 space-y-1.5 transition-colors ${
        selfInDanger ? 'border-rose-500/50' : 'border-neutral-800'
      }`}
    >
      {rows.map((r, i) => {
        const danger = r === lastRow
        return (
          <div key={r.player.id} className={`flex items-center gap-2.5 text-xs ${r.player.id === selfId ? 'text-white' : 'text-neutral-400'}`}>
            <span className="w-3 shrink-0 text-right text-[10px] text-neutral-600">{i + 1}</span>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: r.player.color, boxShadow: `0 0 6px 1px ${r.player.color}66` }}
            />
            <span className="w-20 shrink-0 truncate">{r.player.nickname}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(r.score / top) * 100}%`, backgroundColor: danger ? '#fb7185' : r.player.color }}
              />
            </div>
            <span className="w-14 text-right font-semibold tabular-nums">{r.score}</span>
            <span className="w-4 text-center">{danger ? '💀' : ''}</span>
          </div>
        )
      })}
      {selfInDanger && <p className="pt-1 text-center text-[11px] font-medium text-rose-400">You&apos;re in last place. Catch up!</p>}
    </div>
  )
}

function RoundRankingList({
  players,
  progress,
  carry,
  selfId,
  showRoundTotals,
  revealElimination,
}: {
  players: RoomPlayer[]
  progress: RapidProgress[]
  carry: Totals
  selfId: string
  showRoundTotals: boolean
  revealElimination: boolean
}) {
  const ranked = rankPlayers(players, progress, carry)
  return (
    <div className="space-y-2">
      {ranked.map((player, i) => {
        const p = progress.find((x) => x.playerId === player.id)
        const isLast = revealElimination && i === ranked.length - 1
        return (
          <div
            key={player.id}
            className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
              isLast ? 'border-rose-500/30 bg-rose-500/5' : 'border-neutral-800 bg-neutral-900/40'
            } ${player.id === selfId ? 'ring-1 ring-violet-400/40' : ''}`}
          >
            <span className="w-7 shrink-0 text-center text-sm font-semibold text-neutral-500">{isLast ? '💀' : i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {player.nickname}
                {player.id === selfId && <span className="font-normal text-neutral-500"> (you)</span>}
              </p>
              <p className="text-xs text-neutral-500">
                {p?.summary
                  ? `${p.summary.correct}/${p.summary.total} correct · ${p.summary.accuracy}% · best combo ${p.summary.bestStreak}`
                  : 'Still answering…'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums">{runningTotal(carry, progress, player.id)}</p>
              {showRoundTotals && (
                <p className="text-[10px] text-neutral-500 tabular-nums">+{liveScore(progress, player.id)} this round</p>
              )}
            </div>
            {isLast && <span className="shrink-0 text-xs font-medium text-rose-400">Eliminated</span>}
          </div>
        )
      })}
    </div>
  )
}

function SpectatorView({ room, selfId, onExit }: { room: Room; selfId: string; onExit: () => void }) {
  const progress = useRapidProgress(room.code)
  const survivors = room.players.filter((p) => !room.eliminatedIds.includes(p.id))

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <header className="w-full max-w-2xl flex items-center justify-between gap-3 mb-6 sm:mb-8">
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
      <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
        <p className="text-center text-2xl">💀 You were eliminated</p>
        <LiveStandings players={survivors} progress={progress} carry={{}} selfId={selfId} showDanger />
      </main>
    </div>
  )
}

function FinalResults({
  room,
  mode,
  totals,
  selfId,
  onExit,
}: {
  room: Room
  mode: RapidMode
  totals: Totals
  selfId: string
  onExit: () => void
}) {
  const isHost = room.players.find((p) => p.id === selfId)?.isHost ?? false
  const [rematching, setRematching] = useState(false)
  const isElimination = mode.format === 'elimination'

  // Elimination: last eliminated is runner-up, first eliminated is last place, never eliminated wins.
  // Classic: highest total wins.
  const ranked: RoomPlayer[] = isElimination
    ? ([
        ...room.players.filter((p) => !room.eliminatedIds.includes(p.id)),
        ...[...room.eliminatedIds].reverse().map((id) => room.players.find((p) => p.id === id)),
      ].filter(Boolean) as RoomPlayer[])
    : [...room.players].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0) || (a.id < b.id ? -1 : 1))
  const winner = ranked[0]
  const medals = ['🥇', '🥈', '🥉']

  async function rematch() {
    setRematching(true)
    try {
      await resetRapidForRematch(room.code, newRapidPayload())
    } finally {
      setRematching(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-10">
      <main className="w-full max-w-2xl flex-1 space-y-6 animate-pop-in">
        <div className="text-center space-y-2">
          <p className="text-sm text-neutral-500 uppercase tracking-widest">
            {isElimination ? 'Elimination results' : 'Final standings'}
          </p>
          {winner && (
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              🏆 {winner.nickname} {isElimination ? 'is the champion' : 'wins'}
              {winner.id === selfId ? " — that's you!" : ''}
            </h1>
          )}
          <p className="text-xs text-neutral-500">
            {room.roundNumber} round{room.roundNumber === 1 ? '' : 's'} played
          </p>
        </div>

        <div className="space-y-2">
          {ranked.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                i < 3 ? 'border-amber-400/20 bg-amber-400/5' : 'border-neutral-800 bg-neutral-900/40'
              } ${p.id === selfId ? 'ring-1 ring-violet-400/40' : ''}`}
            >
              <span className="w-7 shrink-0 text-center text-sm font-semibold text-neutral-500">{medals[i] ?? i + 1}</span>
              <p className="min-w-0 flex-1 font-medium">
                {p.nickname}
                {p.id === selfId && <span className="font-normal text-neutral-500"> (you)</span>}
              </p>
              {!isElimination && <span className="text-lg font-semibold tabular-nums">{totals[p.id] ?? 0}</span>}
            </div>
          ))}
        </div>

        <RoomLeaderboard roomCode={room.code} />

        <div className="flex flex-col gap-3 sm:flex-row">
          {isHost && (
            <button
              onClick={rematch}
              disabled={rematching}
              className="flex-1 rounded-xl border border-neutral-700 py-3 text-sm font-medium transition-colors hover:border-neutral-500 disabled:opacity-50"
            >
              {rematching ? 'Starting…' : 'Play again'}
            </button>
          )}
          <button
            onClick={() => {
              leaveRoom(selfId).catch(() => {})
              onExit()
            }}
            className="flex-1 rounded-2xl bg-violet-500 py-3 font-semibold text-white transition-colors hover:bg-violet-400"
          >
            Back to Arcade
          </button>
        </div>
      </main>
    </div>
  )
}
