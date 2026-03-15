import { Phone, MessageSquare, CreditCard, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Activity {
  id: string
  type: 'call' | 'sms' | 'payment' | 'new_client'
  description: string
  time: string
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'call',
    description: 'Inbound call from (555) 234-5678 — booked consultation',
    time: '12 min ago',
  },
  {
    id: '2',
    type: 'payment',
    description: 'Payment of $150.00 received from Sarah Johnson',
    time: '34 min ago',
  },
  {
    id: '3',
    type: 'new_client',
    description: 'New lead converted: Mike Chen',
    time: '1 hr ago',
  },
  {
    id: '4',
    type: 'sms',
    description: 'Reminder sent to Emily Davis for tomorrow at 10:00 AM',
    time: '2 hr ago',
  },
  {
    id: '5',
    type: 'call',
    description: 'Inbound call from (555) 876-5432 — left voicemail',
    time: '3 hr ago',
  },
]

const iconMap: Record<Activity['type'], LucideIcon> = {
  call: Phone,
  sms: MessageSquare,
  payment: CreditCard,
  new_client: UserPlus,
}

export default function RecentActivity() {
  return (
    <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-5">
      <h3 className="text-sm font-medium text-neutral-500 mb-4">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type]
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 py-2 border-b border-neutral-100 last:border-0"
            >
              <div className="mt-0.5 p-1.5 rounded-lg bg-neutral-100">
                <Icon size={14} className="text-neutral-500" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-700">{activity.description}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{activity.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
