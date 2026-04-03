import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import supabase from '../services/supabase'
import { postSignup, fetchMe, type Role, type UserProduct } from '../services/api'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  role: Role | null
  products: UserProduct[]
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, metadata: Record<string, string>) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role | null>(null)
  const [products, setProducts] = useState<UserProduct[]>([])

  async function loadProfile() {
    try {
      const profile = await fetchMe()
      setRole(profile.role)
      setProducts(profile.products)
    } catch {
      // Server may not be reachable; non-fatal
      setRole(null)
      setProducts([])
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session) await loadProfile()
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session) {
          await loadProfile()
        } else {
          setRole(null)
          setProducts([])
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

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
  }

  async function refreshProfile() {
    await loadProfile()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, role, products, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
