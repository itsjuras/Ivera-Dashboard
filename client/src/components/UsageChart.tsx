import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { month: 'Jan', calls: 124, sms: 89 },
  { month: 'Feb', calls: 156, sms: 102 },
  { month: 'Mar', calls: 143, sms: 95 },
  { month: 'Apr', calls: 189, sms: 134 },
  { month: 'May', calls: 172, sms: 118 },
  { month: 'Jun', calls: 210, sms: 145 },
  { month: 'Jul', calls: 198, sms: 137 },
]

export default function UsageChart() {
  return (
    <div className="bg-white/70 rounded-xl border border-neutral-200/60 p-5">
      <h3 className="text-sm font-medium text-neutral-500 mb-4">
        Call &amp; SMS Volume
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#a3a3a3' }}
              axisLine={{ stroke: '#e5e5e5' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#a3a3a3' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Bar dataKey="calls" fill="#525252" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sms" fill="#d4d4d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
