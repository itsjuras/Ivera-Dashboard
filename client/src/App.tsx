import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import WaveBackground from './components/WaveBackground'
import Landing from './views/Landing'
import Login from './views/Login'
import Signup from './views/Signup'
import Dashboard from './views/Dashboard'
import Bookings from './views/Bookings'
import Clients from './views/Clients'
import Payments from './views/Payments'

function DashboardLayout() {
  return (
    <div className="relative flex h-screen">
      <WaveBackground backgroundColor="#fafafa" strokeColor="#e5e5e5" />
      <Sidebar />
      <main className="relative z-10 flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
