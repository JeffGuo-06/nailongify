import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import IntroPage from './components/IntroPage.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import './styles/App.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/game" element={<App />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
