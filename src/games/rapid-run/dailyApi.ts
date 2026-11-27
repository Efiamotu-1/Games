import { supabase } from '../../shared/supabase'
import type { Question } from './questions'
import type { RunResult } from './RunPlayer'

const DEVICE_KEY = 'party-arcade-device'
const NICKNAME_KEY = 'party-arcade-nickname'

let memoryId: string | null = null

/** A random id kept in this browser, so the same device can't take a day's scored attempt twice. */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY)
    if (existing) return existing
    const id = `d_${crypto.randomUUID()}`
    localStorage.setItem(DEVICE_KEY, id)
    return id
  } catch {
    memoryId ??= `d_${crypto.randomUUID()}`
    return memoryId
  }
}

export function loadNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveNickname(name: string): void {
  try {
    localStorage.setItem(NICKNAME_KEY, name)
  } catch {
    // storage unavailable; the name just won't be remembered
  }
}

export interface DailyEntry {
  nickname: string
  score: number
  answered: number
  seconds: number
}

export async function fetchLeaderboard(day: string, limit = 10): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('daily_scores')
    .select('nickname, score, answered, seconds')
    .eq('day', day)
    .order('score', { ascending: false })
    .order('seconds', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as DailyEntry[]
}

export async function fetchMyEntry(day: string, playerId: string): Promise<DailyEntry | null> {
  const { data, error } = await supabase
    .from('daily_scores')
    .select('nickname, score, answered, seconds')
    .eq('day', day)
    .eq('player_id', playerId)
    .maybeSingle()
  if (error) throw error
  return (data as DailyEntry | null) ?? null
}

/** 1 + the number of players ahead that day: a higher score, or the same score in less time. */
export async function fetchRank(day: string, score: number, seconds: number): Promise<number> {
  const { count, error } = await supabase
    .from('daily_scores')
    .select('player_id', { count: 'exact', head: true })
    .eq('day', day)
    .or(`score.gt.${score},and(score.eq.${score},seconds.lt.${seconds})`)
  if (error) throw error
  return (count ?? 0) + 1
}

/** Sends what the player picked for each question; the server works out the score. */
export async function submitDailyScore(params: {
  day: string
  playerId: string
  nickname: string
  deck: Question[]
  run: RunResult
  /** The time limit the player chose, in seconds. */
  limitSeconds: number
}): Promise<{ accepted: boolean; score: number; answered: number; seconds: number }> {
  const answers = params.run.picks.map((pick, i) => ({
    id: params.deck[i].id,
    picked: params.deck[i].options[pick],
  }))
  const { data, error } = await supabase.rpc('submit_daily_score', {
    p_day: params.day,
    p_player_id: params.playerId,
    p_nickname: params.nickname,
    p_answers: answers,
    p_seconds: params.run.seconds,
    p_limit_seconds: params.limitSeconds,
  })
  if (error) throw error
  return data as { accepted: boolean; score: number; answered: number; seconds: number }
}
