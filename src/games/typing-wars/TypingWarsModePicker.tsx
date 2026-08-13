import type { ModePickerProps } from '../registry'
import type { RaceMode } from './types'
import { MAX_ROUND_SECONDS, MIN_ROUND_SECONDS, toRaceMode } from './types'

export default function TypingWarsModePicker({ mode, onChange, disabled }: ModePickerProps) {
  const current: RaceMode = toRaceMode(mode)

  function toggle(key: 'noBackspace' | 'blind' | 'noPeek' | 'suddenDeath' | 'eliminationRounds') {
    if (disabled) return
    onChange({ ...current, [key]: !current[key] })
  }

  function setRoundSeconds(seconds: number) {
    if (disabled) return
    const clamped = Math.min(MAX_ROUND_SECONDS, Math.max(MIN_ROUND_SECONDS, seconds))
    onChange({ ...current, roundSeconds: clamped })
  }

  const minutes = Math.floor(current.roundSeconds / 60)
  const seconds = current.roundSeconds % 60

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <ModeToggle
          label="No Backspace"
          checked={current.noBackspace}
          disabled={disabled}
          onClick={() => toggle('noBackspace')}
        />
        <ModeToggle label="Blind" checked={current.blind} disabled={disabled} onClick={() => toggle('blind')} />
        <ModeToggle label="No Peek" checked={current.noPeek} disabled={disabled} onClick={() => toggle('noPeek')} />
        <ModeToggle
          label="Sudden Death"
          checked={current.suddenDeath}
          disabled={disabled}
          onClick={() => toggle('suddenDeath')}
        />
        <ModeToggle
          label="Elimination Rounds"
          checked={current.eliminationRounds}
          disabled={disabled}
          onClick={() => toggle('eliminationRounds')}
        />
      </div>
      <p className="text-xs text-neutral-500">
        {current.blind && 'Blind: type without looking at your keyboard (passage stays visible). '}
        {current.noPeek && 'No Peek: passage is hidden — hold the button to reveal it while typing.'}
      </p>

      {current.eliminationRounds && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 space-y-2">
          <p className="text-xs text-neutral-400">
            Last place is eliminated each round until one winner remains. Set the time limit per round:
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="number"
                min={0}
                max={Math.floor(MAX_ROUND_SECONDS / 60)}
                value={minutes}
                disabled={disabled}
                onChange={(e) => setRoundSeconds(Number(e.target.value || 0) * 60 + seconds)}
                className="w-16 rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-center outline-none focus:border-violet-400 disabled:opacity-60"
              />
              <span className="text-neutral-500">min</span>
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="number"
                min={0}
                max={59}
                value={seconds}
                disabled={disabled}
                onChange={(e) => setRoundSeconds(minutes * 60 + Number(e.target.value || 0))}
                className="w-16 rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-center outline-none focus:border-violet-400 disabled:opacity-60"
              />
              <span className="text-neutral-500">sec</span>
            </label>
            <span className="text-xs text-neutral-600 ml-auto">
              {MIN_ROUND_SECONDS}s–{Math.floor(MAX_ROUND_SECONDS / 60)}min
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function ModeToggle({
  label,
  checked,
  disabled,
  onClick,
}: {
  label: string
  checked: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`py-2.5 px-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        checked
          ? 'border-violet-400 bg-violet-500/15 text-violet-200'
          : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
      }`}
    >
      {label}
    </button>
  )
}
