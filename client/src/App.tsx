import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './views/Dashboard'
import Bookings from './views/Bookings'
import Clients from './views/Clients'
import Payments from './views/Payments'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-neutral-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
