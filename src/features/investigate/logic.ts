// 소문 사건 채점 규칙 (docs/spec.md §4-1 5번). UI 없이 테스트한다.
import type { RumorCase, Verdict } from '../../content/types'
import { evidenceKeys, byAbbr } from '../../content/cases'
import { expandRef, refWithin, verseKeyString } from '../../content/ref'

export const MAX_EVIDENCE = 3

export type Outcome =
  | { kind: 'solved' }
  /** 판정은 맞았지만 표시한 절이 근거가 아님 — 판정 유지, 증거만 다시 */
  | { kind: 'wrong-evidence' }
  /** 판정이 틀림 — hintLevel만큼 힌트를 연다 */
  | { kind: 'wrong-verdict'; hintLevel: number }

export interface Attempt {
  verdict: Verdict
  /** 표시한 절 key ("mat:28:6") */
  marked: string[]
}

export interface Tries {
  verdict: number
  evidence: number
}

/** 정답으로 인정하는 판정 — 중복 답변 사건은 두 가지 (docs/content-audit.md) */
export function acceptedVerdicts(c: RumorCase): Verdict[] {
  return [c.verdict, ...(c.alsoAccept ?? [])]
}

export function grade(c: RumorCase, attempt: Attempt, prevWrongVerdicts: number): Outcome {
  if (!acceptedVerdicts(c).includes(attempt.verdict)) return { kind: 'wrong-verdict', hintLevel: prevWrongVerdicts + 1 }
  if (c.verdict === 'absent') return { kind: 'solved' }
  const keys = evidenceKeys(c)
  return attempt.marked.some((k) => keys.has(k)) ? { kind: 'solved' } : { kind: 'wrong-evidence' }
}

/** 이 구간 안에 정답 절이 한 절이라도 들어 있는가 */
function hasEvidence(c: RumorCase, ref: string): boolean {
  const ev = evidenceKeys(c)
  return expandRef(ref, byAbbr).map(verseKeyString).some((k) => ev.has(k))
}

/**
 * 힌트 단계에 따라 보여줄 조사 범위.
 * 0: 전체 scope / 1: 근거가 없는 구간을 접는다 / 2+: 같은 범위 + 정답 절 1개 강조
 *
 * 좁힌 범위에는 **반드시 정답 절이 보여야 한다**. 그래서
 *  - 'absent'(근거 절이 없는 판정)는 좁히지 않는다. 좁히면 "본문에 없다"를 확인할 길이 사라진다
 *  - 근거가 여러 구간에 나뉘어 있으면 그 구간을 모두 남기고, 근거가 없는 구간만 접는다
 *  - 접을 것이 없을 때만 hintOrder[0] 으로 좁힌다 (그 구간에 근거가 있을 때만)
 */
export function visibleScope(c: RumorCase, hintLevel: number): { refs: string[]; highlight: string | null } {
  if (hintLevel <= 0 || c.verdict === 'absent' || c.evidence.length === 0) {
    return { refs: c.scope, highlight: null }
  }
  const withEvidence = c.scope.filter((s) => hasEvidence(c, s))
  let refs = c.scope
  if (withEvidence.length > 0 && withEvidence.length < c.scope.length) refs = withEvidence
  else if (c.hintOrder[0] && hasEvidence(c, c.hintOrder[0])) refs = [c.hintOrder[0]]

  if (hintLevel < 2) return { refs, highlight: null }
  // 강조할 정답 절은 보이는 구간 안에 있어야 한다. 없으면 그 구간을 함께 연다
  const inside = c.evidence.find((e) => refWithin(e, refs, byAbbr))
  if (inside) return { refs, highlight: inside }
  return { refs: [...refs, c.evidence[0]], highlight: c.evidence[0] }
}

/**
 * 2단계 힌트에서 강조할 절 key — 정답 절 **한 개만** (spec §4-1 5번).
 * evidence가 구간(예: 마 28:11-15)이면 그 구간 전체를 칠하게 되어 힌트가 되지 않으므로 첫 절만 남긴다.
 */
export function highlightKeys(view: { highlight: string | null }): string[] {
  if (!view.highlight) return []
  return expandRef(view.highlight, byAbbr).map(verseKeyString).slice(0, 1)
}

export function toggleMark(marked: string[], key: string): string[] {
  if (marked.includes(key)) return marked.filter((k) => k !== key)
  if (marked.length >= MAX_EVIDENCE) return marked
  return [...marked, key]
}
