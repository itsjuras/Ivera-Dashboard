import PageHeader from '../components/PageHeader'

export default function LiveConsultantDashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Consultant"
        subtitle="Live consultant data is not connected for customer accounts yet."
      />

      <div className="rounded-2xl border border-neutral-200 bg-white/70 p-8">
        <p className="text-sm text-neutral-700 mb-3">
          This workspace is not showing mock insights anymore inside the logged-in dashboard.
        </p>
        <p className="text-sm text-neutral-500 mb-6">
          We will either connect this product to real data sources or hide it from assigned accounts until it is ready.
        </p>
        <a
          href="/demo/consultant"
          className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium tracking-widest uppercase text-white hover:bg-neutral-800 transition-colors"
        >
          View public demo
        </a>
      </div>
    </div>
  )
}
