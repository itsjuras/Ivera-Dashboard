import { useState, useEffect } from 'react'
import {
  Mail,
  Users,
  CalendarCheck,
  Send,
  Reply,
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
    created_at: string
  }>
}

const statusColors: Record<string, string> = {
  active:       'bg-emerald-100 text-emerald-700',
  paused:       'bg-amber-100 text-amber-700',
  completed:    'bg-neutral-100 text-neutral-600',
  replied:      'bg-emerald-100 text-emerald-700',
  opened:       'bg-blue-100 text-blue-700',
  booked:       'bg-neutral-900 text-white',
  emailed:      'bg-neutral-100 text-neutral-500',
  sent:         'bg-neutral-100 text-neutral-500',
  unsubscribed: 'bg-red-50 text-red-400',
  disqualified: 'bg-neutral-50 text-neutral-400',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
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

function buildLeadActivity(leads: PortalStats['recentLeads']) {
  const byDay = new Map<string, { day: string; sent: number; replied: number; booked: number }>()

  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)
    const key = date.toISOString().slice(0, 10)
    byDay.set(key, {
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sent: 0,
      replied: 0,
      booked: 0,
    })
  }

  for (const lead of leads) {
    const key = new Date(lead.created_at).toISOString().slice(0, 10)
    const bucket = byDay.get(key)
    if (!bucket) continue

    if (lead.status === 'replied') {
      bucket.replied += 1
    } else if (lead.status === 'booked') {
      bucket.booked += 1
    } else {
      bucket.sent += 1
    }
  }

  return Array.from(byDay.values())
}

function MetricGroup({
  title,
  icon: Icon,
  metrics,
}: {
  title: string
  icon: typeof Mail
  metrics: Array<{ label: string; value: string | number; hint: string }>
}) {
  return (
    <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-neutral-100 p-2">
          <Icon size={16} className="text-neutral-600" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-neutral-100 bg-white/60 p-3">
            <p className="text-[11px] tracking-widest uppercase text-neutral-400">{metric.label}</p>
            <p className="mt-1.5 text-xl font-semibold text-neutral-900 leading-none">{metric.value}</p>
            <p className="mt-1 text-[11px] text-neutral-500 leading-snug">{metric.hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SalesDashboard() {
  const { session } = useAuth()
  const [stats, setStats] = useState<PortalStats | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  if (!stats && !error) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center pt-24">
        <div className="w-6 h-6 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          title="Sales Agent"
          subtitle="Outbound campaign performance and prospect pipeline"
        />
        <div className="bg-white/70 rounded-xl border border-red-200/60 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  const totals = stats?.totals ?? { emailed: 0, replied: 0, booked: 0, unsubscribed: 0, weekEmailed: 0 }
  const recentLeads = stats?.recentLeads ?? []
  const campaigns = stats?.campaigns ?? []
  const leadActivity = buildLeadActivity(recentLeads)
  const outreachMetrics = [
    { label: 'Emails Sent', value: totals.emailed, hint: 'All time' },
    { label: 'Sent This Week', value: totals.weekEmailed, hint: 'Last 7 days' },
    { label: 'Campaign Runs', value: campaigns.length, hint: 'Recorded runs' },
    { label: 'Latest Run', value: latestRunLabel(campaigns), hint: 'Most recent activity' },
  ]
  const engagementMetrics = [
    { label: 'Replies', value: totals.replied, hint: 'All time' },
    { label: 'Reply Rate', value: replyRate(totals.replied, totals.emailed), hint: 'Replies divided by emails' },
    { label: 'Unsubscribed', value: totals.unsubscribed, hint: 'All time' },
    { label: 'Unsub Rate', value: unsubscribeRate(totals.unsubscribed, totals.emailed), hint: 'Unsubscribed divided by emails' },
  ]
  const pipelineMetrics = [
    { label: 'Meetings Booked', value: totals.booked, hint: 'All time' },
    { label: 'Booked Rate', value: bookingRate(totals.booked, totals.emailed), hint: 'Booked divided by emails' },
    { label: 'Pipeline Leads', value: recentLeads.length, hint: 'Recent prospects shown below' },
    { label: 'Recent Replies', value: recentReplyCount(recentLeads), hint: 'Replies or bookings in recent leads' },
  ]
  const qualityMetrics = [
    { label: 'Avg Lead Score', value: averageLeadScore(recentLeads), hint: 'Across scored recent leads' },
    { label: 'High-Intent', value: highIntentCount(recentLeads), hint: 'Score 7/10 or higher' },
    { label: 'Booked', value: recentLeads.filter((lead) => lead.status === 'booked').length, hint: 'Within recent leads' },
    { label: 'Unsubscribed', value: recentLeads.filter((lead) => lead.status === 'unsubscribed').length, hint: 'Within recent leads' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Sales Agent"
        subtitle="Outbound campaign performance and prospect pipeline"
      />

      <div className="grid grid-cols-1 gap-4 mb-6">
        <MetricGroup title="Outreach" icon={Send} metrics={outreachMetrics} />
        <MetricGroup title="Engagement" icon={Reply} metrics={engagementMetrics} />
        <MetricGroup title="Pipeline" icon={CalendarCheck} metrics={pipelineMetrics} />
        <MetricGroup title="Lead Quality" icon={Users} metrics={qualityMetrics} />
      </div>

      <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-6 mb-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Recent Lead Activity</h3>
            <p className="mt-1 text-xs text-neutral-500">Last 14 days from live lead records</p>
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
              <Bar dataKey="sent" stackId="activity" fill="#d4d4d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="replied" stackId="activity" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="booked" stackId="activity" fill="#171717" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Campaign runs */}
        <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Recent Campaign Runs</h3>
          {campaigns.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center">No campaign runs yet.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{c.product_name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Started {timeAgo(c.created_at)}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full tracking-widest font-medium uppercase shrink-0 ml-3 ${statusColors.completed}`}>
                    run
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Prospects */}
        <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Recent Prospects</h3>
          {recentLeads.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center">No prospects yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.slice(0, 10).map((p) => {
                const initials = p.company ? p.company.slice(0, 2).toUpperCase() : '?'
                return (
                  <div key={p.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-neutral-600">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{p.company || '—'}</p>
                        <p className="text-xs text-neutral-400 truncate">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-xs text-neutral-400">{timeAgo(p.created_at)}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full tracking-widest font-medium uppercase ${statusColors[p.status] ?? statusColors.emailed}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
