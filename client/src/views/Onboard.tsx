import { useState } from 'react'
import { Check } from 'lucide-react'
import WaveBackground from '../components/WaveBackground'

const CAL_URL = 'https://cal.com/vaidas-makselis-wvjvqz/ivera-sales-agent'

const plans = [
  { value: 'basic', label: 'Basic — $99/mo', desc: '~25 prospects/week, 1 target audience' },
  { value: 'pro', label: 'Pro — $499/mo', desc: '~75 prospects/week, up to 3 target audiences' },
  { value: 'enterprise', label: 'Enterprise — $999/mo', desc: '~150 prospects/week, unlimited audiences' },
]

function Field({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
  hint,
  value,
  onChange,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  hint?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs tracking-widest uppercase text-neutral-500 mb-2">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors"
      />
      {hint && <p className="mt-1.5 text-xs text-neutral-400 tracking-wider uppercase">{hint}</p>}
    </div>
  )
}

function TextArea({
  label,
  name,
  required = false,
  placeholder,
  hint,
  value,
  onChange,
}: {
  label: string
  name: string
  required?: boolean
  placeholder?: string
  hint?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs tracking-widest uppercase text-neutral-500 mb-2">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 transition-colors resize-none"
      />
      {hint && <p className="mt-1.5 text-xs text-neutral-400 tracking-wider uppercase">{hint}</p>}
    </div>
  )
}

function Section({ title, number, children }: { title: string; number: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/70 border border-neutral-200/60 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs font-medium text-neutral-300">{number}</span>
        <h3 className="text-sm font-semibold text-black tracking-wider uppercase">{title}</h3>
      </div>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  )
}

