import { parseRef, expandRef, refWithin, normalizeQuote } from './ref'
import books from './books.json'

const byAbbr = Object.fromEntries(books.map((b) => [b.abbr, b.id]))

describe('parseRef', () => {
  it('단일 절', () => {
    expect(parseRef('마 28:6', byAbbr)).toEqual([{ bookId: 'mat', chapter: 28, from: 6, to: 6 }])
  })
  it('범위', () => {
    expect(parseRef('행 21:27-29', byAbbr)).toEqual([{ bookId: 'act', chapter: 21, from: 27, to: 29 }])
  })
  it('쉼표 뒤 책 생략은 앞 책을 이어받음', () => {
    expect(parseRef('행 16:12, 17:1', byAbbr)).toEqual([
      { bookId: 'act', chapter: 16, from: 12, to: 12 },
      { bookId: 'act', chapter: 17, from: 1, to: 1 },
    ])
  })
  it('쉼표 뒤 절만 쓰면 앞 장을 이어받음', () => {
    expect(parseRef('요 7:41-42, 52', byAbbr)).toEqual([
      { bookId: 'jhn', chapter: 7, from: 41, to: 42 },
      { bookId: 'jhn', chapter: 7, from: 52, to: 52 },
    ])
    expect(() => parseRef('52', byAbbr)).toThrow()
  })
  it('쉼표 뒤 다른 책', () => {
    expect(parseRef('마 2:1, 눅 2:4-7', byAbbr).map((r) => r.bookId)).toEqual(['mat', 'luk'])
  })
  it('없는 책·이상한 문법·역순은 던짐', () => {
    expect(() => parseRef('창 1:1', byAbbr)).toThrow()
    expect(() => parseRef('마 28', byAbbr)).toThrow()
    expect(() => parseRef('마 28:9-6', byAbbr)).toThrow()
    expect(() => parseRef('28:6', byAbbr)).toThrow()
  })
})

describe('expandRef / refWithin', () => {
  it('범위를 절 단위로 펼침', () => {
    expect(expandRef('막 3:22-24', byAbbr).map((k) => k.verse)).toEqual([22, 23, 24])
  })
  it('scope 안에 있는지', () => {
    expect(refWithin('마 28:13', ['마 28:11-15'], byAbbr)).toBe(true)
    expect(refWithin('마 28:16', ['마 28:11-15'], byAbbr)).toBe(false)
    expect(refWithin('마 28:5-6', ['마 28:1-8', '마 27:62-66'], byAbbr)).toBe(true)
  })
})

describe('normalizeQuote', () => {
  it('공백·구두점·따옴표 제거', () => {
    expect(normalizeQuote('너희는 세상의 소금이니, "빛"이라!')).toBe('너희는세상의소금이니빛이라')
  })
})
