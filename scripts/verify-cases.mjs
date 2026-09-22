// 사건 콘텐츠의 정확도 게이트. 오류가 하나라도 있으면 exit 1 → prebuild에서 빌드를 막는다.
// 검사 항목은 docs/spec.md §6 참고.
//  1. 모든 Ref가 실재하는 책·장·절인가
//  2. 인용 일치 — Testimony.quote는 ref 본문과 완전 일치, 그 외 텍스트의 따옴표 문구는 참조 본문에 포함
//  3. evidence ⊂ scope, hintOrder ⊂ scope
//  4. absent면 evidence 비어 있음, 그 외엔 1개 이상
//  5. answerCards가 cards에 존재, 모든 카드는 어떤 질문에 쓰이거나 distractor
import { readFile } from 'node:fs/promises'
import { parseRef, expandRef, refWithin, normalizeQuote } from '../src/content/ref.ts'

const root = new URL('../', import.meta.url)
const read = async (p) => JSON.parse(await readFile(new URL(p, root), 'utf8'))

const bible = await read('src/content/nt-krv.json')
const books = await read('src/content/books.json')
// 인자로 다른 파일을 줄 수 있다: node scripts/verify-cases.mjs [rumors.json] [testimonies.json]
const [rumorPath = 'src/content/rumors.json', witnessPath = 'src/content/testimonies.json'] = process.argv.slice(2)
const rumors = await read(rumorPath)
const testimonies = await read(witnessPath)
const chapters = await read('src/content/chapters.json')

const byAbbr = Object.fromEntries(books.map((b) => [b.abbr, b.id]))
const chapterIds = new Set(chapters.map((c) => c.id))
const VERDICTS = new Set(['fact', 'twisted', 'false', 'absent'])

let errors = 0
let quotes = 0
const fail = (where, msg) => {
  errors++
  console.error(`✗ ${where}: ${msg}`)
}

function textFor(ref) {
  let out = ''
  for (const k of expandRef(ref, byAbbr)) {
    const t = bible[k.bookId]?.[k.chapter - 1]?.[k.verse - 1]
    if (!t) throw new Error(`no verse ${k.bookId} ${k.chapter}:${k.verse} (${ref})`)
    out += ' ' + t
  }
  return out
}

function checkRef(where, ref) {
  try {
    parseRef(ref, byAbbr)
    textFor(ref)
    return true
  } catch (e) {
    fail(where, e.message)
    return false
  }
}

// 큰따옴표·작은따옴표·「」 안의 문구를 인용으로 간주. 8자 미만은 인용이 아니라 강조로 보고 건너뛴다.
function quotedPhrases(s) {
  const out = []
  // 짝을 먼저 맞추고 길이로 거른다 — 길이를 정규식에 넣으면 짧은 인용의 닫는 따옴표가 다음 인용의 여는 따옴표로 잘못 잡힌다
  for (const m of s.matchAll(/["“「']([^"”」']+?)["”」']/g)) if (m[1].length >= 8) out.push(m[1])
  return out
}

function checkQuotes(where, text, refs) {
  if (!text) return
  const phrases = quotedPhrases(text)
  if (phrases.length === 0) return
  let pool
  try {
    pool = normalizeQuote(refs.map(textFor).join(' '))
  } catch (e) {
    fail(where, e.message)
    return
  }
  for (const p of phrases) {
    quotes++
    if (!pool.includes(normalizeQuote(p))) fail(where, `인용 불일치: "${p}"`)
  }
}

