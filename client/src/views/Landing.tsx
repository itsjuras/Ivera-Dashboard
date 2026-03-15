import { Link } from 'react-router-dom'
import { Phone, CalendarDays, CreditCard, BarChart3, ChevronDown } from 'lucide-react'
import WaveBackground from '../components/WaveBackground'

const features = [
  {
    icon: Phone,
    title: 'Answers Every Call',
    description:
      'Your AI receptionist picks up 24/7 — no missed leads, no voicemail.',
  },
  {
    icon: CalendarDays,
    title: 'Books Appointments',
    description:
      'Automatically schedules clients into your calendar in real time.',
  },
  {
    icon: CreditCard,
    title: 'Handles Payments',
    description:
      'Collects payments and sends receipts without you lifting a finger.',
  },
  {
    icon: BarChart3,
    title: 'Tracks Everything',
    description:
      'See calls, conversions, revenue, and client activity at a glance.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Client calls your business',
    description:
      'Ivera answers instantly with a natural, professional voice tailored to your brand.',
  },
  {
    number: '02',
    title: 'AI qualifies the lead',
    description:
      'Asks the right questions, understands intent, and determines if they\'re a fit.',
  },
  {
    number: '03',
    title: 'Books & collects payment',
    description:
      'Schedules directly into your calendar and processes payment on the spot.',
  },
  {
    number: '04',
    title: 'You see it all in your dashboard',
    description:
      'Track conversions, revenue, and client activity — no manual work.',
  },
]

export default function Landing() {
  return (
    <div>
      {/* Nav — fixed */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200/30">
        <div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold tracking-widest text-neutral-900">
            Ivera
          </h1>
          <div className="flex items-center gap-4">
            <Link
              to="/signup"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Create account
            </Link>
            <Link
              to="/login"
              className="px-4 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>

      {/* Section 1 — Hero (white bg, light grey lines) */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#ffffff" strokeColor="#e5e5e5" />
        <div className="relative z-10 px-8 max-w-6xl mx-auto w-full">
          <div className="max-w-lg">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-wide text-neutral-900 leading-[1.2]">
              Your AI receptionist.
            </h2>
            <p className="mt-5 text-sm text-neutral-500 tracking-widest leading-relaxed">
              Answers calls. Converts leads. Books appointments.
              Handles payments. Automatically.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Link
                to="/signup"
                className="px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-neutral-400 tracking-widest">Scroll</span>
          <ChevronDown size={16} className="text-neutral-400" />
        </div>
      </section>

      {/* Section 2 — Features (light grey bg, slightly darker lines) */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#f5f5f5" strokeColor="#d4d4d4" />
        <div className="relative z-10 max-w-5xl mx-auto px-8 py-32 w-full">
          <div className="mb-16">
            <p className="text-xs tracking-widest text-neutral-400 mb-3">
              What Ivera does
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-wide">
              Everything your receptionist does.<br />
              Nothing they forget.
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white/70 border border-neutral-200/60 rounded-2xl p-8 hover:border-neutral-300 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-5">
                  <Icon size={22} className="text-neutral-600" strokeWidth={1.5} />
                </div>
                <h4 className="text-sm font-semibold text-neutral-900 mb-2 tracking-wider">
                  {title}
                </h4>
                <p className="text-xs text-neutral-500 leading-relaxed tracking-wider">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — How it works (white bg, light lines) */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <WaveBackground backgroundColor="#ffffff" strokeColor="#e5e5e5" />
        <div className="relative z-10 max-w-4xl mx-auto px-8 py-32 w-full">
          <div className="mb-16">
            <p className="text-xs tracking-widest text-neutral-400 mb-3">
              How it works
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-wide">
              From phone call to paid booking<br />
              in under two minutes.
            </h3>
          </div>

          <div className="space-y-0">
            {steps.map(({ number, title, description }, i) => (
              <div
                key={number}
                className={`flex gap-8 py-10 ${
                  i < steps.length - 1 ? 'border-b border-neutral-200/50' : ''
                }`}
              >
                <span className="text-sm font-medium text-neutral-300 pt-1 shrink-0">
                  {number}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 mb-2 tracking-wider">
                    {title}
                  </h4>
                  <p className="text-xs text-neutral-500 leading-relaxed tracking-wider max-w-lg">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — CTA (dark bg, subtle light lines) */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <WaveBackground backgroundColor="#171717" strokeColor="#2a2a2a" />
        <div className="relative z-10 text-center px-8">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-wide">
            Ready to never miss a call again?
          </h3>
          <p className="mt-4 text-neutral-400 text-sm tracking-widest max-w-md mx-auto">
            Set up your AI receptionist in minutes.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-6 py-3 bg-white text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-100 transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 border border-neutral-600 text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-neutral-900 border-t border-neutral-800 py-6 text-center">
        <p className="text-xs text-neutral-500">
          &copy; {new Date().getFullYear()} Ivera. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
