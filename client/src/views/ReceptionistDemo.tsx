import { Link } from 'react-router-dom'
import {
  Users,
  Phone,
  DollarSign,
  UserCheck,
  CalendarDays,
  MessageSquare,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import RevenueChart from '../components/RevenueChart'
import UsageChart from '../components/UsageChart'
import UpcomingBookings from '../components/UpcomingBookings'
import RecentActivity from '../components/RecentActivity'

const demoStats = {
  activeClients: 18,
  leadsConverted: 9,
  totalRevenue: '$6,300',
  callsHandled: 189,
  totalBookings: 34,
  upcomingBookings: 7,
  smsSent: 134,
}

export default function ReceptionistDemo() {
  return (
    <div className="relative h-screen flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
          <a href="/" className="text-xl font-semibold tracking-widest uppercase text-white">
            Ivera
          </a>
          <div className="hidden sm:flex items-center gap-6 text-xs tracking-widest uppercase text-white">
            <a href="/#receptionist" className="opacity-60 hover:opacity-100 transition-opacity">Receptionist</a>
            <a href="/#sales" className="opacity-60 hover:opacity-100 transition-opacity">Sales Agent</a>
            <a href="/#consultant" className="opacity-60 hover:opacity-100 transition-opacity">Consultant</a>
            <a href="/#support" className="opacity-60 hover:opacity-100 transition-opacity">Support</a>
          </div>
          <Link
            to="/login"
            className="px-4 py-1.5 text-xs font-medium tracking-widest rounded-lg uppercase border border-white text-white hover:opacity-60 transition-opacity"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <div
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: 120,
          background: 'linear-gradient(to bottom, #fafafa 0%, #fafafa 45%, transparent 100%)',
        }}
      />

      <main className="relative z-10 flex-1 flex min-h-0 pt-14">
        <Sidebar basePath="/demo/receptionist" demo />
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto">
            <PageHeader
              title="Receptionist Demo"
              subtitle="Sample data for public preview. Sign in to see your live business data."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <StatCard label="Active Clients" value={demoStats.activeClients} subtitle="Current" icon={Users} />
              <StatCard label="Leads Converted" value={demoStats.leadsConverted} subtitle="This month" icon={UserCheck} />
              <StatCard label="Total Revenue" value={demoStats.totalRevenue} subtitle="This month" icon={DollarSign} />
              <StatCard label="Calls Handled" value={demoStats.callsHandled} subtitle="This month" icon={Phone} />
              <StatCard label="Bookings" value={demoStats.totalBookings} subtitle={`${demoStats.upcomingBookings} upcoming`} icon={CalendarDays} />
              <StatCard label="SMS Sent" value={demoStats.smsSent} subtitle="Reminders & confirmations" icon={MessageSquare} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <RevenueChart />
              <UsageChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <UpcomingBookings />
              <RecentActivity />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
