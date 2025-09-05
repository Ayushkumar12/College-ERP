import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { fixMobileViewport, preventIOSZoom } from './utils/mobileUtils'

// Initialize mobile optimizations
fixMobileViewport();
preventIOSZoom();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
