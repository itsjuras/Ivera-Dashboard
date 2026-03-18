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

const campaigns = [
  { name: 'Series A SaaS Founders', status: 'active', sent: 312, opened: 187, replied: 42, booked: 11 },
  { name: 'E-commerce Directors', status: 'active', sent: 198, opened: 104, replied: 28, booked: 7 },
  { name: 'Healthcare Clinic Owners', status: 'paused', sent: 156, opened: 89, replied: 19, booked: 5 },
  { name: 'Real Estate Brokerages', status: 'completed', sent: 245, opened: 142, replied: 35, booked: 9 },
]

const recentProspects = [
  { name: 'Sarah Chen', company: 'Meridian Health', title: 'COO', status: 'replied', lastAction: '2h ago' },
  { name: 'James Wilson', company: 'Atlas Software', title: 'CEO', status: 'opened', lastAction: '4h ago' },
  { name: 'Maria Garcia', company: 'Bloom Dental', title: 'Owner', status: 'booked', lastAction: '6h ago' },
  { name: 'David Kim', company: 'Purelight Studios', title: 'Director', status: 'sent', lastAction: '8h ago' },
  { name: 'Lisa Patel', company: 'NovaPay', title: 'VP Sales', status: 'replied', lastAction: '1d ago' },
]

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-neutral-100 text-neutral-600',
  replied: 'bg-emerald-100 text-emerald-700',
  opened: 'bg-blue-100 text-blue-700',
  booked: 'bg-neutral-900 text-white',
  sent: 'bg-neutral-100 text-neutral-500',
}

export default function SalesDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Sales Agent"
        subtitle="Outbound campaign performance and prospect pipeline"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Emails Sent" value={911} subtitle="This month" icon={Send} />
        <StatCard label="Open Rate" value="53.8%" subtitle="Industry avg: 21%" icon={MousePointerClick} />
        <StatCard label="Replies" value={124} subtitle="13.6% reply rate" icon={Reply} />
        <StatCard label="Meetings Booked" value={32} subtitle="This month" icon={CalendarCheck} />
        <StatCard label="Prospects in Pipeline" value={287} subtitle="Across 4 campaigns" icon={Users} />
        <StatCard label="Active Campaigns" value={2} subtitle="2 paused, 1 completed" icon={Mail} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Campaigns */}
        <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Campaigns</h3>
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.name} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{c.name}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {c.sent} sent &middot; {c.opened} opened &middot; {c.replied} replied &middot; {c.booked} booked
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full tracking-widest font-medium uppercase shrink-0 ml-3 ${statusColors[c.status]}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Prospects */}
        <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Recent Prospects</h3>
          <div className="space-y-3">
            {recentProspects.map((p) => (
              <div key={p.name} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-neutral-600">
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{p.name}</p>
                    <p className="text-xs text-neutral-400 truncate">{p.title} at {p.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-xs text-neutral-400">{p.lastAction}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full tracking-widest font-medium uppercase ${statusColors[p.status]}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
