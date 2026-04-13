import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const CHUNK_RELOAD_KEY = 'bitpacs_chunk_reload_once'

window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event.reason || '')
  const isChunkError = reason.includes('Failed to fetch dynamically imported module')

  if (!isChunkError) return

  const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1'
  if (alreadyReloaded) return

  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  window.location.reload()
})

window.addEventListener('load', () => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
