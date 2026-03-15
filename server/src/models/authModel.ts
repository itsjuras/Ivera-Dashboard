import supabase from '../config/db'

interface ClientLookup {
  id: string
  firstName: string
  lastName: string
}

function stripToDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function findClientByPhone(phone: string): Promise<ClientLookup | null> {
  const inputDigits = stripToDigits(phone)

  if (inputDigits.length < 7) return null

  // Try exact match first (covers case where user includes country code)
  const { data: exactMatch, error: exactErr } = await supabase
    .from('clients')
    .select('id, first_name, last_name, phone')
    .eq('phone', phone.trim())
    .limit(1)
    .maybeSingle()

  if (exactErr) throw exactErr
  if (exactMatch) return mapClient(exactMatch)

  // Fetch candidates and match by trailing digits
  // e.g. input "6046167679" matches stored "+16046167679"
  const { data: candidates, error: searchErr } = await supabase
    .from('clients')
    .select('id, first_name, last_name, phone')
    .not('phone', 'is', null)

  if (searchErr) throw searchErr

  const match = (candidates ?? []).find((row) => {
    const storedDigits = stripToDigits(row.phone as string)
    return storedDigits.endsWith(inputDigits) || inputDigits.endsWith(storedDigits)
  })

  return match ? mapClient(match) : null
}

function mapClient(row: Record<string, unknown>): ClientLookup {
  return {
    id: row.id as string,
    firstName: (row.first_name as string) || '',
    lastName: (row.last_name as string) || '',
  }
}
