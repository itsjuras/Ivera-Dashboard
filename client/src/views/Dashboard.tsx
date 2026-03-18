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

const mockStats: DashboardStats = {
  activeClients: 48,
  leadsConverted: 127,
  totalRevenue: 34200,
  callsHandled: 210,
  totalBookings: 89,
  upcomingBookings: 12,
  smsSent: 145,
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString()}`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>(mockStats)

  useEffect(() => {
    if (!user) {
      setStats(mockStats)
      return
    }
    fetchStats()
      .then(setStats)
      .catch(() => setStats(mockStats))
  }, [user])

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
          subtitle={user ? 'Current' : '3 added this week'}
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
