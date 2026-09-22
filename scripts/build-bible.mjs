import { writeFile, readFile } from 'node:fs/promises'

const books = JSON.parse(await readFile(new URL('../src/content/books.json', import.meta.url), 'utf8'))
const BASE = 'https://raw.githubusercontent.com/kuris/bible/main/data/krv/'
const out = {}
for (const b of books) {
  const res = await fetch(`${BASE}${b.id}.json`)
  if (!res.ok) throw new Error(`${b.id}: HTTP ${res.status}`)
  const json = await res.json()
  if (json.chapters.length !== b.chapters) {
    throw new Error(`${b.id}: expected ${b.chapters} chapters, got ${json.chapters.length}`)
  }
  out[b.id] = json.chapters
  console.log(b.id, json.chapters.length)
}
await writeFile(new URL('../src/content/nt-krv.json', import.meta.url), JSON.stringify(out), 'utf8')
