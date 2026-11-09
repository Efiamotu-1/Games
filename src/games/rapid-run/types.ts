import { CATEGORIES, type Difficulty } from './questions'

export type RapidFormat = 'classic' | 'elimination'

export const ROUND_SECONDS_OPTIONS = [20, 30, 45, 60] as const
export const ROUND_COUNT_OPTIONS = [1, 3, 5] as const
export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'mixed', label: 'Mixed' },
  { id: 'normal', label: 'Normal' },
  { id: 'expert', label: 'Expert' },
]
export const STRIKE_LIMIT = 3

export interface RapidMode {
  /** Classic: everyone plays every round and totals decide the ranking. Elimination: lowest each round is out. */
  format: RapidFormat
  roundSeconds: number
  /** Classic only; elimination runs until one player is left. */
  rounds: number
  difficulty: Difficulty
  /** Empty means every category. */
  categories: string[]
  /** Three wrong answers end your run for the round. */
  threeStrikes: boolean
}

export const DEFAULT_RAPID_MODE: RapidMode = {
  format: 'classic',
  roundSeconds: 60,
  rounds: 1,
  difficulty: 'mixed',
  categories: [],
  threeStrikes: false,
}

function pick<T extends number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'number' && (allowed as readonly number[]).includes(value) ? (value as T) : fallback
}

export function toRapidMode(mode: Record<string, unknown>): RapidMode {
  const difficulty = DIFFICULTIES.find((d) => d.id === mode.difficulty)?.id ?? DEFAULT_RAPID_MODE.difficulty
  const categories = Array.isArray(mode.categories)
    ? CATEGORIES.filter((c) => (mode.categories as unknown[]).includes(c))
    : []
  return {
    format: mode.format === 'elimination' ? 'elimination' : 'classic',
    roundSeconds: pick(mode.roundSeconds, ROUND_SECONDS_OPTIONS, DEFAULT_RAPID_MODE.roundSeconds),
    rounds: pick(mode.rounds, ROUND_COUNT_OPTIONS, DEFAULT_RAPID_MODE.rounds),
    difficulty,
    categories,
    threeStrikes: mode.threeStrikes === true,
  }
}

/** What a room stores per round: a seed every device turns into the same question deck, plus running totals. */
export interface RapidPayload {
  seed: number
  /** Classic format: cumulative score per player id from the rounds already played. */
  totals?: Record<string, number>
}

export function isRapidPayload(value: unknown): value is RapidPayload {
  return !!value && typeof value === 'object' && typeof (value as RapidPayload).seed === 'number'
}

export const newRapidPayload = (totals?: Record<string, number>): RapidPayload => ({
  seed: Math.floor(Math.random() * 2 ** 32),
  ...(totals ? { totals } : {}),
})

export interface RunSummary {
  score: number
  correct: number
  total: number
  bestStreak: number
  accuracy: number
}
