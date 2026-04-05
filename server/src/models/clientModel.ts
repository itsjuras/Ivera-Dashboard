import supabase from '../config/db'

export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  createdAt: string
}

export async function getAllClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  return (data ?? []).map(mapClient)
}

function mapClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    firstName: (row.first_name as string) || '',
    lastName: (row.last_name as string) || '',
    email: (row.email as string) || '',
    phone: (row.phone as string) || '',
    status: 'ACTIVE',
    createdAt: row.created_at as string,
  }
}
