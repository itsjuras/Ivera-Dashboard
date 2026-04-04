import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Inbox, BookOpen, Settings, RefreshCw, Send, Trash2, Plus, Globe, FileText } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const API = 'https://sales.ivera.ca'

interface Ticket {
  id: string
  subject: string
  sender_email: string
  sender_name: string
  status: string
  category: string
  urgency: string
  summary: string
  created_at: string
  resolved_by?: string
}

interface Message {
  id: string
  direction: string
  sender_email: string
  body: string
  created_at: string
  confidence?: number
}

interface KBArticle {
  id: string
  title: string
  source_type: string
  source_url?: string
  created_at: string
}

interface Stats {
  totalTickets: number
  openTickets: number
  resolvedAuto: number
  escalated: number
  weekTickets: number
  avgResolutionMs: number | null
  kbArticles: number
}

const URGENCY_COLOR: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  normal: 'bg-blue-100 text-blue-700',
  low: 'bg-neutral-100 text-neutral-500',
}

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700',
  escalated: 'bg-red-100 text-red-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-neutral-100 text-neutral-500',
}

export default function SupportDashboard() {
  const { session } = useAuth()
  const [tab, setTab] = useState<'tickets' | 'kb' | 'settings'>('tickets')
  const [ticketFilter, setTicketFilter] = useState('all')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [ingestUrl, setIngestUrl] = useState('')
  const [ingestText, setIngestText] = useState('')
  const [ingestTitle, setIngestTitle] = useState('')
  const [ingesting, setIngesting] = useState(false)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }), [session])

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const [statsRes, ticketsRes, kbRes] = await Promise.all([
        fetch(`${API}/support/stats`, { headers: headers() }),
        fetch(`${API}/support/tickets?limit=100`, { headers: headers() }),
        fetch(`${API}/support/kb`, { headers: headers() }),
      ])
      if (!statsRes.ok || !ticketsRes.ok || !kbRes.ok) {
        const status = [statsRes.status, ticketsRes.status, kbRes.status].find((code) => code >= 400) ?? 500
        throw new Error(`HTTP ${status}`)
      }
      if (statsRes.ok) setStats(await statsRes.json())
      if (ticketsRes.ok) { const d = await ticketsRes.json(); setTickets(d.tickets || []) }
      if (kbRes.ok) { const d = await kbRes.json(); setKbArticles(d.articles || []) }
    } catch (err) {
      const message = err instanceof Error && err.message === 'HTTP 401'
        ? 'Your account is signed in, but it is not authorized for a support workspace yet.'
        : 'We could not load live support data.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [session, headers])

  useEffect(() => { load() }, [load])

  async function openTicket(ticket: Ticket) {
    setSelected(ticket)
    const res = await fetch(`${API}/support/tickets/${ticket.id}`, { headers: headers() })
    if (res.ok) { const d = await res.json(); setMessages(d.messages || []) }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return
    setSending(true)
    await fetch(`${API}/support/tickets/${selected.id}/reply`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ body: reply }),
    })
    setReply('')
    openTicket(selected)
    setSending(false)
  }

  async function closeTicket() {
    if (!selected) return
    await fetch(`${API}/support/tickets/${selected.id}/close`, { method: 'POST', headers: headers() })
    setSelected(null)
    load()
  }

  async function deleteKb(id: string) {
    await fetch(`${API}/support/kb/${id}`, { method: 'DELETE', headers: headers() })
    load()
  }

  async function handleIngestUrl() {
    if (!ingestUrl.trim()) return
    setIngesting(true)
    await fetch(`${API}/support/kb/ingest-url`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ url: ingestUrl }),
    })
    setIngestUrl('')
    setIngesting(false)
    load()
  }

  async function handleIngestText() {
    if (!ingestText.trim() || !ingestTitle.trim()) return
    setIngesting(true)
    await fetch(`${API}/support/kb/ingest-text`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ title: ingestTitle, text: ingestText, source_type: 'manual' }),
    })
    setIngestText('')
    setIngestTitle('')
    setIngesting(false)
    load()
  }

  const filteredTickets = tickets.filter(t =>
    ticketFilter === 'all' || t.status === ticketFilter
  )

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-xs text-neutral-400 tracking-widest uppercase">Loading support data...</div>
    </div>
  )

  if (error) {
    return (
      <div className="flex h-full items-start p-8">
        <div className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-neutral-200 flex flex-col py-6 px-4 gap-1">
        {[
          { id: 'tickets', icon: Inbox, label: 'Tickets', badge: stats?.openTickets || 0 },
          { id: 'kb', icon: BookOpen, label: 'Knowledge Base', badge: stats?.kbArticles || 0 },
          { id: 'settings', icon: Settings, label: 'Settings', badge: 0 },
        ].map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs tracking-wider uppercase transition-colors ${tab === id ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            <span className="flex items-center gap-2"><Icon size={14} />{label}</span>
            {badge > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'}`}>{badge}</span>}
          </button>
        ))}

        {/* Stats */}
        {stats && (
          <div className="mt-auto pt-6 border-t border-neutral-100 space-y-3">
            {[
              { label: 'This week', value: stats.weekTickets },
              { label: 'Auto-resolved', value: stats.resolvedAuto },
              { label: 'Escalated', value: stats.escalated },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-neutral-400 tracking-wider uppercase">{label}</span>
                <span className="text-xs font-semibold text-neutral-700">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── TICKETS TAB ── */}
        {tab === 'tickets' && (
          <>
            {/* Ticket list */}
            <div className={`flex flex-col border-r border-neutral-200 overflow-hidden ${selected ? 'w-80 shrink-0' : 'flex-1'}`}>
              <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex gap-1">
                  {['all', 'open', 'escalated', 'resolved', 'closed'].map(f => (
                    <button key={f} onClick={() => setTicketFilter(f)}
                      className={`px-2 py-1 rounded text-xs tracking-wider uppercase transition-colors ${ticketFilter === f ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-neutral-700'}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <button onClick={load} className="text-neutral-400 hover:text-neutral-700 transition-colors"><RefreshCw size={13} /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredTickets.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-xs text-neutral-400 tracking-widest uppercase">No tickets</div>
                )}
                {filteredTickets.map(ticket => (
                  <button key={ticket.id} onClick={() => openTicket(ticket)}
                    className={`w-full text-left px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${selected?.id === ticket.id ? 'bg-neutral-50' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-neutral-900 truncate">{ticket.subject || '(No subject)'}</span>
                      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLOR[ticket.status] || ''}`}>{ticket.status}</span>
                    </div>
                    <div className="text-xs text-neutral-500 truncate mb-1">{ticket.sender_name || ticket.sender_email}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${URGENCY_COLOR[ticket.urgency] || ''}`}>{ticket.urgency}</span>
                      <span className="text-xs text-neutral-400">{new Date(ticket.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket detail */}
            {selected && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 mb-1">{selected.subject}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500">{selected.sender_name} &lt;{selected.sender_email}&gt;</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${URGENCY_COLOR[selected.urgency] || ''}`}>{selected.urgency}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLOR[selected.status] || ''}`}>{selected.status}</span>
                    </div>
                    {selected.summary && <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider">{selected.summary}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {selected.status !== 'closed' && (
                      <button onClick={closeTicket} className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 tracking-wider uppercase">Close</button>
                    )}
                    <button onClick={() => setSelected(null)} className="text-neutral-400 hover:text-neutral-700 px-2">✕</button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-lg rounded-2xl px-4 py-3 ${m.direction === 'outbound' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-900'}`}>
                        <div className="text-xs leading-relaxed whitespace-pre-wrap">{m.body}</div>
                        <div className={`text-xs mt-1 ${m.direction === 'outbound' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          {m.direction === 'outbound' ? 'You' : m.sender_email} · {new Date(m.created_at).toLocaleTimeString()}
                          {m.confidence != null && <span className="ml-2">· {(m.confidence * 100).toFixed(0)}% confidence</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply box */}
                {selected.status !== 'closed' && (
                  <div className="px-6 py-4 border-t border-neutral-100">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder="Write a reply..."
                      rows={3}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-xs resize-none outline-none focus:border-neutral-400 transition-colors"
                    />
                    <div className="flex justify-end mt-2">
                      <button onClick={sendReply} disabled={sending || !reply.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs rounded-lg hover:bg-neutral-700 disabled:opacity-40 transition-colors tracking-wider uppercase">
                        <Send size={12} />{sending ? 'Sending...' : 'Send reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── KB TAB ── */}
        {tab === 'kb' && (
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-2xl space-y-8">
              {/* Scrape URL */}
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-neutral-900 mb-3 flex items-center gap-2"><Globe size={14} />Scrape a website</h3>
                <div className="flex gap-2">
                  <input value={ingestUrl} onChange={e => setIngestUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-xs outline-none focus:border-neutral-400" />
                  <button onClick={handleIngestUrl} disabled={ingesting || !ingestUrl.trim()}
                    className="px-4 py-2 bg-neutral-900 text-white text-xs rounded-lg hover:bg-neutral-700 disabled:opacity-40 tracking-wider uppercase">
                    {ingesting ? 'Scraping...' : 'Scrape'}
                  </button>
                </div>
              </div>

              {/* Paste text */}
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-neutral-900 mb-3 flex items-center gap-2"><FileText size={14} />Add text manually</h3>
                <input value={ingestTitle} onChange={e => setIngestTitle(e.target.value)}
                  placeholder="Title (e.g. Pricing FAQ)"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs outline-none focus:border-neutral-400 mb-2" />
                <textarea value={ingestText} onChange={e => setIngestText(e.target.value)}
                  placeholder="Paste your content here..."
                  rows={5}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs outline-none focus:border-neutral-400 resize-none mb-2" />
                <button onClick={handleIngestText} disabled={ingesting || !ingestText.trim() || !ingestTitle.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs rounded-lg hover:bg-neutral-700 disabled:opacity-40 tracking-wider uppercase">
                  <Plus size={12} />{ingesting ? 'Adding...' : 'Add to KB'}
                </button>
              </div>

              {/* Article list */}
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-neutral-900 mb-3">{kbArticles.length} Articles</h3>
                <div className="space-y-2">
                  {kbArticles.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                      <div>
                        <div className="text-xs font-medium text-neutral-900">{a.title}</div>
                        <div className="text-xs text-neutral-400 uppercase tracking-wider mt-0.5">{a.source_type} · {new Date(a.created_at).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => deleteKb(a.id)} className="text-neutral-300 hover:text-red-500 transition-colors ml-4"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-lg">
              <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-6 space-y-4">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-neutral-900 flex items-center gap-2"><MessageSquare size={14} />Support Configuration</h3>
                <SupportConfig headers={headers} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SupportConfig({ headers }: { headers: () => Record<string, string> }) {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${API}/support/config`, { headers: headers() })
      .then(r => r.json()).then(setConfig).catch(() => {})
  }, [headers])

  async function save() {
    setSaving(true)
    await fetch(`${API}/support/config`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify(config),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      {[
        { key: 'reply_from_name', label: 'Reply from name', placeholder: 'Support' },
        { key: 'signature', label: 'Email signature', placeholder: 'Best, The Ivera Team' },
        { key: 'escalation_email', label: 'Escalation email', placeholder: 'you@yourcompany.com' },
        { key: 'escalation_phone', label: 'Escalation SMS', placeholder: '+1 778 ...' },
        { key: 'auto_resolve_threshold', label: 'Auto-resolve threshold (0–1)', placeholder: '0.85' },
        { key: 'tone', label: 'Tone (professional / friendly / casual)', placeholder: 'professional' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-xs text-neutral-500 tracking-wider uppercase mb-1">{label}</label>
          <input
            value={config[key] || ''}
            onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs outline-none focus:border-neutral-400"
          />
        </div>
      ))}
      <button onClick={save} disabled={saving}
        className="px-4 py-2 bg-neutral-900 text-white text-xs rounded-lg hover:bg-neutral-700 disabled:opacity-40 tracking-wider uppercase">
        {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save settings'}
      </button>
    </div>
  )
}
