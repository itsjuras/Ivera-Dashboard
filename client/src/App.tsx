import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import WaveBackground from './components/WaveBackground'
import Landing from './views/Landing'
import Login from './views/Login'
import Signup from './views/Signup'
import Onboard from './views/Onboard'
import ReceptionistLayout from './views/ReceptionistLayout'
import SalesDashboard from './views/SalesDashboard'
import ConsultantDashboard from './views/ConsultantDashboard'

const CAL_URL = 'https://cal.com/vaidas-makselis-wvjvqz/ivera-sales-agent'

const agents = [
  { to: '/dashboard/receptionist', label: 'Receptionist' },
  { to: '/dashboard/sales', label: 'Sales Agent' },
  { to: '/dashboard/consultant', label: 'Consultant' },
]

function DashboardShell() {
  const { pathname } = useLocation()

  return (
    <div className="relative h-screen flex flex-col">
      <WaveBackground backgroundColor="#fafafa" strokeColor="#e5e5e5" />

      {/* Fixed nav — z-50, identical to landing page */}
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
          <a href="/" className="text-xl font-semibold tracking-widest uppercase text-white">
            Ivera
          </a>
          <div className="hidden sm:flex items-center gap-6 text-xs tracking-widest uppercase text-white">
            {agents.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={`transition-opacity ${pathname.startsWith(to) ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              >
                {label}
              </NavLink>
            ))}
          </div>
          <a
            href={CAL_URL}
            className="px-4 py-1.5 text-xs font-medium tracking-widest rounded-lg uppercase border border-white text-white hover:opacity-60 transition-opacity"
          >
            Book a demo
          </a>
        </div>
      </nav>

      {/* Fixed fade overlay — z-40, identical to landing page */}
      <div
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: 120,
          background: 'linear-gradient(to bottom, #fafafa 0%, #fafafa 45%, transparent 100%)',
        }}
      />

      {/* Content — scrolls beneath the fixed nav + gradient */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0 pt-14">
        <Routes>
          <Route path="/receptionist/*" element={<ReceptionistLayout />} />
          <Route path="/sales" element={<SalesDashboard />} />
          <Route path="/consultant" element={<ConsultantDashboard />} />
          <Route path="/" element={<Navigate to="/dashboard/receptionist" replace />} />
          <Route path="*" element={<Navigate to="/dashboard/receptionist" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboard" element={<Onboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard/*" element={<DashboardShell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
