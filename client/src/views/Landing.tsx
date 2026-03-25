import { useEffect, useRef } from 'react'
import { Phone, Mail, BarChart3, ChevronDown, Check } from 'lucide-react'
import WaveBackground from '../components/WaveBackground'

const CAL_URL = 'https://cal.com/vaidas-makselis-wvjvqz/ivera-sales-agent'

const products = [
  {
    tag: 'Live now',
    tagColor: 'bg-emerald-100 text-emerald-700',
    icon: Phone,
    title: 'AI Receptionist',
    description:
      'Answers every call around the clock. Books and reschedules appointments, answers questions about your services and pricing, and sends confirmations to clients — all without you picking up the phone.',
    cta: 'Learn more',
    href: '#receptionist',
  },
  {
    tag: 'Live now',
    tagColor: 'bg-emerald-100 text-emerald-700',
    icon: Mail,
    title: 'AI Sales Agent',
    description:
      'Finds your ideal customers, writes a personalised email for each one, and follows up automatically until they book. Handles replies, schedules meetings, and keeps your pipeline full — you only talk to warm leads.',
    cta: 'Get started',
    href: '/onboard',
  },
  {
    tag: 'Live now',
    tagColor: 'bg-emerald-100 text-emerald-700',
    icon: BarChart3,
    title: 'AI Business Consultant',
    description:
      'Ask any business question in plain English and get a clear, data-backed answer. Tracks revenue, churn, pipeline health, and marketing performance. Delivers a weekly briefing with exactly where to focus next.',
    cta: 'Try demo',
    href: '/dashboard/consultant',
  },
]

const receptionistSteps = [
  {
    number: '01',
    title: 'A customer calls your business',
    description: 'Ivera picks up instantly, any time of day or night.',
  },
  {
    number: '02',
    title: 'The call is handled end to end',
    description:
      'Answers their questions, checks your availability, and books them into your calendar.',
  },
  {
    number: '03',
    title: 'You get notified',
    description: 'A new booking appears in your calendar with all the details. The client receives a confirmation.',
  },
  {
    number: '04',
    title: 'Nothing falls through the cracks',
    description: 'Every call is answered, every lead is captured, every appointment is booked.',
  },
]

const receptionistPricing = [
  {
    plan: 'Basic',
    price: '79',
    desc: 'Perfect for solo operators and small studios.',
    features: ['Up to 100 calls/month', '24/7 call answering', 'Calendar booking (Cal.com)', 'SMS notifications', 'Email support'],
    featured: false,
  },
  {
    plan: 'Pro',
    price: '199',
    desc: 'For busy clinics and service businesses with high call volume.',
    features: ['Up to 500 calls/month', '24/7 call answering', 'Calendar booking + cancellations', 'SMS + email notifications', 'FAQ customisation', 'Priority support'],
    featured: true,
  },
  {
    plan: 'Enterprise',
    price: '399',
    desc: 'Multi-location businesses and high-volume clinics.',
    features: ['Unlimited calls', 'Multiple locations', 'Custom AI persona + voice', 'Stripe payment collection', 'Advanced reporting', 'Dedicated account manager'],
    featured: false,
  },
]

const salesSteps = [
  {
    number: '01',
    title: 'Define your ideal customer',
    description: 'Tell us who you want to reach — industry, role, location. We handle the rest.',
  },
  {
    number: '02',
    title: 'Prospects are found and qualified',
    description:
      'The agent identifies high-intent leads showing real buying signals and builds a vetted list for you.',
  },
  {
    number: '03',
    title: 'Personalised outreach is sent',
    description:
      'Each prospect receives a unique email written specifically for them — not a template, not a mail merge.',
  },
  {
    number: '04',
    title: 'Follow-ups run until they book',
    description:
      'Interested leads get a link to schedule. Everyone else gets a multi-step follow-up sequence. You only speak to people ready to talk.',
  },
]

