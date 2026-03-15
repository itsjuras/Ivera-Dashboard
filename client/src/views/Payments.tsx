import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { DollarSign, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface Payment {
  id: string
  clientName: string
  amount: number
  status: 'succeeded' | 'pending' | 'failed'
  date: string
  cardBrand: string
  cardLast4: string
}

const payments: Payment[] = [
  { id: '1', clientName: 'Sarah Johnson', amount: 150, status: 'succeeded', date: 'Mar 11, 2026', cardBrand: 'Visa', cardLast4: '4242' },
  { id: '2', clientName: 'Mike Chen', amount: 200, status: 'pending', date: 'Mar 11, 2026', cardBrand: 'Mastercard', cardLast4: '8888' },
  { id: '3', clientName: 'James Wilson', amount: 150, status: 'succeeded', date: 'Mar 10, 2026', cardBrand: 'Visa', cardLast4: '1234' },
  { id: '4', clientName: 'Emily Davis', amount: 300, status: 'succeeded', date: 'Mar 10, 2026', cardBrand: 'Amex', cardLast4: '0005' },
  { id: '5', clientName: 'Lisa Park', amount: 200, status: 'failed', date: 'Mar 9, 2026', cardBrand: 'Visa', cardLast4: '9876' },
  { id: '6', clientName: 'Tom Rivera', amount: 150, status: 'succeeded', date: 'Mar 9, 2026', cardBrand: 'Mastercard', cardLast4: '5555' },
]

const statusConfig: Record<Payment['status'], { style: string; icon: typeof CheckCircle }> = {
  succeeded: { style: 'text-neutral-900', icon: CheckCircle },
  pending: { style: 'text-neutral-500', icon: Clock },
  failed: { style: 'text-neutral-400', icon: AlertCircle },
}

export default function Payments() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Payments"
        subtitle="Payment history and revenue tracking"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Collected This Month"
          value="$34,200"
          icon={DollarSign}
        />
        <StatCard
          label="Pending"
          value="$1,400"
          subtitle="3 payments"
          icon={Clock}
        />
        <StatCard
          label="Failed"
          value="$200"
          subtitle="1 payment"
          icon={AlertCircle}
        />
      </div>

      <div className="bg-white/70 rounded-xl border border-neutral-200/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="px-5 py-3 font-medium text-neutral-500">Client</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Amount</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Date</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Method</th>
              <th className="px-5 py-3 font-medium text-neutral-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const config = statusConfig[payment.status]
              const StatusIcon = config.icon
              return (
                <tr
                  key={payment.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-5 py-4 font-medium text-neutral-900">
                    {payment.clientName}
                  </td>
                  <td className="px-5 py-4 text-neutral-900 font-medium">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{payment.date}</td>
                  <td className="px-5 py-4 text-neutral-600">
                    {payment.cardBrand} ····{payment.cardLast4}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${config.style}`}>
                      <StatusIcon size={14} />
                      {payment.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
