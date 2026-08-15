import { useEffect, useState } from 'react'
import { supabase } from '../../shared/supabase'
import type { CategoriesSubmission } from './types'

interface SubmissionRow {
  player_id: string
  round_number: number
  answer: string
  is_valid: boolean
  is_unique: boolean
  score: number
  scored: boolean
  submitted: boolean
  submitted_at: string | null
}

function fromRow(row: SubmissionRow): CategoriesSubmission {
  return {
    playerId: row.player_id,
    roundNumber: row.round_number,
    answer: row.answer,
    isValid: row.is_valid,
    isUnique: row.is_unique,
    score: row.score,
    scored: row.scored,
    submitted: row.submitted,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).getTime() : null,
  }
}

export function useCategoriesSubmissions(roomCode: string | null): CategoriesSubmission[] {
  const [submissions, setSubmissions] = useState<CategoriesSubmission[]>([])

  useEffect(() => {
    if (!roomCode) {
      setSubmissions([])
      return
    }

    const code = roomCode
    let cancelled = false

    function refresh() {
      supabase
        .from('categories_submissions')
        .select('*')
        .eq('room_code', code)
        .then(({ data }) => {
          if (!cancelled && data) setSubmissions((data as SubmissionRow[]).map(fromRow))
        })
    }

    refresh()

    const channel = supabase
      .channel(`categories:${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories_submissions', filter: `room_code=eq.${code}` },
        refresh,
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [roomCode])

  return submissions
}
