/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/*', 'apple-touch-icon.png', 'favicon.ico'],
      manifest: {
        name: '증언대: 신약 재판소',
        short_name: '증언대',
        description: '소문을 신약 본문으로 검증하는 조사 게임',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        background_color: '#14110d',
        theme_color: '#14110d',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // 본문 JSON이 번들에 포함되므로 JS까지 캐시하면 오프라인 조사가 된다
        globPatterns: ['**/*.{js,css,html,webp,png,svg}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
})
