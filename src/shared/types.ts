export interface Player {
  id: string
  nickname: string
  color: string
  isHost: boolean
  ready: boolean
}

export interface Room {
  code: string
  gameId: string
  players: Player[]
  status: 'lobby' | 'in-game' | 'finished'
  passage: string | null
  startedAt: number | null
  mode: Record<string, unknown>
  roundNumber: number
  eliminatedIds: string[]
}

export interface RaceProgress {
  playerId: string
  charsTyped: number
  wpm: number
  accuracy: number
  finished: boolean
  finishedAt: number | null
  result: RaceResult | null
}

export interface RaceResult {
  wpm: number
  rawWpm: number
  accuracyChar: number
  accuracyWord: number
  correctWords: number
  incorrectWords: number
  correctChars: number
  incorrectChars: number
  durationSeconds: number
  backspaces: number
  correctionAttempts: number
  eliminated: boolean
}
