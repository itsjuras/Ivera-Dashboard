import WaveBackground from '../components/WaveBackground'
import teamPhoto from '../assets/team.png'

export default function About() {
  return (
    <div className="relative min-h-screen">
      <WaveBackground backgroundColor="#171717" strokeColor="#2a2a2a" />

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
            <a href="/about" className="opacity-100">About</a>
            <a href="/portal" className="opacity-60 hover:opacity-100 transition-opacity">Dashboard</a>
          </div>
          <a
            href="https://cal.com/vaidas-makselis-wvjvqz/ivera-sales-agent"
            className="px-4 py-1.5 text-xs font-medium tracking-widest rounded-lg uppercase border border-white text-white hover:opacity-60 transition-opacity"
          >
            Book a demo
          </a>
        </div>
      </nav>

      {/* Fade overlay */}
      <div
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: 120,
          background: 'linear-gradient(to bottom, #171717 0%, #171717 45%, transparent 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 pt-32 pb-16 w-full">
          <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">About us</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-wide text-white leading-[1.2] uppercase mb-6">
            Built by a father<br />and son team.
          </h2>
          <p className="text-xs text-neutral-400 tracking-widest max-w-lg leading-relaxed uppercase mb-16">
            Ivera started with a simple question — what if small businesses had the same AI tools as the big players? We're building the answer from Vancouver, BC.
          </p>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-1/2">
              <img
                src={teamPhoto}
                alt="Vaidas and Juras — the team behind Ivera"
                className="rounded-2xl w-full object-cover border border-neutral-700"
              />
            </div>
            <div className="lg:w-1/2 space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2 tracking-wider uppercase">Vaidas Makselis</h3>
                <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">Co-founder & Engineer</p>
                <p className="text-xs text-neutral-400 tracking-wider leading-relaxed uppercase">
                  BCIT graduate, former business owner, and full-stack engineer with over a decade of software experience. Built and ran his own businesses before moving into tech — now brings both perspectives to Ivera, architecting and coding the platform end to end.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-2 tracking-wider uppercase">Juras Makselis</h3>
                <p className="text-xs tracking-widest text-neutral-500 mb-3 uppercase">Co-founder & Engineer</p>
                <p className="text-xs text-neutral-400 tracking-wider leading-relaxed uppercase">
                  Computer science student at Simon Fraser University and full-stack engineer. Co-built every part of Ivera alongside Vaidas — from the AI voice agent to the outbound sales system to the dashboard you're looking at now.
                </p>
              </div>
              <div className="pt-4 border-t border-neutral-700">
                <p className="text-xs text-neutral-500 tracking-wider leading-relaxed uppercase">
                  Based in Vancouver, BC. Focused on helping Canadian small businesses compete with AI-powered automation.
                </p>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}
