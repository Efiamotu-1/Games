export interface CategoriesMode {
  totalRounds: number
  roundSeconds: number
}

export const ROUND_COUNT_OPTIONS = [3, 5, 8, 10] as const
export const DEFAULT_TOTAL_ROUNDS = 5
export const ROUND_SECONDS = 30

export const DEFAULT_CATEGORIES_MODE: CategoriesMode = {
  totalRounds: DEFAULT_TOTAL_ROUNDS,
  roundSeconds: ROUND_SECONDS,
}

export function toCategoriesMode(mode: Record<string, unknown>): CategoriesMode {
  const totalRounds =
    typeof mode.totalRounds === 'number' && ROUND_COUNT_OPTIONS.includes(mode.totalRounds as (typeof ROUND_COUNT_OPTIONS)[number])
      ? mode.totalRounds
      : DEFAULT_TOTAL_ROUNDS

  return { totalRounds, roundSeconds: ROUND_SECONDS }
}

export interface CategoriesSubmission {
  playerId: string
  roundNumber: number
  answer: string
  isValid: boolean
  isUnique: boolean
  score: number
  scored: boolean
  submitted: boolean
  submittedAt: number | null
}
