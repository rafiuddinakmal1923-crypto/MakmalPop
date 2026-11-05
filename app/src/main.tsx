import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// No <StrictMode>: its dev-only double mount breaks drei <Html>'s inner React root under React 19
// (the page DOM never renders). Production behaviour is the same either way.
createRoot(document.getElementById('root')!).render(<App />)
