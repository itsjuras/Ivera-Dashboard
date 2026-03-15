import { Clock } from 'lucide-react'
import PageHeader from '../components/PageHeader'

interface Booking {
  id: string
  clientName: string
  serviceType: string
  date: string
  time: string
  duration: number
  amount: number
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  source: string
}

const bookings: Booking[] = [
  { id: '1', clientName: 'Sarah Johnson', serviceType: 'Consultation', date: 'Mar 11, 2026', time: '2:00 PM', duration: 30, amount: 150, status: 'confirmed', source: 'phone' },
  { id: '2', clientName: 'Mike Chen', serviceType: 'Follow-up', date: 'Mar 11, 2026', time: '3:30 PM', duration: 45, amount: 200, status: 'scheduled', source: 'phone' },
  { id: '3', clientName: 'Emily Davis', serviceType: 'Initial Session', date: 'Mar 12, 2026', time: '10:00 AM', duration: 60, amount: 300, status: 'confirmed', source: 'phone' },
  { id: '4', clientName: 'James Wilson', serviceType: 'Consultation', date: 'Mar 12, 2026', time: '1:00 PM', duration: 30, amount: 150, status: 'scheduled', source: 'phone' },
  { id: '5', clientName: 'Lisa Park', serviceType: 'Follow-up', date: 'Mar 13, 2026', time: '9:00 AM', duration: 45, amount: 200, status: 'scheduled', source: 'phone' },
  { id: '6', clientName: 'Tom Rivera', serviceType: 'Consultation', date: 'Mar 10, 2026', time: '11:00 AM', duration: 30, amount: 150, status: 'completed', source: 'phone' },
  { id: '7', clientName: 'Anna Lee', serviceType: 'Initial Session', date: 'Mar 9, 2026', time: '4:00 PM', duration: 60, amount: 300, status: 'cancelled', source: 'phone' },
]

const statusStyles: Record<Booking['status'], string> = {
  confirmed: 'bg-neutral-900 text-white',
  scheduled: 'bg-neutral-100 text-neutral-600',
  completed: 'bg-neutral-200 text-neutral-700',
  cancelled: 'bg-neutral-100 text-neutral-400',
}

export default function Bookings() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Bookings"
        subtitle="All scheduled and past bookings"
      />

      <div className="bg-white/70 rounded-xl border border-neutral-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="px-5 py-3 font-medium text-neutral-500">Client</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Service</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Date</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Duration</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Amount</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
              >
                <td className="px-5 py-4 font-medium text-neutral-900">
                  {booking.clientName}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {booking.serviceType}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  <div>{booking.date}</div>
                  <div className="text-xs text-neutral-400">{booking.time}</div>
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-neutral-400" />
                    {booking.duration} min
                  </span>
                </td>
                <td className="px-5 py-4 text-neutral-900">
                  ${booking.amount}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[booking.status]}`}>
                    {booking.status}
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
