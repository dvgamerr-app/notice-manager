import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/liff/',
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist/liff', emptyOutDir: true },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    ws: {
      host: '127.0.0.1',
      port: 5173,
      clientPort: 5173,
    },
    proxy: {
      '/app': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    }
  }
})
