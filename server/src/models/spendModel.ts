import supabase from '../config/db'

export interface ProviderSpendEntry {
  providerSlug: string
  amountCad: number | null
  notes: string | null
  updatedAt?: string | null
}

function monthToDate(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Month must use YYYY-MM format')
  }

  return `${month}-01`
}

export async function listProviderSpend(month: string): Promise<ProviderSpendEntry[]> {
  const periodMonth = monthToDate(month)
  const { data, error } = await supabase
    .from('provider_spend_entries')
    .select('provider_slug, amount_cad, notes, updated_at')
    .eq('period_month', periodMonth)
    .order('provider_slug', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    providerSlug: row.provider_slug as string,
    amountCad: row.amount_cad as number | null,
    notes: row.notes as string | null,
    updatedAt: row.updated_at as string | null,
  }))
}

export async function upsertProviderSpend(
  month: string,
  entries: ProviderSpendEntry[],
  userId: string,
): Promise<ProviderSpendEntry[]> {
  const periodMonth = monthToDate(month)
  const rows = entries.map((entry) => ({
    period_month: periodMonth,
    provider_slug: entry.providerSlug,
    amount_cad: entry.amountCad,
    notes: entry.notes ?? null,
    updated_by: userId,
    created_by: userId,
  }))

  const { error } = await supabase
    .from('provider_spend_entries')
    .upsert(rows, { onConflict: 'period_month,provider_slug' })

  if (error) throw error

  return listProviderSpend(month)
}
