import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RumorRecord {
  /** 첫 해결 때의 시도 수. 이후 불변 */
  verdictTries: number
  evidenceTries: number
  /** 재조사 포함 최소 시도 수 (verdictTries + evidenceTries) */
  bestTries: number
  replays: number
  solvedAt: string
}

export interface WitnessRecord {
  tries: number
  bestTries: number
  replays: number
  solvedAt: string
}

export interface ProgressState {
  version: 1
  /** 위임장을 받아들인 뒤 accepted=true. 그 전에는 모든 경로가 위임장으로 간다 */
  investigator: { name: string; accepted: boolean }
  solved: Record<string, RumorRecord>
  witnessSolved: Record<string, WitnessRecord>

  setInvestigator: (name: string) => void
  /** 첫 해결이면 기록 생성, 이미 해결된 사건이면 재조사로 처리(bestTries·replays 갱신) */
  solveRumor: (id: string, tries: { verdict: number; evidence: number }) => void
  solveWitness: (id: string, tries: number) => void
  importState: (s: Pick<ProgressState, 'investigator' | 'solved' | 'witnessSolved'>) => void
  reset: () => void
}

const DEFAULT_NAME = '조사관'

const empty = () => ({
  version: 1 as const,
  investigator: { name: DEFAULT_NAME, accepted: false },
  solved: {},
  witnessSolved: {},
})

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...empty(),

      setInvestigator: (name) => set({ investigator: { name: name.trim() || DEFAULT_NAME, accepted: true } }),

      solveRumor: (id, tries) =>
        set((s) => {
          const total = tries.verdict + tries.evidence
          const prev = s.solved[id]
          const next: RumorRecord = prev
            ? { ...prev, bestTries: Math.min(prev.bestTries, total), replays: prev.replays + 1 }
            : {
                verdictTries: tries.verdict,
                evidenceTries: tries.evidence,
                bestTries: total,
                replays: 0,
                solvedAt: new Date().toISOString(),
              }
          return { solved: { ...s.solved, [id]: next } }
        }),

      solveWitness: (id, tries) =>
        set((s) => {
          const prev = s.witnessSolved[id]
          const next: WitnessRecord = prev
            ? { ...prev, bestTries: Math.min(prev.bestTries, tries), replays: prev.replays + 1 }
            : { tries, bestTries: tries, replays: 0, solvedAt: new Date().toISOString() }
          return { witnessSolved: { ...s.witnessSolved, [id]: next } }
        }),

      importState: (s) => set({ investigator: s.investigator, solved: s.solved, witnessSolved: s.witnessSolved }),
      reset: () => set(empty()),
    }),
    { name: 'witness-stand-progress', version: 1 },
  ),
)

/** 1회 만에 해결(판정·증거 모두 첫 시도) — 보관소 금테 조건 */
export function isGold(r: RumorRecord | WitnessRecord): boolean {
  // 증언 사건은 시도 1회, 소문 사건은 판정 1회 + 증거 1회
  return 'tries' in r ? r.bestTries === 1 : r.bestTries === 2
}
