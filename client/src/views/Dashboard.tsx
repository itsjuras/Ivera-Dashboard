import { useState, useEffect } from 'react'
import {
  Users,
  Phone,
  DollarSign,
  UserCheck,
  CalendarDays,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { fetchStats, type DashboardStats } from '../services/api'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import RevenueChart from '../components/RevenueChart'
import UsageChart from '../components/UsageChart'
import UpcomingBookings from '../components/UpcomingBookings'
import RecentActivity from '../components/RecentActivity'

const emptyStats: DashboardStats = {
  activeClients: 0,
  leadsConverted: 0,
  totalRevenue: 0,
  callsHandled: 0,
  totalBookings: 0,
  upcomingBookings: 0,
  smsSent: 0,
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString()}`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    if (!user) return
    fetchStats()
      .then(setStats)
      .catch(() => setStats(emptyStats))
  }, [user])

  if (!stats) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center pt-24">
        <div className="w-6 h-6 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your AI receptionist's performance"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Active Clients"
          value={stats.activeClients}
          subtitle="Current"
          icon={Users}
        />
        <StatCard
          label="Leads Converted"
          value={stats.leadsConverted}
          subtitle="This month"
          icon={UserCheck}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle="This month"
          icon={DollarSign}
        />
        <StatCard
          label="Calls Handled"
          value={stats.callsHandled}
          subtitle="This month"
          icon={Phone}
        />
        <StatCard
          label="Bookings"
          value={stats.totalBookings}
          subtitle={`${stats.upcomingBookings} upcoming`}
          icon={CalendarDays}
        />
        <StatCard
          label="SMS Sent"
          value={stats.smsSent}
          subtitle="Reminders & confirmations"
          icon={MessageSquare}
        />
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
  )
}
