import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { fetchBookings, type Booking as ApiBooking } from '../services/api'
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


function mapApiBooking(b: ApiBooking): Booking {
  const dt = new Date(b.bookingTime)
  return {
    id: b.id,
    clientName: b.clientName,
    serviceType: b.serviceType,
    date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    duration: b.duration,
    amount: b.amount,
    status: b.status as Booking['status'],
    source: b.source,
  }
}

const statusStyles: Record<string, string> = {
  confirmed: 'bg-neutral-900 text-white',
  scheduled: 'bg-neutral-100 text-neutral-600',
  completed: 'bg-neutral-200 text-neutral-700',
  cancelled: 'bg-neutral-100 text-neutral-400',
}

export default function Bookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[] | null>(null)

  useEffect(() => {
    if (!user) return
    fetchBookings()
      .then((data) => setBookings(data.map(mapApiBooking)))
      .catch(() => setBookings([]))
  }, [user])

  if (bookings === null) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex justify-center pt-24">
        <div className="w-6 h-6 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Bookings"
        subtitle="All scheduled and past bookings"
      />

      <div className="bg-white/70 rounded-xl border border-neutral-200/60 overflow-hidden">
        {bookings.length === 0 ? (
          <p className="px-5 py-10 text-sm text-neutral-400 text-center">No bookings yet.</p>
        ) : (
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
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[booking.status] || statusStyles.scheduled}`}>
                    {booking.status}
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
