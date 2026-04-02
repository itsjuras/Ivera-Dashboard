import { useState, useRef, useEffect } from 'react'

const API_BASE = 'https://sales.ivera.ca'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! 👋 I\'m Ivera\'s AI assistant. Ask me anything about our products, pricing, or how to get started.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6)
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, something went wrong. Please email sales@ivera.ca.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please email sales@ivera.ca.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Chat window */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 68, right: 0,
          width: 340, maxHeight: 480,
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ background: '#0A0F1E', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>Ivera AI</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Always online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, maxHeight: 340 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '8px 12px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: m.role === 'user' ? '#0A0F1E' : '#f3f4f6',
                  color: m.role === 'user' ? 'white' : '#1f2937',
                  fontSize: 13, lineHeight: 1.5
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#f3f4f6', borderRadius: '12px 12px 12px 2px', padding: '8px 14px' }}>
                  <span style={{ display: 'inline-flex', gap: 3 }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', display: 'inline-block', animation: `bounce 1s ${i * 0.15}s infinite` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything..."
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fafafa' }}
              autoFocus
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{ padding: '8px 14px', background: input.trim() && !loading ? '#0A0F1E' : '#e5e7eb', color: input.trim() && !loading ? 'white' : '#9ca3af', border: 'none', borderRadius: 8, cursor: input.trim() && !loading ? 'pointer' : 'default', fontSize: 13, fontWeight: 600, transition: 'background 0.15s' }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Bounce animation */}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }`}</style>

      {/* Bubble button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#0A0F1E',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: 'white',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'scale(1)' }}
        aria-label="Chat with Ivera AI"
      >
        {open ? '×' : '✦'}
      </button>
    </div>
  )
}
