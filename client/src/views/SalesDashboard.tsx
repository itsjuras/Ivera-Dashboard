import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  CalendarCheck,
  Send,
  Reply,
  SlidersHorizontal,
  Play,
  X,
  Pause,
  RotateCcw,
  Archive,
  Plus,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import {
  bookingRate,
  branchLabel,
  buildCampaignAnalytics,
  healthTone,
  replyRate,
  sourceLabel,
  unsubscribeRate,
} from './salesAnalytics'

const SALES_API = 'https://sales.ivera.ca'

interface PortalStats {
  totals: {
    emailed: number
    replied: number
    booked: number
    unsubscribed: number
    bounced?: number
    weekEmailed: number
  }
  recentLeads: Array<{
    id: string
    company: string
    email: string
    status: string
    qualify_score: number | null
    created_at: string
  }>
  leadActivity?: Array<{
    date: string
    sent: number
    replied: number
    booked: number
    unsubscribed: number
  }>
  followUpPerformance?: Array<{
    branch: 'clicked' | 'opened' | 'cold' | 'replied_later'
    sent: number
    leads: number
    replied: number
    booked: number
    bounced: number
    unsubscribed: number
  }>
  campaignSourcePerformance?: Array<{
    campaign_definition_id: string
    source: 'exa' | 'scraped' | 'pattern' | 'unknown'
    leads: number
    replied: number
    booked: number
    bounced: number
    unsubscribed: number
  }>
  campaigns: Array<{
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
  }>
}

interface CampaignConfig {
  id?: string
  name?: string
  product_name: string
  product_context: string
  target_description: string
  num_leads_per_run: number
  sender_name?: string | null
  sender_email?: string | null
  reply_to_email?: string | null
  cal_booking_url?: string | null
}

interface CampaignDefinition {
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
}

interface CampaignAnalytics {
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
  latestRun: PortalStats['campaigns'][number] | null
  healthScore: number
}

interface ProspectHistory {
  lead: {
    id: string
    company: string | null
    contact_name: string | null
    contact_role: string | null
    email: string | null
    phone: string | null
    qualify_score: number | null
    status: string
    created_at: string
  }
  timeline: Array<{
    id: string
    type: string
    at: string
    title: string
    body: string
    meta?: Record<string, string | number | boolean | null>
  }>
}

const statusColors: Record<string, string> = {
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

type OverviewDays = 0 | 7 | 14 | 30
type ProspectDays = 0 | 7 | 14 | 30
type LayerKey = 'sent' | 'replied' | 'booked' | 'unsubscribed'
type TabKey = 'outreach' | 'engagement' | 'pipeline' | 'leadQuality' | 'prospects'
type ProspectStatus = 'all' | 'sent' | 'replied' | 'booked' | 'unsubscribed'
type ProspectScore = 'all' | 'scored' | 'high'
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function leadStatusBucket(status: string): LayerKey {
  if (status === 'replied') return 'replied'
  if (status === 'booked') return 'booked'
  if (status === 'unsubscribed') return 'unsubscribed'
  return 'sent'
}

function leadWithinDays(iso: string, days: number) {
  if (days === 0) return true
  const now = Date.now()
  const diff = now - new Date(iso).getTime()
  return diff <= days * 24 * 60 * 60 * 1000
}

function averageLeadScore(leads: PortalStats['recentLeads']) {
  const scored = leads.filter((lead) => typeof lead.qualify_score === 'number')
  if (scored.length === 0) return '—'
  const total = scored.reduce((sum, lead) => sum + (lead.qualify_score ?? 0), 0)
  return `${(total / scored.length).toFixed(1)}/10`
}

function highIntentCount(leads: PortalStats['recentLeads']) {
  return leads.filter((lead) => (lead.qualify_score ?? 0) >= 7).length
}

function recentReplyCount(leads: PortalStats['recentLeads']) {
  return leads.filter((lead) => lead.status === 'replied' || lead.status === 'booked').length
}

function latestRunLabel(campaigns: PortalStats['campaigns']) {
  if (campaigns.length === 0) return 'No runs yet'
  return `Latest ${timeAgo(campaigns[0].created_at)}`
}

function formatRunDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatElapsedTimer(startedAt: number, now = Date.now()) {
  const totalSeconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getNextScheduledCampaignRun(now = new Date()) {
  const targetDays = new Set([2, 3, 4]) // Tue-Thu in UTC

  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(now)
    candidate.setUTCDate(now.getUTCDate() + offset)
    candidate.setUTCHours(17, 0, 0, 0)

    if (!targetDays.has(candidate.getUTCDay())) continue
    if (candidate.getTime() <= now.getTime()) continue

    return candidate
  }

  return null
}

function formatScheduledRun(date: Date | null) {
  if (!date) return 'Unavailable'
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatCampaignRunTitle(run: PortalStats['campaigns'][number]) {
  if (run.campaign_name) return run.campaign_name
  return run.product_name || 'Campaign run'
}

function buildFunnelSummary(
  diagnostics: PortalStats['campaigns'][number]['funnel_diagnostics'] | undefined,
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

function reportStatusLabel(status: string | undefined, error: string | undefined) {
  if (status === 'sent') return 'Report sent'
  if (status === 'failed') return error ? `Report failed: ${error}` : 'Report failed'
  return 'Report status unavailable'
}

function buildRunInsights(
  diagnostics: PortalStats['campaigns'][number]['funnel_diagnostics'] | undefined,
) {
  if (!diagnostics) return []

  const insights: string[] = []
  const bestSearchPass = diagnostics.best_search_pass
  if (bestSearchPass?.query && typeof bestSearchPass.fresh_added === 'number') {
    insights.push(`Best search pass added ${bestSearchPass.fresh_added} fresh leads from "${bestSearchPass.query.slice(0, 72)}${bestSearchPass.query.length > 72 ? '…' : ''}"`)
  }

  const riskySuppressed = diagnostics.risky_domains_suppressed ?? 0
  if (riskySuppressed > 0) {
    insights.push(`${riskySuppressed} leads were suppressed because their domains already had risky bounce history`)
  }

  const sources = diagnostics.email_sources
  if (sources) {
    const sourceEntries = [
      { label: 'Exa', count: sources.exa ?? 0 },
      { label: 'Scraped', count: sources.scraped ?? 0 },
      { label: 'Pattern', count: sources.pattern ?? 0 },
    ]
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)

    if (sourceEntries.length > 0) {
      insights.push(`Most emails came from ${sourceEntries.map((entry) => `${entry.label.toLowerCase()} ${entry.count}`).join(', ')}`)
    }

    if ((sources.pattern ?? 0) > 0 && (diagnostics.status_breakdown?.bounced ?? 0) > 0) {
      insights.push('Pattern-guessed emails are still active in this run, so watch bounce pressure closely')
    }
  }

  const branches = diagnostics.follow_up_branches
  if (branches) {
    const branchEntries = [
      { label: 'clicked', count: branches.clicked ?? 0 },
      { label: 'opened', count: branches.opened ?? 0 },
      { label: 'cold', count: branches.cold ?? 0 },
      { label: 'replied later', count: branches.replied_later ?? 0 },
    ]
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)

    if (branchEntries.length > 0) {
      insights.push(`Follow-up branch mix: ${branchEntries.map((entry) => `${entry.label} ${entry.count}`).join(', ')}`)
    }
  }

  const noEmailFound = diagnostics.no_email_found ?? 0
  const qualified = diagnostics.qualified ?? 0
  if (qualified > 0 && noEmailFound / qualified >= 0.4) {
    insights.push('Contact discovery was a bottleneck on this run, with many qualified leads missing usable personal email')
  }

  const bounced = diagnostics.status_breakdown?.bounced ?? 0
  const sent = diagnostics.sent ?? 0
  if (sent >= 5 && bounced / sent >= 0.2) {
    insights.push(`Bounce pressure stayed elevated at ${Math.round((bounced / sent) * 100)}% of sent leads`)
  }

  return insights.slice(0, 4)
}

function buildRecommendedActions(
  diagnostics: PortalStats['campaigns'][number]['funnel_diagnostics'] | undefined,
) {
  if (!diagnostics) return []

  const actions: string[] = []
  const qualified = diagnostics.qualified ?? 0
  const noEmailFound = diagnostics.no_email_found ?? 0
  const sent = diagnostics.sent ?? 0
  const bounced = diagnostics.status_breakdown?.bounced ?? 0
  const riskySuppressed = diagnostics.risky_domains_suppressed ?? 0
  const patternEmails = diagnostics.email_sources?.pattern ?? 0
  const coldBranch = diagnostics.follow_up_branches?.cold ?? 0
  const clickedBranch = diagnostics.follow_up_branches?.clicked ?? 0
  const openedBranch = diagnostics.follow_up_branches?.opened ?? 0

  if (qualified > 0 && noEmailFound / qualified >= 0.4) {
    actions.push('Tighten contact discovery for this ICP before the next run. Too many qualified leads are failing at the personal-email step.')
  }

  if (sent >= 5 && bounced / sent >= 0.2) {
    actions.push('Reduce risky sends next run. Prefer scraped or Exa-confirmed emails and trim pattern-guessed addresses for this campaign.')
  }

  if (patternEmails > 0 && bounced > 0) {
    actions.push('Review whether this campaign should temporarily disable pattern guesses. They are still contributing risk here.')
  }

  if (riskySuppressed > 0) {
    actions.push('Refine targeting away from domains with repeat bounce history, or create a separate campaign wedge with cleaner account sources.')
  }

  if (coldBranch > openedBranch + clickedBranch && coldBranch >= 3) {
    actions.push('Your follow-up sequence is staying mostly cold. Test a stronger touch-2 subject line or a narrower ICP before scaling this campaign.')
  }

  if (clickedBranch > 0) {
    actions.push('Clicked leads are showing intent. Consider a more direct CTA or a faster human handoff for that branch.')
  }

  if (!actions.length && sent > 0) {
    actions.push('This run looks operationally healthy. Keep the same campaign live and use the next run to compare reply and click behavior by follow-up branch.')
  }

  return actions.slice(0, 3)
}

function buildLiveRunProgress(
  run: PortalStats['campaigns'][number] | null,
  startedAt: number,
  requestedLeadCount: number | null,
  now = Date.now(),
) {
  const diagnostics = run?.funnel_diagnostics
  const rawCandidates = diagnostics?.raw_candidates ?? 0
  const freshCandidates = diagnostics?.fresh_candidates ?? run?.total_leads ?? 0
  const qualified = diagnostics?.qualified ?? run?.qualified_leads ?? 0
  const emailFound = diagnostics?.email_found ?? 0
  const noEmail = diagnostics?.no_email_found ?? 0
  const sent = diagnostics?.sent ?? run?.emailed ?? 0
  const isComplete = run?.status === 'complete'

  const hasSearch = rawCandidates > 0 || freshCandidates > 0
  const hasQualified = qualified > 0 || sent > 0
  const hasContacts = emailFound > 0 || noEmail > 0 || sent > 0
  const hasSent = sent > 0

  const stages = [
    { key: 'search', label: 'Searching', done: hasSearch },
    { key: 'qualify', label: 'Qualifying', done: hasQualified },
    { key: 'contacts', label: 'Finding Contacts', done: hasContacts },
    { key: 'sending', label: 'Sending', done: hasSent },
    { key: 'complete', label: 'Completed', done: isComplete },
  ]

  const currentIndex = isComplete ? stages.length - 1 : stages.findIndex((stage) => !stage.done)
  const completedCount = stages.filter((stage) => stage.done).length
  const progressPercent = isComplete
    ? 100
    : Math.max(10, Math.round(((completedCount + (currentIndex >= 0 ? 0.45 : 0)) / stages.length) * 100))

  const steps = stages.map((stage, index) => ({
    ...stage,
    state: stage.done ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
  }))

  let summary = `Campaign queued · ${formatElapsedTimer(startedAt, now)} elapsed`
  if (run && !hasQualified) {
    summary = `Searching and cleaning candidates · ${rawCandidates || '—'} raw found so far`
  } else if (run && hasQualified && !hasContacts) {
    summary = `Qualifying best-fit accounts · ${qualified} leads passed scoring`
  } else if (run && hasContacts && !hasSent) {
    summary = `Finding real contacts · ${emailFound} found, ${noEmail} skipped`
  } else if (run && hasSent && !isComplete) {
    summary = `Sending outreach · ${sent} sent so far`
  } else if (run && isComplete) {
    summary = `Run complete · ${sent} sent, ${qualified} qualified, ${freshCandidates} fresh candidates reviewed`
  }

  return {
    isComplete,
    summary,
    progressPercent,
    steps,
    badge: isComplete ? 'completed' : `${formatElapsedTimer(startedAt, now)}`,
    metrics: [
      { label: 'Requested', value: requestedLeadCount ?? run?.funnel_diagnostics?.requested_leads ?? '—' },
      { label: 'Raw', value: rawCandidates ?? '—' },
      { label: 'Fresh', value: freshCandidates ?? '—' },
      { label: 'Qualified', value: qualified ?? '—' },
      { label: 'Sent', value: sent ?? '—' },
    ],
  }
}

function buildLeadActivity(leads: PortalStats['recentLeads'], days: number) {
  const byDay = new Map<
    string,
    {
      day: string
      sent: number
      replied: number
      booked: number
      unsubscribed: number
    }
  >()

  if (days === 0) {
    const sortedKeys = Array.from(
      new Set(leads.map((lead) => new Date(lead.created_at).toISOString().slice(0, 10))),
    ).sort()

    for (const key of sortedKeys) {
      const date = new Date(`${key}T00:00:00.000Z`)
      byDay.set(key, {
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: 0,
        replied: 0,
        booked: 0,
        unsubscribed: 0,
      })
    }
  } else {
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - offset)
      const key = date.toISOString().slice(0, 10)
      byDay.set(key, {
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: 0,
        replied: 0,
        booked: 0,
        unsubscribed: 0,
      })
    }
  }

  for (const lead of leads) {
    const key = new Date(lead.created_at).toISOString().slice(0, 10)
    const bucket = byDay.get(key)
    if (!bucket) continue
    bucket[leadStatusBucket(lead.status)] += 1
  }

  return Array.from(byDay.values())
}

