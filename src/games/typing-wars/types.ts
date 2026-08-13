export interface TestConfig {
  blind: boolean
  noBackspace: boolean
}

export interface RaceMode {
  noBackspace: boolean
  blind: boolean
  suddenDeath: boolean
  eliminationRounds: boolean
  roundSeconds: number
}

export const DEFAULT_ROUND_SECONDS = 45
export const MIN_ROUND_SECONDS = 10
export const MAX_ROUND_SECONDS = 600

export const DEFAULT_RACE_MODE: RaceMode = {
  noBackspace: false,
  blind: false,
  suddenDeath: false,
  eliminationRounds: false,
  roundSeconds: DEFAULT_ROUND_SECONDS,
}

export function toRaceMode(mode: Record<string, unknown>): RaceMode {
  const roundSeconds =
    typeof mode.roundSeconds === 'number' && Number.isFinite(mode.roundSeconds)
      ? Math.min(MAX_ROUND_SECONDS, Math.max(MIN_ROUND_SECONDS, Math.round(mode.roundSeconds)))
      : DEFAULT_ROUND_SECONDS

  return {
    noBackspace: mode.noBackspace === true,
    blind: mode.blind === true,
    suddenDeath: mode.suddenDeath === true,
    eliminationRounds: mode.eliminationRounds === true,
    roundSeconds,
  }
}

export interface AttemptResult {
  id: string
  timestamp: number
  wpm: number
  rawWpm: number
  accuracyChar: number
  accuracyWord: number
  correctWords: number
  incorrectWords: number
  correctChars: number
  incorrectChars: number
  missingChars: number
  extraChars: number
  durationSeconds: number
  backspaces: number
  deletes: number
  correctionAttempts: number
  config: TestConfig
  text: string
}
