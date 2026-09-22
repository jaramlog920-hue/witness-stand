import { check, place, removeWrong, placedCard } from './logic'
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
