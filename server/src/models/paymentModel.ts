import supabase from '../config/db'

export interface Payment {
  id: string
  clientName: string
  amount: number
  status: string
  createdAt: string
  cardBrand: string
  cardLast4: string
}

export async function getAllPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, client_id, amount, payment_status, created_at')
    .order('created_at', { ascending: false })
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
    const rawStatus = String(row.payment_status ?? 'pending').toLowerCase()
    const status =
      rawStatus === 'charged' || rawStatus === 'paid_cash'
        ? 'succeeded'
        : rawStatus === 'failed'
          ? 'failed'
          : 'pending'

    return {
      id: row.id as string,
      clientName: client ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() : 'Unknown',
      amount: parseFloat(String(row.amount ?? 0)) || 0,
      status,
      createdAt: row.created_at as string,
      cardBrand: '',
      cardLast4: '',
    }
  })
}
