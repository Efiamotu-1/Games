import type { ComponentType } from 'react'
import TypingWarsGame from './typing-wars/TypingWarsGame'
import MultiplayerRace from './typing-wars/MultiplayerRace'
import TypingWarsModePicker from './typing-wars/TypingWarsModePicker'
import { getRandomPassage } from './typing-wars/passages'
import { DEFAULT_RACE_MODE } from './typing-wars/types'
import MultiplayerCategories from './categories/MultiplayerCategories'
import CategoriesModePicker from './categories/CategoriesModePicker'
import { getRandomPrompt, type CategoryPrompt } from './categories/wordBank'
import { startCategoriesRound } from './categories/categoriesApi'
import { DEFAULT_CATEGORIES_MODE } from './categories/types'
import RapidRunGame from './rapid-run/RapidRunGame'
import MultiplayerRapidRun from './rapid-run/MultiplayerRapidRun'
import RapidRunModePicker from './rapid-run/RapidRunModePicker'
import { startRapidRun } from './rapid-run/rapidApi'
import { DEFAULT_RAPID_MODE, newRapidPayload, type RapidPayload } from './rapid-run/types'
import MultiplayerTruthOrDare from './truth-or-dare/MultiplayerTruthOrDare'
import TruthOrDareModePicker from './truth-or-dare/TruthOrDareModePicker'
import { startTruthOrDare } from './truth-or-dare/todApi'
import { DEFAULT_TOD_MODE, newTodPayload, type TodPayload } from './truth-or-dare/types'
import { startRace } from '../shared/roomApi'
import type { Room } from '../shared/types'

/**
 * Turn this on to make Truth or Dare appear in the arcade. While false it is hidden from the home
 * screen and its URLs send people back home.
 */
const ENABLE_TRUTH_OR_DARE = false

export interface MultiplayerGameProps {
  room: Room
  selfId: string
  onExit: () => void
}

export interface ModePickerProps {
  mode: Record<string, unknown>
  onChange: (mode: Record<string, unknown>) => void
  disabled: boolean
}

export interface GameDefinition {
  id: string
  name: string
  tagline: string
  minPlayers: number
  maxPlayers: number
  available: boolean
  /** Hidden games are not listed and cannot be opened by URL. */
  hidden?: boolean
  supportsSolo: boolean
  /** Text for the solo button on the home screen. Defaults to "Practice Solo". */
  soloLabel?: string
  soloComponent: ComponentType<{ onExit: () => void }> | null
  multiplayerComponent: ComponentType<MultiplayerGameProps> | null
  /** Returns the payload (passage text, prompt object, etc.) to seed a fresh multiplayer round. */
  getStartPayload: (() => unknown) | null
  /** Starts the room using this game's payload shape (e.g. race passage vs. category prompt). */
  startGame: ((roomCode: string, payload: unknown) => Promise<void>) | null
  /** Default mode config for a freshly created room. */
  defaultMode: Record<string, unknown>
  /** Host-only UI for picking mode settings in the lobby. */
  modePickerComponent: ComponentType<ModePickerProps> | null
}