function buildLeadActivityFromSeries(series: NonNullable<PortalStats['leadActivity']>, days: number) {
  if (series.length === 0) return []

  const filtered = days === 0
    ? series
    : series.filter((entry) => leadWithinDays(`${entry.date}T12:00:00.000Z`, days))

  return filtered.map((entry) => ({
    day: new Date(`${entry.date}T00:00:00.000Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sent: entry.sent,
    replied: entry.replied,
    booked: entry.booked,
    unsubscribed: entry.unsubscribed,
  }))
}

function MetricSection({
  title,
  icon: Icon,
  metrics,
}: {
  title: string
  icon: typeof Send
  metrics: Array<{ label: string; value: string | number; hint: string }>
}) {
  return (
    <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-lg bg-neutral-100 p-2">
          <Icon size={16} className="text-neutral-600" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
            <p className="text-[11px] tracking-widest uppercase text-neutral-400">{metric.label}</p>
            <p className="mt-1 text-lg font-semibold leading-none text-neutral-900">{metric.value}</p>
            <p className="mt-1 text-[11px] leading-snug text-neutral-500">{metric.hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ListCard({
  title,
  subtitle,
  rows,
  emptyLabel,
  onRowClick,
}: {
  title: string
  subtitle: string
  rows: Array<{
    id: string
    title: string
    meta: string
    badge?: string
    interactive?: boolean
    metrics?: Array<{ label: string; value: string | number }>
    detail?: string
  }>
  emptyLabel: string
  onRowClick?: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-xs uppercase tracking-[0.18em] text-neutral-400">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={onRowClick && row.interactive !== false ? () => onRowClick(row.id) : undefined}
              className={`flex w-full items-start justify-between gap-4 rounded-lg border border-neutral-100 bg-white/80 px-3 py-3 text-left ${
                onRowClick && row.interactive !== false ? 'transition hover:bg-neutral-50/80' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{row.title}</p>
                <p className="mt-1 text-xs text-neutral-500">{row.meta}</p>
                {row.detail ? (
                  <p className="mt-2 text-xs text-neutral-600">{row.detail}</p>
                ) : null}
                {row.metrics?.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
                    {row.metrics.map((metric) => (
                      <div key={metric.label} className="rounded-md border border-neutral-100 bg-neutral-50/80 px-2.5 py-2">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">{metric.label}</p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {row.badge ? (
                <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  {row.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function tabButtonClass(active: boolean) {
  return `rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition ${
    active
      ? 'border-neutral-900 bg-neutral-900 text-white'
      : 'border-neutral-200 bg-white/70 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
  }`
}

function timelineTypeLabel(type: string) {
  const labels: Record<string, string> = {
    outbound_email: 'Outbound Email',
    inbound_reply: 'Inbound Reply',
    email_event: 'Email Event',
    follow_up_sent: 'Follow-up Sent',
    follow_up_scheduled: 'Follow-up Scheduled',
    support_message: 'Support Message',
    call: 'Call Transcript',
  }

  return labels[type] || 'Activity'
}

async function salesRequest<T>(token: string, path: string, options: RequestInit = {}): Promise<T> {
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
      // Keep HTTP fallback
    }
    throw new Error(message)
  }

  return res.json()
}

export default function SalesDashboard() {
  const { session, role } = useAuth()
  const [stats, setStats] = useState<PortalStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('outreach')
  const [overviewDays, setOverviewDays] = useState<OverviewDays>(0)
  const [prospectDays, setProspectDays] = useState<ProspectDays>(30)
  const [prospectStatus, setProspectStatus] = useState<ProspectStatus>('all')
  const [prospectScore, setProspectScore] = useState<ProspectScore>('all')
  const [chartLayers, setChartLayers] = useState<Record<LayerKey, boolean>>({
    sent: true,
    replied: true,
    booked: true,
    unsubscribed: false,
  })
  const [campaignDefinitions, setCampaignDefinitions] = useState<CampaignDefinition[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<CampaignConfig | null>(null)
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false)
  const [newCampaignDraft, setNewCampaignDraft] = useState<CampaignConfig>({
    name: '',
    product_name: '',
    product_context: '',
    target_description: '',
    num_leads_per_run: 40,
  })
  const [savingCampaign, setSavingCampaign] = useState(false)
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [adminActionMessage, setAdminActionMessage] = useState<string | null>(null)
  const [adminActionError, setAdminActionError] = useState<string | null>(null)
  const [runningCampaign, setRunningCampaign] = useState(false)
  const [manualLeadOverride, setManualLeadOverride] = useState('')
  const [pendingRun, setPendingRun] = useState<{
    startedAt: number
    title: string
    requestedLeadCount: number | null
    campaignId: string | null
    completedAt: number | null
  } | null>(null)
  const [runTimerNow, setRunTimerNow] = useState(Date.now())
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [prospectHistory, setProspectHistory] = useState<ProspectHistory | null>(null)

  useEffect(() => {
    if (!session?.access_token) return

    let cancelled = false
    setError(null)
    setStats(null)

    fetch(`${SALES_API}/portal/stats`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(
            err.message === 'HTTP 401'
              ? 'Your account is signed in, but it is not mapped to a live sales workspace yet.'
              : 'We could not load live sales data.',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!session?.access_token || role !== 'ivera_admin') {
      setCampaignDefinitions([])
      setSelectedCampaignId(null)
      setEditingCampaign(null)
      return
    }

    let cancelled = false
    setCampaignsLoading(true)

    salesRequest<{ campaigns: CampaignDefinition[] }>(session.access_token, '/campaigns')
      .then((data) => {
        if (cancelled) return
        setCampaignDefinitions(data.campaigns)
      })
      .catch((err: Error) => {
        if (!cancelled) setAdminActionError(err.message)
      })
      .finally(() => {
        if (!cancelled) setCampaignsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [role, session])

  const totals = stats?.totals ?? { emailed: 0, replied: 0, booked: 0, unsubscribed: 0, weekEmailed: 0 }
  const recentLeads = stats?.recentLeads ?? []
  const leadActivitySeries = stats?.leadActivity ?? []
  const followUpPerformance = stats?.followUpPerformance ?? []
  const campaignSourcePerformance = stats?.campaignSourcePerformance ?? []
  const campaigns = stats?.campaigns ?? []
  const campaignAnalyticsByDefinition = useMemo(() => {
    const entries = campaignDefinitions
      .map((definition) => {
        const analytics = buildCampaignAnalytics(definition, campaigns, campaignSourcePerformance)
        return analytics ? [definition.id, analytics] : null
      })
      .filter((entry): entry is [string, CampaignAnalytics] => Boolean(entry))

    return new Map(entries)
  }, [campaignDefinitions, campaignSourcePerformance, campaigns])
  const selectedCampaignDefinition = useMemo(
    () => campaignDefinitions.find((campaign) => campaign.id === selectedCampaignId) ?? null,
    [campaignDefinitions, selectedCampaignId],
  )
  const selectedCampaignAnalytics = useMemo(
    () => (selectedCampaignId ? campaignAnalyticsByDefinition.get(selectedCampaignId) ?? null : null),
    [campaignAnalyticsByDefinition, selectedCampaignId],
  )

  useEffect(() => {
    if (!campaignDefinitions.length) {
      setSelectedCampaignId(null)
      setEditingCampaign(null)
      return
    }

    const preferred = campaignDefinitions.find((campaign) => campaign.is_default) ?? campaignDefinitions[0]

    setSelectedCampaignId((current) => {
      if (current && campaignDefinitions.some((campaign) => campaign.id === current)) {
        return current
      }
      return preferred.id
    })
  }, [campaignDefinitions])

  useEffect(() => {
    if (!selectedCampaignDefinition) {
      setEditingCampaign(null)
      return
    }

    setEditingCampaign({
      id: selectedCampaignDefinition.id,
      name: selectedCampaignDefinition.name,
      product_name: selectedCampaignDefinition.product_name,
      product_context: selectedCampaignDefinition.product_context,
      target_description: selectedCampaignDefinition.target_description,
      num_leads_per_run: selectedCampaignDefinition.num_leads_per_run,
    })
  }, [selectedCampaignDefinition])

  const overviewLeads = useMemo(
    () => recentLeads.filter((lead) => leadWithinDays(lead.created_at, overviewDays)),
    [recentLeads, overviewDays],
  )

  const overviewWindowLabel = overviewDays === 0 ? 'All time' : `Last ${overviewDays} days`

  const filteredProspects = useMemo(() => {
    return recentLeads.filter((lead) => {
      if (!leadWithinDays(lead.created_at, prospectDays)) return false
      if (prospectStatus !== 'all' && leadStatusBucket(lead.status) !== prospectStatus) return false
      if (prospectScore === 'scored' && typeof lead.qualify_score !== 'number') return false
      if (prospectScore === 'high' && (lead.qualify_score ?? 0) < 7) return false
      return true
    })
  }, [recentLeads, prospectDays, prospectScore, prospectStatus])

  const overviewSummary = useMemo(() => {
    const sent = overviewLeads.filter((lead) => leadStatusBucket(lead.status) === 'sent').length
    const replied = overviewLeads.filter((lead) => leadStatusBucket(lead.status) === 'replied').length
    const booked = overviewLeads.filter((lead) => leadStatusBucket(lead.status) === 'booked').length
    const unsubscribed = overviewLeads.filter((lead) => leadStatusBucket(lead.status) === 'unsubscribed').length

    return {
      sent,
      replied,
      booked,
      unsubscribed,
      scored: overviewLeads.filter((lead) => typeof lead.qualify_score === 'number').length,
      pipeline: overviewLeads.length,
      avgScore: averageLeadScore(overviewLeads),
      highIntent: highIntentCount(overviewLeads),
      recentReplies: recentReplyCount(overviewLeads),
    }
  }, [overviewLeads])

  const leadActivity = useMemo(
    () => (
      leadActivitySeries.length > 0
        ? buildLeadActivityFromSeries(leadActivitySeries, overviewDays)
        : buildLeadActivity(overviewLeads, overviewDays)
    ),
    [leadActivitySeries, overviewLeads, overviewDays],
  )

  const parsedManualOverride = Number(manualLeadOverride)
  const hasManualOverride = manualLeadOverride.trim().length > 0 && Number.isFinite(parsedManualOverride)

  const matchingPendingCampaign = useMemo(() => {
    if (!pendingRun) return null
    if (pendingRun.campaignId) {
      return campaigns.find((campaign) => campaign.id === pendingRun.campaignId) ?? null
    }
    return (
      campaigns.find(
        (campaign) => new Date(campaign.created_at).getTime() >= pendingRun.startedAt - 60_000,
      ) ?? null
    )
  }, [campaigns, pendingRun])
  const pendingRunProgress = useMemo(
    () => (pendingRun ? buildLiveRunProgress(matchingPendingCampaign, pendingRun.startedAt, pendingRun.requestedLeadCount, runTimerNow) : null),
    [matchingPendingCampaign, pendingRun, runTimerNow],
  )
  const activeCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.status === 'active') ?? null,
    [campaigns],
  )
  const activeCampaignProgress = useMemo(
    () => (
      activeCampaign
        ? buildLiveRunProgress(
          activeCampaign,
          new Date(activeCampaign.created_at).getTime(),
          activeCampaign.funnel_diagnostics?.requested_leads ?? null,
          runTimerNow,
        )
        : null
    ),
    [activeCampaign, runTimerNow],
  )
  const liveCampaign = matchingPendingCampaign ?? activeCampaign
  const liveCampaignProgress = pendingRunProgress ?? activeCampaignProgress
  const hasActiveCampaign = campaigns.some((campaign) => campaign.status === 'active')
  const runStartDisabled = runningCampaign || savingCampaign || hasActiveCampaign
  const latestCampaignRuns = useMemo(
    () => {
      const rows = campaigns.slice(0, 8).map((campaign) => ({
        id: campaign.id,
        title: formatCampaignRunTitle(campaign),
        meta: `${formatRunDate(campaign.created_at)} · ${campaign.product_name}`,
        badge: `${campaign.total_leads || 0} leads`,
        detail: buildFunnelSummary(campaign.funnel_diagnostics) || undefined,
        metrics: [
          { label: 'Qualified', value: campaign.qualified_leads || 0 },
          { label: 'Emailed', value: campaign.emailed || 0 },
          { label: 'Replies', value: campaign.replied || 0 },
          { label: 'Booked', value: campaign.booked || 0 },
          { label: 'Unsub', value: campaign.unsubscribed || 0 },
          { label: 'Bounce', value: campaign.bounced || 0 },
          {
            label: 'Avg Score',
            value: typeof campaign.avg_score === 'number' ? `${campaign.avg_score.toFixed(1)}/10` : '—',
          },
        ],
      }))

      if (!liveCampaign || !liveCampaignProgress) return rows

      return [
        {
          id: `live-${liveCampaign.id}`,
          title: pendingRun?.title || liveCampaign.product_name || 'Campaign run',
          meta: liveCampaignProgress.summary,
          badge: liveCampaignProgress.badge,
          detail: buildFunnelSummary(liveCampaign.funnel_diagnostics) || undefined,
          metrics: liveCampaignProgress.metrics,
          interactive: false,
        },
        ...rows,
      ]
    },
    [campaigns, liveCampaign, liveCampaignProgress, pendingRun],
  )

  const selectedRun = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedRunId) ?? null,
    [campaigns, selectedRunId],
  )
  const latestRunDiagnostics = campaigns[0]?.funnel_diagnostics
  const latestRunInsights = useMemo(
    () => buildRunInsights(latestRunDiagnostics),
    [latestRunDiagnostics],
  )
  const latestRunActions = useMemo(
    () => buildRecommendedActions(latestRunDiagnostics),
    [latestRunDiagnostics],
  )
  const selectedRunInsights = useMemo(
    () => buildRunInsights(selectedRun?.funnel_diagnostics),
    [selectedRun],
  )
  const selectedRunActions = useMemo(
    () => buildRecommendedActions(selectedRun?.funnel_diagnostics),
    [selectedRun],
  )

  const engagedProspects = useMemo(
    () =>
      overviewLeads
        .filter((lead) => ['replied', 'booked', 'unsubscribed'].includes(lead.status))
        .slice(0, 6)
        .map((lead) => ({
          id: lead.id,
          title: lead.company || lead.email || 'Prospect',
          meta: `${lead.email || 'No email'} · ${timeAgo(lead.created_at)}`,
          badge: lead.status,
        })),
    [overviewLeads],
  )

  const bookedProspects = useMemo(
    () =>
      recentLeads
        .filter((lead) => lead.status === 'booked')
        .slice(0, 6)
        .map((lead) => ({
          id: lead.id,
          title: lead.company || lead.email || 'Prospect',
          meta: `${lead.email || 'No email'} · ${timeAgo(lead.created_at)}`,
          badge: typeof lead.qualify_score === 'number' ? `${lead.qualify_score}/10` : 'booked',
        })),
    [recentLeads],
  )

  const highIntentProspects = useMemo(
    () =>
      recentLeads
        .filter((lead) => (lead.qualify_score ?? 0) >= 7)
        .sort((a, b) => (b.qualify_score ?? 0) - (a.qualify_score ?? 0))
        .slice(0, 6)
        .map((lead) => ({
          id: lead.id,
          title: lead.company || lead.email || 'Prospect',
          meta: `${lead.email || 'No email'} · ${timeAgo(lead.created_at)}`,
          badge: `${lead.qualify_score}/10`,
        })),
    [recentLeads],
  )

  const nextScheduledRun = useMemo(() => getNextScheduledCampaignRun(), [])

  useEffect(() => {
    if (!liveCampaignProgress || !session?.access_token) return

    const tickTimer = window.setInterval(() => {
      setRunTimerNow(Date.now())
    }, 1000)

    const pollTimer = window.setInterval(() => {
      void refreshStats()
      void refreshCampaignDefinitions()
    }, 10000)

    return () => {
      window.clearInterval(tickTimer)
      window.clearInterval(pollTimer)
    }
  }, [liveCampaignProgress, session?.access_token])

  useEffect(() => {
    if (!session?.access_token) return

    function handleResume() {
      setRunTimerNow(Date.now())
      void refreshStats()
      void refreshCampaignDefinitions()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        handleResume()
      }
    }

    window.addEventListener('focus', handleResume)
    window.addEventListener('online', handleResume)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleResume)
      window.removeEventListener('online', handleResume)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (!pendingRun) return

    if (matchingPendingCampaign && pendingRun.campaignId !== matchingPendingCampaign.id) {
      setPendingRun((current) => (
        current ? { ...current, campaignId: matchingPendingCampaign.id } : current
      ))
      return
    }

    if (matchingPendingCampaign?.status === 'complete') {
      if (!pendingRun.completedAt) {
        setPendingRun((current) => (
          current ? { ...current, completedAt: Date.now() } : current
        ))
        return
      }

      if (Date.now() - pendingRun.completedAt > 120_000) {
        setPendingRun(null)
      }
      return
    }

    const hasTimedOut = Date.now() - pendingRun.startedAt > 20 * 60_000
    if (hasTimedOut) {
      setPendingRun(null)
    }
  }, [matchingPendingCampaign, pendingRun])

  const outreachMetrics = [
    { label: 'Sent In Window', value: overviewSummary.sent, hint: overviewWindowLabel },
    { label: 'Sent This Week', value: totals.weekEmailed, hint: 'Rolling 7 days' },
    { label: 'Campaign Runs', value: campaigns.length, hint: 'Recorded runs' },
    { label: 'Latest Run', value: latestRunLabel(campaigns), hint: 'Most recent activity' },
    { label: 'Next Run', value: formatScheduledRun(nextScheduledRun), hint: 'Tue–Thu at 17:00 UTC' },
  ]
  const engagementMetrics = [
    { label: 'Replies', value: overviewSummary.replied, hint: overviewWindowLabel },
    { label: 'Reply Rate', value: replyRate(overviewSummary.replied, overviewSummary.sent), hint: 'Replies divided by sent' },
    { label: 'Unsubscribed', value: overviewSummary.unsubscribed, hint: overviewWindowLabel },
    { label: 'Unsub Rate', value: unsubscribeRate(overviewSummary.unsubscribed, overviewSummary.sent), hint: 'Opt-outs divided by sent' },
  ]
  const pipelineMetrics = [
    { label: 'Meetings Booked', value: overviewSummary.booked, hint: overviewWindowLabel },
    { label: 'Booked Rate', value: bookingRate(overviewSummary.booked, overviewSummary.sent), hint: 'Booked divided by sent' },
    { label: 'Pipeline Leads', value: overviewSummary.pipeline, hint: 'Prospects in current window' },
    { label: 'Recent Replies', value: overviewSummary.recentReplies, hint: 'Replies or bookings in window' },
  ]
  const qualityMetrics = [
    { label: 'Avg Lead Score', value: overviewSummary.avgScore, hint: 'Across scored leads in window' },
    { label: 'High-Intent', value: overviewSummary.highIntent, hint: 'Score 7/10 or higher' },
    { label: 'Scored Leads', value: overviewSummary.scored, hint: 'Leads with a quality score' },
    { label: 'Booked', value: overviewSummary.booked, hint: 'Booked prospects in window' },
  ]

  const layerOptions: Array<{ key: LayerKey; label: string }> = [
    { key: 'sent', label: 'Sent' },
    { key: 'replied', label: 'Replies' },
    { key: 'booked', label: 'Booked' },
    { key: 'unsubscribed', label: 'Unsubscribed' },
  ]

  async function refreshStats() {
    if (!session?.access_token) return
    const data = await salesRequest<PortalStats>(session.access_token, '/portal/stats')
    setStats(data)
  }

  async function refreshCampaignDefinitions() {
    if (!session?.access_token || role !== 'ivera_admin') return
    const data = await salesRequest<{ campaigns: CampaignDefinition[] }>(session.access_token, '/campaigns')
    setCampaignDefinitions(data.campaigns)
  }

  async function handleRunCampaign(definitionId: string) {
    if (!session?.access_token) return
    setRunningCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const requestedLeadCount = hasManualOverride ? Math.round(parsedManualOverride) : undefined
      const startedAt = Date.now()
      const data = await salesRequest<{ message: string }>(session.access_token, `/campaigns/${definitionId}/start`, {
        method: 'POST',
        body: JSON.stringify(requestedLeadCount ? { num_leads: requestedLeadCount } : {}),
      })
      setPendingRun({
        startedAt,
        title: selectedCampaignDefinition?.product_name || 'Campaign run',
        requestedLeadCount: requestedLeadCount ?? null,
        campaignId: null,
        completedAt: null,
      })
      setRunTimerNow(startedAt)
      setAdminActionMessage(
        requestedLeadCount
          ? `${data.message || 'Campaign started.'} Manual override: ${requestedLeadCount} leads.`
          : (data.message || 'Campaign started.'),
      )
      await Promise.all([refreshStats(), refreshCampaignDefinitions()])
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to start campaign.')
    } finally {
      setRunningCampaign(false)
    }
  }

  async function saveCampaignDefinition() {
    if (!session?.access_token || !editingCampaign?.id) return
    setSavingCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const data = await salesRequest<{ campaign: CampaignDefinition; message: string }>(
        session.access_token,
        `/campaigns/${editingCampaign.id}`,
        {
        method: 'PATCH',
          body: JSON.stringify({
            name: editingCampaign.name,
            product_name: editingCampaign.product_name,
            product_context: editingCampaign.product_context,
            target_description: editingCampaign.target_description,
            num_leads_per_run: editingCampaign.num_leads_per_run,
          }),
        },
      )
      setSelectedCampaignId(data.campaign.id)
      setAdminActionMessage(data.message || 'Campaign saved.')
      await Promise.all([refreshStats(), refreshCampaignDefinitions()])
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to save campaign.')
    } finally {
      setSavingCampaign(false)
    }
  }

  async function setDefaultCampaign(definitionId: string) {
    if (!session?.access_token) return
    setSavingCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const data = await salesRequest<{ campaign: CampaignDefinition; message: string }>(
        session.access_token,
        `/campaigns/${definitionId}/default`,
        { method: 'POST' },
      )
      setSelectedCampaignId(data.campaign.id)
      setAdminActionMessage(data.message || 'Default campaign updated.')
      await Promise.all([refreshStats(), refreshCampaignDefinitions()])
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to update default campaign.')
    } finally {
      setSavingCampaign(false)
    }
  }

  async function createCampaignDefinition() {
    if (!session?.access_token) return
    setSavingCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const data = await salesRequest<{ campaign: CampaignDefinition; message: string }>(session.access_token, '/campaigns', {
        method: 'POST',
        body: JSON.stringify(newCampaignDraft),
      })
      setShowNewCampaignForm(false)
      setNewCampaignDraft({
        name: '',
        product_name: editingCampaign?.product_name || '',
        product_context: editingCampaign?.product_context || '',
        target_description: editingCampaign?.target_description || '',
        num_leads_per_run: editingCampaign?.num_leads_per_run || 40,
      })
      setSelectedCampaignId(data.campaign.id)
      setAdminActionMessage(data.message || 'Campaign created.')
      await refreshCampaignDefinitions()
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to create campaign.')
    } finally {
      setSavingCampaign(false)
    }
  }

  async function handleCampaignAction(definitionId: string, action: 'pause' | 'restart' | 'archive') {
    if (!session?.access_token) return
    const actionLabel = action === 'pause' ? 'pause' : action === 'restart' ? 'restart' : 'archive'
    const confirmationMessage = action === 'archive'
      ? 'Archive this campaign? It will be hidden from active use until you restore it later in code.'
      : action === 'restart'
        ? 'Restart this campaign now? This starts a fresh run using the saved campaign settings.'
        : 'Pause this campaign? Any active run linked to it will be stopped.'

    if (typeof window !== 'undefined' && !window.confirm(confirmationMessage)) {
      return
    }

    setSavingCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const data = await salesRequest<{ message: string }>(session.access_token, `/campaigns/${definitionId}/${action}`, {
        method: 'POST',
      })
      setAdminActionMessage(data.message || `Campaign ${actionLabel}d.`)
      await Promise.all([refreshStats(), refreshCampaignDefinitions()])
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : `Failed to ${actionLabel} campaign.`)
    } finally {
      setSavingCampaign(false)
    }
  }

  async function openProspectHistory(leadId: string) {
    if (!session?.access_token) return
    setSelectedLeadId(leadId)
    setHistoryLoading(true)
    setHistoryError(null)
    setProspectHistory(null)

    try {
      const data = await salesRequest<ProspectHistory>(session.access_token, `/leads/${leadId}/history`)
      setProspectHistory(data)
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load prospect history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  function closeProspectHistory() {
    setSelectedLeadId(null)
    setHistoryError(null)
    setProspectHistory(null)
  }

  if (!stats && !error) {
    return (
      <div className="mx-auto flex max-w-7xl justify-center p-8 pt-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <PageHeader
          title="Sales Agent"
          subtitle="Outbound campaign performance and prospect pipeline"
        />
        <div className="rounded-xl border border-red-200/60 bg-white/70 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <PageHeader
        title="Sales Agent"
        subtitle="Outbound campaign performance and prospect pipeline"
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('outreach')}
          className={tabButtonClass(activeTab === 'outreach')}
        >
          Outreach
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('engagement')}
          className={tabButtonClass(activeTab === 'engagement')}
        >
          Engagement
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={tabButtonClass(activeTab === 'pipeline')}
        >
          Pipeline
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('leadQuality')}
          className={tabButtonClass(activeTab === 'leadQuality')}
        >
          Lead Quality
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prospects')}
          className={tabButtonClass(activeTab === 'prospects')}
        >
          Prospects
        </button>
      </div>

      {activeTab === 'outreach' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Lead Activity</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Live lead activity with time and layer filters. Showing {leadActivity.length}{' '}
                  {leadActivity.length === 1 ? 'day' : 'days'} in {overviewWindowLabel.toLowerCase()}.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setOverviewDays(days as OverviewDays)}
                      className={tabButtonClass(overviewDays === days)}
                    >
                      {days}d
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOverviewDays(0)}
                    className={tabButtonClass(overviewDays === 0)}
                  >
                    All Time
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 text-[11px] tracking-widest uppercase text-neutral-400">
                    <SlidersHorizontal size={12} />
                    Layers
                  </span>
                  {layerOptions.map((layer) => (
                    <button
                      key={layer.key}
                      type="button"
                      onClick={() =>
                        setChartLayers((current) => ({
                          ...current,
                          [layer.key]: !current[layer.key],
                        }))
                      }
                      className={tabButtonClass(chartLayers[layer.key])}
                    >
                      {layer.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadActivity} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    dataKey="day"
                    interval={0}
                    minTickGap={0}
                    height={56}
                    angle={-35}
                    textAnchor="end"
                    tick={{ fontSize: 12, fill: '#a3a3a3' }}
                    axisLine={{ stroke: '#e5e5e5' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#a3a3a3' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e5e5',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  {chartLayers.sent && <Bar dataKey="sent" stackId="activity" fill="#d4d4d4" radius={[4, 4, 0, 0]} />}
                  {chartLayers.replied && <Bar dataKey="replied" stackId="activity" fill="#93c5fd" radius={[4, 4, 0, 0]} />}
                  {chartLayers.booked && <Bar dataKey="booked" stackId="activity" fill="#171717" radius={[4, 4, 0, 0]} />}
                  {chartLayers.unsubscribed && <Bar dataKey="unsubscribed" stackId="activity" fill="#fca5a5" radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <MetricSection title="Outreach" icon={Send} metrics={outreachMetrics} />
            {latestRunDiagnostics ? (
              <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Latest Funnel</h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      Where the most recent run narrowed from search to sent outreach
                    </p>
                  </div>
                  <p className="text-xs text-neutral-400">
                    target {latestRunDiagnostics.requested_leads ?? '—'} · effective {latestRunDiagnostics.effective_run_limit ?? '—'}
                  </p>
                </div>
                <p className="mt-3 text-xs text-neutral-500">
                  {reportStatusLabel(latestRunDiagnostics.report_status, latestRunDiagnostics.report_error_message)}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-5">
                  <div className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Raw</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{latestRunDiagnostics.raw_candidates ?? '—'}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">Exa candidates returned</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Fresh</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{latestRunDiagnostics.fresh_candidates ?? '—'}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">After dedupe</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Qualified</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{latestRunDiagnostics.qualified ?? '—'}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">Scored 7/10 or higher</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Email Found</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{latestRunDiagnostics.email_found ?? '—'}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">Personal contact found</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Sent</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{latestRunDiagnostics.sent ?? '—'}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">Delivered into the run</p>
                  </div>
                </div>
                {latestRunInsights.length ? (
                  <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Run Insights</p>
                    <div className="mt-3 space-y-2">
                      {latestRunInsights.map((insight) => (
                        <p key={insight} className="text-sm text-neutral-700">
                          {insight}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {latestRunActions.length ? (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                    <p className="text-[11px] tracking-widest uppercase text-blue-700">Recommended Actions</p>
                    <div className="mt-3 space-y-2">
                      {latestRunActions.map((action) => (
                        <p key={action} className="text-sm text-neutral-700">
                          {action}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {followUpPerformance.length ? (
                  <div className="mt-4 rounded-xl border border-neutral-200 bg-white/75 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Follow-Up Branch Performance</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          How each engagement branch is performing across tracked follow-up touches for this workspace
                        </p>
                      </div>
                      <p className="text-xs text-neutral-400">{followUpPerformance.reduce((sum, branch) => sum + branch.sent, 0)} follow-up sends tracked</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {followUpPerformance.map((branch) => (
                        <div key={branch.branch} className="overflow-x-auto rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-3">
                          <div className="grid min-w-[640px] grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,0.8fr))] gap-2 text-sm">
                          <div>
                            <p className="font-medium text-neutral-900">{branchLabel(branch.branch)}</p>
                            <p className="mt-1 text-xs text-neutral-500">{branch.leads} leads in branch</p>
                          </div>
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Sent</p>
                            <p className="mt-1 font-medium text-neutral-900">{branch.sent}</p>
                          </div>
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Replies</p>
                            <p className="mt-1 font-medium text-neutral-900">{branch.replied}</p>
                          </div>
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Booked</p>
                            <p className="mt-1 font-medium text-neutral-900">{branch.booked}</p>
                          </div>
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Bounced</p>
                            <p className="mt-1 font-medium text-neutral-900">{branch.bounced}</p>
                          </div>
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Reply Rate</p>
                            <p className="mt-1 font-medium text-neutral-900">{replyRate(branch.replied, branch.leads)}</p>
                          </div>
                        </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : activeTab === 'engagement' ? (
        <div className="space-y-4">
          <MetricSection title="Engagement" icon={Reply} metrics={engagementMetrics} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ListCard
              title="Active Conversations"
              subtitle="Replies, bookings, and opt-outs in the selected time window"
              rows={engagedProspects}
              emptyLabel="No engagement yet"
            />
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Engagement Notes</h3>
              <p className="mt-1 text-xs text-neutral-500">Use this view to watch reply pressure and opt-out quality before changing messaging.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {engagementMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{metric.label}</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{metric.value}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">{metric.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'pipeline' ? (
        <div className="space-y-4">
          <MetricSection title="Pipeline" icon={CalendarCheck} metrics={pipelineMetrics} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ListCard
              title="Booked Prospects"
              subtitle="Meetings already captured from the current pipeline"
              rows={bookedProspects}
              emptyLabel="No meetings booked"
            />
            <ListCard
              title="Fastest Movers"
              subtitle="Recent leads already showing reply or booking intent"
              rows={engagedProspects.filter((row) => row.badge !== 'unsubscribed')}
              emptyLabel="No active movement yet"
            />
          </div>
        </div>
      ) : activeTab === 'leadQuality' ? (
        <div className="space-y-4">
          <MetricSection title="Lead Quality" icon={Users} metrics={qualityMetrics} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ListCard
              title="High-Intent Leads"
              subtitle="Top scored prospects to prioritize for outreach and follow-up"
              rows={highIntentProspects}
              emptyLabel="No high-intent leads"
            />
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Quality Readout</h3>
              <p className="mt-1 text-xs text-neutral-500">A compact read on whether the current targeting is feeding the right prospects into the pipeline.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {qualityMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{metric.label}</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{metric.value}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">{metric.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Prospects</h3>
              <p className="mt-1 text-xs text-neutral-500">Filter live prospects by time period, status, and score</p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setProspectDays(days as ProspectDays)}
                    className={tabButtonClass(prospectDays === days)}
                  >
                    {days}d
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setProspectDays(0)}
                  className={tabButtonClass(prospectDays === 0)}
                >
                  All
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'sent', label: 'Sent' },
                  { value: 'replied', label: 'Replies' },
                  { value: 'booked', label: 'Booked' },
                  { value: 'unsubscribed', label: 'Unsubscribed' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProspectStatus(option.value as ProspectStatus)}
                    className={tabButtonClass(prospectStatus === option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: 'all', label: 'All Scores' },
                  { value: 'scored', label: 'Scored' },
                  { value: 'high', label: '7+/10' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProspectScore(option.value as ProspectScore)}
                    className={tabButtonClass(prospectScore === option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredProspects.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-400">No prospects match the current filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left">
                    <th className="px-0 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Company</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Email</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Status</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Score</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProspects.map((lead) => (
                    <tr
                      key={lead.id}
                      className="cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50/70 last:border-0"
                      onClick={() => openProspectHistory(lead.id)}
                    >
                      <td className="px-0 py-3 font-medium text-neutral-900">{lead.company || '—'}</td>
                      <td className="px-4 py-3 text-neutral-500">{lead.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full tracking-widest font-medium uppercase ${statusColors[lead.status] ?? statusColors.emailed}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {typeof lead.qualify_score === 'number' ? `${lead.qualify_score}/10` : '—'}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{timeAgo(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'outreach' && (
        <div className="mt-6 space-y-6">
          {role === 'ivera_admin' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Campaign Manager</p>
                    <h3 className="mt-1 text-sm font-semibold text-neutral-900">Outreach campaigns</h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      Create campaigns, tune their copy, and control which ones can start, pause, restart, or archive.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCampaignForm((current) => !current)
                      setNewCampaignDraft({
                        name: '',
                        product_name: editingCampaign?.product_name || selectedCampaignDefinition?.product_name || '',
                        product_context: editingCampaign?.product_context || selectedCampaignDefinition?.product_context || '',
                        target_description: editingCampaign?.target_description || selectedCampaignDefinition?.target_description || '',
                        num_leads_per_run: editingCampaign?.num_leads_per_run || selectedCampaignDefinition?.num_leads_per_run || 40,
                      })
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
                  >
                    <Plus size={12} />
                    Add Campaign
                  </button>
                </div>

                {campaignsLoading ? (
                  <p className="mt-4 text-sm text-neutral-500">Loading campaigns...</p>
                ) : (
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {campaignDefinitions.map((campaign) => {
                      const analytics = campaignAnalyticsByDefinition.get(campaign.id)
                      const topBranch = analytics
                        ? [
                            { label: 'clicked', count: analytics.branchMix.clicked },
                            { label: 'opened', count: analytics.branchMix.opened },
                            { label: 'cold', count: analytics.branchMix.cold },
                            { label: 'replied later', count: analytics.branchMix.replied_later },
                          ].sort((a, b) => b.count - a.count)[0]
                        : null
                      const sourceEntries = analytics
                        ? [
                            { label: 'Exa', count: analytics.sourceMix.exa },
                            { label: 'Scraped', count: analytics.sourceMix.scraped },
                            { label: 'Pattern', count: analytics.sourceMix.pattern },
                          ].filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count)
                        : []
                      const strongestSource = analytics?.sourcePerformance.length
                        ? [...analytics.sourcePerformance]
                          .sort((a, b) => {
                            const aReply = a.leads > 0 ? a.replied / a.leads : 0
                            const bReply = b.leads > 0 ? b.replied / b.leads : 0
                            if (bReply !== aReply) return bReply - aReply
                            return b.leads - a.leads
                          })[0]
                        : null

                      return (
                        <div
                          key={campaign.id}
                          onClick={() => setSelectedCampaignId(campaign.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setSelectedCampaignId(campaign.id)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            selectedCampaignId === campaign.id
                              ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                              : 'border-neutral-200 bg-white/80 hover:border-neutral-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-neutral-900">{campaign.name}</p>
                                {campaign.is_default ? (
                                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-blue-700">
                                    Default
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 truncate text-xs text-neutral-500">{campaign.product_name}</p>
                              <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1">
                                  {campaign.num_leads_per_run} leads/run
                                </span>
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1">
                                  {campaign.total_runs || 0} runs
                                </span>
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1">
                                  {campaign.last_run_at ? `last run ${timeAgo(campaign.last_run_at)}` : 'never run'}
                                </span>
                              </div>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${statusColors[campaign.status] ?? statusColors.paused}`}>
                              {campaign.status}
                            </span>
                          </div>

                          {analytics ? (
                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                              <div className={`rounded-xl border px-3 py-3 ${healthTone(analytics.healthScore)}`}>
                                <p className="text-[10px] uppercase tracking-[0.18em]">Health</p>
                                <p className="mt-1 text-lg font-semibold">{analytics.healthScore}/100</p>
                                <p className="mt-1 text-[11px]">
                                  {replyRate(analytics.replied, analytics.sent)} reply · {analytics.sent ? `${Math.round((analytics.bounced / analytics.sent) * 100)}%` : '—'} bounce
                                </p>
                              </div>
                              <div className="rounded-xl border border-neutral-200 bg-white px-3 py-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Top Branch</p>
                                <p className="mt-1 text-sm font-semibold text-neutral-900">
                                  {topBranch && topBranch.count > 0 ? `${topBranch.label} ${topBranch.count}` : 'No follow-ups yet'}
                                </p>
                                <p className="mt-1 text-[11px] text-neutral-500">
                                  {analytics.latestRun ? `Latest run ${formatRunDate(analytics.latestRun.created_at)}` : 'Waiting for first run'}
                                </p>
                              </div>
                              <div className="rounded-xl border border-neutral-200 bg-white px-3 py-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Source Quality</p>
                                <p className="mt-1 text-sm font-semibold text-neutral-900">
                                  {strongestSource
                                    ? `${sourceLabel(strongestSource.source)} ${replyRate(strongestSource.replied, strongestSource.leads)} reply`
                                    : (sourceEntries.length ? sourceEntries.map((entry) => `${entry.label} ${entry.count}`).join(' · ') : 'No source data yet')}
                                </p>
                                <p className="mt-1 text-[11px] text-neutral-500">
                                  {strongestSource
                                    ? `${strongestSource.leads} leads · ${strongestSource.bounced} bounced`
                                    : `${analytics.totalRuns} tracked runs · ${analytics.sent} sent`}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-white/70 px-3 py-3 text-sm text-neutral-500">
                              No run analytics yet. Start this campaign to build branch and source performance history.
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleRunCampaign(campaign.id)
                            }}
                            disabled={runStartDisabled || campaign.status === 'archived'}
                            className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Play size={11} />
                            Start
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void setDefaultCampaign(campaign.id)
                            }}
                            disabled={savingCampaign || campaign.is_default || campaign.status === 'archived'}
                            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Set Default
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleCampaignAction(campaign.id, 'pause')
                            }}
                            disabled={savingCampaign}
                            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pause size={11} />
                            Pause
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleCampaignAction(campaign.id, 'restart')
                            }}
                            disabled={runStartDisabled}
                            className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RotateCcw size={11} />
                            Restart
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleCampaignAction(campaign.id, 'archive')
                            }}
                            disabled={savingCampaign}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Archive size={11} />
                            Archive
                          </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {showNewCampaignForm ? (
                  <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Campaign Name</span>
                        <input
                          type="text"
                          value={newCampaignDraft.name || ''}
                          onChange={(event) => setNewCampaignDraft((current) => ({ ...current, name: event.target.value }))}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Leads Per Run</span>
                        <input
                          type="number"
                          min={5}
                          step={1}
                          value={newCampaignDraft.num_leads_per_run}
                          onChange={(event) => setNewCampaignDraft((current) => ({ ...current, num_leads_per_run: Number(event.target.value) || 40 }))}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                        />
                      </label>
                    </div>
                    <label className="mt-3 block space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Product Name</span>
                      <input
                        type="text"
                        value={newCampaignDraft.product_name}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, product_name: event.target.value }))}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                      />
                    </label>
                    <label className="mt-3 block space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Product Context</span>
                      <textarea
                        value={newCampaignDraft.product_context}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, product_context: event.target.value }))}
                        rows={4}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
                      />
                    </label>
                    <label className="mt-3 block space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Target Description</span>
                      <textarea
                        value={newCampaignDraft.target_description}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, target_description: event.target.value }))}
                        rows={6}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
                      />
                    </label>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={createCampaignDefinition}
                        disabled={savingCampaign}
                        className="rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingCampaign ? 'Creating...' : 'Create Campaign'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewCampaignForm(false)}
                        className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {selectedCampaignDefinition && editingCampaign ? (
                  <div className="mt-5 rounded-xl border border-neutral-200 bg-white/80 p-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Selected Campaign</p>
                        <h4 className="mt-1 text-sm font-semibold text-neutral-900">{selectedCampaignDefinition.name}</h4>
                        <p className="mt-1 text-xs text-neutral-500">
                          {selectedCampaignDefinition.is_default ? 'Default campaign config' : 'Save changes here, then use Set Default only if you want this campaign to become the default'}
                        </p>
                      </div>
                      <label className="space-y-2">
                        <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Manual Override This Run</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={manualLeadOverride}
                          onChange={(event) => setManualLeadOverride(event.target.value)}
                          placeholder={String(selectedCampaignDefinition.num_leads_per_run)}
                          className="w-full min-w-40 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Campaign Name</span>
                        <input
                          type="text"
                          value={editingCampaign.name || ''}
                          onChange={(event) => setEditingCampaign((current) => (current ? { ...current, name: event.target.value } : current))}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Leads Per Run</span>
                        <input
                          type="number"
                          min={5}
                          step={1}
                          value={editingCampaign.num_leads_per_run}
                          onChange={(event) => setEditingCampaign((current) => (current ? { ...current, num_leads_per_run: Number(event.target.value) || 40 } : current))}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                        />
                      </label>
                    </div>

                    {selectedCampaignAnalytics ? (
                      <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Campaign Analytics</p>
                            <p className="mt-1 text-sm text-neutral-700">
                              All tracked runs: {selectedCampaignAnalytics.totalRuns} · latest run {selectedCampaignAnalytics.latestRun ? formatRunDate(selectedCampaignAnalytics.latestRun.created_at) : '—'}
                            </p>
                          </div>
                          <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${healthTone(selectedCampaignAnalytics.healthScore)}`}>
                            Health {selectedCampaignAnalytics.healthScore}/100
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 md:grid-cols-4">
                          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Reply Rate</p>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{replyRate(selectedCampaignAnalytics.replied, selectedCampaignAnalytics.sent)}</p>
                            <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.replied} replies from {selectedCampaignAnalytics.sent} sent</p>
                          </div>
                          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Booked Rate</p>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{bookingRate(selectedCampaignAnalytics.booked, selectedCampaignAnalytics.sent)}</p>
                            <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.booked} booked</p>
                          </div>
                          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Bounce Rate</p>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedCampaignAnalytics.sent ? `${Math.round((selectedCampaignAnalytics.bounced / selectedCampaignAnalytics.sent) * 100)}%` : '—'}</p>
                            <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.bounced} bounced</p>
                          </div>
                          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Unsub Rate</p>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{unsubscribeRate(selectedCampaignAnalytics.unsubscribed, selectedCampaignAnalytics.sent)}</p>
                            <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.unsubscribed} unsubscribed</p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 xl:grid-cols-2">
                          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Branch Mix</p>
                            <div className="mt-3 space-y-2">
                              {([
                                ['clicked', selectedCampaignAnalytics.branchMix.clicked],
                                ['opened', selectedCampaignAnalytics.branchMix.opened],
                                ['cold', selectedCampaignAnalytics.branchMix.cold],
                                ['replied_later', selectedCampaignAnalytics.branchMix.replied_later],
                              ] as const).map(([branch, count]) => (
                                <div key={branch} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-2">
                                  <span className="text-sm font-medium text-neutral-700">{branchLabel(branch)}</span>
                                  <span className="text-sm text-neutral-900">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Email Source Mix</p>
                            <div className="mt-3 space-y-2">
                              {([
                                ['Exa', selectedCampaignAnalytics.sourceMix.exa],
                                ['Scraped', selectedCampaignAnalytics.sourceMix.scraped],
                                ['Pattern', selectedCampaignAnalytics.sourceMix.pattern],
                              ] as const).map(([label, count]) => (
                                <div key={label} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-2">
                                  <span className="text-sm font-medium text-neutral-700">{label}</span>
                                  <span className="text-sm text-neutral-900">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {selectedCampaignAnalytics.sourcePerformance.length ? (
                          <div className="mt-4 rounded-lg border border-neutral-200 bg-white px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Source Quality By Campaign</p>
                            <div className="mt-3 space-y-2">
                              {selectedCampaignAnalytics.sourcePerformance.map((source) => (
                                <div key={source.source} className="grid grid-cols-[minmax(0,1.1fr)_repeat(4,minmax(0,0.8fr))] gap-2 rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-3 text-sm">
                                  <div>
                                    <p className="font-medium text-neutral-900">{sourceLabel(source.source)}</p>
                                    <p className="mt-1 text-xs text-neutral-500">{source.leads} leads tracked</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Replies</p>
                                    <p className="mt-1 font-medium text-neutral-900">{source.replied}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Booked</p>
                                    <p className="mt-1 font-medium text-neutral-900">{source.booked}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Bounced</p>
                                    <p className="mt-1 font-medium text-neutral-900">{source.bounced}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Reply Rate</p>
                                    <p className="mt-1 font-medium text-neutral-900">{replyRate(source.replied, source.leads)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <label className="mt-3 block space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Product Name</span>
                      <input
                        type="text"
                        value={editingCampaign.product_name}
                        onChange={(event) => setEditingCampaign((current) => (current ? { ...current, product_name: event.target.value } : current))}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                      />
                    </label>

                    <label className="mt-3 block space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Product Context</span>
                      <textarea
                        value={editingCampaign.product_context}
                        onChange={(event) => setEditingCampaign((current) => (current ? { ...current, product_context: event.target.value } : current))}
                        rows={4}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
                      />
                    </label>

                    <label className="mt-3 block space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Campaign Description</span>
                      <textarea
                        value={editingCampaign.target_description}
                        onChange={(event) => setEditingCampaign((current) => (current ? { ...current, target_description: event.target.value } : current))}
                        rows={8}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={saveCampaignDefinition}
                        disabled={savingCampaign || runningCampaign}
                        className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 transition hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingCampaign ? 'Saving...' : 'Save Campaign'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void setDefaultCampaign(selectedCampaignDefinition.id)}
                        disabled={savingCampaign || selectedCampaignDefinition.is_default || selectedCampaignDefinition.status === 'archived'}
                        className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {selectedCampaignDefinition.is_default ? 'Default Campaign' : 'Set Default'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRunCampaign(selectedCampaignDefinition.id)}
                        disabled={runStartDisabled || selectedCampaignDefinition.status === 'archived'}
                        className="inline-flex items-center gap-2 rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Play size={12} />
                        {runningCampaign ? 'Starting...' : hasActiveCampaign ? 'Campaign Running' : 'Start Campaign'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {hasActiveCampaign && !pendingRun ? (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    A campaign is already running. Wait for it to finish before starting another one.
                  </div>
                ) : null}

                {liveCampaign && liveCampaignProgress ? (
                  <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">
                          {liveCampaignProgress.isComplete ? 'Run Complete' : 'Campaign In Progress'}
                        </p>
                        <h4 className="mt-1 text-sm font-semibold text-neutral-900">
                          {pendingRun?.title || liveCampaign.product_name || 'Campaign run'}
                        </h4>
                        <p className="mt-1 text-xs text-neutral-500">{liveCampaignProgress.summary}</p>
                      </div>
                      <span className={`inline-flex self-start rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                        liveCampaignProgress.isComplete
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-neutral-200 bg-white text-neutral-500'
                      }`}>
                        {liveCampaignProgress.badge}
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          liveCampaignProgress.isComplete ? 'bg-emerald-500' : 'bg-neutral-900'
                        }`}
                        style={{ width: `${liveCampaignProgress.progressPercent}%` }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-5">
                      {liveCampaignProgress.steps.map((step) => (
                        <div
                          key={step.key}
                          className={`rounded-lg border px-3 py-3 ${
                            step.state === 'complete'
                              ? 'border-emerald-200 bg-emerald-50/80'
                              : step.state === 'current'
                                ? 'border-neutral-900 bg-white'
                                : 'border-neutral-100 bg-white/70'
                          }`}
                        >
                          <p className="text-[11px] tracking-widest uppercase text-neutral-400">{step.label}</p>
                          <p className={`mt-1 text-sm font-semibold ${
                            step.state === 'complete'
                              ? 'text-emerald-700'
                              : step.state === 'current'
                                ? 'text-neutral-900'
                                : 'text-neutral-400'
                          }`}>
                            {step.state === 'complete' ? 'Done' : step.state === 'current' ? 'In progress' : 'Waiting'}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-5">
                      {liveCampaignProgress.metrics.map((metric) => (
                        <div key={metric.label} className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-2.5">
                          <p className="text-[11px] tracking-widest uppercase text-neutral-400">{metric.label}</p>
                          <p className="mt-1 text-lg font-semibold text-neutral-900">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {adminActionMessage ? (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {adminActionMessage}
                  </div>
                ) : null}
                {adminActionError ? (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {adminActionError}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <ListCard
            title="Recent Runs"
            subtitle="Click any run to open the full targeting, positioning, and delivery details"
            rows={latestCampaignRuns}
            emptyLabel="No runs yet"
            onRowClick={setSelectedRunId}
          />
        </div>
      )}

      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 px-4 py-8">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
              <div>
                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Campaign Run</p>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                  {formatCampaignRunTitle(selectedRun)}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {formatRunDate(selectedRun.created_at)} · {selectedRun.product_name} · {selectedRun.total_leads || 0} leads
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRunId(null)}
                className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4">
                  <p className="text-[11px] tracking-widest uppercase text-neutral-400">Run Metrics</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                    <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                      <p className="text-[11px] tracking-widest uppercase text-neutral-400">Qualified</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.qualified_leads || 0}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                      <p className="text-[11px] tracking-widest uppercase text-neutral-400">Emailed</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.emailed || 0}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                      <p className="text-[11px] tracking-widest uppercase text-neutral-400">Replies</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.replied || 0}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                      <p className="text-[11px] tracking-widest uppercase text-neutral-400">Booked</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.booked || 0}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                      <p className="text-[11px] tracking-widest uppercase text-neutral-400">Unsubscribed</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.unsubscribed || 0}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                      <p className="text-[11px] tracking-widest uppercase text-neutral-400">Bounced</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.bounced || 0}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                      <p className="text-[11px] tracking-widest uppercase text-neutral-400">Avg Score</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">
                        {typeof selectedRun.avg_score === 'number' ? `${selectedRun.avg_score.toFixed(1)}/10` : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3 md:col-span-2 xl:col-span-1">
                      <p className="text-[11px] tracking-widest uppercase text-neutral-400">Last Lead Activity</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900">
                        {selectedRun.last_lead_at ? formatRunDate(selectedRun.last_lead_at) : 'No lead activity recorded'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedRun.funnel_diagnostics ? (
                  <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Funnel Diagnostics</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          This shows exactly where the run narrowed from search to outreach.
                        </p>
                      </div>
                      <p className="text-xs text-neutral-400">
                        requested {selectedRun.funnel_diagnostics.requested_leads ?? '—'} · effective {selectedRun.funnel_diagnostics.effective_run_limit ?? '—'}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                      <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Raw</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.funnel_diagnostics.raw_candidates ?? '—'}</p>
                      </div>
                      <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Duplicates</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.funnel_diagnostics.duplicate_candidates ?? '—'}</p>
                      </div>
                      <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Fresh</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.funnel_diagnostics.fresh_candidates ?? '—'}</p>
                      </div>
                      <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Qualified</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.funnel_diagnostics.qualified ?? '—'}</p>
                      </div>
                      <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Email Found</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.funnel_diagnostics.email_found ?? '—'}</p>
                      </div>
                      <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">No Email</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedRun.funnel_diagnostics.no_email_found ?? '—'}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Report Delivery</p>
                        <p className="mt-1 text-sm font-medium text-neutral-900">
                          {reportStatusLabel(
                            selectedRun.funnel_diagnostics.report_status,
                            selectedRun.funnel_diagnostics.report_error_message,
                          )}
                        </p>
                      </div>
                      <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Follow-Up Sequence</p>
                        <p className="mt-1 text-sm text-neutral-700">
                          Touch 2 on day 4 with email + SMS, then touches 3–6 by email on days 11, 25, 39, and 53.
                        </p>
                      </div>
                    </div>
                    {selectedRunInsights.length ? (
                      <div className="mt-4 rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Run Insights</p>
                        <div className="mt-3 space-y-2">
                          {selectedRunInsights.map((insight) => (
                            <p key={insight} className="text-sm text-neutral-700">
                              {insight}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {selectedRunActions.length ? (
                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-blue-700">Recommended Actions</p>
                        <div className="mt-3 space-y-2">
                          {selectedRunActions.map((action) => (
                            <p key={action} className="text-sm text-neutral-700">
                              {action}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {followUpPerformance.length ? (
                      <div className="mt-4 rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Workspace Follow-Up Branch Performance</p>
                        <div className="mt-3 space-y-2">
                          {followUpPerformance.map((branch) => (
                            <div key={`modal-${branch.branch}`} className="overflow-x-auto rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-3">
                              <div className="grid min-w-[620px] grid-cols-[minmax(0,1.1fr)_repeat(5,minmax(0,0.75fr))] gap-2 text-sm">
                              <div>
                                <p className="font-medium text-neutral-900">{branchLabel(branch.branch)}</p>
                                <p className="mt-1 text-xs text-neutral-500">{branch.leads} leads tracked</p>
                              </div>
                              <div>
                                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Sent</p>
                                <p className="mt-1 font-medium text-neutral-900">{branch.sent}</p>
                              </div>
                              <div>
                                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Replies</p>
                                <p className="mt-1 font-medium text-neutral-900">{branch.replied}</p>
                              </div>
                              <div>
                                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Booked</p>
                                <p className="mt-1 font-medium text-neutral-900">{branch.booked}</p>
                              </div>
                              <div>
                                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Bounced</p>
                                <p className="mt-1 font-medium text-neutral-900">{branch.bounced}</p>
                              </div>
                              <div>
                                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Reply Rate</p>
                                <p className="mt-1 font-medium text-neutral-900">{replyRate(branch.replied, branch.leads)}</p>
                              </div>
                            </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {selectedRun.funnel_diagnostics.search_passes?.length ? (
                      <div className="mt-4 space-y-2">
                        {selectedRun.funnel_diagnostics.search_passes.map((pass, index) => (
                          <div key={`${selectedRun.id}-pass-${index}`} className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">
                              Search Pass {index + 1}
                            </p>
                            <p className="mt-1 text-sm text-neutral-700">{pass.query}</p>
                            <p className="mt-2 text-xs text-neutral-500">
                              raw {pass.raw_candidates} · fresh {pass.fresh_added} · duplicates {pass.duplicate_candidates ?? 0}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4">
                  <p className="text-[11px] tracking-widest uppercase text-neutral-400">Targeting</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                    {selectedRun.target_description || 'No targeting description saved for this run.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 px-4 py-8">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
              <div>
                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Prospect History</p>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                  {prospectHistory?.lead.company || 'Loading prospect...'}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {prospectHistory?.lead.email || '—'}
                  {prospectHistory?.lead.phone ? ` · ${prospectHistory.lead.phone}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closeProspectHistory}
                className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              {historyLoading ? (
                <p className="py-16 text-center text-sm text-neutral-500">Loading full correspondence history...</p>
              ) : historyError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {historyError}
                </div>
              ) : prospectHistory?.timeline.length ? (
                <div className="space-y-4">
                  {prospectHistory.timeline.map((item) => (
                    <div key={item.id} className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-4">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] uppercase tracking-widest text-neutral-500">
                              {timelineTypeLabel(item.type)}
                            </span>
                            <span className="text-xs text-neutral-400">{timeAgo(item.at)}</span>
                          </div>
                          <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                        </div>
                      </div>
                      {item.body && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{item.body}</p>
                      )}
                      {item.meta && Object.keys(item.meta).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(item.meta)
                            .filter(([, value]) => value !== null && value !== '')
                            .map(([key, value]) => (
                              <span key={key} className="rounded-full bg-white px-3 py-1 text-[11px] uppercase tracking-wider text-neutral-500">
                                {key.replace(/_/g, ' ')}: {String(value)}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-neutral-500">No saved correspondence was found for this prospect yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
