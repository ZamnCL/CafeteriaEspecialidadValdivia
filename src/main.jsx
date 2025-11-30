import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 1. Bootstrap PRIMERO (Estilos base)
import 'bootstrap/dist/css/bootstrap.min.css'

// 2. Tus estilos LUEGO (Para sobrescribir a Bootstrap)
import './index.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)