export const GAMES: GameDefinition[] = [
  {
    id: 'typing-wars',
    name: 'Typing Wars',
    tagline: 'Race to type the same passage first.',
    minPlayers: 1,
    maxPlayers: 8,
    available: true,
    supportsSolo: true,
    soloComponent: TypingWarsGame,
    multiplayerComponent: MultiplayerRace,
    getStartPayload: getRandomPassage,
    startGame: (code, payload) => startRace(code, payload as string),
    defaultMode: { ...DEFAULT_RACE_MODE },
    modePickerComponent: TypingWarsModePicker,
  },
  {
    id: 'word-blitz',
    name: 'Word Blitz',
    tagline: 'Make words from random letters before time runs out.',
    minPlayers: 2,
    maxPlayers: 12,
    available: false,
    supportsSolo: false,
    soloComponent: null,
    multiplayerComponent: null,
    getStartPayload: null,
    startGame: null,
    defaultMode: {},
    modePickerComponent: null,
  },
  {
    id: 'categories',
    name: 'Categories',
    tagline: "You get a topic and a letter (like Animals + S). Type a word that fits before time's up!",
    minPlayers: 2,
    maxPlayers: 12,
    available: true,
    supportsSolo: false,
    soloComponent: null,
    multiplayerComponent: MultiplayerCategories,
    getStartPayload: getRandomPrompt,
    startGame: (code, payload) => startCategoriesRound(code, payload as CategoryPrompt),
    defaultMode: { ...DEFAULT_CATEGORIES_MODE },
    modePickerComponent: CategoriesModePicker,
  },
  {
    id: 'rapid-run',
    name: 'Rapid-Run Trivia',
    tagline: "Play today's daily trivia and climb the leaderboard, or race your friends on the same questions.",
    minPlayers: 2,
    maxPlayers: 12,
    available: true,
    supportsSolo: true,
    soloLabel: 'Play Daily Trivia',
    soloComponent: RapidRunGame,
    multiplayerComponent: MultiplayerRapidRun,
    getStartPayload: newRapidPayload,
    startGame: (code, payload) => startRapidRun(code, payload as RapidPayload),
    defaultMode: { ...DEFAULT_RAPID_MODE },
    modePickerComponent: RapidRunModePicker,
  },
  {
    id: 'truth-or-dare',
    name: 'Truth or Dare',
    tagline: 'Take turns picking truth or dare. Answer honestly or do the dare.',
    minPlayers: 2,
    maxPlayers: 12,
    available: true,
    hidden: !ENABLE_TRUTH_OR_DARE,
    supportsSolo: false,
    soloComponent: null,
    multiplayerComponent: MultiplayerTruthOrDare,
    getStartPayload: newTodPayload,
    startGame: (code, payload) => startTruthOrDare(code, payload as TodPayload),
    defaultMode: { ...DEFAULT_TOD_MODE },
    modePickerComponent: TruthOrDareModePicker,
  },
  {
    id: 'emoji-pictionary',
    name: 'Emoji Pictionary',
    tagline: 'Guess movies, songs, and places from emojis.',
    minPlayers: 2,
    maxPlayers: 12,
    available: false,
    supportsSolo: false,
    soloComponent: null,
    multiplayerComponent: null,
    getStartPayload: null,
    startGame: null,
    defaultMode: {},
    modePickerComponent: null,
  },
  {
    id: 'quick-draw',
    name: 'Quick Draw',
    tagline: 'See a prompt, draw it, everyone guesses.',
    minPlayers: 2,
    maxPlayers: 10,
    available: false,
    supportsSolo: false,
    soloComponent: null,
    multiplayerComponent: null,
    getStartPayload: null,
    startGame: null,
    defaultMode: {},
    modePickerComponent: null,
  },
  {
    id: 'reaction-race',
    name: 'Reaction Race',
    tagline: 'React as quickly as possible when the signal appears.',
    minPlayers: 2,
    maxPlayers: 12,
    available: false,
    supportsSolo: false,
    soloComponent: null,
    multiplayerComponent: null,
    getStartPayload: null,
    startGame: null,
    defaultMode: {},
    modePickerComponent: null,
  },
  {
    id: 'memory-battle',
    name: 'Memory Battle',
    tagline: 'Memorize increasingly difficult sequences.',
    minPlayers: 2,
    maxPlayers: 8,
    available: false,
    supportsSolo: false,
    soloComponent: null,
    multiplayerComponent: null,
    getStartPayload: null,
    startGame: null,
    defaultMode: {},
    modePickerComponent: null,
  },
  {
    id: 'imposter',
    name: 'Imposter',
    tagline: 'Everyone gets a secret word except one player.',
    minPlayers: 4,
    maxPlayers: 12,
    available: false,
    supportsSolo: false,
    soloComponent: null,
    multiplayerComponent: null,
    getStartPayload: null,
    startGame: null,
    defaultMode: {},
    modePickerComponent: null,
  },
  {
    id: 'number-duel',
    name: 'Number Duel',
    tagline: 'Solve quick arithmetic challenges.',
    minPlayers: 2,
    maxPlayers: 8,
    available: false,
    supportsSolo: false,
    soloComponent: null,
    multiplayerComponent: null,
    getStartPayload: null,
    startGame: null,
    defaultMode: {},
    modePickerComponent: null,
  },
  {
    id: 'liars-challenge',
    name: "Liar's Challenge",
    tagline: "Players make claims; everyone decides who's lying.",
    minPlayers: 3,
    maxPlayers: 12,
    available: false,
    supportsSolo: false,
    soloComponent: null,
    multiplayerComponent: null,
    getStartPayload: null,
    startGame: null,
    defaultMode: {},
    modePickerComponent: null,
  },
]
