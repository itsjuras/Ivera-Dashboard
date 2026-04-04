import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchClients, type Client as ApiClient } from '../services/api'
import PageHeader from '../components/PageHeader'

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: 'BOOKED' | 'ACTIVE' | 'DEACTIVATED' | 'ARCHIVED'
  createdAt: string
}


function mapApiClient(c: ApiClient): Client {
  const dt = new Date(c.createdAt)
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    status: c.status as Client['status'],
    createdAt: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-neutral-900 text-white',
  BOOKED: 'bg-neutral-100 text-neutral-600',
  DEACTIVATED: 'bg-neutral-100 text-neutral-400',
  ARCHIVED: 'bg-neutral-50 text-neutral-400',
}

export default function Clients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[] | null>(null)

  useEffect(() => {
    if (!user) return
    fetchClients()
      .then((data) => setClients(data.map(mapApiClient)))
      .catch(() => setClients([]))
  }, [user])

  if (clients === null) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center pt-24">
        <div className="w-6 h-6 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Clients"
        subtitle="All clients managed by your AI receptionist"
      />

      <div className="bg-white/70 rounded-xl border border-neutral-200/60 overflow-hidden">
        {clients.length === 0 ? (
          <p className="px-5 py-10 text-sm text-neutral-400 text-center">No clients yet.</p>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="px-5 py-3 font-medium text-neutral-500">Name</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Email</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Phone</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Since</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium text-neutral-600">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <span className="font-medium text-neutral-900">
                      {client.firstName} {client.lastName}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-neutral-600">{client.email}</td>
                <td className="px-5 py-4 text-neutral-600">{client.phone}</td>
                <td className="px-5 py-4 text-neutral-600">{client.createdAt}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[client.status] || statusStyles.BOOKED}`}>
                    {client.status.toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  )
}
