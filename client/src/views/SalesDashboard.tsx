import { useState, useEffect } from 'react'
import {
  Mail,
  Users,
  MousePointerClick,
  CalendarCheck,
  Send,
  Reply,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
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
  const latestCampaignRun = campaigns[0] ?? null

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Sales Agent"
        subtitle="Outbound campaign performance and prospect pipeline"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Emails Sent" value={totals.emailed} subtitle="All time" icon={Send} />
        <StatCard label="Reply Rate" value={replyRate(totals.replied, totals.emailed)} subtitle={`${totals.replied} replies`} icon={Reply} />
        <StatCard label="Meetings Booked" value={totals.booked} subtitle="All time" icon={CalendarCheck} />
        <StatCard label="Sent This Week" value={totals.weekEmailed} subtitle="Last 7 days" icon={MousePointerClick} />
        <StatCard label="Prospects in Pipeline" value={recentLeads.length} subtitle="Recent leads" icon={Users} />
        <StatCard
          label="Campaign Runs"
          value={campaigns.length}
          subtitle={latestCampaignRun ? `Latest ${timeAgo(latestCampaignRun.created_at)}` : 'No runs yet'}
          icon={Mail}
        />
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
