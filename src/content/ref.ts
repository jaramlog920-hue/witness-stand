// 참조 문자열 파서. 앱과 scripts/verify-cases.mjs가 같은 구현을 쓴다(Node 24 타입 스트립).
// 문법: "마 28:11-15" | "행 16:12, 17:1" (쉼표 뒤 항목은 책 생략 가능, 앞 책을 이어받음)
//       "요 7:41-42, 52" (쉼표 뒤 절만 쓰면 앞 장까지 이어받음)
// 여기서는 절 범위만 다루고 본문 조회는 하지 않는다 — 브라우저·노드 모두에서 import 가능.

export interface VerseRange {
  bookId: string
  chapter: number
  from: number
  to: number
}

export interface VerseKey {
  bookId: string
  chapter: number
  verse: number
}

type BookLookup = Record<string, string> // abbr -> bookId

const PART = /^(?:(\S+)\s+)?(\d+):(\d+)(?:-(\d+))?$/
const VERSES_ONLY = /^(\d+)(?:-(\d+))?$/

export function parseRef(ref: string, byAbbr: BookLookup): VerseRange[] {
  const out: VerseRange[] = []
  let lastBook: string | null = null
  let lastChapter: number | null = null
  for (const part of ref.split(',').map((s) => s.trim())) {
    let bookId: string | null
    let chapter: number
    let from: number
    let to: number
    const vm = part.match(VERSES_ONLY)
    if (vm) {
      if (!lastBook || lastChapter === null) throw new Error(`verse-only part needs a preceding chapter: "${part}" in "${ref}"`)
      bookId = lastBook
      chapter = lastChapter
      from = Number(vm[1])
      to = vm[2] ? Number(vm[2]) : from
    } else {
      const m = part.match(PART)
      if (!m) throw new Error(`bad ref: "${part}" in "${ref}"`)
      bookId = m[1] ? (byAbbr[m[1]] ?? null) : lastBook
      if (!bookId) throw new Error(`unknown book in "${part}" (${ref})`)
      chapter = Number(m[2])
      from = Number(m[3])
      to = m[4] ? Number(m[4]) : from
    }
    lastBook = bookId
    lastChapter = chapter
    if (to < from) throw new Error(`reversed range: "${part}"`)
    out.push({ bookId, chapter, from, to })
  }
  return out
}

export function expandRef(ref: string, byAbbr: BookLookup): VerseKey[] {
  const keys: VerseKey[] = []
  for (const r of parseRef(ref, byAbbr)) {
    for (let v = r.from; v <= r.to; v++) keys.push({ bookId: r.bookId, chapter: r.chapter, verse: v })
  }
  return keys
}

export function verseKeyString(k: VerseKey): string {
  return `${k.bookId}:${k.chapter}:${k.verse}`
}

/** a의 모든 절이 b 어딘가에 포함되는가 */
export function refWithin(a: string, b: string[], byAbbr: BookLookup): boolean {
  const pool = new Set(b.flatMap((r) => expandRef(r, byAbbr).map(verseKeyString)))
  return expandRef(a, byAbbr).every((k) => pool.has(verseKeyString(k)))
}

/** 인용 비교용 정규화: 공백과 구두점 제거 */
export function normalizeQuote(s: string): string {
  return s.replace(/\s+/g, '').replace(/[,.!?…'"“”‘’「」\[\]()]/g, '')
}
