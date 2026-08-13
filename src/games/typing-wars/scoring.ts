import type { AttemptResult, TestConfig } from './types'
import { makeAttemptId } from './storage'

export function scoreAttempt(params: {
  target: string
  typed: string
  elapsedSeconds: number
  backspaces: number
  deletes: number
  correctionAttempts: number
  config: TestConfig
}): AttemptResult {
  const { target, typed, elapsedSeconds, backspaces, deletes, correctionAttempts, config } = params

  let correctChars = 0
  let incorrectChars = 0
  const len = Math.min(target.length, typed.length)
  for (let i = 0; i < len; i++) {
    if (typed[i] === target[i]) correctChars++
    else incorrectChars++
  }
  const missingChars = Math.max(0, target.length - typed.length)
  const extraChars = Math.max(0, typed.length - target.length)

  const targetWords = target.trim().split(/\s+/)
  const typedWords = typed.trim().split(/\s+/).filter((w) => w.length > 0)
  let correctWords = 0
  const wordCount = Math.min(targetWords.length, typedWords.length)
  for (let i = 0; i < wordCount; i++) {
    if (typedWords[i] === targetWords[i]) correctWords++
  }
  const incorrectWords = typedWords.length - correctWords

  const minutes = Math.max(elapsedSeconds / 60, 1 / 60)
  const rawWpm = Math.round(typed.length / 5 / minutes)
  const wpm = Math.round(correctChars / 5 / minutes)

  const accuracyChar = typed.length > 0 ? Math.round((correctChars / typed.length) * 1000) / 10 : 0
  const accuracyWord = typedWords.length > 0 ? Math.round((correctWords / typedWords.length) * 1000) / 10 : 0

  return {
    id: makeAttemptId(),
    timestamp: Date.now(),
    wpm,
    rawWpm,
    accuracyChar,
    accuracyWord,
    correctWords,
    incorrectWords,
    correctChars,
    incorrectChars,
    missingChars,
    extraChars,
    durationSeconds: Math.round(elapsedSeconds * 10) / 10,
    backspaces,
    deletes,
    correctionAttempts,
    config,
    text: target,
  }
}

export function modeLabel(config: TestConfig): string {
  if (config.blind && config.noBackspace) return 'Blind + No Backspace'
  if (config.blind) return 'Blind'
  if (config.noBackspace) return 'No Backspace'
  return 'Standard'
}

/**
 * Composite race score: WPM weighted by accuracy, so a fast-but-sloppy
 * finish doesn't automatically beat a slightly slower, cleaner one.
 * accuracyChar is 0-100; this scales it to a 0-1 multiplier.
 */
export function raceScore(wpm: number, accuracyChar: number): number {
  return wpm * (accuracyChar / 100)
}
