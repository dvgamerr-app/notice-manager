import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore Vite loads CSS side effects at build time.
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
