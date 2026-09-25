import { useNavigate } from 'react-router'
import { rumors, testimonies, passageFor } from '../../content/cases'
import { useProgress, isGold } from '../../store/progress'

// 완주: 데오빌로에게 보내는 보고서 + 가장 많이 틀린 사건 3개의 본문 (spec §4-3)
export function Complete() {
  const nav = useNavigate()
  const name = useProgress((s) => s.investigator.name)
  const solved = useProgress((s) => s.solved)
  const witnessSolved = useProgress((s) => s.witnessSolved)
  // 삭제된 사건의 기록이 저장소에 남아 있어도 세지 않는다
  const solvedNow = rumors.filter((c) => solved[c.id]).length
  const witnessNow = testimonies.filter((c) => witnessSolved[c.id]).length
  const done = solvedNow >= rumors.length && witnessNow >= testimonies.length
  const gold =
    rumors.filter((c) => solved[c.id] && isGold(solved[c.id])).length +
    testimonies.filter((c) => witnessSolved[c.id] && isGold(witnessSolved[c.id])).length
  const allGold = gold === rumors.length + testimonies.length
  const triesOf = (id: string) => solved[id].verdictTries + solved[id].evidenceTries
  const hardest = rumors
    .filter((c) => solved[c.id])
    .sort((a, b) => triesOf(b.id) - triesOf(a.id))
    .slice(0, 3)

  if (!done) {
    return (
      <main className="shell">
        <div className="topbar"><button className="back" onClick={() => nav('/board')}>← 게시판</button></div>
        <p className="lock-msg">
          모든 사건을 해결하면 각하께 보고서를 보낼 수 있습니다.
          <br /><span className="small">소문 {solvedNow}/{rumors.length} · 증언 {witnessNow}/{testimonies.length}</span>
        </p>
      </main>
    )
  }

  return (
    <main className="shell">
      <div className="topbar"><button className="back" onClick={() => nav('/board')}>← 게시판</button><span className="meta">보고서</span></div>
      <section className="mandate">
        <div className="small muted">데오빌로 각하께</div>
        <h1 style={{ fontSize: 20, margin: '6px 0 12px' }}>조사 보고서</h1>
        <p>
          조사관 <strong>{name}</strong> — 소문 {rumors.length}건과 증언 사건 {testimonies.length}건을 모두 본문과 대조하여 판정하였습니다.
          첫 시도에 해결한 사건은 {gold}건입니다.
        </p>
        <div className="seal-row">
          <div className="seal fact" style={{ width: 96, height: 96 }}><div className="v" style={{ fontSize: 15 }}>확인</div></div>
          {allGold && <div className="seal gold" style={{ width: 96, height: 96, color: 'var(--gold)' }}><div className="v" style={{ fontSize: 15 }}>전부 금테</div></div>}
        </div>
        <p className="muted small">각하로 그 배운 바의 확실함을 알게 하려 함이로라 — 누가복음 1:4</p>
      </section>

      {hardest.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16 }}>본문으로 돌아가기</h2>
          <p className="muted small">가장 여러 번 시도한 사건 세 건의 근거 구절입니다. 한 번 더 읽어 보십시오.</p>
          {hardest.map((c) => (
            <div key={c.id} className="evidence-block">
              <h3>“{c.rumor}”</h3>
              {/* 'absent' 는 정답 절이 없다 — 결과 화면과 같이 조사 범위 전체를 보여준다 */}
              {(c.verdict === 'absent' ? c.scope : [...c.evidence, ...(c.alsoShow ?? [])]).map(passageFor).map((p) => (
                <div key={p.ref} style={{ marginBottom: 10 }}>
                  <div className="small" style={{ color: '#8a7a60' }}>{p.label}</div>
                  {p.verses.map((v) => <div key={v.key} className="v"><span className="n">{v.verse}</span><span>{v.text}</span></div>)}
                </div>
              ))}
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
