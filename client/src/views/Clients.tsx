import PageHeader from '../components/PageHeader'

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: 'BOOKED' | 'ACTIVE' | 'DEACTIVATED' | 'ARCHIVED'
  createdAt: string
  sessionsCount: number
}

const clients: Client[] = [
  { id: '1', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@email.com', phone: '(555) 123-4567', status: 'ACTIVE', createdAt: 'Jan 15, 2026', sessionsCount: 12 },
  { id: '2', firstName: 'Mike', lastName: 'Chen', email: 'mike@email.com', phone: '(555) 234-5678', status: 'ACTIVE', createdAt: 'Feb 3, 2026', sessionsCount: 8 },
  { id: '3', firstName: 'Emily', lastName: 'Davis', email: 'emily@email.com', phone: '(555) 345-6789', status: 'BOOKED', createdAt: 'Mar 1, 2026', sessionsCount: 1 },
  { id: '4', firstName: 'James', lastName: 'Wilson', email: 'james@email.com', phone: '(555) 456-7890', status: 'ACTIVE', createdAt: 'Dec 10, 2025', sessionsCount: 18 },
  { id: '5', firstName: 'Lisa', lastName: 'Park', email: 'lisa@email.com', phone: '(555) 567-8901', status: 'BOOKED', createdAt: 'Mar 5, 2026', sessionsCount: 0 },
  { id: '6', firstName: 'Tom', lastName: 'Rivera', email: 'tom@email.com', phone: '(555) 678-9012', status: 'DEACTIVATED', createdAt: 'Nov 20, 2025', sessionsCount: 6 },
]

const statusStyles: Record<Client['status'], string> = {
  ACTIVE: 'bg-neutral-900 text-white',
  BOOKED: 'bg-neutral-100 text-neutral-600',
  DEACTIVATED: 'bg-neutral-100 text-neutral-400',
  ARCHIVED: 'bg-neutral-50 text-neutral-400',
}

export default function Clients() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Clients"
        subtitle="All clients managed by your AI receptionist"
      />

      <div className="bg-white/70 rounded-xl border border-neutral-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="px-5 py-3 font-medium text-neutral-500">Name</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Email</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Phone</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Sessions</th>
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
                <td className="px-5 py-4 text-neutral-900">{client.sessionsCount}</td>
                <td className="px-5 py-4 text-neutral-600">{client.createdAt}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[client.status]}`}>
                    {client.status.toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
