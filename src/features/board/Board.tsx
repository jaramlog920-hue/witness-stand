import { useState } from 'react'
import { Link } from 'react-router'
import { chapters, rumorsIn, rumors, witnessIn, testimonies } from '../../content/cases'
import { useProgress, isGold, type RumorRecord } from '../../store/progress'
import type { ChapterId } from '../../content/types'

export function solvedCountIn(solved: Record<string, RumorRecord>, chapter: ChapterId): number {
  return rumors.filter((c) => c.chapter === chapter && solved[c.id]).length
}

export function isChapterOpen(solved: Record<string, RumorRecord>, chapter: ChapterId): boolean {
  const meta = chapters.find((c) => c.id === chapter)!
  if (!meta.unlockAfter) return true
  return solvedCountIn(solved, meta.unlockAfter.chapter) >= meta.unlockAfter.solved
}

export function isWitnessOpen(solved: Record<string, RumorRecord>, chapter: ChapterId): boolean {
  const meta = chapters.find((c) => c.id === chapter)!
  return solvedCountIn(solved, chapter) >= meta.witnessUnlock
}

const RANKS: [number, string][] = [
  [0, '견습'],
  [8, '서기'],
  [25, '조사관'],
  [55, '선임 조사관'],
  [90, '데오빌로의 기록관'],
]
export function rankFor(total: number): string {
  let r = RANKS[0][1]
  for (const [n, name] of RANKS) if (total >= n) r = name
  return r
}

type Tab = ChapterId | 'W'

export function Board() {
  const name = useProgress((s) => s.investigator.name)
  const solved = useProgress((s) => s.solved)
  const witnessSolved = useProgress((s) => s.witnessSolved)
  const [tab, setTab] = useState<Tab>('I')
  const total = Object.keys(solved).length + Object.keys(witnessSolved).length
  const allDone = Object.keys(solved).length >= rumors.length && Object.keys(witnessSolved).length >= testimonies.length

  return (
    <main className="shell">
      <div className="topbar">
        <h1>소문 게시판</h1>
        <div className="meta">{name} · {rankFor(total)} · {total}건</div>
      </div>
      <div className="tabs" role="tablist">
        {chapters.map((c) => {
          const openTab = isChapterOpen(solved, c.id)
          return (
            <button key={c.id} role="tab" aria-selected={tab === c.id} className={`tab ${tab === c.id ? 'active' : ''} ${openTab ? '' : 'locked'}`} onClick={() => setTab(c.id)}>
              {openTab ? '' : '🔒 '}{c.id}. {c.title}
            </button>
          )
        })}
        <button role="tab" aria-selected={tab === 'W'} className={`tab ${tab === 'W' ? 'active' : ''}`} onClick={() => setTab('W')}>증언대</button>
      </div>
      <div className="row-links small">
        <Link to="/archive">기록 보관소 →</Link>
        {allDone && <Link to="/complete">각하께 보고서 보내기 →</Link>}
      </div>

      {tab === 'W' ? <WitnessTab /> : <RumorTab chapter={tab} />}
    </main>
  )
}

function RumorTab({ chapter }: { chapter: ChapterId }) {
  const solved = useProgress((s) => s.solved)
  const list = rumorsIn(chapter)
  const open = isChapterOpen(solved, chapter)
  const meta = chapters.find((c) => c.id === chapter)!
  return (
    <>
      <p className="muted small" style={{ marginTop: 0 }}>{meta.subtitle} · {solvedCountIn(solved, chapter)}/{list.length}</p>
      {!open && meta.unlockAfter && (
        <p className="lock-msg">
          {meta.unlockAfter.chapter} 사건철에서 {meta.unlockAfter.solved}건을 해결하면 열립니다.
          <br /><span className="small">현재 {solvedCountIn(solved, meta.unlockAfter.chapter)}건</span>
        </p>
      )}
      {open && list.length === 0 && <p className="lock-msg">아직 붙은 소문이 없습니다.</p>}
      {open && (
        <div className="notes">
          {list.map((c) => {
            const rec = solved[c.id]
            const dots = '●'.repeat(c.difficulty) + '○'.repeat(3 - c.difficulty)
            return (
              <Link key={c.id} to={`/case/${c.id}`} className={`note ${rec ? 'solved' : ''}`} style={{ textDecoration: 'none' }}>
                <div className="rumor">“{c.rumor}”</div>
                <div className="src">— {c.source}</div>
                <div className="row">
                  <span className="diff">{dots}</span>
                  {rec && (
                    <span>
                      <span className={`seal-dot ${isGold(rec) ? 'gold' : ''}`} style={{ background: `var(--seal-${c.verdict})` }} />해결
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

function WitnessTab() {
  const solved = useProgress((s) => s.solved)
  const witnessSolved = useProgress((s) => s.witnessSolved)
  return (
    <>
      <p className="muted small" style={{ marginTop: 0 }}>여러 인물의 증언을 대조해 사건 기록을 완성합니다. 사건철마다 소문 {chapters[0].witnessUnlock}건을 해결하면 열립니다.</p>
      {chapters.map((ch) => {
        const list = witnessIn(ch.id)
        if (list.length === 0) return null
        const open = isWitnessOpen(solved, ch.id)
        return (
          <section key={ch.id} className="drawer">
            <h2>{ch.id}. {ch.title} {open ? '' : `🔒 ${solvedCountIn(solved, ch.id)}/${ch.witnessUnlock}`}</h2>
            <div className="notes">
              {list.map((c) => {
                const rec = witnessSolved[c.id]
                const inner = (
                  <>
                    <div className="rumor">{c.title}</div>
                    <div className="src">{c.summary}</div>
                    <div className="row">
                      <span>{c.cards.length}장 · 질문 {c.questions.length}</span>
                      {rec && <span><span className={`seal-dot ${isGold(rec) ? 'gold' : ''}`} style={{ background: 'var(--accent)' }} />완성</span>}
                    </div>
                  </>
                )
                return open ? (
                  <Link key={c.id} to={rec ? `/witness/${c.id}/result` : `/witness/${c.id}`} className={`note ${rec ? 'solved' : ''}`} style={{ textDecoration: 'none' }}>{inner}</Link>
                ) : (
                  <div key={c.id} className="note locked">{inner}</div>
                )
              })}
            </div>
          </section>
        )
      })}
    </>
  )
}
