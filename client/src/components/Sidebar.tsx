import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CreditCard,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/bookings', icon: CalendarDays, label: 'Bookings' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-neutral-200 flex flex-col">
      <div className="px-6 py-5 border-b border-neutral-200">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
          ivera
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">Business Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-neutral-200">
        <p className="text-xs text-neutral-400">v0.1.0</p>
      </div>
    </aside>
  )
}
