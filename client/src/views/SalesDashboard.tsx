import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  CalendarCheck,
  Send,
  Reply,
  SlidersHorizontal,
  Play,
  X,
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

const SALES_API = 'https://sales.ivera.ca'

interface PortalStats {
  totals: {
    emailed: number
    replied: number
    booked: number
    unsubscribed: number
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
  campaigns: Array<{
    id: string
    product_name: string
    target_description: string
    created_at: string
    total_leads: number
    qualified_leads: number
    emailed: number
    replied: number
    booked: number
    unsubscribed: number
    avg_score: number | null
    last_lead_at: string | null
  }>
}

interface CampaignConfig {
  product_name: string
  product_context: string
  target_description: string
  num_leads_per_run: number
  sender_name?: string | null
  sender_email?: string | null
  reply_to_email?: string | null
  cal_booking_url?: string | null
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

function replyRate(replied: number, emailed: number) {
  if (!emailed) return '—'
  return `${((replied / emailed) * 100).toFixed(1)}%`
}

function bookingRate(booked: number, emailed: number) {
  if (!emailed) return '—'
  return `${((booked / emailed) * 100).toFixed(1)}%`
}

function unsubscribeRate(unsubscribed: number, emailed: number) {
  if (!emailed) return '—'
  return `${((unsubscribed / emailed) * 100).toFixed(1)}%`
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
  rows: Array<{ id: string; title: string; meta: string; badge?: string; interactive?: boolean }>
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
  const [overviewDays, setOverviewDays] = useState<OverviewDays>(14)
  const [prospectDays, setProspectDays] = useState<ProspectDays>(30)
  const [prospectStatus, setProspectStatus] = useState<ProspectStatus>('all')
  const [prospectScore, setProspectScore] = useState<ProspectScore>('all')
  const [chartLayers, setChartLayers] = useState<Record<LayerKey, boolean>>({
    sent: true,
    replied: true,
    booked: true,
    unsubscribed: false,
  })
  const [campaignConfig, setCampaignConfig] = useState<CampaignConfig | null>(null)
  const [editableTargetDescription, setEditableTargetDescription] = useState('')
  const [savingDescription, setSavingDescription] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [adminActionMessage, setAdminActionMessage] = useState<string | null>(null)
  const [adminActionError, setAdminActionError] = useState<string | null>(null)
  const [runningCampaign, setRunningCampaign] = useState(false)
  const [expectedLeadMin, setExpectedLeadMin] = useState('')
  const [expectedLeadMax, setExpectedLeadMax] = useState('')
  const [manualLeadOverride, setManualLeadOverride] = useState('')
  const [pendingRun, setPendingRun] = useState<{
    startedAt: number
    title: string
    requestedLeadCount: number | null
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
      setCampaignConfig(null)
      return
    }

    let cancelled = false
    setConfigLoading(true)

    salesRequest<{ config: CampaignConfig }>(session.access_token, '/campaign/config')
      .then((data) => {
        if (!cancelled) {
          setCampaignConfig(data.config)
          setEditableTargetDescription(data.config.target_description || '')
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setAdminActionError(err.message)
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [role, session])

  useEffect(() => {
    if (!campaignConfig) return

    const suggestedMin = Math.max(5, Math.floor(campaignConfig.num_leads_per_run * 0.7))
    const suggestedMax = Math.max(suggestedMin, Math.ceil(campaignConfig.num_leads_per_run * 1.3))

    setExpectedLeadMin((current) => current || String(suggestedMin))
    setExpectedLeadMax((current) => current || String(suggestedMax))
  }, [campaignConfig])

  useEffect(() => {
    setEditableTargetDescription(campaignConfig?.target_description || '')
  }, [campaignConfig?.target_description])

  const totals = stats?.totals ?? { emailed: 0, replied: 0, booked: 0, unsubscribed: 0, weekEmailed: 0 }
  const recentLeads = stats?.recentLeads ?? []
  const campaigns = stats?.campaigns ?? []

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
    () => buildLeadActivity(overviewLeads, overviewDays),
    [overviewLeads, overviewDays],
  )

  const parsedExpectedMin = Number(expectedLeadMin)
  const parsedExpectedMax = Number(expectedLeadMax)
  const parsedManualOverride = Number(manualLeadOverride)
  const hasManualOverride = manualLeadOverride.trim().length > 0 && Number.isFinite(parsedManualOverride)
  const overrideOutsideRange =
    hasManualOverride &&
    Number.isFinite(parsedExpectedMin) &&
    Number.isFinite(parsedExpectedMax) &&
    (parsedManualOverride < parsedExpectedMin || parsedManualOverride > parsedExpectedMax)

  const latestCampaignRuns = useMemo(
    () => {
      const rows = campaigns.slice(0, 8).map((campaign) => ({
        id: campaign.id,
        title: campaign.product_name || 'Campaign run',
        meta: formatRunDate(campaign.created_at),
        badge: `${campaign.total_leads || 0} leads`,
      }))

      if (!pendingRun) return rows

      return [
        {
          id: 'pending-run',
          title: pendingRun.title,
          meta: `Live run in progress · ${formatElapsedTimer(pendingRun.startedAt, runTimerNow)}`,
          badge:
            pendingRun.requestedLeadCount && pendingRun.requestedLeadCount > 0
              ? `${pendingRun.requestedLeadCount} requested`
              : 'running',
          interactive: false,
        },
        ...rows,
      ]
    },
    [campaigns, pendingRun, runTimerNow],
  )

  const selectedRun = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedRunId) ?? null,
    [campaigns, selectedRunId],
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
    if (!pendingRun || !session?.access_token) return

    const tickTimer = window.setInterval(() => {
      setRunTimerNow(Date.now())
    }, 1000)

    const pollTimer = window.setInterval(() => {
      void refreshStats()
    }, 10000)

    return () => {
      window.clearInterval(tickTimer)
      window.clearInterval(pollTimer)
    }
  }, [pendingRun, session?.access_token])

