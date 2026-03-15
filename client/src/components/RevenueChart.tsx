import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { month: 'Jan', revenue: 4200 },
  { month: 'Feb', revenue: 5100 },
  { month: 'Mar', revenue: 4800 },
  { month: 'Apr', revenue: 6300 },
  { month: 'May', revenue: 5900 },
  { month: 'Jun', revenue: 7200 },
  { month: 'Jul', revenue: 6800 },
]

export default function RevenueChart() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <h3 className="text-sm font-medium text-neutral-500 mb-4">Revenue</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a3a3a3" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#a3a3a3" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v) => `$${v / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e5e5',
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#525252"
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
