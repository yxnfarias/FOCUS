import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'FOCUS — Organização Pessoal',
        short_name: 'FOCUS',
        description: 'Sua vida organizada: finanças, hábitos, tarefas e metas.',
        theme_color: '#3B82F6',
        background_color: '#FFFFFF',
        display: 'standalone',
        icons: [
          { src: 'favicon.ico', sizes: '64x64', type: 'image/x-icon' },
        ],
      },
    }),
  ],
})
