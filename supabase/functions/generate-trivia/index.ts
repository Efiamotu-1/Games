// Supabase Edge Function: generates one day's trivia with Gemini and stores it in generated_questions.
//
// Secrets it needs (supabase secrets set ...):
//   GEMINI_API_KEY      a key from aistudio.google.com/api-keys
//   GEMINI_MODEL        optional; defaults to gemini-2.5-flash
//   CRON_SECRET         any long random string; callers must send it in the x-cron-secret header
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided to Edge Functions automatically.
//
// Deploy:  supabase functions deploy generate-trivia --no-verify-jwt
// Run now: curl -X POST "$SUPABASE_URL/functions/v1/generate-trivia" -H "x-cron-secret: $CRON_SECRET"
// Options (JSON body): { "day": "2026-11-18", "force": true }

import { createClient } from 'npm:@supabase/supabase-js@2'

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
const CATEGORIES = [
  'Science',
  'History',
  'Geography',
  'Mathematics',
  'Technology',
  'Sports',
  'Pop Culture',
  'Literature',
]
// The trivia day starts at midnight in this time zone (Lagos has no daylight saving).
const TIME_ZONE = 'Africa/Lagos'
const dateIn = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date) // YYYY-MM-DD
const PER_LEVEL = 10 // questions per category per difficulty, so 160 a day

interface Generated {
  difficulty: 'normal' | 'expert'
  text: string
  answer: string
  wrong: string[]
}

const questionSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          difficulty: { type: 'string', enum: ['normal', 'expert'] },
          text: { type: 'string' },
          answer: { type: 'string' },
          wrong: { type: 'array', items: { type: 'string' } },
        },
        required: ['difficulty', 'text', 'answer', 'wrong'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
}

const verifySchema = {
  type: 'object',
  properties: { certain: { type: 'array', items: { type: 'integer' } } },
  required: ['certain'],
  additionalProperties: false,
}

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

/** Gemini's schema dialect is a subset of JSON Schema, so drop keywords it may reject. */
function simplify(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(simplify)
  if (schema && typeof schema === 'object') {
    return Object.fromEntries(
      Object.entries(schema)
        .filter(([k]) => k !== 'additionalProperties')
        .map(([k, v]) => [k, simplify(v)]),
    )
  }
  return schema
}

async function askJson<T>(prompt: string, schema: object): Promise<T> {
  const request = () =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY') ?? '' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: simplify(schema),
          maxOutputTokens: 16000,
        },
      }),
    })
  // Gemini is sometimes briefly overloaded (503) or rate limited (429): retry with growing waits.
  let res = await request()
  for (let attempt = 1; attempt <= 5 && (res.status === 503 || res.status === 429 || res.status === 500); attempt++) {
    await new Promise((r) => setTimeout(r, attempt * 4000))
    res = await request()
  }
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const candidate = data.candidates?.[0]
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
    throw new Error(`Model stopped early: ${candidate.finishReason}`)
  }
  const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('')
  if (!text) throw new Error('No text in response')
  return JSON.parse(text) as T
}

function isValid(q: Generated): boolean {
  const options = [q.answer, ...q.wrong]
  return (
    (q.difficulty === 'normal' || q.difficulty === 'expert') &&
    q.text.length > 8 &&
    q.text.length <= 220 &&
    q.wrong.length === 3 &&
    options.every((o) => o.trim().length > 0 && o.length <= 70) &&
    new Set(options.map((o) => o.trim().toLowerCase())).size === 4
  )
}

async function generateCategory(category: string, day: string, avoid: string[]): Promise<Generated[]> {
  const { questions } = await askJson<{ questions: Generated[] }>(
    `Write fresh trivia questions for a fast party game. Category: ${category}. Quiz date: ${day}.

Write exactly ${PER_LEVEL} "normal" questions (most adults could get about half right) and ${PER_LEVEL} "expert" questions (hard, for enthusiasts).
Every question has one correct answer and exactly 3 plausible but clearly wrong answers.

Rules:
- Only include facts you are completely certain about. The answer must be unambiguous and not change over time (no "current" records, office-holders or prices).
- Each question must be readable in a couple of seconds: one short sentence, no multi-part questions.
- Answers and wrong options are short (a few words at most), of the same type as the answer, and never "all of the above" or "none of the above".
- Cover a wide spread of subtopics. Don't ask the most famous textbook question for the category.
${avoid.length > 0 ? `- Do not repeat or rephrase any of these recent questions:\n${avoid.map((t) => `  * ${t}`).join('\n')}` : ''}`,
    questionSchema,
  )
  return questions.filter(isValid)
}

/** A second, independent pass that keeps only questions the model is certain about. */
async function verify(category: string, questions: Generated[]): Promise<Generated[]> {
  const { certain } = await askJson<{ certain: number[] }>(
    `You are fact-checking ${category} trivia questions. For each, decide whether the marked answer is definitely correct, none of the wrong options could also be considered correct, and the question has one clear answer that does not change over time.

Return the indexes (0-based) of ONLY the questions that pass. If you have any doubt about one, leave it out.

${questions
  .map((q, i) => `${i}. ${q.text}\n   Answer: ${q.answer}\n   Wrong: ${q.wrong.join(' | ')}`)
  .join('\n')}`,
    verifySchema,
  )
  const keep = new Set(certain)
  return questions.filter((_, i) => keep.has(i))
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  // Default: the date it will be in 3 hours. The nightly job runs at 22:00, so it prepares tomorrow's set, and a
  // manual run in the daytime prepares today's.
  const day: string = typeof body.day === 'string' ? body.day : dateIn(new Date(Date.now() + 3 * 60 * 60 * 1000))
  const force = body.force === true

  // One category per call keeps each run inside Supabase's time and memory limits.
  const wanted: string[] = typeof body.category === 'string' ? [body.category] : CATEGORIES
  const categories = CATEGORIES.filter((c) => wanted.includes(c))
  if (categories.length === 0) return Response.json({ error: 'Unknown category', allowed: CATEGORIES }, { status: 400 })

  if (!force) {
    const { count } = await supabase
      .from('generated_questions')
      .select('id', { count: 'exact', head: true })
      .eq('day', day)
      .in('category', categories)
    if ((count ?? 0) > 0) return Response.json({ day, categories, skipped: 'already generated', existing: count })
  }

  const { data: recent } = await supabase
    .from('generated_questions')
    .select('category, text')
    .order('day', { ascending: false })
    .limit(400)

  const results = await Promise.allSettled(
    categories.map(async (category) => {
      const avoid = (recent ?? []).filter((r) => r.category === category).map((r) => r.text as string)
      const drafted = await generateCategory(category, day, avoid.slice(0, 40))
      const checked = await verify(category, drafted)
      const rows = checked.map((q) => ({
        day,
        category,
        difficulty: q.difficulty,
        text: q.text.trim(),
        answer: q.answer.trim(),
        wrong: q.wrong.map((w) => w.trim()),
      }))
      if (rows.length > 0) {
        const { error } = await supabase.from('generated_questions').upsert(rows, { onConflict: 'day,text', ignoreDuplicates: true })
        if (error) throw error
      }
      return { category, drafted: drafted.length, saved: rows.length }
    }),
  )

  const summary = results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { category: categories[i], error: String(r.reason) },
  )
  return Response.json({ day, model: MODEL, summary })
})
