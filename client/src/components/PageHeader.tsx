interface PageHeaderProps {
  title: string
  subtitle?: string
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      {subtitle && (
        <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}
