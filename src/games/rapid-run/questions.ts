export type Level = 'normal' | 'expert'

/** Four options per question: the answer plus three wrong ones. */
export const OPTION_COUNT = 4

export interface Question {
  /** Id of the generated question; the server uses it to re-score a daily run. */
  id: string
  category: string
  text: string
  /** Already shuffled for this deal. */
  options: string[]
  /** Index into options. */
  correct: number
}

/** A generated question as stored in the database. There are no built-in questions. */
export interface ExtraQuestion {
  id: string
  category: string
  level: Level
  text: string
  answer: string
  wrong: string[]
}

/** The categories the daily generator writes (keep in sync with supabase/functions/generate-trivia). */
export const CATEGORIES: string[] = [
  'Science',
  'History',
  'Geography',
  'Mathematics',
  'Technology',
  'Sports',
  'Pop Culture',
  'Literature',
]

export type Difficulty = 'mixed' | 'normal' | 'expert'

export interface DealOptions {
  difficulty: Difficulty
  /** Empty means every category. */
  categories: string[]
}

const MIN_DECK_LENGTH = 160

function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Small seeded PRNG so every player deals the identical deck from one shared seed. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function toQuestion(q: ExtraQuestion, rand: () => number): Question {
  const options = shuffle([q.answer, ...q.wrong.slice(0, OPTION_COUNT - 1)], rand)
  return { id: q.id, category: q.category, text: q.text, options, correct: options.indexOf(q.answer) }
}

/** Only questions with a full set of options can be asked. */
function playable(questions: ExtraQuestion[]): ExtraQuestion[] {
  return questions.filter((q) => q.wrong.length >= OPTION_COUNT - 1)
}

function poolFor({ difficulty, categories }: DealOptions, extra: ExtraQuestion[]): ExtraQuestion[] {
  const all = playable(extra)
  const byLevel = difficulty === 'mixed' ? all : all.filter((q) => q.level === difficulty)
  const filtered = categories.length > 0 ? byLevel.filter((q) => categories.includes(q.category)) : byLevel
  return filtered.length > 0 ? filtered : all
}

export function poolSize(options: DealOptions, extra: ExtraQuestion[]): number {
  return poolFor(options, extra).length
}

/**
 * A seed-determined deck for room games, with option order shuffled by the same stream. Same seed, options
 * and questions give the same deck on every device. Small pools are reshuffled back to back so a round can't
 * run out of questions. Returns an empty deck when there are no questions.
 */
export function dealSeeded(
  seed: number,
  options: DealOptions = { difficulty: 'mixed', categories: [] },
  extra: ExtraQuestion[] = [],
): Question[] {
  const pool = poolFor(options, extra)
  if (pool.length === 0) return []
  const rand = mulberry32(seed)
  const deck: Question[] = []
  while (deck.length < MIN_DECK_LENGTH) {
    const pass = shuffle(pool, rand).map((q) => toQuestion(q, rand))
    // avoid the same question twice in a row where one pass ends and the next begins
    if (deck.length > 0 && pass.length > 1 && pass[0].text === deck[deck.length - 1].text) {
      ;[pass[0], pass[pass.length - 1]] = [pass[pass.length - 1], pass[0]]
    }
    deck.push(...pass)
  }
  return deck
}

/** Every question of the filtered pool exactly once, in a seed-determined order (for full-set rounds). */
export function dealOnce(seed: number, options: DealOptions, extra: ExtraQuestion[]): Question[] {
  const pool = poolFor(options, extra)
  const rand = mulberry32(seed)
  const ordered = [...pool].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return shuffle(ordered, rand).map((q) => toQuestion(q, rand))
}

/**
 * The daily set: every question of that day's batch exactly once, in an order and with option positions
 * fixed by the day itself, so everyone who plays that day gets the identical run.
 */
export function dealDaily(day: string, extra: ExtraQuestion[]): Question[] {
  const rand = mulberry32(hashString(day))
  const ordered = [...playable(extra)].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return shuffle(ordered, rand).map((q) => toQuestion(q, rand))
}
