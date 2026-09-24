import { check, place, removeWrong, placedCard, type Placement } from './logic'
import { testimonies } from '../../content/cases'
import type { TestimonyCase } from '../../content/types'

const c: TestimonyCase = {
  id: 'w',
  chapter: 'I',
  title: 't',
  summary: 's',
  scope: ['요 9:1-41'],
  cards: [
    { id: 'a', speaker: 'x', speakerId: 'x', quote: '', ref: '요 9:9' },
    { id: 'b', speaker: 'x', speakerId: 'x', quote: '', ref: '요 9:20' },
    { id: 'c', speaker: 'x', speakerId: 'x', quote: '', ref: '요 9:16', distractor: true },
  ],
  questions: [
    { id: 'q1', prompt: '', answerCards: ['a', 'b'], record: '' },
    { id: 'q2', prompt: '', answerCards: ['a'], record: '' },
  ],
  explanation: '',
}

describe('place', () => {
  it('붙이기·같은 슬롯 재탭은 떼기·다른 슬롯으로 이동', () => {
    let p = place({}, 'q1', 'a')
    expect(p).toEqual({ q1: ['a'] })
    p = place(p, 'q1', 'a')
    expect(p).toEqual({ q1: [] })
    p = place(place({}, 'q1', 'a'), 'q2', 'a')
    expect(p).toEqual({ q1: [], q2: ['a'] })
    expect(placedCard(p, 'a')).toBe('q2')
    expect(placedCard(p, 'b')).toBeNull()
  })
})

describe('check', () => {
  it('정확히 일치해야 complete', () => {
    const r = check(c, { q1: ['a', 'b'], q2: ['a'] })
    expect(r.allDone).toBe(true)
  })
  it('빠지거나 틀린 카드는 보고', () => {
    const r = check(c, { q1: ['a', 'c'], q2: [] })
    expect(r.allDone).toBe(false)
    expect(r.results[0]).toEqual({ id: 'q1', complete: false, wrong: ['c'], missing: 1 })
    expect(r.results[1]).toEqual({ id: 'q2', complete: false, wrong: [], missing: 1 })
  })
  it('removeWrong은 틀린 카드만 뗀다', () => {
    const p = { q1: ['a', 'c'], q2: ['b'] }
    const r = check(c, p)
    expect(removeWrong(p, r.results)).toEqual({ q1: ['a'], q2: [] })
  })
})

describe('증언 사건 전체 — 정답대로 풀리는가', () => {
  it('18건 모두 정답 카드를 붙이면 제출 버튼이 열리고 전 질문이 완성된다', () => {
    for (const c of testimonies) {
      let p: Placement = {}
      for (const q of c.questions) {
        expect(q.answerCards.length, `${c.id} ${q.id} 정답 카드 없음`).toBeGreaterThan(0)
        for (const cid of q.answerCards) {
          expect(c.cards.some((x) => x.id === cid), `${c.id} ${q.id}: 없는 카드 ${cid}`).toBe(true)
          p = place(p, q.id, cid)
        }
      }
      // Witness 화면의 제출 버튼 조건과 같은 식
      const allPlaced = c.questions.every((q) => (p[q.id]?.length ?? 0) >= q.answerCards.length)
      expect(allPlaced, `${c.id}: 정답을 다 붙여도 제출 버튼이 열리지 않는다`).toBe(true)
      expect(check(c, p).allDone, `${c.id}: 정답대로 붙였는데 완성되지 않는다`).toBe(true)
    }
  })
  it('한 카드가 두 질문의 정답이면 풀 수 없다 — 그런 사건이 없어야 한다', () => {
    for (const c of testimonies) {
      const seen = new Map<string, string>()
      for (const q of c.questions)
        for (const cid of q.answerCards) {
          expect(seen.has(cid), `${c.id}: 카드 ${cid} 가 ${seen.get(cid)} 와 ${q.id} 양쪽의 정답`).toBe(false)
          seen.set(cid, q.id)
        }
    }
  })
})
