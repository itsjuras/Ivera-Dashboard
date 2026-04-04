import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import WaveBackground from '../components/WaveBackground'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const { signUp } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const metadata: Record<string, string> = {}
    if (phone.trim()) metadata.phone = phone.trim()

    const { error } = await signUp(email, password, metadata)
    setSubmitting(false)

    if (error) {
      setError(error)
    } else {
      setConfirmed(true)
    }
  }

  if (confirmed) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <WaveBackground backgroundColor="#fafafa" strokeColor="#e5e5e5" />
        <nav className="relative z-10 px-8 py-5">
          <Link to="/" className="text-xl font-semibold tracking-tight text-neutral-900">
            ivera
          </Link>
        </nav>
        <div className="relative z-10 flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm text-center">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Check your email</h2>
            <p className="text-sm text-neutral-500 mb-6">
              We sent a confirmation link to <strong>{email}</strong>.<br />
              Click it to activate your account.
            </p>
            <Link to="/login" className="text-sm text-neutral-900 font-medium hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <WaveBackground backgroundColor="#fafafa" strokeColor="#e5e5e5" />
      <nav className="relative z-10 px-8 py-5">
        <Link to="/" className="text-xl font-semibold tracking-tight text-neutral-900">
          ivera
        </Link>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-neutral-900 text-center mb-1">
            Create your account
          </h2>
          <p className="text-sm text-neutral-500 text-center mb-8">
            Sign up to access your Ivera dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="you@business.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Phone <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-neutral-500 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-neutral-900 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
