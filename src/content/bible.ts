import raw from './nt-krv.json'

const data = raw as Record<string, string[][]>

export function getChapter(bookId: string, chapter: number): string[] {
  const verses = data[bookId]?.[chapter - 1]
  if (!verses) throw new Error(`no text for ${bookId}:${chapter}`)
  return verses
}

export function verseCount(bookId: string, chapter: number): number {
  return getChapter(bookId, chapter).length
}