const salesPricing = [
  {
    plan: 'Basic',
    price: '99',
    desc: 'For businesses just starting with outbound.',
    features: ['~25 new prospects/week', 'AI-written personalised emails', 'Automated reply handling', '1 target audience', 'Weekly email report', 'Email support'],
    featured: false,
  },
  {
    plan: 'Pro',
    price: '499',
    desc: 'For growing businesses that want a serious outbound pipeline.',
    features: ['~75 new prospects/week', 'AI-written personalised emails', 'Automated reply handling + follow-ups', 'Up to 3 target audiences', 'Booking link automation', 'Weekly report + campaign insights', 'Priority support'],
    featured: true,
  },
  {
    plan: 'Enterprise',
    price: '999',
    desc: 'For high-growth teams that want maximum pipeline.',
    features: ['~150 new prospects/week', 'AI-written personalised emails', 'Automated reply handling + follow-ups', 'Unlimited target audiences', 'Booking link + outbound call automation', 'Weekly report + campaign insights', 'Monthly strategy call'],
    featured: false,
  },
]

const consultantSteps = [
  {
    number: '01',
    title: 'Link your tools once',
    description: 'Connect your CRM, payments, and analytics in a single setup. Your data stays private and secure.',
  },
  {
    number: '02',
    title: 'Ask questions, get answers',
    description:
      '"Why did revenue drop?" "Which customers might churn?" Ask any question and get a clear, data-backed response in seconds.',
  },
  {
    number: '03',
    title: 'Problems found before they cost you',
    description:
      'Stale deals, at-risk accounts, underperforming campaigns — surfaced automatically so you can act before it hits your bottom line.',
  },
  {
    number: '04',
    title: 'A weekly briefing in your inbox',
    description:
      'Every Monday, a summary of what changed, what matters, and exactly where to focus next.',
  },
]

const consultantPricing = [
  {
    plan: 'Basic',
    price: '299',
    desc: 'For founders who want clear visibility into what\'s working and what isn\'t.',
    features: ['1 connected data source (CRM or Stripe)', 'Unlimited business questions via chat', 'Weekly email briefing', 'Revenue & churn tracking', 'Email support'],
    featured: false,
  },
  {
    plan: 'Pro',
    price: '599',
    desc: 'For growing businesses that want a full-stack view and proactive alerts.',
    features: ['3 connected sources (CRM + Stripe + GA4)', 'Unlimited business questions via chat', 'Weekly strategic briefing', 'At-risk account & deal alerts', 'Pipeline health scoring', 'Marketing ROI analysis', 'Priority support'],
    featured: true,
  },
  {
    plan: 'Enterprise',
    price: '1,499',
    desc: 'For scaling teams that need deep analysis and hands-on strategy.',
    features: ['Unlimited data source connections', 'Unlimited business questions via chat', 'Custom KPI dashboards & reports', 'Proactive growth opportunity alerts', 'CSV / spreadsheet data import', 'Monthly strategy call', 'Dedicated account manager'],
    featured: false,
  },
]

