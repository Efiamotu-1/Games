import type { Level } from './prompts'

export const TURNS_EACH_OPTIONS = [1, 2, 3, 5] as const
export const SKIP_OPTIONS = [0, 1, 2, 3] as const
export const MAX_TRUTH_STREAK = 2

export interface TodMode {
  level: Level
  turnsEach: number
  maxSkips: number
}

export const DEFAULT_TOD_MODE: TodMode = { level: 'party', turnsEach: 3, maxSkips: 2 }

export function toTodMode(mode: Record<string, unknown>): TodMode {
  const level = mode.level === 'chill' || mode.level === 'party' || mode.level === 'wild' ? mode.level : DEFAULT_TOD_MODE.level
  const turnsEach = (TURNS_EACH_OPTIONS as readonly number[]).includes(mode.turnsEach as number)
    ? (mode.turnsEach as number)
    : DEFAULT_TOD_MODE.turnsEach
  const maxSkips = (SKIP_OPTIONS as readonly number[]).includes(mode.maxSkips as number)
    ? (mode.maxSkips as number)
    : DEFAULT_TOD_MODE.maxSkips
  return { level, turnsEach, maxSkips }
}

export interface PlayerStats {
  truths: number
  dares: number
  skips: number
  truthStreak: number
}

export const EMPTY_STATS: PlayerStats = { truths: 0, dares: 0, skips: 0, truthStreak: 0 }

/** Stored in rooms.round_payload. The room's round_number is the turn counter. */
export interface TodPayload {
  phase: 'choose' | 'prompt' | 'penalty'
  kind: 'truth' | 'dare' | null
  prompt: string | null
  order: string[]
  seen: string[]
  stats: Record<string, PlayerStats>
}

export function newTodPayload(): TodPayload {
  return { phase: 'choose', kind: null, prompt: null, order: [], seen: [], stats: {} }
}

export function isTodPayload(value: unknown): value is TodPayload {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<TodPayload>
  return (v.phase === 'choose' || v.phase === 'prompt' || v.phase === 'penalty') && Array.isArray(v.order)
}
