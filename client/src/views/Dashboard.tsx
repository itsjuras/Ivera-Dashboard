import { useState, useEffect } from 'react'
import {
  Users,
  Phone,
  DollarSign,
  UserCheck,
  CalendarDays,
  MessageSquare,
  CreditCard,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
  fetchStats,
  fetchBookings,
  fetchClients,
  fetchPayments,
  type DashboardStats,
  type Booking,
  type Client,
  type Payment,
} from '../services/api'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function initials(first = '', last = ''): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '—'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    Promise.all([
      fetchStats(),
      fetchBookings(),
      fetchClients(),
      fetchPayments(),
    ])
      .then(([statsData, bookingsData, clientsData, paymentsData]) => {
        if (cancelled) return
        setStats(statsData)
        setBookings(bookingsData)
        setClients(clientsData)
        setPayments(paymentsData)
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        setStats(emptyStats)
        setBookings([])
        setClients([])
        setPayments([])
        setError('We could not load all live receptionist dashboard data.')
      })

    return () => {
      cancelled = true
    }
  }, [user])

  if (!stats) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center pt-24">
        <div className="w-6 h-6 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
      </div>
    )
  }

  const upcomingBookings = bookings
    .filter((booking) => new Date(booking.bookingTime).getTime() >= Date.now() && booking.status !== 'cancelled')
    .sort((a, b) => new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime())
    .slice(0, 6)

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your AI receptionist's performance"
      />

      {error && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-5">
          <h3 className="text-sm font-medium text-neutral-500 mb-4">Upcoming Bookings</h3>
          {upcomingBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No upcoming live bookings.</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-neutral-900">{booking.clientName}</p>
                  <p className="text-xs text-neutral-500">{booking.serviceType}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {formatDate(booking.bookingTime)} at {formatTime(booking.bookingTime)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-5">
          <h3 className="text-sm font-medium text-neutral-500 mb-4">Newest Clients</h3>
          {recentClients.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No live clients yet.</p>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client) => (
                <div key={client.id} className="flex items-center gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                    {initials(client.firstName, client.lastName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">
                      Added {formatDate(client.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-5">
          <h3 className="text-sm font-medium text-neutral-500 mb-4">Recent Payments</h3>
          {recentPayments.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">No live payments yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-start gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <div className="mt-0.5 rounded-lg bg-neutral-100 p-2">
                    <CreditCard size={14} className="text-neutral-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">{payment.clientName}</p>
                    <p className="text-xs text-neutral-500">
                      ${payment.amount.toFixed(2)} · {payment.status}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">{formatDate(payment.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
