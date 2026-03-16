import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { LogWorkout } from './pages/LogWorkout'
import { History } from './pages/History'
import { Exercises } from './pages/Exercises'

export function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
        <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/log">Log</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/exercises">Exercises</NavLink>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log" element={<LogWorkout />} />
          <Route path="/history" element={<History />} />
          <Route path="/exercises" element={<Exercises />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
