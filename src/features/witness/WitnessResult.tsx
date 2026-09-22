import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { getWitness, refLabel } from '../../content/cases'
import { useProgress, isGold } from '../../store/progress'

export function WitnessResult() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const c = getWitness(id)
  const name = useProgress((s) => s.investigator.name)
  const rec = useProgress((s) => s.witnessSolved[id])
  if (!c) return <main className="shell"><p>없는 사건입니다. <Link to="/board">게시판</Link></p></main>
  if (!rec) return <Navigate to={`/witness/${c.id}`} replace />
  const gold = isGold(rec)

  return (
    <main className="shell">
      <div className="topbar">
        <button className="back" onClick={() => nav('/board')}>← 게시판</button>
        <span className="meta">증언 사건 · 완성</span>
      </div>
      <div className={`seal witness ${gold ? 'gold' : ''}`}>
        <div className="v">기록 완성</div>
        <div className="who">조사관 {name} 확인</div>
      </div>
      <h1 style={{ fontSize: 20, textAlign: 'center', margin: '0 0 4px' }}>{c.title}</h1>
      {gold && <p className="muted small" style={{ textAlign: 'center', marginTop: 0 }}>첫 시도에 완성 · 금테</p>}

      <section className="evidence-block">
        <h3>사건 기록</h3>
        {c.questions.map((q) => (
          <div key={q.id} style={{ marginBottom: 14 }}>
            <div className="small" style={{ color: '#8a7a60' }}>{q.prompt}</div>
            <div style={{ fontSize: 16, lineHeight: 1.6 }}>{q.record}</div>
            <div className="small" style={{ color: '#8a7a60', marginTop: 4 }}>
              근거: {q.answerCards.map((id) => { const t = c.cards.find((x) => x.id === id)!; return `${t.speaker}(${refLabel(t.ref)})` }).join(', ')}
            </div>
          </div>
        ))}
      </section>
      <p className="explain">{c.explanation}</p>
      <div className="result-actions">
        <button className="btn" onClick={() => nav(`/witness/${c.id}`)}>재조사</button>
        <button className="btn primary" onClick={() => nav('/archive')}>보관소</button>
      </div>
    </main>
  )
}
