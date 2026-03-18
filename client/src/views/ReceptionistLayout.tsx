import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Dashboard from './Dashboard'
import Bookings from './Bookings'
import Clients from './Clients'
import Payments from './Payments'

export default function ReceptionistLayout() {
  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="*" element={<Navigate to="/dashboard/receptionist" replace />} />
        </Routes>
      </div>
    </div>
  )
}
