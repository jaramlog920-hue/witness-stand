import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Analytics } from '@vercel/analytics/react'
import { App } from './app/App'
import './app/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {/* Vercel 대시보드의 방문 통계. 쿠키·개인정보 없이 페이지 조회만 센다 */}
    <Analytics />
  </StrictMode>,
)
