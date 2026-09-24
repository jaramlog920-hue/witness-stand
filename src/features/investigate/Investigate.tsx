import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getRumor, passageFor, VERDICTS, VERDICT_LABEL, VERDICT_DESC } from '../../content/cases'
import { useProgress } from '../../store/progress'
import { grade, visibleScope, toggleMark, highlightKeys, MAX_EVIDENCE, type Outcome } from './logic'
import type { Verdict } from '../../content/types'

export function Investigate() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const c = getRumor(id)
  const solveRumor = useProgress((s) => s.solveRumor)

  const [marked, setMarked] = useState<string[]>([])
  const [wrongVerdicts, setWrongVerdicts] = useState(0)
  const [evidenceTries, setEvidenceTries] = useState(0)
  const [modal, setModal] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  // 'absent' 판정은 증거 대신 조사 범위를 끝까지 읽는 것이 조건 (spec §4-1)
  const [readToEnd, setReadToEnd] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const view = useMemo(() => (c ? visibleScope(c, wrongVerdicts) : null), [c, wrongVerdicts])
  const passages = useMemo(() => (view ? view.refs.map(passageFor) : []), [view])
  const highlight = useMemo(() => new Set(view ? highlightKeys(view) : []), [view])

  // 끝까지 읽었는지: 스크롤·리사이즈마다 끝 표식이 화면 안에 들어왔는지 본다.
  // IntersectionObserver는 화면에 그려지지 않는 탭에서 콜백이 오지 않아 쓰지 않는다.
  useEffect(() => {
    setReadToEnd(false)
    const check = () => {
      const el = endRef.current
      if (el && el.getBoundingClientRect().top <= window.innerHeight) setReadToEnd(true)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    // 스크롤 이벤트가 누락되는 환경(그려지지 않는 탭 등) 대비. 값이 true가 되면 setState는 no-op이라 부담 없다
    const timer = window.setInterval(check, 500)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      window.clearInterval(timer)
    }
  }, [passages])

  if (!c || !view) return <main className="shell"><p>없는 사건입니다. <Link to="/board">게시판</Link></p></main>

  function submit(verdict: Verdict) {
    if (!c) return
    const o = grade(c, { verdict, marked }, wrongVerdicts)
    setOutcome(o)
    if (o.kind === 'solved') {
      solveRumor(c.id, { verdict: wrongVerdicts + 1, evidence: c.verdict === 'absent' ? 1 : evidenceTries + 1 })
      nav(`/case/${c.id}/result`, { replace: true, state: { fresh: true } })
      return
    }
    if (o.kind === 'wrong-verdict') {
      setWrongVerdicts(o.hintLevel)
      setMarked([])
      setModal(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setEvidenceTries((n) => n + 1)
      setMarked([])
      setModal(false)
    }
  }

  const canJudge = marked.length > 0 || readToEnd

  return (
    <main className="shell reader">
      <div className="topbar">
        <button className="back" onClick={() => nav(`/case/${c.id}`)}>← 사건 파일</button>
        <span className="meta">조사 중</span>
      </div>
      <div className="rumor-bar">
        <div className="q">“{c.rumor}” <span className="muted small">— {c.source}</span></div>
        {outcome?.kind === 'wrong-verdict' && (
          <div className="hint">
            판정이 본문과 맞지 않습니다.{' '}
            {/* 안내는 화면이 실제로 달라진 만큼만 말한다 — 'absent' 사건은 범위를 좁히지 않는다 */}
            {view.highlight
              ? '표시된 절을 다시 읽어 보십시오.'
              : view.refs.length < c.scope.length
                ? '조사 범위를 좁혔습니다. 다시 읽어 보십시오.'
                : '본문을 처음부터 다시 읽어 보십시오.'}
          </div>
        )}
        {outcome?.kind === 'wrong-evidence' && (
          <div className="hint">판정은 맞지만 표시한 절은 근거가 되지 않습니다. 근거가 되는 절을 다시 표시하십시오.</div>
        )}
      </div>

      {passages.map((p) => (
        <section key={p.ref} className="passage">
          <h3>{p.label}</h3>
          {p.verses.map((v) => {
            const on = marked.includes(v.key)
            return (
              <button
                key={v.key}
                className={`verse ${on ? 'marked' : ''} ${highlight.has(v.key) ? 'hl' : ''}`}
                onClick={() => setMarked((m) => toggleMark(m, v.key))}
                aria-pressed={on}
              >
                <span className="n">{v.verse}</span>
                <span>{v.text}</span>
              </button>
            )
          })}
        </section>
      ))}
      <div ref={endRef} style={{ height: 1 }} />

      <div className="bottom-bar">
        <div className="inner">
          <span className="count">증거 {marked.length}/{MAX_EVIDENCE}</span>
          <button className="btn primary" disabled={!canJudge} onClick={() => setModal(true)}>판정하기</button>
        </div>
      </div>

      {modal && (
        <div className="modal-bg" onClick={() => setModal(false)}>
          <div className="modal" role="dialog" aria-label="판정" onClick={(e) => e.stopPropagation()}>
            <h2>이 소문은 본문과 어떤 관계입니까?</h2>
            <div className="verdicts">
              {VERDICTS.map((v) => (
                <button key={v} className={`vbtn ${v}`} onClick={() => submit(v)}>
                  <strong>{VERDICT_LABEL[v]}</strong>
                  <span>{VERDICT_DESC[v]}</span>
                </button>
              ))}
            </div>
            {marked.length === 0 && <p className="msg">표시한 절이 없습니다. ‘본문에 없음’이 아니라면 근거 절을 먼저 표시하십시오.</p>}
          </div>
        </div>
      )}
    </main>
  )
}
