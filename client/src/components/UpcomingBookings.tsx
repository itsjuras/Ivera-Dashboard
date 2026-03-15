import { Clock } from 'lucide-react'

interface Booking {
  id: string
  clientName: string
  serviceType: string
  time: string
  duration: number
  status: 'scheduled' | 'confirmed'
}

const upcomingBookings: Booking[] = [
  {
    id: '1',
    clientName: 'Sarah Johnson',
    serviceType: 'Consultation',
    time: 'Today, 2:00 PM',
    duration: 30,
    status: 'confirmed',
  },
  {
    id: '2',
    clientName: 'Mike Chen',
    serviceType: 'Follow-up',
    time: 'Today, 3:30 PM',
    duration: 45,
    status: 'scheduled',
  },
  {
    id: '3',
    clientName: 'Emily Davis',
    serviceType: 'Initial Session',
    time: 'Tomorrow, 10:00 AM',
    duration: 60,
    status: 'confirmed',
  },
  {
    id: '4',
    clientName: 'James Wilson',
    serviceType: 'Consultation',
    time: 'Tomorrow, 1:00 PM',
    duration: 30,
    status: 'scheduled',
  },
]

const statusStyles = {
  confirmed: 'bg-neutral-900 text-white',
  scheduled: 'bg-neutral-100 text-neutral-600',
}

export default function UpcomingBookings() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <h3 className="text-sm font-medium text-neutral-500 mb-4">
        Upcoming Bookings
      </h3>
      <div className="space-y-3">
        {upcomingBookings.map((booking) => (
          <div
            key={booking.id}
            className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {booking.clientName}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {booking.serviceType}
              </p>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <div className="text-right">
                <p className="text-xs text-neutral-600">{booking.time}</p>
                <p className="text-xs text-neutral-400 flex items-center justify-end gap-1 mt-0.5">
                  <Clock size={10} />
                  {booking.duration} min
                </p>
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[booking.status]}`}
              >
                {booking.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
