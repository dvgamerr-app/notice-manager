import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'liff',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../public/liff', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/line': 'http://localhost:3000',
      '/flex': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    }
  }
})
