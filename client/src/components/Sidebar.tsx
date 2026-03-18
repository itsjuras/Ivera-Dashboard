import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CreditCard,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard/receptionist', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/receptionist/bookings', icon: CalendarDays, label: 'Bookings' },
  { to: '/dashboard/receptionist/clients', icon: Users, label: 'Clients' },
  { to: '/dashboard/receptionist/payments', icon: CreditCard, label: 'Payments' },
]

export default function Sidebar() {
  return (
    <aside className="relative w-60 bg-white/80 border-r border-neutral-200/60 flex flex-col shrink-0">
      <div className="px-6 pt-16 pb-5 border-b border-neutral-200">
        <p className="text-xs tracking-widest text-neutral-900 font-medium uppercase">AI Receptionist</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard/receptionist'}
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
    </aside>
  )
}