function PricingGrid({ tiers, setup, dark = false }: { tiers: typeof receptionistPricing; setup: string; dark?: boolean }) {
  return (
    <div className="max-w-5xl mx-auto px-8 py-32 w-full">
      <div className="mb-4 text-center">
        <p className={`text-xs tracking-widest uppercase mb-1 ${dark ? 'text-neutral-500' : 'text-neutral-400'}`}>Pricing</p>
        <p className={`text-xs uppercase ${dark ? 'text-neutral-500' : 'text-neutral-400'}`}>{setup}</p>
      </div>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {tiers.map(({ plan, price, desc, features, featured }) => {
          const highlight = dark ? featured : featured
          return (
            <div
              key={plan}
              className={`rounded-2xl p-8 flex flex-col gap-6 border transition-colors ${
                dark
                  ? highlight
                    ? 'bg-white border-neutral-200 text-neutral-900'
                    : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-500'
                  : highlight
                    ? 'bg-neutral-900 border-neutral-700 text-white'
                    : 'bg-white/70 border-neutral-200/60 hover:border-neutral-300'
              }`}
            >
              {featured && (
                <span className={`text-xs tracking-widest uppercase ${dark ? (highlight ? 'text-neutral-400' : 'text-neutral-500') : 'text-neutral-400'}`}>Most popular</span>
              )}
              <div>
                <p className={`text-xs tracking-widest mb-3 uppercase ${dark ? (highlight ? 'text-neutral-400' : 'text-neutral-500') : 'text-neutral-400'}`}>
                  {plan}
                </p>
                <p className={`text-4xl font-semibold tracking-tight ${dark ? (highlight ? 'text-neutral-900' : 'text-white') : (highlight ? 'text-white' : 'text-neutral-900')}`}>
                  <sup className="text-xl">$</sup>{price}
                  <span className={`text-sm font-normal ${dark ? (highlight ? 'text-neutral-400' : 'text-neutral-500') : 'text-neutral-400'}`}>/mo</span>
                </p>
                <p className={`mt-3 text-xs leading-relaxed tracking-wider uppercase ${dark ? (highlight ? 'text-neutral-500' : 'text-neutral-400') : (highlight ? 'text-neutral-400' : 'text-neutral-500')}`}>
                  {desc}
                </p>
              </div>
              <ul className="space-y-2 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={13} className={`mt-0.5 shrink-0 ${dark ? (highlight ? 'text-emerald-500' : 'text-emerald-400') : (highlight ? 'text-emerald-400' : 'text-emerald-500')}`} />
                    <span className={`text-xs tracking-wider leading-relaxed uppercase ${dark ? (highlight ? 'text-neutral-500' : 'text-neutral-300') : (highlight ? 'text-neutral-300' : 'text-neutral-500')}`}>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={CAL_URL}
                className={`block text-center py-3 rounded-lg text-xs font-medium tracking-widest uppercase transition-colors ${
                  dark
                    ? highlight
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                      : 'border border-neutral-600 text-neutral-300 hover:bg-neutral-700'
                    : highlight
                      ? 'bg-white text-neutral-900 hover:bg-neutral-100'
                      : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Get started
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Steps({ steps }: { steps: typeof receptionistSteps }) {
  return (
    <div className="space-y-0">
      {steps.map(({ number, title, description }, i) => (
        <div
          key={number}
          className={`flex gap-8 py-10 ${i < steps.length - 1 ? 'border-b border-neutral-200/50' : ''}`}
        >
          <span className="text-sm font-medium text-neutral-300 pt-1 shrink-0">{number}</span>
          <div>
            <h4 className="text-sm font-semibold text-black mb-2 tracking-wider uppercase">{title}</h4>
            <p className="text-xs text-neutral-600 leading-relaxed tracking-wider uppercase max-w-lg">{description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Landing() {
  const sectionsRef = useRef<HTMLElement[]>([])
  const fadeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sections = sectionsRef.current
    if (sections.length === 0) return

    const update = () => {
      const scrollY = window.scrollY

      // Find which section is at the top of viewport
      let currentIdx = 0
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i] && scrollY >= sections[i].offsetTop - 1) {
          currentIdx = i
          break
        }
      }

      const current = sections[currentIdx]
      const bg = current?.getAttribute('data-bg') ?? '#171717'

      // Update fade overlay directly on DOM (no React re-render)
      if (fadeRef.current) {
        fadeRef.current.style.background = `linear-gradient(to bottom, ${bg} 0%, ${bg} 45%, transparent 100%)`
      }
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const addSectionRef = (el: HTMLElement | null) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el)
    }
  }

  return (
    <div>
      {/* Nav — white text, mix-blend-difference auto-inverts on light backgrounds */}
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold tracking-widest uppercase text-white">
            Ivera
          </h1>
          <div className="hidden sm:flex items-center gap-6 text-xs tracking-widest uppercase text-white">
            <a href="#receptionist" className="opacity-60 hover:opacity-100 transition-opacity">Receptionist</a>
            <a href="#sales" className="opacity-60 hover:opacity-100 transition-opacity">Sales Agent</a>
            <a href="#consultant" className="opacity-60 hover:opacity-100 transition-opacity">Consultant</a>
            <a href="/about" className="opacity-60 hover:opacity-100 transition-opacity">About</a>
            <a href="/portal" className="opacity-60 hover:opacity-100 transition-opacity">Dashboard</a>
          </div>
          <a
            href={CAL_URL}
            className="px-4 py-1.5 text-xs font-medium tracking-widest rounded-lg uppercase border border-white text-white hover:opacity-60 transition-opacity"
          >
            Book a demo
          </a>
        </div>
      </nav>

      {/* Fade overlay — matches current section bg */}
      <div
        ref={fadeRef}
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: 120,
          background: 'linear-gradient(to bottom, #171717 0%, #171717 45%, transparent 100%)',
        }}
      />

      {/* Hero */}
      <section ref={addSectionRef} data-dark="true" data-bg="#171717" className="relative h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#171717" strokeColor="#2a2a2a" />
        <div className="relative z-10 px-8 max-w-6xl mx-auto w-full">
          <div className="max-w-xl">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-wide text-white leading-[1.2] uppercase">
              AI Automation<br />for Business.
            </h2>
            <div className="mt-10 flex items-center gap-4">
              <a
                href={CAL_URL}
                className="px-6 py-3 bg-white text-neutral-900 text-xs font-medium tracking-widest rounded-lg hover:bg-neutral-100 transition-colors uppercase"
              >
                Book a free demo
              </a>
              <a
                href="mailto:sales@ivera.ca"
                className="px-6 py-3 border border-neutral-600 text-neutral-300 text-xs font-medium tracking-widest rounded-lg hover:bg-neutral-800 transition-colors uppercase"
              >
                sales@ivera.ca
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-neutral-500 tracking-widest uppercase">Scroll</span>
          <ChevronDown size={16} className="text-neutral-400" />
        </div>
      </section>

      {/* Products */}
      <section ref={addSectionRef} data-dark="false" data-bg="#f5f5f5" className="relative min-h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#f5f5f5" strokeColor="#e8e8e8" />
        <div className="relative z-10 max-w-5xl mx-auto px-8 py-32 w-full">
          <div className="mb-16">
            <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">Products</p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-black tracking-wide uppercase">
              Three agents.<br />One agency.
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {products.map(({ icon: Icon, title, description, cta, href }) => (
              <div
                key={title}
                className="bg-white/70 border border-neutral-200/60 rounded-2xl p-8 hover:border-neutral-300 transition-colors flex flex-col gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <Icon size={22} className="text-neutral-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-black mb-2 tracking-wider uppercase">{title}</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed tracking-wider uppercase">{description}</p>
                </div>
                <a
                  href={href}
                  className="mt-auto text-xs font-medium tracking-widest text-neutral-900 hover:text-neutral-500 transition-colors uppercase"
                >
                  {cta} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Receptionist — How it works */}
      <section ref={addSectionRef} data-dark="false" data-bg="#ffffff" id="receptionist" className="relative min-h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#ffffff" strokeColor="#f0f0f0" />
        <div className="relative z-10 max-w-4xl mx-auto px-8 py-32 w-full">
          <div className="mb-16">
            <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">AI Receptionist</p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-black tracking-wide uppercase">
              Your clients, handled.<br />24 hours a day.
            </h3>
            <p className="mt-4 text-xs text-neutral-600 tracking-widest max-w-sm leading-relaxed uppercase">
              Set up in under a day.
            </p>
          </div>
          <Steps steps={receptionistSteps} />
          <div className="mt-16 bg-neutral-50 border border-neutral-200/60 rounded-2xl p-8">
            <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">Try it now</p>
            <p className="text-2xl font-semibold text-neutral-900 tracking-wide mb-3">+1 778 800 7577</p>
            <p className="text-xs text-neutral-600 leading-relaxed tracking-wider mb-6 max-w-lg uppercase">
              Call this number to experience our AI receptionist live. Ask it to book an appointment, check availability, or ask about pricing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
              {['Books real appointments via Cal.com', 'Natural conversation, not a phone tree', 'Handles interruptions and questions', 'Available 24/7, zero hold time', 'Outbound follow-up calls to warm leads via Twilio voice AI', 'Syncs with Google Calendar and Apple Calendar', 'SMS confirmation sent to client after every booking', 'Custom call script trained on your services and pricing'].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-neutral-600 tracking-wider uppercase">{f}</span>
                </div>
              ))}
            </div>
            <a
              href={CAL_URL}
              className="inline-block px-6 py-3 bg-neutral-900 text-white text-xs font-medium tracking-widest rounded-lg hover:bg-neutral-800 transition-colors uppercase"
            >
              Book a demo →
            </a>
          </div>
        </div>
      </section>

      {/* AI Receptionist Pricing */}
      <section ref={addSectionRef} data-dark="true" data-bg="#171717" className="relative min-h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#171717" strokeColor="#2a2a2a" />
        <div className="relative z-10 w-full">
          <PricingGrid dark tiers={receptionistPricing} setup="$499 one-time setup fee — AI training, custom call script, and full onboarding." />
        </div>
      </section>

      {/* AI Sales Agent — How it works */}
      <section ref={addSectionRef} data-dark="false" data-bg="#ffffff" id="sales" className="relative min-h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#ffffff" strokeColor="#f0f0f0" />
        <div className="relative z-10 max-w-4xl mx-auto px-8 py-32 w-full">
          <div className="mb-16">
            <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">AI Sales Agent</p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-black tracking-wide uppercase">
              Outbound sales,<br />on autopilot.
            </h3>
            <p className="mt-4 text-xs text-neutral-600 tracking-widest max-w-md leading-relaxed uppercase">
              Cold outreach that books warm meetings.
            </p>
          </div>
          <Steps steps={salesSteps} />
          <div className="mt-16 bg-neutral-50 border border-neutral-200/60 rounded-2xl p-8">
            <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">Live now</p>
            <p className="text-xl font-semibold text-neutral-900 tracking-wide mb-3 uppercase">AI Sales Agent</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
              {['Trigger-based targeting — recent hires, funding, launches', 'LinkedIn enrichment — decision-maker name + title', 'Role-specific email angles — CEO vs ops vs marketing', '6-touch follow-up sequence + SMS on touch 2', 'Claude scores each lead 1–10 — only ≥ 7 get contacted', 'Inbound replies auto-classified: interested / later / info / not interested', 'Cal.com webhook auto-updates lead to booked and cancels pending follow-ups', 'Weekly report: open rates, reply rates, and booked demos per client'].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-neutral-600 tracking-wider uppercase">{f}</span>
                </div>
              ))}
            </div>
            <a
              href="/onboard"
              className="inline-block px-6 py-3 bg-neutral-900 text-white text-xs font-medium tracking-widest rounded-lg hover:bg-neutral-800 transition-colors uppercase"
            >
              Get started →
            </a>
          </div>
        </div>
      </section>

      {/* AI Sales Agent Pricing */}
      <section ref={addSectionRef} data-dark="true" data-bg="#171717" className="relative min-h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#171717" strokeColor="#2a2a2a" />
        <div className="relative z-10 w-full">
          <PricingGrid dark tiers={salesPricing} setup="$199 one-time setup fee — agent training, custom email script, and full onboarding." />
        </div>
      </section>

      {/* AI Business Consultant — How it works */}
      <section ref={addSectionRef} data-dark="false" data-bg="#ffffff" id="consultant" className="relative min-h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#ffffff" strokeColor="#f0f0f0" />
        <div className="relative z-10 max-w-4xl mx-auto px-8 py-32 w-full">
          <div className="mb-16">
            <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">AI Business Consultant</p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-black tracking-wide uppercase">
              Know what's working.<br />Know what's not.
            </h3>
            <p className="mt-4 text-xs text-neutral-600 tracking-widest max-w-md leading-relaxed uppercase">
              Ask any question about your business and get a real answer, backed by your data.
            </p>
          </div>
          <Steps steps={consultantSteps} />
          <div className="mt-16 bg-neutral-50 border border-neutral-200/60 rounded-2xl p-8">
            <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">What you can ask</p>
            <p className="text-xl font-semibold text-neutral-900 tracking-wide mb-3 uppercase">"Why did MRR drop this month?"</p>
            <p className="text-xs text-neutral-600 leading-relaxed tracking-wider mb-6 max-w-lg uppercase">
              The agent cross-references Stripe churn data, HubSpot pipeline activity, and GA4 traffic trends — then gives you a prioritised answer with one clear action to take today.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
              {['CRM pipeline health — stale deals, close rate trends', 'Revenue insights — MRR, churn, expansion, NRR', 'Marketing ROI — ROAS, funnel drop-off, top pages', 'Weekly strategic briefing delivered to your inbox', 'Connects to Stripe, HubSpot CRM, and GA4 — one agent across all sources', 'Identifies churn risk by account — not just aggregate percentages', 'Responses streamed in real time — answers appear instantly', 'Every reply cites exact figures and ends with one clear recommended action'].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-neutral-600 tracking-wider uppercase">{f}</span>
                </div>
              ))}
            </div>
            <a
              href="/dashboard/consultant"
              className="inline-block px-6 py-3 bg-neutral-900 text-white text-xs font-medium tracking-widest rounded-lg hover:bg-neutral-800 transition-colors uppercase"
            >
              See demo →
            </a>
          </div>
        </div>
      </section>

      {/* AI Business Consultant Pricing */}
      <section ref={addSectionRef} data-dark="true" data-bg="#171717" className="relative min-h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#171717" strokeColor="#2a2a2a" />
        <div className="relative z-10 w-full">
          <PricingGrid dark tiers={consultantPricing} setup="$499 one-time setup fee — data source integration, custom dashboard, and full onboarding." />
        </div>
      </section>

      {/* CTA Band */}
      <section ref={addSectionRef} data-dark="true" data-bg="#171717" className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <WaveBackground backgroundColor="#171717" strokeColor="#2a2a2a" />
        <div className="relative z-10 text-center px-8">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-wide uppercase">
            Ready to grow on autopilot?
          </h3>
          <p className="mt-4 text-neutral-400 text-xs tracking-widest max-w-md mx-auto leading-relaxed uppercase">
            Book a free 15-minute demo with Vaidas and see any product configured for your business live.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a
              href={CAL_URL}
              className="px-6 py-3 bg-white text-neutral-900 text-xs font-medium tracking-widest rounded-lg hover:bg-neutral-100 transition-colors uppercase"
            >
              Book a free demo →
            </a>
            <a
              href="mailto:sales@ivera.ca"
              className="px-6 py-3 border border-neutral-600 text-neutral-300 text-xs font-medium tracking-widest rounded-lg hover:bg-neutral-800 transition-colors uppercase"
            >
              sales@ivera.ca
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-neutral-900 border-t border-neutral-800 py-10">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <p className="text-sm font-semibold tracking-widest text-white mb-3 uppercase">Ivera</p>
              <p className="text-xs text-neutral-500 tracking-wider leading-relaxed uppercase">AI automation for Canadian small businesses.</p>
            </div>
            <div>
              <p className="text-xs tracking-widest text-neutral-400 mb-4 uppercase">Products</p>
              <ul className="space-y-2">
                {['#receptionist:AI Receptionist', '#sales:AI Sales Agent', '#consultant:AI Business Consultant'].map((item) => {
                  const [href, label] = item.split(':')
                  return (
                    <li key={label}>
                      <a href={href} className="text-xs text-neutral-500 tracking-wider hover:text-neutral-300 transition-colors uppercase">{label}</a>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div>
              <p className="text-xs tracking-widest text-neutral-400 mb-4 uppercase">Company</p>
              <ul className="space-y-2">
                <li><a href="/about" className="text-xs text-neutral-500 tracking-wider hover:text-neutral-300 transition-colors uppercase">About us</a></li>
                <li><a href="mailto:sales@ivera.ca" className="text-xs text-neutral-500 tracking-wider hover:text-neutral-300 transition-colors uppercase">Contact</a></li>
                <li><a href={CAL_URL} className="text-xs text-neutral-500 tracking-wider hover:text-neutral-300 transition-colors uppercase">Book a demo</a></li>
                <li><a href="tel:+17789079707" className="text-xs text-neutral-500 tracking-wider hover:text-neutral-300 transition-colors uppercase">+1 778 907 9707</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs tracking-widest text-neutral-400 mb-4 uppercase">Try it live</p>
              <ul className="space-y-2">
                <li><a href="tel:+17788007577" className="text-xs text-neutral-500 tracking-wider hover:text-neutral-300 transition-colors uppercase">AI Receptionist: +1 778 800 7577</a></li>
                <li><a href="/onboard" className="text-xs text-neutral-500 tracking-wider hover:text-neutral-300 transition-colors uppercase">AI Sales Agent: Get started</a></li>
                <li><span className="text-xs text-neutral-500 tracking-wider uppercase">Vancouver, BC</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 pt-6 text-center">
            <p className="text-xs text-neutral-600 uppercase">&copy; {new Date().getFullYear()} Ivera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
