import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'

const motrixResetKeys = [
  'autopulse-data',
  'autopulse-vehicle',
  'autopulse-profile',
  'autopulse-analysis',
  'autopulse-owner-profile',
  'autopulse-reminders',
  'autopulse-chat',
  'autopulse-vehicle-render',
]

if (new URLSearchParams(window.location.search).has('reset')) {
  motrixResetKeys.forEach((key) => localStorage.removeItem(key))
  window.history.replaceState({}, '', window.location.pathname)
}


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