// ---- 소문 사건 ----
const rumorIds = new Set()
for (const c of rumors) {
  const w = `rumor ${c.id}`
  if (rumorIds.has(c.id)) fail(w, '중복 id')
  rumorIds.add(c.id)
  if (!chapterIds.has(c.chapter)) fail(w, `없는 사건철 ${c.chapter}`)
  if (![1, 2, 3].includes(c.difficulty)) fail(w, `difficulty ${c.difficulty}`)
  if (!VERDICTS.has(c.verdict)) fail(w, `verdict ${c.verdict}`)
  // 중복 답변(alsoAccept): 같은 근거 절로 채점하므로 absent 와 섞을 수 없다
  if (c.alsoAccept !== undefined) {
    if (!Array.isArray(c.alsoAccept) || c.alsoAccept.length === 0) fail(w, 'alsoAccept는 비어 있지 않은 배열')
    else
      for (const v of c.alsoAccept) {
        if (!VERDICTS.has(v)) fail(w, `alsoAccept ${v}`)
        if (v === c.verdict) fail(w, `alsoAccept가 verdict와 같음 (${v})`)
        if (v === 'absent' || c.verdict === 'absent') fail(w, 'absent 판정은 중복 답변으로 묶을 수 없음')
      }
  }
  if (!c.rumor?.trim()) fail(w, 'rumor 비어 있음')
  if (!c.source?.trim()) fail(w, 'source 비어 있음')
  if (!Array.isArray(c.scope) || c.scope.length < 1 || c.scope.length > 4) fail(w, 'scope는 1~4구간')

  const scopeOk = (c.scope ?? []).every((r) => checkRef(w, r))
  ;(c.evidence ?? []).forEach((r) => checkRef(w, r))
  ;(c.hintOrder ?? []).forEach((r) => checkRef(w, r))
  if (c.sourceRef) checkRef(w, c.sourceRef)

  if (c.verdict === 'absent') {
    if (c.evidence?.length) fail(w, 'absent 판정은 evidence가 비어 있어야 함')
  } else if (!c.evidence?.length) {
    fail(w, `${c.verdict} 판정은 evidence가 1개 이상`)
  }

  if (scopeOk) {
    for (const r of c.evidence ?? []) {
      if (!refWithin(r, c.scope, byAbbr)) fail(w, `evidence ${r} 가 scope 밖`)
    }
    for (const r of c.hintOrder ?? []) {
      if (!refWithin(r, c.scope, byAbbr)) fail(w, `hintOrder ${r} 가 scope 밖`)
    }
    const quoteRefs = [...c.scope, ...(c.sourceRef ? [c.sourceRef] : [])]
    checkQuotes(w, c.rumor, quoteRefs)
    checkQuotes(w, c.explanation, quoteRefs)
  }
  if (typeof c.recordedInText !== 'boolean') fail(w, 'recordedInText 필요')
}

// ---- 증언 사건 ----
const witnessIds = new Set()
for (const c of testimonies) {
  const w = `witness ${c.id}`
  if (witnessIds.has(c.id)) fail(w, '중복 id')
  witnessIds.add(c.id)
  if (!chapterIds.has(c.chapter)) fail(w, `없는 사건철 ${c.chapter}`)
  if (!Array.isArray(c.scope) || c.scope.length < 1) fail(w, 'scope 필요')
  const scopeOk = (c.scope ?? []).every((r) => checkRef(w, r))

  const cardIds = new Set()
  const used = new Set()
  for (const t of c.cards ?? []) {
    const cw = `${w} card ${t.id}`
    if (cardIds.has(t.id)) fail(cw, '중복 카드 id')
    cardIds.add(t.id)
    if (!checkRef(cw, t.ref)) continue
    if (scopeOk && !refWithin(t.ref, c.scope, byAbbr)) fail(cw, `ref ${t.ref} 가 scope 밖`)
    quotes++
    if (normalizeQuote(t.quote) !== normalizeQuote(textFor(t.ref))) {
      fail(cw, `증언 카드는 본문과 완전 일치해야 함 (${t.ref})`)
    }
  }
  for (const q of c.questions ?? []) {
    const qw = `${w} q ${q.id}`
    if (!q.answerCards?.length) fail(qw, 'answerCards 비어 있음')
    for (const id of q.answerCards ?? []) {
      if (!cardIds.has(id)) fail(qw, `없는 카드 ${id}`)
      used.add(id)
    }
    if (scopeOk) checkQuotes(qw, q.record, c.scope)
  }
  for (const t of c.cards ?? []) {
    if (!used.has(t.id) && !t.distractor) fail(`${w} card ${t.id}`, '어떤 질문에도 쓰이지 않음 — distractor: true 명시 필요')
  }
  if (scopeOk) checkQuotes(w, c.explanation, c.scope)
}

// ---- 사건철 해금 조건이 실제 건수를 넘지 않는가 ----
// 아직 사건이 하나도 없는 사건철은 건너뛴다(콘텐츠를 순서대로 채우는 중)
for (const ch of chapters) {
  const count = rumors.filter((r) => r.chapter === ch.id).length
  if (ch.unlockAfter) {
    const prevCount = rumors.filter((r) => r.chapter === ch.unlockAfter.chapter).length
    if (prevCount > 0 && ch.unlockAfter.solved > prevCount) {
      fail(`chapter ${ch.id}`, `해금 조건 ${ch.unlockAfter.solved} > ${ch.unlockAfter.chapter}의 사건 수 ${prevCount}`)
    }
  }
  if (count > 0 && ch.witnessUnlock > count) {
    fail(`chapter ${ch.id}`, `증언 해금 조건 ${ch.witnessUnlock} > 사건 수 ${count}`)
  }
}

const reviewing = [...rumors, ...testimonies].filter((c) => c.flags?.includes('review')).length
console.log(`소문 ${rumors.length}건, 증언 ${testimonies.length}건, 인용 ${quotes}개 검사, 검수 대기 ${reviewing}건`)
if (errors) {
  console.error(`오류 ${errors}개`)
  process.exit(1)
}
console.log('✓ verify-cases 통과')
