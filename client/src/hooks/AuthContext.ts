import { createContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { Role, UserProduct } from '../services/api'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  role: Role | null
  products: UserProduct[]
  profileError: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, metadata: Record<string, string>) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
