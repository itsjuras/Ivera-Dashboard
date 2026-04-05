import supabase from '../config/db'
import { getCustomerProfile, getUserRole } from './userModel'

function normalizePhone(value: string | null | undefined): string {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const digits = text.replace(/\D/g, '')
  if (!digits) return ''
  if (text.startsWith('+')) return `+${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  return `+${digits}`
}

export async function resolveReceptionistCustomerId(userId: string): Promise<string | null> {
  const profile = await getCustomerProfile(userId)
  const twilioNumber = normalizePhone(profile.twilioNumber)

  if (twilioNumber) {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('customer_id')
      .eq('active', true)
      .eq('twilio_phone_number', twilioNumber)
      .maybeSingle()

    if (error) throw error
    const customerId = String(data?.customer_id ?? '').trim()
    if (customerId) return customerId
  }

  const role = await getUserRole(userId)
  if (role === 'ivera_admin') {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('customer_id')
      .eq('active', true)

    if (error) throw error

    const uniqueCustomerIds = [...new Set((data ?? []).map((row) => String(row.customer_id ?? '').trim()).filter(Boolean))]
    if (uniqueCustomerIds.length === 1) return uniqueCustomerIds[0] ?? null
  }

  return null
}
