import type { ModePickerProps } from '../registry'
import { LEVELS } from './prompts'
import { SKIP_OPTIONS, TURNS_EACH_OPTIONS, toTodMode, type TodMode } from './types'

export default function TruthOrDareModePicker({ mode, onChange, disabled }: ModePickerProps) {
  const current = toTodMode(mode)
  const level = LEVELS.find((l) => l.id === current.level) ?? LEVELS[1]

  function update(patch: Partial<TodMode>) {
    if (!disabled) onChange({ ...current, ...patch })
  }

  return (
    <div className="space-y-5">
      <Section label="Spice level">
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((l) => (
            <Choice key={l.id} active={current.level === l.id} disabled={disabled} onClick={() => update({ level: l.id })}>
              {l.label}
            </Choice>
          ))}
        </div>
        <p className="text-xs text-neutral-500">{level.description}</p>
      </Section>

      <div className="grid gap-5 sm:grid-cols-2">
        <Section label="Turns each">
          <div className="grid grid-cols-4 gap-2">
            {TURNS_EACH_OPTIONS.map((n) => (
              <Choice key={n} active={current.turnsEach === n} disabled={disabled} onClick={() => update({ turnsEach: n })}>
                {n}
              </Choice>
            ))}
          </div>
        </Section>
        <Section label="Passes allowed">
          <div className="grid grid-cols-4 gap-2">
            {SKIP_OPTIONS.map((n) => (
              <Choice key={n} active={current.maxSkips === n} disabled={disabled} onClick={() => update({ maxSkips: n })}>
                {n}
              </Choice>
            ))}
          </div>
        </Section>
      </div>
      <p className="text-xs text-neutral-500">
        Passing on a prompt means doing a forfeit instead. Agree on off-limits topics before you start.
      </p>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
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
      className={`rounded-xl border py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed ${
        active
          ? 'border-violet-400 bg-violet-500/15 text-violet-200'
          : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {children}
    </button>
  )
}
