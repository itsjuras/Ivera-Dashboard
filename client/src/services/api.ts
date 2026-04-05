import supabase from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function authGet<T>(path: string): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function authPost<T>(path: string, body?: unknown): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function authPatch<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function authDelete<T>(path: string): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface DashboardStats {
  activeClients: number
  leadsConverted: number
  totalRevenue: number
  callsHandled: number
  totalBookings: number
  upcomingBookings: number
  smsSent: number
}

export interface Booking {
  id: string
  clientName: string
  serviceType: string
  bookingTime: string
  duration: number
  amount: number
  status: string
  source: string
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  createdAt: string
}

export interface Payment {
  id: string
  clientName: string
  amount: number
  status: string
  createdAt: string
  cardBrand: string
  cardLast4: string
}

export interface ProviderSpendEntry {
  providerSlug: string
  amountCad: number | null
  notes: string | null
}

export interface ProviderSpendSyncResult {
  month: string
  entries: ProviderSpendEntry[]
  syncedProviders: string[]
  skippedProviders: Array<{
    providerSlug: string
    reason: string
  }>
}

export interface SendGridUsageSummary {
  month: string
  creditsRemaining: number | null
  usedQuotaPercent: number | null
  creditsTotal: number | null
}

export type Role = 'ivera_admin' | 'customer'

export interface UserProduct {
  productSlug: string
  productName: string
  planId: number
  planSlug: string
  planName: string
  customPriceCad: number | null
  customNotes: string | null
  active: boolean
}

export interface UserProfile {
  userId: string
  role: Role | null
  products: UserProduct[]
}

export interface Plan {
  id: number
  slug: string
  name: string
  description: string | null
  priceCad: number | null
}

export interface CustomerProfile {
  firstName: string | null
  lastName: string | null
  companyName: string | null
  twilioNumber: string | null
}

export interface CustomerSummary {
  userId: string
  email: string
  phone: string | null
  role: 'ivera_admin' | 'customer'
  memberSince: string
  profile: CustomerProfile
  products: UserProduct[]
}

// ── Dashboard / existing endpoints ────────────────────────────────────────

export function fetchStats(): Promise<DashboardStats> {
  return authGet('/api/dashboard/stats')
}

export function fetchBookings(): Promise<Booking[]> {
  return authGet('/api/bookings')
}

export function fetchClients(): Promise<Client[]> {
  return authGet('/api/clients')
}

export function fetchPayments(): Promise<Payment[]> {
  return authGet('/api/payments')
}

// ── Auth ───────────────────────────────────────────────────────────────────

export function postSignup(): Promise<{ role: Role }> {
  return authPost('/api/auth/post-signup')
}

// ── User / profile ─────────────────────────────────────────────────────────

export function fetchMe(): Promise<UserProfile> {
  return authGet('/api/user/me')
}

export function fetchPlans(): Promise<Plan[]> {
  return authGet('/api/user/plans')
}

// ── Ivera admin — customer management ─────────────────────────────────────

export function fetchCustomers(): Promise<CustomerSummary[]> {
  return authGet('/api/user/customers')
}

export function assignProductToCustomer(
  userId: string,
  productSlug: string,
  planId: number,
  customPriceCad?: number | null,
  customNotes?: string | null,
): Promise<{ success: boolean }> {
  return authPost(`/api/user/customers/${userId}/products`, {
    productSlug,
    planId,
    customPriceCad,
    customNotes,
  })
}

export function updateCustomerProduct(
  userId: string,
  productSlug: string,
  updates: { planId?: number; customPriceCad?: number | null; customNotes?: string | null },
): Promise<{ success: boolean }> {
  return authPatch(`/api/user/customers/${userId}/products/${productSlug}`, updates)
}

export function removeCustomerProduct(
  userId: string,
  productSlug: string,
): Promise<{ success: boolean }> {
  return authDelete(`/api/user/customers/${userId}/products/${productSlug}`)
}

export function updateCustomerPhone(
  userId: string,
  phone: string | null,
): Promise<{ success: boolean }> {
  return authPatch(`/api/user/customers/${userId}/phone`, { phone })
}

export function createCustomer(
  email: string,
  firstName?: string | null,
  lastName?: string | null,
): Promise<{ userId: string; email: string }> {
  return authPost('/api/user/customers', { email, firstName, lastName })
}

export function updateCustomerEmail(
  userId: string,
  email: string,
): Promise<{ success: boolean }> {
  return authPatch(`/api/user/customers/${userId}/email`, { email })
}

export function upsertCustomerProfile(
  userId: string,
  profile: Partial<CustomerProfile>,
): Promise<{ success: boolean }> {
  return authPatch(`/api/user/customers/${userId}/profile`, profile)
}

export function fetchProviderSpend(
  month: string,
): Promise<{ month: string; entries: ProviderSpendEntry[] }> {
  return authGet(`/api/spend?month=${encodeURIComponent(month)}`)
}

export async function saveProviderSpend(
  month: string,
  entries: ProviderSpendEntry[],
): Promise<{ month: string; entries: ProviderSpendEntry[] }> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}/api/spend`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ month, entries }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function syncProviderSpend(
  month: string,
): Promise<ProviderSpendSyncResult> {
  return authPost('/api/spend/sync', { month })
}

export function fetchSendGridUsage(
  month: string,
): Promise<SendGridUsageSummary> {
  return authGet(`/api/spend/sendgrid-usage?month=${encodeURIComponent(month)}`)
}
