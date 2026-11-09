import { useMemo } from 'react'
import { useRaceProgress } from '../../shared/useRaceProgress'
import type { RunSummary } from './types'

export interface RapidProgress {
  playerId: string
  score: number
  answered: number
  accuracy: number
  finished: boolean
  summary: RunSummary | null
}

/** Live per-player scores for a room, read from the shared race_progress table (see rapidApi.ts for the mapping). */
export function useRapidProgress(roomCode: string | null): RapidProgress[] {
  const raw = useRaceProgress(roomCode)
  return useMemo(
    () =>
      raw.map((p) => ({
        playerId: p.playerId,
        score: p.wpm,
        answered: p.charsTyped,
        accuracy: p.accuracy,
        finished: p.finished,
        summary: p.result as unknown as RunSummary | null,
      })),
    [raw],
  )
}

/** Highest score first; ties go to more correct answers, then accuracy, then id so every client ranks identically. */
export function compareProgress(a: RapidProgress | undefined, b: RapidProgress | undefined, aId: string, bId: string): number {
  const aScore = a?.summary?.score ?? a?.score ?? 0
  const bScore = b?.summary?.score ?? b?.score ?? 0
  if (aScore !== bScore) return bScore - aScore
  const aCorrect = a?.summary?.correct ?? 0
  const bCorrect = b?.summary?.correct ?? 0
  if (aCorrect !== bCorrect) return bCorrect - aCorrect
  if ((a?.accuracy ?? 0) !== (b?.accuracy ?? 0)) return (b?.accuracy ?? 0) - (a?.accuracy ?? 0)
  return aId < bId ? -1 : 1
}
