import { useState } from 'react'

interface PeekablePassageProps {
  target: string
  typed: string
}

/**
 * Renders the passage hidden behind a blur, revealed only while the
 * player is actively pressing/holding a "peek" control. Uses pointer
 * events (not CSS :hover) so it works identically on touch and mouse.
 */
export default function PeekablePassage({ target, typed }: PeekablePassageProps) {
  const [peeking, setPeeking] = useState(false)

  return (
    <div className="space-y-2">
      <div
        className={`relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6 text-base sm:text-xl leading-relaxed font-mono-test select-none transition-[filter] duration-150 ${
          peeking ? '' : 'blur-md'
        }`}
      >
        {target.split('').map((char, i) => {
          let cls = 'text-neutral-500'
          if (i < typed.length) {
            cls = typed[i] === char ? 'text-emerald-400' : 'text-rose-400 bg-rose-500/15 rounded'
          } else if (i === typed.length) {
            cls = 'text-neutral-200 border-b-2 border-violet-400 caret'
          }
          return (
            <span key={i} className={cls}>
              {char}
            </span>
          )
        })}
      </div>
      <button
        type="button"
        onPointerDown={() => setPeeking(true)}
        onPointerUp={() => setPeeking(false)}
        onPointerLeave={() => setPeeking(false)}
        onPointerCancel={() => setPeeking(false)}
        className="w-full py-2 rounded-xl border border-neutral-700 text-xs font-medium text-neutral-400 active:border-violet-400 active:text-violet-300 active:bg-violet-500/10 transition-colors select-none touch-none"
      >
        👁 Hold to peek
      </button>
    </div>
  )
}
