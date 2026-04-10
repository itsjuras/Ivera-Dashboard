import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import supabase from '../services/supabase'
import { postSignup, fetchMe, type Role, type UserProduct } from '../services/api'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role | null>(null)
  const [products, setProducts] = useState<UserProduct[]>([])
  const [profileError, setProfileError] = useState<string | null>(null)
  const lastRevalidatedAtRef = useRef(0)
  const revalidatingRef = useRef(false)

  async function loadProfile() {
    try {
      const profile = await fetchMe()
      setRole(profile.role)
      setProducts(profile.products)
      setProfileError(null)
    } catch {
      // Keep the session intact and surface the profile/API failure separately.
      setProfileError('We could not load your dashboard access right now.')
    }
  }

  async function refreshSession() {
    if (revalidatingRef.current) return
    revalidatingRef.current = true
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) return

      const nextSession = data.session ?? null
      const currentAccessToken = session?.access_token ?? null
      const nextAccessToken = nextSession?.access_token ?? null
      const currentUserId = user?.id ?? null
      const nextUserId = nextSession?.user?.id ?? null

      if (currentAccessToken !== nextAccessToken || currentUserId !== nextUserId) {
        setSession(nextSession)
        setUser(nextSession?.user ?? null)
      }

      if (nextSession) {
        await loadProfile()
      } else {
        setRole(null)
        setProducts([])
        setProfileError(null)
      }
      lastRevalidatedAtRef.current = Date.now()
    } finally {
      revalidatingRef.current = false
    }
  }

  useEffect(() => {
    // Use onAuthStateChange exclusively — it fires INITIAL_SESSION on mount
    // so we don't need a separate getSession() call (which causes lock contention).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session) {
          await loadProfile()
        } else {
          setRole(null)
          setProducts([])
          setProfileError(null)
        }
        // Mark loading done after first event (INITIAL_SESSION or SIGNED_IN)
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(false)
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function revalidateAuthState() {
      if (document.visibilityState === 'hidden') return
      if (!session) return
      if (Date.now() - lastRevalidatedAtRef.current < 60_000) return
      await refreshSession()
    }

    function handleVisibilityChange() {
      void revalidateAuthState()
    }

    function handleFocus() {
      void revalidateAuthState()
    }

    function handleOnline() {
      void revalidateAuthState()
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session, user])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string, metadata: Record<string, string>) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
    if (error) return { error: error.message }

    setProfileError(null)
    // Provision role + products server-side
    try {
      const result = await postSignup()
      setRole(result.role)
      if (result.role === 'ivera_admin') {
        // Load full products list (ivera admin gets all products)
        await loadProfile()
      }
    } catch {
      // Provisioning failed — not a sign-up blocker, user can retry via refreshProfile
    }

    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setRole(null)
    setProducts([])
    setProfileError(null)
  }

  async function refreshProfile() {
    await loadProfile()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, role, products, profileError, signIn, signUp, signOut, refreshProfile, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}
