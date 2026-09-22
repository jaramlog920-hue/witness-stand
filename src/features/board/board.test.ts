import { rankFor, isChapterOpen, isWitnessOpen, solvedCountIn } from './Board'
import { rumorsIn, testimonies, rumors } from '../../content/cases'
import type { RumorRecord } from '../../store/progress'

const rec = (): RumorRecord => ({ verdictTries: 1, evidenceTries: 1, bestTries: 2, replays: 0, solvedAt: '' })
const solve = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, rec()]))

describe('해금', () => {
  it('I은 처음부터, II는 I에서 8건, III는 II에서 8건', () => {
    expect(isChapterOpen({}, 'I')).toBe(true)
    expect(isChapterOpen({}, 'II')).toBe(false)
    const eightI = solve(rumorsIn('I').slice(0, 8).map((c) => c.id))
    expect(isChapterOpen(eightI, 'II')).toBe(true)
    expect(isChapterOpen(eightI, 'III')).toBe(false)
    const eightII = { ...eightI, ...solve(rumorsIn('II').slice(0, 8).map((c) => c.id)) }
    expect(isChapterOpen(eightII, 'III')).toBe(true)
  })
  it('증언대는 사건철에서 10건', () => {
    const nine = solve(rumorsIn('I').slice(0, 9).map((c) => c.id))
    expect(isWitnessOpen(nine, 'I')).toBe(false)
    const ten = solve(rumorsIn('I').slice(0, 10).map((c) => c.id))
    expect(isWitnessOpen(ten, 'I')).toBe(true)
    expect(solvedCountIn(ten, 'I')).toBe(10)
  })
  it('콘텐츠가 해금 조건을 채울 만큼 있다', () => {
    expect(rumorsIn('I').length).toBeGreaterThanOrEqual(10)
    expect(rumorsIn('II').length).toBeGreaterThanOrEqual(10)
    expect(rumorsIn('III').length).toBeGreaterThanOrEqual(8)
    expect(testimonies.length).toBeGreaterThan(0)
    expect(rumors.length + testimonies.length).toBeGreaterThanOrEqual(90) // 최고 등급 도달 가능
  })
})

describe('rankFor', () => {
  it('구간', () => {
    expect(rankFor(0)).toBe('견습')
    expect(rankFor(8)).toBe('서기')
    expect(rankFor(25)).toBe('조사관')
    expect(rankFor(55)).toBe('선임 조사관')
    expect(rankFor(90)).toBe('데오빌로의 기록관')
  })
})
