import books from './books.json'
import chapters from './chapters.json'
import rumors from './rumors.json'
import testimonies from './testimonies.json'
import { getChapter } from './bible'
import type { RumorCase, TestimonyCase, ChapterMeta } from './types'

// verify-cases.mjs가 인용 정확도를 검사하고, 여기서는 구조·무결성만 본다.
const rumorList = rumors as RumorCase[]
const witnessList = testimonies as TestimonyCase[]
const chapterList = chapters as ChapterMeta[]

describe('본문', () => {
  it('27권, 260장', () => {
    expect(books).toHaveLength(27)
    expect(books.reduce((n, b) => n + b.chapters, 0)).toBe(260)
  })
  it('모든 장에 본문이 있음', () => {
    for (const b of books) for (let c = 1; c <= b.chapters; c++) expect(getChapter(b.id, c).length).toBeGreaterThan(0)
  })
})

describe('사건철', () => {
  it('I → II → III 순서와 해금 연결', () => {
    expect(chapterList.map((c) => c.id)).toEqual(['I', 'II', 'III'])
    expect(chapterList[0].unlockAfter).toBeNull()
    expect(chapterList[1].unlockAfter?.chapter).toBe('I')
    expect(chapterList[2].unlockAfter?.chapter).toBe('II')
  })
})

describe('사건 콘텐츠 구조', () => {
  const ids = new Set<string>()
  it('id 유일 (소문·증언 통합)', () => {
    for (const c of [...rumorList, ...witnessList]) {
      expect(ids.has(c.id)).toBe(false)
      ids.add(c.id)
    }
  })
  it('사건철 id가 chapters.json에 존재', () => {
    const valid = new Set(chapterList.map((c) => c.id))
    for (const c of [...rumorList, ...witnessList]) expect(valid.has(c.chapter)).toBe(true)
  })
  it('review 플래그는 알려진 값만', () => {
    for (const c of [...rumorList, ...witnessList]) for (const f of c.flags ?? []) expect(f).toBe('review')
  })
})
