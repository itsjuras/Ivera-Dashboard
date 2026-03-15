import supabase from '../config/db'

export interface Booking {
  id: string
  clientName: string
  serviceType: string
  bookingTime: string
  duration: number
  amount: number
  status: string
  source: string
}

export async function getAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      service_type,
      booking_time,
      duration_minutes,
      amount,
      status,
      booking_source,
      clients ( first_name, last_name )
    `)
    .order('booking_time', { ascending: false })
    .limit(50)

  if (error) throw error

  return (data ?? []).map(mapBooking)
}

function mapBooking(row: Record<string, unknown>): Booking {
  const client = row.clients as Record<string, string> | null
  return {
    id: row.id as string,
    clientName: client ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() : 'Unknown',
    serviceType: (row.service_type as string) || 'General',
    bookingTime: row.booking_time as string,
    duration: (row.duration_minutes as number) || 30,
    amount: parseFloat(row.amount as string) || 0,
    status: row.status as string,
    source: (row.booking_source as string) || 'phone',
  }
}
