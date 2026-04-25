import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer'
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

export interface SendGridUsageSummary {
  month: string
  creditsRemaining: number | null
  usedQuotaPercent: number | null
  creditsTotal: number | null
  lastReset: string | null
  nextReset: string | null
  resetFrequency: string | null
}

export interface ExaUsageSummary {
  month: string
  totalCostUsd: number | null
  apiKeyName: string | null
  breakdownCount: number
  topLineItems: Array<{
    priceName: string
    quantity: number | null
    amountUsd: number | null
  }>
}

const SUPPORTED_PROVIDER_SLUGS = ['openai', 'claude', 'twilio', 'aws'] as const

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

export async function fetchSendGridUsage(month: string): Promise<SendGridUsageSummary> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    throw new Error('Missing SENDGRID_API_KEY')
  }

  const json = await fetchJson('https://api.sendgrid.com/v3/user/credits', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = json as {
    remain?: unknown
    total?: unknown
    used?: unknown
    last_reset?: unknown
    next_reset?: unknown
    reset_frequency?: unknown
  }

  const creditsRemaining = parseMoneyValue(payload.remain)
  const creditsTotal = parseMoneyValue(payload.total)
  const used = parseMoneyValue(payload.used)
  const usedQuotaPercent =
    creditsTotal && creditsRemaining !== null
      ? Number((((creditsTotal - creditsRemaining) / creditsTotal) * 100).toFixed(1))
      : used !== null
        ? used
        : null

  return {
    month,
    creditsRemaining,
    creditsTotal,
    usedQuotaPercent:
      usedQuotaPercent !== null && Number.isFinite(usedQuotaPercent) ? usedQuotaPercent : null,
    lastReset: typeof payload.last_reset === 'string' ? payload.last_reset : null,
    nextReset: typeof payload.next_reset === 'string' ? payload.next_reset : null,
    resetFrequency: typeof payload.reset_frequency === 'string' ? payload.reset_frequency : null,
  }
}

export async function fetchExaUsage(month: string): Promise<ExaUsageSummary> {
  const serviceKey = process.env.EXA_SERVICE_API_KEY
  const apiKeyId = process.env.EXA_API_KEY_ID

  if (!serviceKey) {
    throw new Error('Missing EXA_SERVICE_API_KEY')
  }

  if (!apiKeyId) {
    throw new Error('Missing EXA_API_KEY_ID')
  }

  const start = monthStart(month)
  const end = monthEndExclusive(start)
  const params = new URLSearchParams({
    start_date: start.toISOString(),
    end_date: new Date(end.getTime() - 1000).toISOString(),
    group_by: 'day',
  })

  const json = await fetchJson(
    `https://admin-api.exa.ai/team-management/api-keys/${encodeURIComponent(apiKeyId)}/usage?${params.toString()}`,
    {
      headers: {
        'x-api-key': serviceKey,
        'Content-Type': 'application/json',
      },
    },
  )

  const payload = json as {
    api_key_name?: unknown
    total_cost_usd?: unknown
    cost_breakdown?: Array<{
      price_name?: unknown
      quantity?: unknown
      amount_usd?: unknown
    }>
  }

  const costBreakdown = payload.cost_breakdown ?? []

  return {
    month,
    totalCostUsd: parseMoneyValue(payload.total_cost_usd),
    apiKeyName: typeof payload.api_key_name === 'string' ? payload.api_key_name : null,
    breakdownCount: costBreakdown.length,
    topLineItems: costBreakdown.slice(0, 3).map((item) => ({
      priceName: typeof item.price_name === 'string' ? item.price_name : 'Exa usage',
      quantity: parseMoneyValue(item.quantity),
      amountUsd: parseMoneyValue(item.amount_usd),
    })),
  }
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

async function fetchAwsMonthSpend(month: string): Promise<number> {
  const accessKeyId = process.env.AWS_BILLING_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey =
    process.env.AWS_BILLING_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const sessionToken = process.env.AWS_BILLING_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN
  const region = process.env.AWS_BILLING_REGION || process.env.AWS_REGION || 'us-east-1'

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS_BILLING_ACCESS_KEY_ID or AWS_ACCESS_KEY_ID')
  }

  const start = monthStart(month)
  const end = monthEndExclusive(start)
  const client = new CostExplorerClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
      ...(sessionToken ? { sessionToken } : {}),
    },
  })

  const result = await client.send(
    new GetCostAndUsageCommand({
      TimePeriod: {
        Start: toIsoDay(start),
        End: toIsoDay(end),
      },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
    }),
  )

  const amount = result.ResultsByTime?.reduce((sum, item) => {
    const raw = item.Total?.UnblendedCost?.Amount
    return sum + (parseMoneyValue(raw) ?? 0)
  }, 0) ?? 0

  return Number(amount.toFixed(2))
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
            : providerSlug === 'twilio'
              ? await fetchTwilioMonthSpend(month)
              : await fetchAwsMonthSpend(month)

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
