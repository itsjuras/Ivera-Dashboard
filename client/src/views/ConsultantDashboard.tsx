import { useState, useRef, useEffect } from 'react'
import { Send, TrendingDown, Rocket, AlertTriangle, ClipboardList } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const kpis = [
  { label: 'MRR', value: '$38.9K', delta: '↓ 8.1% MoM', negative: true },
  { label: 'Churn', value: '1.8%', delta: '↑ +0.4%', negative: true },
  { label: 'Accounts', value: '127', delta: '6 churned', negative: true },
  { label: 'Pipeline', value: '$124K', delta: '↓ 14% WoW', negative: true },
  { label: 'New Trials', value: '14', delta: 'vs 16 last wk', negative: false },
  { label: 'NRR', value: '96%', delta: 'target: 105%', negative: true },
]

const sources = [
  { name: 'HubSpot CRM', desc: 'Pipeline, Deals, Contacts', connected: true },
  { name: 'Stripe', desc: 'MRR, Churn, Revenue', connected: true },
  { name: 'Google Analytics 4', desc: 'Traffic, Conversions, Funnel', connected: true },
]

const suggestions = [
  { icon: TrendingDown, text: 'Why did MRR drop this month?' },
  { icon: Rocket, text: 'What should I focus on this week?' },
  { icon: AlertTriangle, text: 'Which accounts are at risk?' },
  { icon: ClipboardList, text: 'Analyse our pipeline health' },
]

const sampleResponses: Record<string, string> = {
  'Why did MRR drop this month?':
    `MRR declined 8.1% ($3,450) this month. Here's the breakdown:\n\n**Churn:** 6 accounts cancelled ($2,100/mo combined). 4 of these were on Basic plans acquired in Q4 — low engagement from day one.\n\n**Contraction:** 3 accounts downgraded from Pro → Basic ($900/mo lost). Two cited "not using advanced features."\n\n**Expansion:** Only $550 in upgrades vs $1,200 last month.\n\n**Recommendation:** The churn is concentrated in Q4 Basic cohort. I'd prioritise a retention campaign targeting Basic accounts with < 3 logins/week — that's 18 accounts representing $6,300 ARR at risk.`,
  'What should I focus on this week?':
    `Based on your current data, here are your top 3 priorities:\n\n**1. Close the Meridian Health deal ($18K)** — It's been in "proposal sent" for 12 days. HubSpot shows they opened the proposal 4 times. A follow-up call this week likely closes it.\n\n**2. Address the 6 at-risk accounts** — These accounts have dropped below 2 logins/week. Combined MRR: $4,200. A personal check-in from CS could save 3-4 of them.\n\n**3. Review your Google Ads spend** — CPC is up 23% this month but conversion rate dropped. You're spending $340/day for diminishing returns. Consider pausing the "enterprise" campaign and reallocating to the "SMB" campaign which has 3x better ROI.`,
  'Which accounts are at risk?':
    `I've identified 8 accounts showing churn signals:\n\n**High risk (likely to churn in 30 days):**\n• NovaTech ($450/mo) — 0 logins in 14 days, support ticket unresolved\n• Greenfield Co ($350/mo) — Downgraded last month, usage dropped 60%\n• Purelight ($300/mo) — Cancelled meeting with CS twice\n\n**Medium risk (60-day window):**\n• Atlas Software ($550/mo) — Login frequency halved\n• Cedar Health ($400/mo) — Only using 1 of 4 features\n• BrightPath ($300/mo) — Billing failed, no updated card\n\n**Early warning:**\n• Meridian Labs ($200/mo) — NPS score dropped from 8 to 5\n• Bloom Digital ($250/mo) — No API calls in 7 days\n\n**Total at-risk MRR: $2,800/mo ($33,600 ARR)**`,
  'Analyse our pipeline health':
    `Here's your pipeline snapshot:\n\n**Total pipeline:** $124K across 23 deals\n**Weighted pipeline:** $47K (based on stage probabilities)\n**Average deal size:** $5,391\n**Average sales cycle:** 34 days\n\n**By stage:**\n• Discovery: 8 deals ($38K) — 3 are stale (>14 days)\n• Proposal: 6 deals ($42K) — Meridian Health is your biggest at $18K\n• Negotiation: 4 deals ($28K) — all progressing normally\n• Closed Won (this month): 5 deals ($16K)\n\n**Concerns:**\n• Pipeline velocity dropped 14% week-over-week\n• 3 discovery deals haven't had activity in 2+ weeks\n• No new deals entered pipeline in the last 5 days\n\n**Action:** Focus on moving the 3 stale discovery deals forward or disqualifying them. Your close rate from Proposal → Won is strong at 62%.`,
}

