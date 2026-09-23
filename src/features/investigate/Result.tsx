import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { getRumor, passageFor, VERDICT_LABEL } from '../../content/cases'
import { acceptedVerdicts } from './logic'
import { useProgress, isGold } from '../../store/progress'

export function Result() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const c = getRumor(id)
  const name = useProgress((s) => s.investigator.name)
  const rec = useProgress((s) => s.solved[id])
  if (!c) return <main className="shell"><p>없는 사건입니다. <Link to="/board">게시판</Link></p></main>
  if (!rec) return <Navigate to={`/case/${c.id}`} replace />
  const gold = isGold(rec)
  // 근거 구절 전문이 결과의 중심이다 (spec §4-1 6번). absent는 조사 범위 전체가 근거.
  const passages = (c.verdict === 'absent' ? c.scope : c.evidence).map(passageFor)
  // 중복 답변 사건은 인장에 두 판정을 함께 찍는다 (어느 쪽으로 답해도 정답이므로)
  const labels = acceptedVerdicts(c).map((v) => VERDICT_LABEL[v])
  const sealLabel = labels.join('·')

  return (
    <main className="shell">
      <div className="topbar">
        <button className="back" onClick={() => nav('/board')}>← 게시판</button>
        <span className="meta">사건 {c.id.toUpperCase()} · 해결</span>
      </div>

      <div className={`seal ${c.verdict} ${gold ? 'gold' : ''}`} aria-label={`판정 ${sealLabel}`}>
        <div className={`v ${labels.length > 1 ? 'dual' : ''}`}>{sealLabel}</div>
        <div className="who">조사관 {name} 확인</div>
      </div>
      <p className="muted small" style={{ textAlign: 'center', marginTop: 0 }}>
        “{c.rumor}” — {c.source}
        {gold && <><br />첫 시도에 해결 · 금테</>}
      </p>

      <section className="evidence-block">
        <h3>{c.verdict === 'absent' ? '조사 범위 본문' : '근거 구절'}</h3>
        {passages.map((p) => (
          <div key={p.ref} style={{ marginBottom: 12 }}>
            <div className="small" style={{ color: '#8a7a60', marginBottom: 4 }}>{p.label}</div>
            {p.verses.map((v) => (
              <div key={v.key} className="v"><span className="n">{v.verse}</span><span>{v.text}</span></div>
            ))}
          </div>
        ))}
      </section>

      <p className="explain">{c.explanation}</p>
      {c.alsoAccept?.length ? (
        <p className="muted small">
          중복 답변: 이 사건은 {sealLabel} 어느 쪽으로 판정해도 인정합니다.
        </p>
      ) : null}
      {c.recordedInText && <p className="muted small">이 소문은 성경 본문이 직접 기록한 소문입니다.</p>}

      <div className="result-actions">
        <button className="btn" onClick={() => nav(`/case/${c.id}/read`)}>재조사</button>
        <button className="btn primary" onClick={() => nav('/board')}>게시판으로</button>
      </div>
    </main>
  )
}
