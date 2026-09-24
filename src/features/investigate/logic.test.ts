import { grade, visibleScope, toggleMark, highlightKeys, MAX_EVIDENCE } from './logic'
import { rumors, evidenceKeys, byAbbr } from '../../content/cases'
import { expandRef, verseKeyString } from '../../content/ref'
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
  it('alsoAccept에 있는 판정도 정답으로 인정', () => {
    const dual: RumorCase = { ...base, verdict: 'twisted', alsoAccept: ['false'] }
    expect(grade(dual, { verdict: 'twisted', marked: ['mat:28:6'] }, 0)).toEqual({ kind: 'solved' })
    expect(grade(dual, { verdict: 'false', marked: ['mat:28:6'] }, 0)).toEqual({ kind: 'solved' })
    expect(grade(dual, { verdict: 'fact', marked: ['mat:28:6'] }, 0)).toEqual({ kind: 'wrong-verdict', hintLevel: 1 })
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
  it('1단계는 근거 절이 없는 구간만 접는다', () => {
    // 근거가 마 28장에만 있으므로 마 27:62-66 이 접힌다
    expect(visibleScope(base, 1)).toEqual({ refs: ['마 28:1-15'], highlight: null })
  })
  it('접을 구간이 없으면 hintOrder 첫 구간으로 좁힌다', () => {
    const c: RumorCase = { ...base, scope: ['마 28:1-15'], evidence: ['마 28:13'], hintOrder: ['마 28:11-15'] }
    expect(visibleScope(c, 1)).toEqual({ refs: ['마 28:11-15'], highlight: null })
  })
  it('hintOrder 첫 구간에 근거가 없으면 그 구간으로 좁히지 않는다', () => {
    const c: RumorCase = { ...base, scope: ['마 28:1-15'], evidence: ['마 28:13'], hintOrder: ['마 28:1-8'] }
    expect(visibleScope(c, 1).refs).toEqual(['마 28:1-15'])
  })
  it("'본문에 없음' 사건은 좁히지 않는다 — 좁히면 없다는 것을 확인할 수 없다", () => {
    const absent: RumorCase = { ...base, verdict: 'absent', evidence: [] }
    expect(visibleScope(absent, 1)).toEqual({ refs: absent.scope, highlight: null })
    expect(visibleScope(absent, 3)).toEqual({ refs: absent.scope, highlight: null })
  })
  it('2단계부터 보이는 범위 안의 정답 절 하나 강조', () => {
    expect(visibleScope(base, 2)).toEqual({ refs: ['마 28:1-15'], highlight: '마 28:5-6' })
  })
})

describe('힌트로 좁힌 범위 — 전체 콘텐츠', () => {
  const keysOf = (refs: string[]) => new Set(refs.flatMap((r) => expandRef(r, byAbbr).map(verseKeyString)))
  it('어느 단계에서도 표시할 정답 절이 화면에 남아 있다', () => {
    for (const c of rumors) {
      if (c.verdict === 'absent') continue
      const ev = evidenceKeys(c)
      for (const level of [0, 1, 2, 3]) {
        const visible = keysOf(visibleScope(c, level).refs)
        const pickable = [...ev].filter((k) => visible.has(k))
        expect(pickable.length, `${c.id} 힌트 ${level}단계에 고를 수 있는 근거 절이 없다`).toBeGreaterThan(0)
      }
    }
  })
  it("'본문에 없음' 사건은 어느 단계에서도 조사 범위가 줄지 않는다", () => {
    for (const c of rumors.filter((r) => r.verdict === 'absent')) {
      for (const level of [1, 2, 3]) expect(visibleScope(c, level).refs, c.id).toEqual(c.scope)
    }
  })
})

describe('highlightKeys', () => {
  it('강조는 언제나 정답 절 한 개 — 구간 evidence 라도 전체를 칠하지 않는다', () => {
    const c: RumorCase = { ...base, evidence: ['마 28:11-15'], hintOrder: ['마 28:11-15'] }
    const view = visibleScope(c, 2)
    expect(view.highlight).toBe('마 28:11-15')
    expect(highlightKeys(view)).toEqual(['mat:28:11'])
  })
  it('강조할 절이 없으면 빈 배열', () => {
    expect(highlightKeys({ highlight: null })).toEqual([])
    expect(highlightKeys(visibleScope(base, 0))).toEqual([])
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
