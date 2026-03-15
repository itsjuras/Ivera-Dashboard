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
    activeClientsRes,
    leadsRes,
    revenueRes,
    usageRes,
    totalBookingsRes,
    upcomingBookingsRes,
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),

    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .not('activated_at', 'is', null)
      .gte('activated_at', monthStart),

    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'succeeded')
      .gte('created_at', monthStart),

    supabase
      .from('usage')
      .select('calls_count, sms_used'),

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
    (sum, row) => sum + (parseFloat(row.amount) || 0),
    0
  )

  const usageData = usageRes.data ?? []
  const callsHandled = usageData.reduce((sum, row) => sum + (Number(row.calls_count) || 0), 0)
  const smsSent = usageData.reduce((sum, row) => sum + (Number(row.sms_used) || 0), 0)

  return {
    activeClients: activeClientsRes.count ?? 0,
    leadsConverted: leadsRes.count ?? 0,
    totalRevenue,
    callsHandled,
    totalBookings: totalBookingsRes.count ?? 0,
    upcomingBookings: upcomingBookingsRes.count ?? 0,
    smsSent,
  }
}