export default function Onboard() {
  const [form, setForm] = useState({
    businessName: '',
    website: '',
    email: '',
    productName: '',
    productWebsite: '',
    serviceDescription: '',
    targetCustomers: '',
    senderName: '',
    senderEmail: '',
    replyToEmail: '',
    calUrl: '',
    phone1: '',
    phone2: '',
    plan: 'pro',
  })

  const [submitted, setSubmitted] = useState(false)

  const set = (key: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
          <a href="/" className="text-xl font-semibold tracking-widest uppercase text-white">
            Ivera
          </a>
          <div className="hidden sm:flex items-center gap-6 text-xs tracking-widest uppercase text-white">
            <a href="/#receptionist" className="opacity-60 hover:opacity-100 transition-opacity">Receptionist</a>
            <a href="/#sales" className="opacity-60 hover:opacity-100 transition-opacity">Sales Agent</a>
            <a href="/#consultant" className="opacity-60 hover:opacity-100 transition-opacity">Consultant</a>
          </div>
          <a
            href={CAL_URL}
            className="px-4 py-1.5 text-xs font-medium tracking-widest rounded-lg uppercase border border-white text-white hover:opacity-60 transition-opacity"
          >
            Book a demo
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#171717" strokeColor="#2a2a2a" />
        <div className="relative z-10 px-8 max-w-3xl mx-auto w-full pt-32 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs tracking-widest text-neutral-300 uppercase">AI Sales Agent &middot; Live Now</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-wide text-white leading-[1.2] uppercase">
            Set Up Your<br />AI Sales Agent
          </h1>
          <p className="mt-6 text-xs text-neutral-400 tracking-widest max-w-md mx-auto leading-relaxed uppercase">
            Fill in the details below and we'll build your automated outbound pipeline. Live within 24 hours.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="relative min-h-screen overflow-hidden">
        <WaveBackground backgroundColor="#f5f5f5" strokeColor="#e8e8e8" />
        <div className="relative z-10 max-w-2xl mx-auto px-8 py-20 w-full">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Section title="Your Business" number="01">
                <Field label="Business Name" name="businessName" required placeholder="Acme Corp" value={form.businessName} onChange={set('businessName')} />
                <Field label="Website" name="website" placeholder="https://acme.com" hint="Optional" value={form.website} onChange={set('website')} />
                <Field label="Your Email" name="email" type="email" required placeholder="you@acme.com" value={form.email} onChange={set('email')} />
              </Section>

              <Section title="What You Sell" number="02">
                <Field label="Product / Service Name" name="productName" required placeholder="Marketing consulting" value={form.productName} onChange={set('productName')} />
                <Field label="Product / Service Website" name="productWebsite" placeholder="https://acme.com/services" hint="If different from your main website" value={form.productWebsite} onChange={set('productWebsite')} />
                <TextArea label="Service Description" name="serviceDescription" required placeholder="Describe what you offer, who it's for, and what makes it different." value={form.serviceDescription} onChange={set('serviceDescription')} />
              </Section>

              <Section title="Target Customers" number="03">
                <TextArea label="Who are your ideal customers?" name="targetCustomers" required placeholder="e.g. SaaS founders with 10-50 employees in North America who recently raised a Series A" value={form.targetCustomers} onChange={set('targetCustomers')} />
              </Section>

              <Section title="Email Configuration" number="04">
                <Field label="Sender Name" name="senderName" required placeholder="Jane from Acme" value={form.senderName} onChange={set('senderName')} />
                <Field label="Sender Email" name="senderEmail" type="email" required placeholder="jane@acme.com" value={form.senderEmail} onChange={set('senderEmail')} />
                <Field label="Reply-To Email" name="replyToEmail" type="email" placeholder="sales@acme.com" hint="Optional — defaults to sender email" value={form.replyToEmail} onChange={set('replyToEmail')} />
              </Section>

              <Section title="Booking Links" number="05">
                <Field label="Cal.com URL" name="calUrl" placeholder="https://cal.com/your-link" hint="Optional" value={form.calUrl} onChange={set('calUrl')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Phone 1" name="phone1" type="tel" placeholder="+1 555 000 0000" hint="Optional" value={form.phone1} onChange={set('phone1')} />
                  <Field label="Phone 2" name="phone2" type="tel" placeholder="+1 555 000 0000" hint="Optional" value={form.phone2} onChange={set('phone2')} />
                </div>
              </Section>

              <Section title="Plan" number="06">
                <div className="space-y-3">
                  {plans.map(({ value, label, desc }) => (
                    <label
                      key={value}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        form.plan === value
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={value}
                        checked={form.plan === value}
                        onChange={() => set('plan')(value)}
                        className="sr-only"
                      />
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        form.plan === value ? 'border-neutral-900' : 'border-neutral-300'
                      }`}>
                        {form.plan === value && <div className="w-2 h-2 rounded-full bg-neutral-900" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 tracking-wider uppercase">{label}</p>
                        <p className="text-xs text-neutral-500 tracking-wider uppercase mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </Section>

              {/* Submit */}
              <div className="bg-white/70 border border-neutral-200/60 rounded-2xl p-8 text-center">
                <p className="text-xs text-neutral-500 tracking-widest uppercase mb-2">$199 one-time setup fee</p>
                <p className="text-xs text-neutral-400 tracking-wider uppercase mb-8 max-w-sm mx-auto leading-relaxed">
                  Agent training, custom email script, and full onboarding. We'll review your details and have your agent live within 24 hours.
                </p>
                <button
                  type="submit"
                  className="px-8 py-3 bg-neutral-900 text-white text-xs font-medium tracking-widest rounded-lg hover:bg-neutral-800 transition-colors uppercase"
                >
                  Get started &rarr;
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white/70 border border-neutral-200/60 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Check size={22} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-black tracking-wider uppercase mb-3">You're all set</h2>
              <p className="text-xs text-neutral-500 tracking-wider uppercase leading-relaxed max-w-sm mx-auto mb-8">
                We've received your details and will have your AI sales agent configured within 24 hours. Check your email for next steps.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 border border-neutral-300 text-neutral-700 text-xs font-medium tracking-widest rounded-lg hover:bg-neutral-50 transition-colors uppercase"
              >
                &larr; Back to home
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-neutral-900 border-t border-neutral-800 py-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="border-t border-neutral-800 pt-6 text-center">
            <p className="text-xs text-neutral-600 uppercase">&copy; {new Date().getFullYear()} Ivera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
