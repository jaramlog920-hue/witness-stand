import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useProgress } from '../../store/progress'
import { passageFor } from '../../content/cases'

// 데오빌로의 위임장 — 눅 1:1-4 를 본문 JSON에서 꺼내 보여준다 (기억으로 쓰지 않음)
export function Mandate() {
  const nav = useNavigate()
  const setInvestigator = useProgress((s) => s.setInvestigator)
  const [name, setName] = useState('')
  const p = passageFor('눅 1:1-4')

  return (
    <main className="shell">
      <div className="topbar"><h1>증언대: 신약 재판소</h1></div>
      <section className="mandate">
        <blockquote>
          {p.verses.map((v) => <p key={v.key} style={{ margin: '0 0 6px' }}>{v.text}</p>)}
          <cite>{p.label}</cite>
        </blockquote>
        <p className="muted small">
          각하께서 이 기록의 확실함을 알고자 하십니다. 시중에 도는 소문들을 하나씩 본문과 대조하여 판정을 보고하십시오.
        </p>
        <label className="field">
          <span className="small muted">조사관 이름 (선택)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="조사관" maxLength={12} />
        </label>
        <button
          className="btn primary block"
          onClick={() => {
            setInvestigator(name)
            nav('/board', { replace: true })
          }}
        >
          위임을 받아들인다
        </button>
      </section>
    </main>
  )
}
