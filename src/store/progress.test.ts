import { useProgress, isGold } from './progress'

beforeEach(() => useProgress.getState().reset())

describe('progress store', () => {
  it('기본 이름은 조사관, 빈 이름은 기본값으로', () => {
    expect(useProgress.getState().investigator).toEqual({ name: '조사관', accepted: false })
    useProgress.getState().setInvestigator('  ')
    expect(useProgress.getState().investigator).toEqual({ name: '조사관', accepted: true })
    useProgress.getState().setInvestigator(' 요한 ')
    expect(useProgress.getState().investigator.name).toBe('요한')
  })

  it('첫 해결은 시도 수를 기록하고 replays 0', () => {
    useProgress.getState().solveRumor('r001', { verdict: 2, evidence: 1 })
    const r = useProgress.getState().solved.r001
    expect(r).toMatchObject({ verdictTries: 2, evidenceTries: 1, bestTries: 3, replays: 0 })
    expect(isGold(r)).toBe(false)
  })

  it('재조사는 첫 기록을 덮지 않고 bestTries·replays만 갱신', () => {
    const s = useProgress.getState()
    s.solveRumor('r001', { verdict: 2, evidence: 1 })
    s.solveRumor('r001', { verdict: 1, evidence: 1 })
    const r = useProgress.getState().solved.r001
    expect(r).toMatchObject({ verdictTries: 2, evidenceTries: 1, bestTries: 2, replays: 1 })
    expect(isGold(r)).toBe(true)
    s.solveRumor('r001', { verdict: 3, evidence: 3 })
    expect(useProgress.getState().solved.r001.bestTries).toBe(2)
    expect(useProgress.getState().solved.r001.replays).toBe(2)
  })

  it('증언 사건은 시도 1회가 금테', () => {
    useProgress.getState().solveWitness('w01', 2)
    expect(isGold(useProgress.getState().witnessSolved.w01)).toBe(false)
    useProgress.getState().solveWitness('w01', 1)
    expect(isGold(useProgress.getState().witnessSolved.w01)).toBe(true)
  })

  it('reset은 모두 비움', () => {
    useProgress.getState().solveRumor('r001', { verdict: 1, evidence: 1 })
    useProgress.getState().reset()
    expect(useProgress.getState().solved).toEqual({})
  })
})
