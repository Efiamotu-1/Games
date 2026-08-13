import type { AttemptResult } from './types'

const KEY = 'typing-tracker-attempts'

export function loadAttempts(): AttemptResult[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as AttemptResult[]
  } catch {
    return []
  }
}

export function saveAttempt(attempt: AttemptResult): AttemptResult[] {
  const attempts = loadAttempts()
  attempts.unshift(attempt)
  localStorage.setItem(KEY, JSON.stringify(attempts))
  return attempts
}

export function clearAttempts(): void {
  localStorage.removeItem(KEY)
}

export function makeAttemptId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `TYP-${s}`
}
