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
    .select('id, client_id, booking_time, duration_minutes, amount, status, booking_source')
    .order('booking_time', { ascending: false })
    .limit(50)

  if (error) throw error
  const clientIds = [...new Set((data ?? []).map((row) => row.client_id).filter(Boolean))]

  let contactsById = new Map<string, { first_name?: string | null; last_name?: string | null }>()
  if (clientIds.length > 0) {
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .in('id', clientIds)

    if (contactsError) throw contactsError

    contactsById = new Map(
      (contacts ?? []).map((contact) => [
        contact.id as string,
        {
          first_name: (contact.first_name as string | null) ?? null,
          last_name: (contact.last_name as string | null) ?? null,
        },
      ]),
    )
  }

  return (data ?? []).map((row) => {
    const client = contactsById.get(row.client_id as string)
    return {
      id: row.id as string,
      clientName: client ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() : 'Unknown',
      serviceType: 'Session',
      bookingTime: row.booking_time as string,
      duration: Number(row.duration_minutes) || 30,
      amount: parseFloat(String(row.amount ?? 0)) || 0,
      status: (row.status as string) || 'scheduled',
      source: (row.booking_source as string) || 'phone',
    }
  })
}
