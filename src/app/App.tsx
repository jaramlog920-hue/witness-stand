import { Routes, Route, Navigate, useLocation } from 'react-router'
import { useProgress } from '../store/progress'
import { Mandate } from '../features/mandate/Mandate'
import { Board } from '../features/board/Board'
import { CaseFile } from '../features/investigate/CaseFile'
import { Investigate } from '../features/investigate/Investigate'
import { Result } from '../features/investigate/Result'
import { Archive } from '../features/archive/Archive'
import { Witness } from '../features/witness/Witness'
import { WitnessResult } from '../features/witness/WitnessResult'
import { Complete } from '../features/complete/Complete'

// 위임장을 받아들이기 전에는 어디로 가든 위임장으로 (spec §7)
function Gate({ children }: { children: React.ReactNode }) {
  const accepted = useProgress((s) => s.investigator.accepted)
  const loc = useLocation()
  if (!accepted) return <Navigate to="/" replace state={{ from: loc.pathname }} />
  return children
}

export function App() {
  const accepted = useProgress((s) => s.investigator.accepted)
  return (
    <Routes>
      <Route path="/" element={accepted ? <Navigate to="/board" replace /> : <Mandate />} />
      <Route path="/board" element={<Gate><Board /></Gate>} />
      <Route path="/case/:id" element={<Gate><CaseFile /></Gate>} />
      <Route path="/case/:id/read" element={<Gate><Investigate /></Gate>} />
      <Route path="/case/:id/result" element={<Gate><Result /></Gate>} />
      <Route path="/witness/:id" element={<Gate><Witness /></Gate>} />
      <Route path="/witness/:id/result" element={<Gate><WitnessResult /></Gate>} />
      <Route path="/archive" element={<Gate><Archive /></Gate>} />
      <Route path="/complete" element={<Gate><Complete /></Gate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