function getResponse(input: string): string {
  const lower = input.toLowerCase()
  for (const [key, value] of Object.entries(sampleResponses)) {
    if (lower.includes(key.toLowerCase().slice(0, 20))) return value
  }
  if (lower.includes('mrr') || lower.includes('revenue') || lower.includes('drop'))
    return sampleResponses['Why did MRR drop this month?']
  if (lower.includes('risk') || lower.includes('churn'))
    return sampleResponses['Which accounts are at risk?']
  if (lower.includes('pipeline') || lower.includes('deal'))
    return sampleResponses['Analyse our pipeline health']
  if (lower.includes('focus') || lower.includes('priority') || lower.includes('week'))
    return sampleResponses['What should I focus on this week?']

  return `Based on your data, here's what I can tell you:\n\nYour business is currently at $38.9K MRR with 127 active accounts. The main area of concern is the 8.1% MRR decline driven by churn in your Q4 Basic cohort.\n\nCould you be more specific? Try asking about:\n• Revenue trends and churn analysis\n• At-risk accounts\n• Pipeline health\n• Marketing performance\n• Weekly priorities`
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ConsultantDashboard() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = (text: string) => {
    if (!text.trim() || typing) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: now(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTyping(true)

    // Simulate response delay
    setTimeout(() => {
      const response: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getResponse(text),
        timestamp: now(),
      }
      setMessages((prev) => [...prev, response])
      setTyping(false)
    }, 1200 + Math.random() * 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar — KPIs & Sources */}
      <aside className="relative w-64 bg-white/80 border-r border-neutral-200/60 flex flex-col shrink-0">
        <div className="relative flex flex-col flex-1 overflow-y-auto">
          <div className="px-5 pt-16 pb-4 border-b border-neutral-200/60">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold tracking-wider uppercase text-neutral-900">Business Consultant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-neutral-400 tracking-widest uppercase">Live</span>
            </div>
          </div>

          {/* Connected Sources */}
          <div className="px-5 py-4 border-b border-neutral-200/60">
            <p className="text-xs tracking-widest text-neutral-400 uppercase mb-3">Connected Sources</p>
            <div className="space-y-2.5">
              {sources.map((s) => (
                <div key={s.name} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-neutral-700">{s.name}</p>
                    <p className="text-xs text-neutral-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="px-5 py-4 flex-1">
            <p className="text-xs tracking-widest text-neutral-400 uppercase mb-3">Live KPIs</p>
            <div className="grid grid-cols-2 gap-2">
              {kpis.map((k) => (
                <div key={k.label} className="bg-neutral-50 rounded-lg p-2.5">
                  <p className="text-xs text-neutral-400 mb-0.5">{k.label}</p>
                  <p className="text-sm font-semibold text-neutral-900">{k.value}</p>
                  <p className={`text-xs mt-0.5 ${k.negative ? 'text-red-500' : 'text-neutral-400'}`}>
                    {k.delta}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {messages.length === 0 && !typing ? (
            /* Welcome state */
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
              <div className="flex items-center gap-1.5 mb-4">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs tracking-widest text-neutral-400 uppercase">Live</span>
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 tracking-wide uppercase mb-3">
                Your business, analysed.
              </h2>
              <p className="text-xs text-neutral-500 tracking-wider leading-relaxed uppercase mb-10 max-w-sm">
                Connected to your CRM, payments, and analytics. Ask any question and get a data-backed answer.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full">
                {suggestions.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    className="flex items-start gap-3 p-4 bg-white/70 border border-neutral-200/60 rounded-xl text-left hover:border-neutral-300 transition-colors group"
                  >
                    <Icon size={16} className="text-neutral-400 mt-0.5 shrink-0 group-hover:text-neutral-600 transition-colors" strokeWidth={1.5} />
                    <span className="text-xs text-neutral-600 tracking-wider uppercase leading-relaxed">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs">📈</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3.5 ${
                      msg.role === 'user'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white/70 border border-neutral-200/60 text-neutral-800'
                    }`}
                  >
                    <div className={`text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'assistant' ? 'prose-sm' : ''
                    }`}>
                      {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
                        }
                        return <span key={i}>{part}</span>
                      })}
                    </div>
                    <p className={`text-xs mt-2 ${
                      msg.role === 'user' ? 'text-neutral-400' : 'text-neutral-300'
                    }`}>
                      {msg.timestamp}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs text-white">👤</span>
                    </div>
                  )}
                </div>
              ))}
              {typing && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 mt-1">
                    <span className="text-xs">📈</span>
                  </div>
                  <div className="bg-white/70 border border-neutral-200/60 rounded-2xl px-5 py-4">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-neutral-200/60 bg-white/60 backdrop-blur-sm px-8 py-4">
          <div className="max-w-2xl mx-auto flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your business..."
              rows={1}
              className="flex-1 px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors resize-none"
              style={{ maxHeight: 120 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              className="w-10 h-10 bg-neutral-900 text-white rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
