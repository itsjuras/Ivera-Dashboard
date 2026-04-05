import supabase from '../config/db'

export interface DashboardStats {
  activeClients: number
  leadsConverted: number
  totalRevenue: number
  callsHandled: number
  totalBookings: number
  upcomingBookings: number
  smsSent: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date().toISOString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    contactsRes,
    bookedContactsRes,
    revenueRes,
    remindersRes,
    totalBookingsRes,
    upcomingBookingsRes,
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      ,

    supabase
      .from('bookings')
      .select('client_id')
      .gte('created_at', monthStart),

    supabase
      .from('bookings')
      .select('amount, payment_status')
      .gte('created_at', monthStart),

    supabase
      .from('reminders')
      .select('reminder_24h_sent_at, reminder_2h_sent_at, trainer_notified_at, followup_sent_at'),

    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true }),

    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gt('booking_time', now)
      .neq('status', 'cancelled'),
  ])

  const totalRevenue = (revenueRes.data ?? []).reduce(
    (sum, row) => {
      const paymentStatus = String(row.payment_status ?? '').toLowerCase()
      if (paymentStatus !== 'charged' && paymentStatus !== 'paid_cash') return sum
      return sum + (parseFloat(String(row.amount ?? 0)) || 0)
    },
    0
  )

  const bookedClientIds = new Set(
    (bookedContactsRes.data ?? [])
      .map((row) => row.client_id as string | null)
      .filter((value): value is string => Boolean(value)),
  )

  const reminders = remindersRes.data ?? []
  const smsSent = reminders.reduce((sum, row) => (
    sum
      + (row.reminder_24h_sent_at ? 1 : 0)
      + (row.reminder_2h_sent_at ? 1 : 0)
      + (row.followup_sent_at ? 1 : 0)
      + (row.trainer_notified_at ? 1 : 0)
  ), 0)

  return {
    activeClients: contactsRes.count ?? 0,
    leadsConverted: bookedClientIds.size,
    totalRevenue,
    callsHandled: totalBookingsRes.count ?? 0,
    totalBookings: totalBookingsRes.count ?? 0,
    upcomingBookings: upcomingBookingsRes.count ?? 0,
    smsSent,
  }
}
