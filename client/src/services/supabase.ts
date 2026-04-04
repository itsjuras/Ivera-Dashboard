import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

// Disable Web Locks for auth — Supabase v2.99+ uses Web Locks for token refresh
// which causes "Lock broken by steal" AbortErrors when signIn and onAuthStateChange
// compete for the same lock, hanging the UI on "Signing in..." forever.
// Safe to disable for single-tab apps.
// Disable Web Locks for auth — Supabase v2.99+ uses Web Locks for token refresh
// which causes "Lock broken by steal" AbortErrors when signIn and onAuthStateChange
// compete for the same lock, hanging the UI on "Signing in..." forever.
// Safe to disable for single-tab apps.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noLock = async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn()
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { lock: noLock as never },
})

export default supabase