  useEffect(() => {
    if (!pendingRun) return

    const startedAt = pendingRun.startedAt
    const matchingRun = campaigns.find(
      (campaign) => new Date(campaign.created_at).getTime() >= startedAt - 60_000,
    )

    if (!matchingRun) return

    const hasMeaningfulProgress =
      (matchingRun.total_leads ?? 0) > 0 ||
      (matchingRun.emailed ?? 0) > 0 ||
      (matchingRun.replied ?? 0) > 0 ||
      (matchingRun.booked ?? 0) > 0 ||
      (matchingRun.unsubscribed ?? 0) > 0

    const hasTimedOut = Date.now() - startedAt > 3 * 60_000

    if (hasMeaningfulProgress || hasTimedOut) {
      setPendingRun(null)
    }
  }, [campaigns, pendingRun])

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

  async function handleRunCampaign() {
    if (!session?.access_token) return
    setRunningCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const requestedLeadCount = hasManualOverride ? Math.round(parsedManualOverride) : undefined
      const startedAt = Date.now()
      const data = await salesRequest<{ message: string }>(session.access_token, '/campaign/start', {
        method: 'POST',
        body: JSON.stringify(requestedLeadCount ? { num_leads: requestedLeadCount } : {}),
      })
      setPendingRun({
        startedAt,
        title: campaignConfig?.product_name || 'Campaign run',
        requestedLeadCount: requestedLeadCount ?? null,
      })
      setRunTimerNow(startedAt)
      setAdminActionMessage(
        requestedLeadCount
          ? `${data.message || 'Campaign started.'} Manual override: ${requestedLeadCount} leads.`
          : (data.message || 'Campaign started.'),
      )
      await refreshStats()
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to start campaign.')
    } finally {
      setRunningCampaign(false)
    }
  }

  async function saveCampaignDescription() {
    if (!session?.access_token || !campaignConfig) return
    setSavingDescription(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const data = await salesRequest<{ config: CampaignConfig; message: string }>(session.access_token, '/campaign/config', {
        method: 'PATCH',
        body: JSON.stringify({ target_description: editableTargetDescription }),
      })
      setCampaignConfig(data.config)
      setEditableTargetDescription(data.config.target_description || '')
      setAdminActionMessage(data.message || 'Campaign description saved.')
      await refreshStats()
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to save campaign description.')
    } finally {
      setSavingDescription(false)
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
                <p className="mt-1 text-xs text-neutral-500">Live lead activity with time and layer filters</p>
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

      {role === 'ivera_admin' && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Admin Controls</p>
                {configLoading ? (
                  <p className="text-sm text-neutral-500">Loading current campaign config...</p>
                ) : campaignConfig ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-neutral-900">{campaignConfig.product_name}</p>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">{campaignConfig.num_leads_per_run} leads per run</p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No live campaign config loaded.</p>
                )}

                <div className="grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Expected Min Leads</span>
                    <input
                      type="number"
                      min={5}
                      step={1}
                      value={expectedLeadMin}
                      onChange={(event) => setExpectedLeadMin(event.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Expected Max Leads</span>
                    <input
                      type="number"
                      min={5}
                      step={1}
                      value={expectedLeadMax}
                      onChange={(event) => setExpectedLeadMax(event.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Manual Override This Run</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={manualLeadOverride}
                      onChange={(event) => setManualLeadOverride(event.target.value)}
                      placeholder={campaignConfig ? String(campaignConfig.num_leads_per_run) : '40'}
                      className="w-full rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                    />
                  </label>
                </div>

                {overrideOutsideRange && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Manual override is outside your expected range for this run. It will still be used when you click <span className="font-medium">Run Campaign</span>.
                  </div>
                )}

                <div className="pt-2">
                  <label
                    htmlFor="campaign-description"
                    className="mb-2 block text-[11px] tracking-widest uppercase text-neutral-400"
                  >
                    Campaign Description
                  </label>
                  <textarea
                    id="campaign-description"
                    value={editableTargetDescription}
                    onChange={(event) => setEditableTargetDescription(event.target.value)}
                    rows={6}
                    className="w-full max-w-4xl rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={saveCampaignDescription}
                    disabled={savingDescription || runningCampaign}
                    className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 transition hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingDescription ? 'Saving...' : 'Save Description'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRunCampaign}
                    disabled={runningCampaign || savingDescription}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Play size={12} />
                    {runningCampaign ? 'Starting...' : 'Run Campaign'}
                  </button>
                </div>
              </div>
            </div>

            {adminActionMessage && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {adminActionMessage}
              </div>
            )}
            {adminActionError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {adminActionError}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'outreach' && (
        <div className="mt-6">
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
                  {selectedRun.product_name || 'Campaign run'}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {formatRunDate(selectedRun.created_at)} · {selectedRun.total_leads || 0} leads
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
