import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getWitness, passageFor, refLabel } from '../../content/cases'
import { useProgress } from '../../store/progress'
import { check, place, removeWrong, placedCard, type Placement, type QuestionResult } from './logic'

export function Witness() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const c = getWitness(id)
  const solveWitness = useProgress((s) => s.solveWitness)

  const [placement, setPlacement] = useState<Placement>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [tries, setTries] = useState(0)
  const [feedback, setFeedback] = useState<QuestionResult[] | null>(null)
  const [showText, setShowText] = useState(false)
  const passages = useMemo(() => (c ? c.scope.map(passageFor) : []), [c])

  if (!c) return <main className="shell"><p>없는 사건입니다. <Link to="/board">게시판</Link></p></main>

  const free = c.cards.filter((t) => !placedCard(placement, t.id))
  const allPlaced = c.questions.every((q) => (placement[q.id]?.length ?? 0) >= q.answerCards.length)

  function tapCard(cardId: string) {
    setFeedback(null)
    setSelected((s) => (s === cardId ? null : cardId))
  }
  function tapSlot(qid: string) {
    if (!selected) return
    setPlacement((p) => place(p, qid, selected))
    setSelected(null)
  }
  function unplace(qid: string, cardId: string) {
    setFeedback(null)
    setPlacement((p) => place(p, qid, cardId))
  }
  function submit() {
    if (!c) return
    const r = check(c, placement)
    const n = tries + 1
    setTries(n)
    if (r.allDone) {
      solveWitness(c.id, n)
      nav(`/witness/${c.id}/result`, { replace: true })
      return
    }
    setFeedback(r.results)
    setPlacement((p) => removeWrong(p, r.results))
  }

  return (
    <main className="shell reader">
      <div className="topbar">
        <button className="back" onClick={() => nav('/board')}>← 게시판</button>
        <span className="meta">증언 사건</span>
      </div>
      <h1 style={{ fontSize: 20, margin: '0 0 6px' }}>{c.title}</h1>
      <p className="muted small" style={{ marginTop: 0 }}>{c.summary}</p>
      <div className="chips" style={{ marginBottom: 14 }}>
        {c.scope.map((r) => <span key={r} className="chip">{refLabel(r)}</span>)}
        <button className="chip" onClick={() => setShowText(true)} style={{ background: 'var(--bg-2)' }}>본문 보기</button>
      </div>

      <section className="slots">
        {c.questions.map((q) => {
          const ids = placement[q.id] ?? []
          const fb = feedback?.find((r) => r.id === q.id)
          return (
            <div key={q.id} className={`slot ${selected ? 'target' : ''} ${fb?.complete ? 'done' : ''}`} onClick={() => tapSlot(q.id)} role="button" tabIndex={0}>
              <div className="prompt">{q.prompt} <span className="muted small">({q.answerCards.length}장)</span></div>
              <div className="placed">
                {ids.map((cid) => {
                  const t = c.cards.find((x) => x.id === cid)!
                  return (
                    <button key={cid} className="tcard placed-card" onClick={(e) => { e.stopPropagation(); unplace(q.id, cid) }}>
                      <span className="who">{t.speaker} · {refLabel(t.ref)}</span>
                      <span className="q">“{t.quote}”</span>
                    </button>
                  )
                })}
                {ids.length === 0 && <span className="muted small">{selected ? '여기에 붙이기' : '카드를 고른 뒤 여기를 누르십시오'}</span>}
              </div>
              {fb && !fb.complete && (
                <div className="hint">
                  {fb.wrong.length > 0 ? '이 질문과 무관한 증언이 있어 되돌렸습니다. ' : ''}
                  {fb.missing > 0 ? `증언 ${fb.missing}장이 더 필요합니다.` : ''}
                </div>
              )}
              {fb?.complete && <div className="ok small">완성</div>}
            </div>
          )
        })}
      </section>

      <section className="deck">
        <h3 className="small muted">증언 카드 {free.length}장</h3>
        {free.map((t) => (
          <button key={t.id} className={`tcard ${selected === t.id ? 'sel' : ''}`} onClick={() => tapCard(t.id)} aria-pressed={selected === t.id}>
            <span className="who">{t.speaker} · {refLabel(t.ref)}</span>
            <span className="q">“{t.quote}”</span>
          </button>
        ))}
      </section>

      <div className="bottom-bar">
        <div className="inner">
          <span className="count">{selected ? '붙일 질문을 누르십시오' : `시도 ${tries}`}</span>
          <button className="btn primary" disabled={!allPlaced} onClick={submit}>기록 완성</button>
        </div>
      </div>

      {showText && (
        <div className="modal-bg" onClick={() => setShowText(false)}>
          <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
            <div className="topbar"><h2 style={{ margin: 0, fontSize: 15 }}>본문</h2><button className="back" onClick={() => setShowText(false)}>닫기</button></div>
            <div className="sheet-body">
              {passages.map((p) => (
                <section key={p.ref} className="passage">
                  <h3>{p.label}</h3>
                  {p.verses.map((v) => <div key={v.key} className="verse"><span className="n">{v.verse}</span><span>{v.text}</span></div>)}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
