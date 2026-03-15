import {
  Users,
  Phone,
  DollarSign,
  UserCheck,
  CalendarDays,
  MessageSquare,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import RevenueChart from '../components/RevenueChart'
import UsageChart from '../components/UsageChart'
import UpcomingBookings from '../components/UpcomingBookings'
import RecentActivity from '../components/RecentActivity'

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your AI receptionist's performance"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Active Clients"
          value={48}
          subtitle="3 added this week"
          icon={Users}
        />
        <StatCard
          label="Leads Converted"
          value={127}
          subtitle="This month"
          icon={UserCheck}
        />
        <StatCard
          label="Total Revenue"
          value="$34,200"
          subtitle="This month"
          icon={DollarSign}
        />
        <StatCard
          label="Calls Handled"
          value={210}
          subtitle="This month"
          icon={Phone}
        />
        <StatCard
          label="Bookings"
          value={89}
          subtitle="12 upcoming"
          icon={CalendarDays}
        />
        <StatCard
          label="SMS Sent"
          value={145}
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
