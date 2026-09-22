// 증언 사건 채점 (docs/spec.md §4-2). 질문마다 정답 카드 집합과 정확히 일치해야 완성.
import type { TestimonyCase } from '../../content/types'

/** questionId -> 붙인 카드 id 목록 */
export type Placement = Record<string, string[]>

export interface QuestionResult {
  id: string
  /** 정답 집합과 정확히 일치 */
  complete: boolean
  /** 붙였지만 정답이 아닌 카드 */
  wrong: string[]
  /** 아직 안 붙인 정답 카드 수 */
  missing: number
}

export function check(c: TestimonyCase, p: Placement): { allDone: boolean; results: QuestionResult[] } {
  const results = c.questions.map((q) => {
    const placed = new Set(p[q.id] ?? [])
    const answer = new Set(q.answerCards)
    const wrong = [...placed].filter((id) => !answer.has(id))
    const missing = [...answer].filter((id) => !placed.has(id)).length
    return { id: q.id, complete: wrong.length === 0 && missing === 0, wrong, missing }
  })
  return { allDone: results.every((r) => r.complete), results }
}

/** 카드를 슬롯에 붙인다. 한 카드는 한 질문에만. 이미 그 슬롯에 있으면 뗀다 */
export function place(p: Placement, questionId: string, cardId: string): Placement {
  const next: Placement = {}
  for (const [q, ids] of Object.entries(p)) next[q] = ids.filter((id) => id !== cardId)
  const cur = next[questionId] ?? []
  const already = (p[questionId] ?? []).includes(cardId)
  next[questionId] = already ? cur : [...cur, cardId]
  return next
}

export function removeWrong(p: Placement, results: QuestionResult[]): Placement {
  const next: Placement = { ...p }
  for (const r of results) if (r.wrong.length) next[r.id] = (next[r.id] ?? []).filter((id) => !r.wrong.includes(id))
  return next
}

export function placedCard(p: Placement, cardId: string): string | null {
  for (const [q, ids] of Object.entries(p)) if (ids.includes(cardId)) return q
  return null
}
