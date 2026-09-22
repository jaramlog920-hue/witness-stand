import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { chapters, rumors, testimonies, books, byAbbr, VERDICT_LABEL, VERDICTS } from '../../content/cases'
import { parseRef } from '../../content/ref'
import { useProgress, isGold } from '../../store/progress'
import type { Verdict } from '../../content/types'

type Filter = { verdict: Verdict | 'all'; book: string | 'all' }

function bookOf(scope: string[]): string {
  return parseRef(scope[0], byAbbr)[0].bookId
}

export function Archive() {
  const nav = useNavigate()
  const solved = useProgress((s) => s.solved)
  const witnessSolved = useProgress((s) => s.witnessSolved)
  const [f, setF] = useState<Filter>({ verdict: 'all', book: 'all' })

  const solvedRumors = useMemo(() => rumors.filter((c) => solved[c.id]), [solved])
  const solvedWitness = useMemo(() => testimonies.filter((c) => witnessSolved[c.id]), [witnessSolved])
  const bookIds = useMemo(() => {
    const set = new Set(solvedRumors.map((c) => bookOf(c.scope)))
    return books.filter((b) => set.has(b.id))
  }, [solvedRumors])

  const shown = solvedRumors.filter(
    (c) => (f.verdict === 'all' || c.verdict === f.verdict) && (f.book === 'all' || bookOf(c.scope) === f.book),
  )
  const goldCount = solvedRumors.filter((c) => isGold(solved[c.id])).length + solvedWitness.filter((c) => isGold(witnessSolved[c.id])).length
  const total = solvedRumors.length + solvedWitness.length
  const all = rumors.length + testimonies.length

  return (
    <main className="shell">
      <div className="topbar">
        <button className="back" onClick={() => nav('/board')}>← 게시판</button>
        <span className="meta">{total}/{all} 해결 · 금테 {goldCount}</span>
      </div>
      <h1 style={{ fontSize: 20, margin: '0 0 12px' }}>기록 보관소</h1>

      <div className="tabs">
        <button className={`tab ${f.verdict === 'all' ? 'active' : ''}`} onClick={() => setF({ ...f, verdict: 'all' })}>전체</button>
        {VERDICTS.map((v) => (
          <button key={v} className={`tab ${f.verdict === v ? 'active' : ''}`} onClick={() => setF({ ...f, verdict: v })}>
            <span className="seal-dot" style={{ background: `var(--seal-${v})` }} />{VERDICT_LABEL[v]}
          </button>
        ))}
      </div>
      {bookIds.length > 1 && (
        <div className="tabs">
          <button className={`tab ${f.book === 'all' ? 'active' : ''}`} onClick={() => setF({ ...f, book: 'all' })}>모든 책</button>
          {bookIds.map((b) => (
            <button key={b.id} className={`tab ${f.book === b.id ? 'active' : ''}`} onClick={() => setF({ ...f, book: b.id })}>{b.name}</button>
          ))}
        </div>
      )}

      {total === 0 && <p className="lock-msg">아직 보관된 기록이 없습니다. 게시판에서 첫 소문을 조사해 보십시오.</p>}

      {chapters.map((ch) => {
        const list = shown.filter((c) => c.chapter === ch.id)
        const wl = solvedWitness.filter((c) => c.chapter === ch.id)
        if (list.length === 0 && (wl.length === 0 || f.verdict !== 'all' || f.book !== 'all')) return null
        return (
          <section key={ch.id} className="drawer">
            <h2>{ch.id}. {ch.title}</h2>
            <div className="drawer-grid">
              {list.map((c) => {
                const rec = solved[c.id]
                return (
                  <Link key={c.id} to={`/case/${c.id}/result`} className={`card-mini ${isGold(rec) ? 'gold' : ''}`} style={{ borderColor: `var(--seal-${c.verdict})` }}>
                    <span className="v" style={{ color: `var(--seal-${c.verdict})` }}>{VERDICT_LABEL[c.verdict]}</span>
                    <span className="t">{c.rumor}</span>
                    {rec.replays > 0 && <span className="r">재조사 {rec.replays}</span>}
                  </Link>
                )
              })}
              {f.verdict === 'all' && f.book === 'all' && wl.map((c) => {
                const rec = witnessSolved[c.id]
                return (
                  <Link key={c.id} to={`/witness/${c.id}/result`} className={`card-mini witness ${isGold(rec) ? 'gold' : ''}`}>
                    <span className="v">증언</span>
                    <span className="t">{c.title}</span>
                    {rec.replays > 0 && <span className="r">재조사 {rec.replays}</span>}
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </main>
  )
}
