import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type Step = 'phone' | 'create'

export default function Signup() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientId, setClientId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleVerifyPhone(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        setSubmitting(false)
        return
      }

      setClientId(data.clientId)
      setClientName(`${data.firstName} ${data.lastName}`.trim())
      setStep('create')
    } catch {
      setError('Could not connect to server')
    }

    setSubmitting(false)
  }

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await signUp(email, password, { clientId, phone })
    setSubmitting(false)

    if (error) {
      setError(error)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <nav className="px-8 py-5">
        <Link
          to="/"
          className="text-xl font-semibold tracking-tight text-neutral-900"
        >
          ivera
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {step === 'phone' && (
            <>
              <h2 className="text-2xl font-semibold text-neutral-900 text-center mb-1">
                Create your account
              </h2>
              <p className="text-sm text-neutral-500 text-center mb-8">
                Enter the phone number on file to get started
              </p>

              <form onSubmit={handleVerifyPhone} className="space-y-4">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
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
                  {submitting ? 'Verifying...' : 'Continue'}
                </button>
              </form>

              <p className="text-sm text-neutral-500 text-center mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-neutral-900 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {step === 'create' && (
            <>
              <h2 className="text-2xl font-semibold text-neutral-900 text-center mb-1">
                Hi, {clientName || 'there'}
              </h2>
              <p className="text-sm text-neutral-500 text-center mb-8">
                Set up your email and password to access your dashboard
              </p>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
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
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    placeholder="••••••••"
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
