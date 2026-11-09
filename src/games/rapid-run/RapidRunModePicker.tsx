import type { ModePickerProps } from '../registry'
import { CATEGORIES, poolSize } from './questions'
import {
  DIFFICULTIES,
  ROUND_COUNT_OPTIONS,
  ROUND_SECONDS_OPTIONS,
  STRIKE_LIMIT,
  toRapidMode,
  type RapidFormat,
  type RapidMode,
} from './types'

const FORMATS: { id: RapidFormat; label: string; description: string }[] = [
  {
    id: 'classic',
    label: 'Classic',
    description:
      'Everyone answers the same questions at once. When time runs out, scores are ranked. Play several rounds and your totals add up.',
  },
  {
    id: 'elimination',
    label: 'Elimination',
    description:
      "Everyone answers the same questions at once. When the clock runs out, whoever scored lowest is eliminated and the rest go again, until one player is left. Chain correct answers to multiply your points, and watch the live board to see if you're in the danger zone.",
  },
]

export default function RapidRunModePicker({ mode, onChange, disabled }: ModePickerProps) {
  const current = toRapidMode(mode)

  function update(patch: Partial<RapidMode>) {
    if (disabled) return
    onChange({ ...current, ...patch })
  }

  function toggleCategory(category: string) {
    const selected = current.categories.length === 0 ? [...CATEGORIES] : current.categories
    const next = selected.includes(category) ? selected.filter((c) => c !== category) : [...selected, category]
    if (next.length === 0) return
    update({ categories: next.length === CATEGORIES.length ? [] : next })
  }

  const allCategories = current.categories.length === 0
  const questionCount = poolSize({ difficulty: current.difficulty, categories: current.categories })
  const format = FORMATS.find((f) => f.id === current.format) ?? FORMATS[0]

  return (
    <div className="space-y-5">
      <Section label="Format">
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map((f) => (
            <Choice key={f.id} active={current.format === f.id} disabled={disabled} onClick={() => update({ format: f.id })}>
              {f.label}
            </Choice>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-neutral-500">{format.description}</p>
      </Section>

      <div className={`grid gap-5 ${current.format === 'classic' ? 'sm:grid-cols-2' : ''}`}>
        <Section label="Seconds per round">
          <div className="grid grid-cols-4 gap-2">
            {ROUND_SECONDS_OPTIONS.map((seconds) => (
              <Choice key={seconds} active={current.roundSeconds === seconds} disabled={disabled} onClick={() => update({ roundSeconds: seconds })}>
                {seconds}s
              </Choice>
            ))}
          </div>
        </Section>

        {current.format === 'classic' && (
          <Section label="Rounds">
            <div className="grid grid-cols-3 gap-2">
              {ROUND_COUNT_OPTIONS.map((rounds) => (
                <Choice key={rounds} active={current.rounds === rounds} disabled={disabled} onClick={() => update({ rounds })}>
                  {rounds}
                </Choice>
              ))}
            </div>
          </Section>
        )}
      </div>

      <Section label="Difficulty">
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => (
            <Choice key={d.id} active={current.difficulty === d.id} disabled={disabled} onClick={() => update({ difficulty: d.id })}>
              {d.label}
            </Choice>
          ))}
        </div>
        <p className="text-xs text-neutral-500">Normal pays 100 a hit, Expert pays 250. Mixed has both.</p>
      </Section>

      <Section label="Categories">
        <div className="flex flex-wrap gap-2">
          <Chip active={allCategories} disabled={disabled} onClick={() => update({ categories: [] })}>
            All
          </Chip>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              active={!allCategories && current.categories.includes(category)}
              disabled={disabled}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </Chip>
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          {questionCount} questions in the pool{questionCount < 30 ? '. Small pools repeat, so mix in more categories.' : '.'}
        </p>
      </Section>

      <Section label="Twists">
        <button
          type="button"
          disabled={disabled}
          onClick={() => update({ threeStrikes: !current.threeStrikes })}
          className={`w-full rounded-xl border px-4 py-3 text-left transition-all disabled:cursor-not-allowed ${
            current.threeStrikes
              ? 'border-rose-400 bg-rose-500/10 text-rose-100'
              : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
          } ${disabled ? 'opacity-60' : ''}`}
        >
          <span className="block text-sm font-medium">Three Strikes {current.threeStrikes ? '· on' : ''}</span>
          <span className="text-xs opacity-70">
            {STRIKE_LIMIT} wrong answers and your round is over. No button mashing.
          </span>
        </button>
      </Section>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-500">{label}</p>
      {children}
    </div>
  )
}

function Choice({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`py-2.5 rounded-xl border text-sm font-medium transition-all disabled:cursor-not-allowed ${
        active
          ? 'border-violet-400 bg-violet-500/15 text-violet-200'
          : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {children}
    </button>
  )
}

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed ${
        active
          ? 'border-violet-400 bg-violet-500/15 text-violet-200'
          : 'border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-200'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {children}
    </button>
  )
}
