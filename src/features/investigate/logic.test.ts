import { grade, visibleScope, toggleMark, MAX_EVIDENCE } from './logic'
import type { RumorCase } from '../../content/types'

const base: RumorCase = {
  id: 'x',
  chapter: 'I',
  difficulty: 1,
  rumor: 'r',
  source: 's',
  scope: ['마 28:1-15', '마 27:62-66'],
  verdict: 'false',
  evidence: ['마 28:5-6', '마 28:13'],
  hintOrder: ['마 28:11-15', '마 28:1-8'],
  explanation: '',
  recordedInText: true,
}

describe('grade', () => {
  it('판정 맞고 증거가 정답 절 하나라도 포함하면 해결', () => {
    expect(grade(base, { verdict: 'false', marked: ['mat:28:1', 'mat:28:6'] }, 0)).toEqual({ kind: 'solved' })
  })
  it('판정 맞고 증거가 모두 빗나가면 wrong-evidence', () => {
    expect(grade(base, { verdict: 'false', marked: ['mat:28:1', 'mat:27:62'] }, 0)).toEqual({ kind: 'wrong-evidence' })
  })
  it('판정 틀리면 힌트 단계가 올라감', () => {
    expect(grade(base, { verdict: 'fact', marked: ['mat:28:6'] }, 0)).toEqual({ kind: 'wrong-verdict', hintLevel: 1 })
    expect(grade(base, { verdict: 'fact', marked: ['mat:28:6'] }, 1)).toEqual({ kind: 'wrong-verdict', hintLevel: 2 })
  })
  it('absent 판정은 증거 없이도 해결', () => {
    const absent: RumorCase = { ...base, verdict: 'absent', evidence: [] }
    expect(grade(absent, { verdict: 'absent', marked: [] }, 0)).toEqual({ kind: 'solved' })
  })
})

describe('visibleScope', () => {
  it('0단계는 전체 범위', () => {
    expect(visibleScope(base, 0)).toEqual({ refs: base.scope, highlight: null })
  })
  it('1단계는 hintOrder 첫 구간만', () => {
    expect(visibleScope(base, 1)).toEqual({ refs: ['마 28:11-15'], highlight: null })
  })
  it('2단계부터 보이는 구간 안의 정답 절 하나 강조', () => {
    expect(visibleScope(base, 2)).toEqual({ refs: ['마 28:11-15'], highlight: '마 28:13' })
  })
  it('보이는 구간에 정답이 없으면 정답 구간을 함께 연다', () => {
    const c: RumorCase = { ...base, hintOrder: ['마 27:62-66'] }
    expect(visibleScope(c, 2)).toEqual({ refs: ['마 27:62-66', '마 28:5-6'], highlight: '마 28:5-6' })
  })
})

describe('toggleMark', () => {
  it('추가·제거·상한', () => {
    expect(toggleMark([], 'a')).toEqual(['a'])
    expect(toggleMark(['a'], 'a')).toEqual([])
    const full = Array.from({ length: MAX_EVIDENCE }, (_, i) => `k${i}`)
    expect(toggleMark(full, 'new')).toEqual(full)
    expect(toggleMark(full, 'k0')).toEqual(full.slice(1))
  })
})
