import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import WaveBackground from './components/WaveBackground'
import MockDataPopup from './components/MockDataBanner'
import { fetchStats } from './services/api'
import ChatWidget from './components/ChatWidget'
import SupportDashboard from './views/SupportDashboard'
import Landing from './views/Landing'
import Login from './views/Login'
import Signup from './views/Signup'
import Onboard from './views/Onboard'
import ReceptionistLayout from './views/ReceptionistLayout'
import SalesDashboard from './views/SalesDashboard'
import ConsultantDashboard from './views/ConsultantDashboard'
import About from './views/About'
import Portal from './views/Portal'
import AdminDashboard from './views/AdminDashboard'

// Registry of all products. Adding a new product = add one entry here.
// The slug must match the slug in the `products` DB table.
const PRODUCT_REGISTRY: Record<string, { label: string; path: string }> = {
  receptionist: { label: 'Receptionist', path: '/dashboard/receptionist' },
  sales:        { label: 'Sales Agent',  path: '/dashboard/sales' },
  consultant:   { label: 'Consultant',   path: '/dashboard/consultant' },
  support:      { label: 'Support',      path: '/dashboard/support' },
}

function NoProducts() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-neutral-500 text-sm">No products assigned to your account yet.</p>
        <p className="text-neutral-400 text-xs mt-1">Contact your Ivera administrator to get started.</p>
      </div>
    </div>
  )
}

function DashboardShell() {
  const { pathname } = useLocation()
  const { user, role, products, signOut } = useAuth()
  const navigate = useNavigate()
  const [showPopup, setShowPopup] = useState(false)

  // Build nav only from products this user has access to, in registry order
  const accessibleAgents = Object.entries(PRODUCT_REGISTRY).flatMap(([slug, info]) =>
    products.some((p) => p.productSlug === slug) ? [info] : [],
  )

  useEffect(() => {
    if (!user) return
    fetchStats().catch(() => setShowPopup(true))
  }, [user])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="relative h-screen flex flex-col">
      <WaveBackground backgroundColor="#fafafa" strokeColor="#e5e5e5" />
      {showPopup && <MockDataPopup onClose={() => setShowPopup(false)} />}

      {/* Fixed nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
          <a href="/" className="text-xl font-semibold tracking-widest uppercase text-white">
            Ivera
          </a>
          <div className="hidden sm:flex items-center gap-6 text-xs tracking-widest uppercase text-white">
            {accessibleAgents.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={`transition-opacity ${pathname.startsWith(path) ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              >
                {label}
              </NavLink>
            ))}
            {role === 'ivera_admin' && (
              <NavLink
                to="/dashboard/admin"
                className={`transition-opacity ${pathname.startsWith('/dashboard/admin') ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              >
                Admin
              </NavLink>
            )}
          </div>
          {user ? (
            <button
              onClick={handleSignOut}
              className="px-4 py-1.5 text-xs font-medium tracking-widest rounded-lg uppercase border border-white text-white hover:opacity-60 transition-opacity"
            >
              Sign out
            </button>
          ) : (
            <NavLink
              to="/login"
              className="px-4 py-1.5 text-xs font-medium tracking-widest rounded-lg uppercase border border-white text-white hover:opacity-60 transition-opacity"
            >
              Sign in
            </NavLink>
          )}
        </div>
      </nav>

      {/* Fixed fade overlay */}
      <div
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: 120,
          background: 'linear-gradient(to bottom, #fafafa 0%, #fafafa 45%, transparent 100%)',
        }}
      />

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0 pt-14">
        <Routes>
          <Route path="/receptionist/*" element={<ReceptionistLayout />} />
          <Route path="/sales" element={<SalesDashboard />} />
          <Route path="/consultant" element={<ConsultantDashboard />} />
          <Route path="/support" element={<SupportDashboard />} />
          <Route path="/admin" element={role === 'ivera_admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
          <Route
            path="/"
            element={
              accessibleAgents.length > 0
                ? <Navigate to={accessibleAgents[0].path} replace />
                : <NoProducts />
            }
          />
          <Route
            path="*"
            element={
              accessibleAgents.length > 0
                ? <Navigate to={accessibleAgents[0].path} replace />
                : <NoProducts />
            }
          />
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
          <Route path="/about" element={<About />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/onboard" element={<Onboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard/*" element={<DashboardShell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </AuthProvider>
  )
}
