// Shared types, constants, and pure utilities used by both SalesDashboard and CampaignEditor.
// Keep this file free of React imports (no JSX, no hooks).

export const SALES_API = 'https://sales.ivera.ca'

// ── Shared interfaces ─────────────────────────────────────────────────────────

export interface CampaignConfig {
  id?: string
  name?: string
  product_name: string
  product_context: string
  target_description: string
  num_leads_per_run: number
  schedule_days?: string[]
  schedule_time_local?: string
  schedule_timezone?: string
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  sender_name?: string | null
  sender_email?: string | null
  reply_to_email?: string | null
  cal_booking_url?: string | null
}

export interface CampaignDefinition {
  id: string
  name: string
  product_name: string
  product_context: string
  target_description: string
  num_leads_per_run: number
  status: 'active' | 'paused' | 'archived'
  is_default: boolean
  created_at: string
  updated_at: string
  total_runs?: number
  last_run_at?: string | null
  last_run_status?: string | null
  active_run_id?: string | null
  schedule_days?: string[]
  schedule_time_local?: string
  schedule_timezone?: string
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  sender_name?: string | null
  sender_email?: string | null
  reply_to_email?: string | null
  cal_booking_url?: string | null
}

export interface CampaignAnalytics {
  definitionId: string
  totalRuns: number
  sent: number
  replied: number
  booked: number
  bounced: number
  unsubscribed: number
  branchMix: {
    clicked: number
    opened: number
    cold: number
    replied_later: number
  }
  sourceMix: {
    exa: number
    scraped: number
    pattern: number
  }
  sourcePerformance: Array<{
    source: 'exa' | 'scraped' | 'pattern' | 'unknown'
    leads: number
    replied: number
    booked: number
    bounced: number
    unsubscribed: number
  }>
  latestRun: CampaignRun | null
  healthScore: number
}

export interface CampaignAssessment {
  summary: string
  strengths: string[]
  issues: string[]
  recommendations: string[]
  suggestedConfig: {
    product_name: string
    product_context: string
    target_description: string
    num_leads_per_run: number
  }
  changeSet: Array<{
    field: string
    from: unknown
    to: unknown
    reason: string
  }>
}

// Type alias for a single campaign run entry from PortalStats
export interface CampaignRun {
  id: string
  product_name: string
  campaign_name?: string | null
  campaign_definition_id?: string | null
  target_description: string
  created_at: string
  status?: string
  funnel_diagnostics?: {
    requested_leads?: number
    effective_run_limit?: number
    manual_override?: boolean
    raw_candidates?: number
    duplicate_candidates?: number
    fresh_candidates?: number
    enriched_contacts?: number
    qualified?: number
    email_found?: number
    no_email_found?: number
    leads_saved?: number
    sent?: number
    send_errors?: number
    risky_domains_suppressed?: number
    report_status?: string
    report_error_message?: string
    warmup_limit?: number | null
    reached_warmup_limit?: boolean
    reached_run_target?: boolean
    search_queries?: string[]
    search_passes?: Array<{
      query: string
      raw_candidates: number
      fresh_added: number
      duplicate_candidates?: number
    }>
    best_search_pass?: {
      query: string
      raw_candidates: number
      fresh_added: number
      duplicate_candidates?: number
    } | null
    email_sources?: {
      exa?: number
      scraped?: number
      pattern?: number
      skipped?: number
    }
    follow_up_branches?: {
      clicked?: number
      opened?: number
      cold?: number
      replied_later?: number
    }
    status_breakdown?: {
      replied?: number
      booked?: number
      unsubscribed?: number
      bounced?: number
    }
    updated_at?: string
  }
  total_leads: number
  qualified_leads: number
  emailed: number
  replied: number
  booked: number
  unsubscribed: number
  bounced?: number
  avg_score: number | null
  last_lead_at: string | null
}

export interface PendingRun {
  startedAt: number
  title: string
  requestedLeadCount: number | null
  campaignId: string | null
  completedAt: number | null
}

export interface LiveCampaignProgress {
  isComplete: boolean
  summary: string
  progressPercent: number
  steps: Array<{ key: string; label: string; done: boolean; state: string }>
  badge: string
  metrics: Array<{ label: string; value: string | number }>
}

export interface ListCardRow {
  id: string
  title: string
  meta: string
  badge?: string
  interactive?: boolean
  metrics?: Array<{ label: string; value: string | number }>
  detail?: string
}

// ── Shared utilities ──────────────────────────────────────────────────────────

export async function salesRequest<T>(token: string, path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SALES_API}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function formatRunDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatCampaignRunTitle(run: CampaignRun) {
  if (run.campaign_name) return run.campaign_name
  return run.product_name || 'Campaign run'
}

export function buildFunnelSummary(
  diagnostics: CampaignRun['funnel_diagnostics'] | undefined,
) {
  if (!diagnostics) return null

  const parts = [
    ['raw', diagnostics.raw_candidates],
    ['fresh', diagnostics.fresh_candidates],
    ['qualified', diagnostics.qualified],
    ['email', diagnostics.email_found],
    ['sent', diagnostics.sent],
  ]
    .filter(([, value]) => typeof value === 'number')
    .map(([label, value]) => `${label} ${value}`)

  return parts.length ? parts.join(' → ') : null
}

export function reportStatusLabel(status: string | undefined, error: string | undefined) {
  if (status === 'sent') return 'Report sent'
  if (status === 'failed') return error ? `Report failed: ${error}` : 'Report failed'
  return 'Report status unavailable'
}

export function tabButtonClass(active: boolean) {
  return `rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition ${
    active
      ? 'border-neutral-900 bg-neutral-900 text-white'
      : 'border-neutral-200 bg-white/70 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
  }`
}

export const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-neutral-100 text-neutral-600',
  replied: 'bg-emerald-100 text-emerald-700',
  opened: 'bg-blue-100 text-blue-700',
  booked: 'bg-neutral-900 text-white',
  emailed: 'bg-neutral-100 text-neutral-500',
  sent: 'bg-neutral-100 text-neutral-500',
  unsubscribed: 'bg-red-50 text-red-400',
  bounced: 'bg-orange-50 text-orange-600',
  disqualified: 'bg-neutral-50 text-neutral-400',
}
