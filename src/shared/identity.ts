import { makePlayerId } from './room'

const KEY_PREFIX = 'party-arcade-player:'

/**
 * A player's identity within a specific room must survive back/forward
 * navigation and page refresh (so they resume as the same participant),
 * but should not leak across different rooms — scoped to sessionStorage
 * keyed by room code.
 */
export function getOrCreatePlayerId(roomCode: string): string {
  const key = `${KEY_PREFIX}${roomCode}`
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const id = makePlayerId()
  sessionStorage.setItem(key, id)
  return id
}

export function savePlayerId(roomCode: string, playerId: string): void {
  sessionStorage.setItem(`${KEY_PREFIX}${roomCode}`, playerId)
}

export function clearPlayerId(roomCode: string): void {
  sessionStorage.removeItem(`${KEY_PREFIX}${roomCode}`)
}

export function newPlayerId(): string {
  return makePlayerId()
}
