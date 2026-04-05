import { listProviderSpend, upsertProviderSpend, type ProviderSpendEntry } from '../models/spendModel'

interface SyncSkip {
  providerSlug: string
  reason: string
}

interface SyncSummary {
  month: string
  entries: ProviderSpendEntry[]
  syncedProviders: string[]
  skippedProviders: SyncSkip[]
}

const SUPPORTED_PROVIDER_SLUGS = ['openai', 'claude', 'twilio'] as const

function monthStart(month: string): Date {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Month must use YYYY-MM format')
  }

  return new Date(`${month}-01T00:00:00.000Z`)
}

function monthEndExclusive(start: Date): Date {
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
}

function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

function toIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseMoneyValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (value && typeof value === 'object' && 'value' in value) {
    return parseMoneyValue((value as { value: unknown }).value)
  }
  return null
}

function sumNestedAmounts(node: unknown): number {
  if (Array.isArray(node)) {
    return node.reduce((sum, item) => sum + sumNestedAmounts(item), 0)
  }

  if (!node || typeof node !== 'object') return 0

  const record = node as Record<string, unknown>
  if ('amount' in record) {
    const parsed = parseMoneyValue(record.amount)
    if (parsed !== null) return parsed
  }

  return Object.values(record).reduce<number>((sum, value) => sum + sumNestedAmounts(value), 0)
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${body ? `: ${body.slice(0, 160)}` : ''}`)
  }
  return res.json()
}

async function fetchOpenAiMonthSpend(month: string): Promise<number> {
  const apiKey = process.env.OPENAI_ADMIN_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Missing OPENAI_ADMIN_API_KEY or OPENAI_API_KEY')
  }

  const start = monthStart(month)
  const end = monthEndExclusive(start)
  let nextPage: string | null = null
  let total = 0

  do {
    const params = new URLSearchParams({
      start_time: String(toUnixSeconds(start)),
      end_time: String(toUnixSeconds(end)),
      bucket_width: '1d',
      limit: '31',
    })
    if (nextPage) params.set('page', nextPage)

    const json = await fetchJson(`https://api.openai.com/v1/organization/costs?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const payload = json as {
      data?: Array<{ results?: unknown[] }>
      next_page?: string | null
    }

    for (const bucket of payload.data ?? []) {
      total += sumNestedAmounts(bucket.results ?? [])
    }

    nextPage = payload.next_page ?? null
  } while (nextPage)

  return Number(total.toFixed(2))
}

async function fetchAnthropicMonthSpend(month: string): Promise<number> {
  const apiKey = process.env.ANTHROPIC_ADMIN_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_ADMIN_API_KEY or ANTHROPIC_API_KEY')
  }

  const start = monthStart(month)
  const end = monthEndExclusive(start)
  let nextPage: string | null = null
  let total = 0

  do {
    const params = new URLSearchParams({
      starting_at: start.toISOString(),
      ending_at: end.toISOString(),
      bucket_width: '1d',
      limit: '31',
    })
    if (nextPage) params.set('page', nextPage)

    const json = await fetchJson(`https://api.anthropic.com/v1/organizations/cost_report?${params.toString()}`, {
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
    })

    const payload = json as {
      data?: Array<{ results?: Array<{ amount?: unknown }> }>
      has_more?: boolean
      next_page?: string | null
    }

    for (const bucket of payload.data ?? []) {
      for (const result of bucket.results ?? []) {
        total += parseMoneyValue(result.amount) ?? 0
      }
    }

    nextPage = payload.has_more ? payload.next_page ?? null : null
  } while (nextPage)

  return Number(total.toFixed(2))
}

async function fetchTwilioMonthSpend(month: string): Promise<number> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN')
  }

  const start = monthStart(month)
  const end = monthEndExclusive(start)
  const params = new URLSearchParams({
    Category: 'totalprice',
    StartDate: toIsoDay(start),
    EndDate: toIsoDay(end),
  })

  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const json = await fetchJson(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Usage/Records/Monthly.json?${params.toString()}`,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    },
  )

  const payload = json as {
    usage_records?: Array<{ price?: unknown }>
    price?: unknown
  }

  const rawTotal =
    payload.usage_records?.reduce((sum, record) => sum + (parseMoneyValue(record.price) ?? 0), 0) ??
    (parseMoneyValue(payload.price) ?? 0)

  return Number(Math.abs(rawTotal).toFixed(2))
}

export async function syncProviderSpend(month: string, userId: string): Promise<SyncSummary> {
  const existing = await listProviderSpend(month)
  const existingByProvider = new Map(existing.map((entry) => [entry.providerSlug, entry]))
  const syncedProviders: string[] = []
  const skippedProviders: SyncSkip[] = []

  const syncedEntries = new Map<string, ProviderSpendEntry>()

  for (const providerSlug of SUPPORTED_PROVIDER_SLUGS) {
    try {
      const amount =
        providerSlug === 'openai'
          ? await fetchOpenAiMonthSpend(month)
          : providerSlug === 'claude'
            ? await fetchAnthropicMonthSpend(month)
            : await fetchTwilioMonthSpend(month)

      syncedEntries.set(providerSlug, {
        providerSlug,
        amountCad: amount,
        notes: 'Auto-synced from provider API',
      })
      syncedProviders.push(providerSlug)
    } catch (err) {
      skippedProviders.push({
        providerSlug,
        reason: err instanceof Error ? err.message : 'Sync failed',
      })
    }
  }

  const mergedEntries: ProviderSpendEntry[] = []
  const seen = new Set<string>()

  for (const syncedEntry of syncedEntries.values()) {
    mergedEntries.push(syncedEntry)
    seen.add(syncedEntry.providerSlug)
  }

  for (const entry of existing) {
    if (seen.has(entry.providerSlug)) continue
    mergedEntries.push(existingByProvider.get(entry.providerSlug) ?? entry)
    seen.add(entry.providerSlug)
  }

  const entries = mergedEntries.length > 0 ? await upsertProviderSpend(month, mergedEntries, userId) : existing

  return {
    month,
    entries,
    syncedProviders,
    skippedProviders,
  }
}
