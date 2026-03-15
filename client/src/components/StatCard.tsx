import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
}

export default function StatCard({ label, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-neutral-500 font-medium">{label}</span>
        <Icon size={18} className="text-neutral-400" strokeWidth={1.5} />
      </div>
      <p className="text-2xl font-semibold text-neutral-900">{value}</p>
      {subtitle && (
        <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>
      )}
    </div>
  )
}
