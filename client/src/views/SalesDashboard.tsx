import { useEffect, useMemo, useState } from 'react'
import {
  Users,
  CalendarCheck,
  Send,
  Reply,
  SlidersHorizontal,
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

type OverviewDays = 7 | 14 | 30
type ProspectDays = 0 | 7 | 14 | 30
type LayerKey = 'sent' | 'replied' | 'booked' | 'unsubscribed'
type TabKey = 'overview' | 'prospects'
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

function tabButtonClass(active: boolean) {
  return `rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition ${
    active
      ? 'border-neutral-900 bg-neutral-900 text-white'
      : 'border-neutral-200 bg-white/70 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
  }`
}

export default function SalesDashboard() {
  const { session } = useAuth()
  const [stats, setStats] = useState<PortalStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
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

  const totals = stats?.totals ?? { emailed: 0, replied: 0, booked: 0, unsubscribed: 0, weekEmailed: 0 }
  const recentLeads = stats?.recentLeads ?? []
  const campaigns = stats?.campaigns ?? []

  const overviewLeads = useMemo(
    () => recentLeads.filter((lead) => leadWithinDays(lead.created_at, overviewDays)),
    [recentLeads, overviewDays],
  )

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

  const outreachMetrics = [
    { label: 'Sent In Window', value: overviewSummary.sent, hint: `Last ${overviewDays} days` },
    { label: 'Sent This Week', value: totals.weekEmailed, hint: 'Rolling 7 days' },
    { label: 'Campaign Runs', value: campaigns.length, hint: 'Recorded runs' },
    { label: 'Latest Run', value: latestRunLabel(campaigns), hint: 'Most recent activity' },
  ]
  const engagementMetrics = [
    { label: 'Replies', value: overviewSummary.replied, hint: `Last ${overviewDays} days` },
    { label: 'Reply Rate', value: replyRate(overviewSummary.replied, overviewSummary.sent), hint: 'Replies divided by sent' },
    { label: 'Unsubscribed', value: overviewSummary.unsubscribed, hint: `Last ${overviewDays} days` },
    { label: 'Unsub Rate', value: unsubscribeRate(overviewSummary.unsubscribed, overviewSummary.sent), hint: 'Opt-outs divided by sent' },
  ]
  const pipelineMetrics = [
    { label: 'Meetings Booked', value: overviewSummary.booked, hint: `Last ${overviewDays} days` },
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
          onClick={() => setActiveTab('overview')}
          className={tabButtonClass(activeTab === 'overview')}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prospects')}
          className={tabButtonClass(activeTab === 'prospects')}
        >
          Prospects
        </button>
      </div>

      {activeTab === 'overview' ? (
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

          <div className="grid grid-cols-1 gap-4">
            <MetricSection title="Outreach" icon={Send} metrics={outreachMetrics} />
            <MetricSection title="Engagement" icon={Reply} metrics={engagementMetrics} />
            <MetricSection title="Pipeline" icon={CalendarCheck} metrics={pipelineMetrics} />
            <MetricSection title="Lead Quality" icon={Users} metrics={qualityMetrics} />
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
                    <tr key={lead.id} className="border-b border-neutral-100 last:border-0">
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
    </div>
  )
}
