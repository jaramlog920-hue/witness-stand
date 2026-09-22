export type BookGroup = 'gospel' | 'acts' | 'pauline' | 'general' | 'revelation'

export interface Book {
  id: string
  code: string
  name: string
  abbr: string
  chapters: number
  group: BookGroup
}

/** 사건철. 해금 조건은 chapters.json에 있다. */
export type ChapterId = 'I' | 'II' | 'III'

export interface ChapterMeta {
  id: ChapterId
  title: string
  subtitle: string
  /** 이 사건철이 열리기 위해 앞 사건철에서 해결해야 하는 소문 수. 첫 사건철은 0 */
  unlockAfter: { chapter: ChapterId; solved: number } | null
  /** 이 사건철의 증언 사건이 열리기 위해 이 사건철에서 해결해야 하는 소문 수 */
  witnessUnlock: number
}

export type Verdict = 'fact' | 'twisted' | 'false' | 'absent'

/** "마 28:11-15" / "행 16:12, 17:1" — 뒤 항목은 책 생략 가능. parseRef 참고 */
export type Ref = string

export type CaseFlag = 'review'

export interface RumorCase {
  id: string
  chapter: ChapterId
  difficulty: 1 | 2 | 3
  rumor: string
  /** 소문 주체. 본문 표현 그대로 */
  source: string
  sourceRef?: Ref
  /** 조사 범위 1~4구간 */
  scope: Ref[]
  verdict: Verdict
  /** 판정이 두 가지로 읽히는 사건에서 함께 정답으로 인정할 판정 (중복 답변) */
  alsoAccept?: Verdict[]
  /** 정답 절 집합. absent면 비어 있음 */
  evidence: Ref[]
  /** 틀렸을 때 남길 구간 순서. scope의 부분집합 */
  hintOrder: Ref[]
  explanation: string
  /** 성경이 직접 기록한 소문 (exclusion-list §2-1) */
  recordedInText: boolean
  flags?: CaseFlag[]
}

export interface Testimony {
  id: string
  speaker: string
  speakerId: string
  /** 본문 그대로. verify가 ref 본문과 완전 일치를 검사한다 */
  quote: string
  ref: Ref
  /** 어떤 질문에도 쓰이지 않는 카드는 명시해야 verify를 통과한다 */
  distractor?: boolean
}

export interface TestimonyQuestion {
  id: string
  prompt: string
  /** Testimony.id 집합. 순서 무관, 전부 필요 */
  answerCards: string[]
  record: string
}

export interface TestimonyCase {
  id: string
  chapter: ChapterId
  title: string
  summary: string
  scope: Ref[]
  cards: Testimony[]
  questions: TestimonyQuestion[]
  explanation: string
  flags?: CaseFlag[]
}
