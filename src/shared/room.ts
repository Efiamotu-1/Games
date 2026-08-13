const PLAYER_COLORS = ['#a78bfa', '#f472b6', '#60a5fa', '#4ade80', '#fbbf24', '#fb923c', '#f87171', '#38bdf8']

export function makeRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export function makePlayerId(): string {
  return `p_${Math.random().toString(36).slice(2, 10)}`
}

export function colorForIndex(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}
