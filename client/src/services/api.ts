const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

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

export function fetchStats(): Promise<DashboardStats> {
  return get('/api/dashboard/stats')
}

export function fetchBookings(): Promise<Booking[]> {
  return get('/api/bookings')
}

export function fetchClients(): Promise<Client[]> {
  return get('/api/clients')
}

export function fetchPayments(): Promise<Payment[]> {
  return get('/api/payments')
}
