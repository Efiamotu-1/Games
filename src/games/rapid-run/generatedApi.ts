import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../shared/supabase'
import { CATEGORIES, type ExtraQuestion } from './questions'
import type { BatchRef } from './types'

interface Row {
  id: string
  category: string
  difficulty: 'normal' | 'expert'
  text: string
  answer: string
  wrong: string[]
  created_at: string
}

function toExtra(r: Row): ExtraQuestion {
  return { id: r.id, category: r.category, level: r.difficulty, text: r.text, answer: r.answer, wrong: r.wrong }
}

/** A day's batch is written category by category overnight, so it only counts once it is complete. */
const SETTLE_MS = 45 * 60 * 1000

/** The newest day whose batch is complete (every category present, or no new rows for a while). */
async function fetchReadyDay(): Promise<string | null> {
  const { data, error } = await supabase
    .from('generated_questions')
    .select('day, category, created_at')
    .order('day', { ascending: false })
    .limit(800)
  if (error || !data) return null

  const days = new Map<string, { categories: Set<string>; newest: number }>()
  for (const row of data as { day: string; category: string; created_at: string }[]) {
    const entry = days.get(row.day) ?? { categories: new Set<string>(), newest: 0 }
    entry.categories.add(row.category)
    entry.newest = Math.max(entry.newest, new Date(row.created_at).getTime())
    days.set(row.day, entry)
  }
  for (const [day, entry] of days) {
    const complete = CATEGORIES.every((c) => entry.categories.has(c))
    if (complete || Date.now() - entry.newest >= SETTLE_MS) return day
  }
  return null
}

/** The newest complete day, pinned at its newest row so every player loads exactly the same set. */
export async function fetchLatestBatch(): Promise<BatchRef | null> {
  const day = await fetchReadyDay()
  if (!day) return null

  const { data, error } = await supabase
    .from('generated_questions')
    .select('created_at')
    .eq('day', day)
    .order('created_at', { ascending: false })
  if (error || !data || data.length === 0) return null
  return { day, upTo: data[0].created_at as string, count: data.length }
}

const cache = new Map<string, ExtraQuestion[]>()

/** Loads exactly the questions a batch reference points at, in a fixed order. Returns null on a mismatch. */
export async function fetchBatch(batch: BatchRef): Promise<ExtraQuestion[] | null> {
  const key = `${batch.day}|${batch.upTo}|${batch.count}`
  const hit = cache.get(key)
  if (hit) return hit

  const { data, error } = await supabase
    .from('generated_questions')
    .select('*')
    .eq('day', batch.day)
    .lte('created_at', batch.upTo)
    .order('id', { ascending: true })
  if (error || !data || data.length !== batch.count) return null

  const questions = (data as Row[]).map(toExtra)
  cache.set(key, questions)
  return questions
}

export type BatchState =
  | { status: 'ready'; questions: ExtraQuestion[] }
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }

/** For rooms: waits until this device has exactly the same generated questions as the host pinned. */
export function useBatch(batch: BatchRef | undefined): BatchState {
  const [loaded, setLoaded] = useState<{ key: string; questions: ExtraQuestion[] } | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const key = batch ? `${batch.day}|${batch.upTo}|${batch.count}` : ''

  useEffect(() => {
    if (!batch) return
    const pinned = batch
    let cancelled = false
    ;(async () => {
      for (let i = 0; i < 4 && !cancelled; i++) {
        const questions = await fetchBatch(pinned)
        if (questions) {
          if (!cancelled) setLoaded({ key, questions })
          return
        }
        await new Promise((r) => setTimeout(r, 800))
      }
      if (!cancelled) setFailedKey(`${key}#${attempt}`)
    })()
    return () => {
      cancelled = true
    }
  }, [batch, key, attempt])

  const retry = useCallback(() => {
    setFailedKey(null)
    setAttempt((n) => n + 1)
  }, [])

  if (!batch) return { status: 'ready', questions: [] }
  if (loaded?.key === key) return { status: 'ready', questions: loaded.questions }
  if (failedKey === `${key}#${attempt}`) return { status: 'error', retry }
  return { status: 'loading' }
}

/** The latest complete set, for showing how many questions a lobby setting leaves. Null while loading or if none. */
export function useLatestQuestions(): ExtraQuestion[] | null {
  const [questions, setQuestions] = useState<ExtraQuestion[] | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const batch = await fetchLatestBatch().catch(() => null)
      const loaded = batch ? await fetchBatch(batch).catch(() => null) : null
      if (!cancelled) setQuestions(loaded)
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return questions
}
