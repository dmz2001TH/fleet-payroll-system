import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Trips from './pages/Trips'
import Summary from './pages/Summary'
import Adjustments from './pages/Adjustments'
import Drivers from './pages/Drivers'
import Periods from './pages/Periods'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { to: '/trips', icon: '🚛', label: 'เที่ยววิ่ง' },
    { to: '/summary', icon: '📊', label: 'สรุปเงินเดือน' },
    { to: '/adjustments', icon: '💰', label: 'เพิ่ม/หักเงิน' },
    { to: '/drivers', icon: '👥', label: 'รายชื่อคนขับ' },
    { to: '/periods', icon: '📅', label: 'รอบจ่ายเงิน' },
  ]

  return (
    <BrowserRouter>
      <div className="app-layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h1>🚛 NPC Fleet</h1>
            <div className="subtitle">ระบบจัดการเงินเดือนคนขับรถ</div>
          </div>
          <ul className="nav-links">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/trips" replace />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/adjustments" element={<Adjustments />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/periods" element={<Periods />} />
          </Routes>
        </main>

        <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>
    </BrowserRouter>
  )
}

export default App
