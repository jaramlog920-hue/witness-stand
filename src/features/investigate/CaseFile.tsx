import { Link, useNavigate, useParams } from 'react-router'
import { getRumor, refLabel } from '../../content/cases'
import { useProgress } from '../../store/progress'

export function CaseFile() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const c = getRumor(id)
  const solved = useProgress((s) => s.solved[id])
  if (!c) return <main className="shell"><p>없는 사건입니다. <Link to="/board">게시판</Link></p></main>

  return (
    <main className="shell">
      <div className="topbar">
        <button className="back" onClick={() => nav('/board')}>← 게시판</button>
        <span className="meta">사건 {c.id.toUpperCase()}</span>
      </div>
      <section className="file">
        <div className="head">
          <div className="label">소문</div>
          <div className="rumor">“{c.rumor}”</div>
          <div className="src small">— {c.source}{c.sourceRef ? ` (${refLabel(c.sourceRef)})` : ''}</div>
        </div>
        <div className="body">
          <div>
            <div className="small muted" style={{ marginBottom: 6 }}>조사 범위</div>
            <div className="chips">{c.scope.map((r) => <span key={r} className="chip">{refLabel(r)}</span>)}</div>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            본문을 읽고 근거가 되는 절을 표시한 뒤 판정하십시오. 표시는 최대 3절입니다.
          </p>
          {solved ? (
            <div className="result-actions" style={{ marginTop: 0 }}>
              <button className="btn" onClick={() => nav(`/case/${c.id}/result`)}>결과 보기</button>
              <button className="btn primary" onClick={() => nav(`/case/${c.id}/read`)}>재조사</button>
            </div>
          ) : (
            <button className="btn primary block" onClick={() => nav(`/case/${c.id}/read`)}>조사 시작</button>
          )}
        </div>
      </section>
    </main>
  )
}
