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
    .from('payments')
    .select(`
      id,
      amount,
      status,
      created_at,
      clients ( first_name, last_name )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return (data ?? []).map(mapPayment)
}

function mapPayment(row: Record<string, unknown>): Payment {
  const client = row.clients as Record<string, string> | null
  return {
    id: row.id as string,
    clientName: client ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() : 'Unknown',
    amount: parseFloat(row.amount as string) || 0,
    status: (row.status as string) || 'pending',
    createdAt: row.created_at as string,
    cardBrand: '',
    cardLast4: '',
  }
}
