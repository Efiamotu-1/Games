import { useEffect, useState } from 'react'

interface RaceCountdownProps {
  startedAt: number
  label?: string
  onDone?: () => void
}

/**
 * Shows a synced countdown to `startedAt` (a shared server timestamp, so
 * every player sees the same number regardless of their own clock drift).
 */
export default function RaceCountdown({ startedAt, label, onDone }: RaceCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((startedAt - Date.now()) / 1000)))

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((startedAt - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (Date.now() >= startedAt) {
        clearInterval(interval)
        onDone?.()
      }
    }, 100)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-4">
      {label && <p className="text-sm text-neutral-500 uppercase tracking-widest">{label}</p>}
      <p key={secondsLeft} className="text-7xl font-bold text-violet-300 animate-pop-in">
        {secondsLeft > 0 ? secondsLeft : 'Go!'}
      </p>
      <p className="text-sm text-neutral-500">Get ready to type…</p>
    </div>
  )
}

export function isCountingDown(startedAt: number | null): boolean {
  return startedAt !== null && Date.now() < startedAt
}
