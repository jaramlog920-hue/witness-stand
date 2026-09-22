import booksRaw from './books.json'
import chaptersRaw from './chapters.json'
import rumorsRaw from './rumors.json'
import testimoniesRaw from './testimonies.json'
import { getChapter } from './bible'
import { expandRef, parseRef, verseKeyString, type VerseKey } from './ref'
import type { Book, ChapterMeta, RumorCase, TestimonyCase, Verdict, ChapterId } from './types'

export const books = booksRaw as Book[]
export const chapters = chaptersRaw as ChapterMeta[]
const allRumors = rumorsRaw as RumorCase[]
const allTestimonies = testimoniesRaw as TestimonyCase[]

/** 검수 대기(flags: review) 사건은 게시판에 내지 않는다 (spec §6) */
export const rumors = allRumors.filter((c) => !c.flags?.includes('review'))
export const testimonies = allTestimonies.filter((c) => !c.flags?.includes('review'))

export const byAbbr: Record<string, string> = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
const bookById: Record<string, Book> = Object.fromEntries(books.map((b) => [b.id, b]))

export function getRumor(id: string): RumorCase | undefined {
  return rumors.find((c) => c.id === id)
}

export function getWitness(id: string): TestimonyCase | undefined {
  return testimonies.find((c) => c.id === id)
}

export function witnessIn(chapter: ChapterId): TestimonyCase[] {
  return testimonies.filter((c) => c.chapter === chapter)
}

export function rumorsIn(chapter: ChapterId): RumorCase[] {
  return rumors.filter((c) => c.chapter === chapter).sort((a, b) => a.difficulty - b.difficulty)
}

export interface Verse extends VerseKey {
  key: string
  text: string
}

/** 조사 범위 한 구간을 절 목록으로. 표시용 라벨은 "마태복음 28:1-15" */
export interface Passage {
  ref: string
  label: string
  verses: Verse[]
}

export function passageFor(ref: string): Passage {
  const verses = expandRef(ref, byAbbr).map((k) => ({
    ...k,
    key: verseKeyString(k),
    text: getChapter(k.bookId, k.chapter)[k.verse - 1],
  }))
  return { ref, label: refLabel(ref), verses }
}

export function refLabel(ref: string): string {
  return parseRef(ref, byAbbr)
    .map((r, i, arr) => {
      const sameBook = i > 0 && arr[i - 1].bookId === r.bookId
      const name = sameBook ? '' : bookById[r.bookId].name + ' '
      const range = r.from === r.to ? `${r.from}` : `${r.from}-${r.to}`
      return `${name}${r.chapter}:${range}`
    })
    .join(', ')
}

export function evidenceKeys(c: RumorCase): Set<string> {
  return new Set(c.evidence.flatMap((r) => expandRef(r, byAbbr).map(verseKeyString)))
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  fact: '사실',
  twisted: '왜곡',
  false: '거짓',
  absent: '본문에 없음',
}

export const VERDICT_DESC: Record<Verdict, string> = {
  fact: '본문이 그대로 확인한다',
  twisted: '근거는 있으나 뜻이 비틀렸다',
  false: '본문이 분명히 부정한다',
  absent: '본문이 말하지 않는 내용이다',
}

export const VERDICTS: Verdict[] = ['fact', 'twisted', 'false', 'absent']
