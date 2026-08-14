export interface TestConfig {
  noBackspace: boolean
}

export interface RaceMode {
  noBackspace: boolean
  noPeek: boolean
  suddenDeath: boolean
  eliminationRounds: boolean
  roundSeconds: number
}

export const DEFAULT_ROUND_SECONDS = 45
export const MIN_ROUND_SECONDS = 10
export const MAX_ROUND_SECONDS = 600

export const DEFAULT_RACE_MODE: RaceMode = {
  noBackspace: false,
  noPeek: false,
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
    noPeek: mode.noPeek === true,
    suddenDeath: mode.suddenDeath === true,
    eliminationRounds: mode.eliminationRounds === true,
    roundSeconds,
  }
}

export const MODE_INFO = {
  noBackspace: {
    label: 'No Backspace',
    description:
      "You can't fix mistakes. Once you type a letter, it stays — even if it's wrong. Backspace and Delete won't work during the race.",
  },
  noPeek: {
    label: 'No Peek',
    description:
      'The text you need to type is hidden. Press and hold the "Hold to peek" button to see it, then let go to hide it again. You have to memorize as you go.',
  },
  suddenDeath: {
    label: 'Sudden Death',
    description:
      "One typo and you're out. The moment you type a single wrong letter, you're eliminated from the race — even if it's the very first letter.",
  },
  eliminationRounds: {
    label: 'Elimination Rounds',
    description:
      "This isn't one race — it's a tournament. Everyone races the same text with a timer. When time's up, whoever is in last place is eliminated. Everyone else races again. This repeats, one person eliminated each round, until only one winner remains.",
  },
} as const

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
