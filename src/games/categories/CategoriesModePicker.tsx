import type { ModePickerProps } from '../registry'
import { ROUND_COUNT_OPTIONS, toCategoriesMode } from './types'

export default function CategoriesModePicker({ mode, onChange, disabled }: ModePickerProps) {
  const current = toCategoriesMode(mode)

  function setTotalRounds(totalRounds: number) {
    if (disabled) return
    onChange({ ...current, totalRounds })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-400 leading-relaxed">
        Each round shows a category and a letter. Everyone has 30 seconds to type a real word in that category starting
        with that letter. Get it right and be the only one with that answer to score a point.
      </p>
      <p className="text-xs text-neutral-500">Rounds</p>
      <div className="grid grid-cols-4 gap-2">
        {ROUND_COUNT_OPTIONS.map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => setTotalRounds(count)}
            disabled={disabled}
            className={`py-2.5 rounded-xl border text-sm font-medium transition-all disabled:cursor-not-allowed ${
              current.totalRounds === count
                ? 'border-violet-400 bg-violet-500/15 text-violet-200'
                : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
            } ${disabled ? 'opacity-60' : ''}`}
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  )
}
