import { LogIn, LayoutDashboard } from 'lucide-react'
import WaveBackground from '../components/WaveBackground'

export default function Portal() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <WaveBackground backgroundColor="#171717" strokeColor="#2a2a2a" />

      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
        <div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
          <a href="/" className="text-xl font-semibold tracking-widest uppercase text-white">
            Ivera
          </a>
          <div className="hidden sm:flex items-center gap-6 text-xs tracking-widest uppercase text-white">
            <a href="/#receptionist" className="opacity-60 hover:opacity-100 transition-opacity">Receptionist</a>
            <a href="/#sales" className="opacity-60 hover:opacity-100 transition-opacity">Sales Agent</a>
            <a href="/#consultant" className="opacity-60 hover:opacity-100 transition-opacity">Consultant</a>
            <a href="/about" className="opacity-60 hover:opacity-100 transition-opacity">About</a>
            <a href="/portal" className="opacity-100">Dashboard</a>
          </div>
          <a
            href="https://cal.com/vaidas-makselis-wvjvqz/ivera-sales-agent"
            className="px-4 py-1.5 text-xs font-medium tracking-widest rounded-lg uppercase border border-white text-white hover:opacity-60 transition-opacity"
          >
            Book a demo
          </a>
        </div>
      </nav>

      <div
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: 120,
          background: 'linear-gradient(to bottom, #171717 0%, #171717 45%, transparent 100%)',
        }}
      />

      <div className="relative z-10 text-center px-8">
        <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">Dashboard</p>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-wide text-white uppercase mb-4">
          Welcome to Ivera
        </h2>
        <p className="text-xs text-neutral-400 tracking-widest max-w-md mx-auto leading-relaxed uppercase mb-12">
          Sign in to access your live dashboard, or explore the demo with sample data.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/login"
            className="flex items-center gap-3 px-8 py-4 bg-white text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors w-full sm:w-auto"
          >
            <LogIn size={18} />
            <div className="text-left">
              <p className="text-sm font-semibold tracking-wider uppercase">Sign in</p>
              <p className="text-xs text-neutral-500 tracking-wider uppercase">Access your account</p>
            </div>
          </a>
          <a
            href="/dashboard/receptionist"
            className="flex items-center gap-3 px-8 py-4 border border-neutral-600 text-neutral-300 rounded-xl hover:bg-neutral-800 transition-colors w-full sm:w-auto"
          >
            <LayoutDashboard size={18} />
            <div className="text-left">
              <p className="text-sm font-semibold tracking-wider uppercase">View demo</p>
              <p className="text-xs text-neutral-500 tracking-wider uppercase">Explore with sample data</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
