export function rankFor(correct: number): string {
  if (correct >= 35) return 'Arcade legend'
  if (correct >= 20) return 'Speed demon'
  if (correct >= 10) return 'Quick fingers'
  return 'Warming up'
}

