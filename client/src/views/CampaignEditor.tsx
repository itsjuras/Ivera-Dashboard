import React from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Archive,
  Plus,
  X,
} from 'lucide-react'
import {
  healthTone,
  replyRate,
  bookingRate,
  unsubscribeRate,
  branchLabel,
  sourceLabel,
} from './salesAnalytics'
import {
  timeAgo,
  formatRunDate,
  formatCampaignRunTitle,
  reportStatusLabel,
  statusColors,
  type CampaignConfig,
  type CampaignDefinition,
  type CampaignAnalytics,
  type CampaignRun,
  type LiveCampaignProgress,
  type ListCardRow,
  type PendingRun,
} from './salesUtils'

// ── Local ListCard (mirrors the one in SalesDashboard) ────────────────────────

function ListCard({
  title,
  subtitle,
  rows,
  emptyLabel,
  onRowClick,
}: {
  title: string
  subtitle: string
  rows: ListCardRow[]
  emptyLabel: string
  onRowClick?: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-xs uppercase tracking-[0.18em] text-neutral-400">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={onRowClick && row.interactive !== false ? () => onRowClick(row.id) : undefined}
              className={`flex w-full items-start justify-between gap-4 rounded-lg border border-neutral-100 bg-white/80 px-3 py-3 text-left ${
                onRowClick && row.interactive !== false ? 'transition hover:bg-neutral-50/80' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{row.title}</p>
                <p className="mt-1 text-xs text-neutral-500">{row.meta}</p>
                {row.detail ? <p className="mt-2 text-xs text-neutral-600">{row.detail}</p> : null}
                {row.metrics?.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
                    {row.metrics.map((metric) => (
                      <div key={metric.label} className="rounded-md border border-neutral-100 bg-neutral-50/80 px-2.5 py-2">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">{metric.label}</p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {row.badge ? (
                <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  {row.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Follow-up performance type ────────────────────────────────────────────────

interface FollowUpBranch {
  branch: 'clicked' | 'opened' | 'cold' | 'replied_later'
  sent: number
  leads: number
  replied: number
  booked: number
  bounced: number
  unsubscribed: number
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CampaignEditorProps {
  role: string
  // Campaign list
  campaignDefinitions: CampaignDefinition[]
  campaignsLoading: boolean
  selectedCampaignId: string | null
  onSelectCampaign: (id: string) => void
  // Editing
  editingCampaign: CampaignConfig | null
  setEditingCampaign: React.Dispatch<React.SetStateAction<CampaignConfig | null>>
  selectedCampaignDefinition: CampaignDefinition | null
  selectedCampaignAnalytics: CampaignAnalytics | null
  // New campaign form
  showNewCampaignForm: boolean
  setShowNewCampaignForm: React.Dispatch<React.SetStateAction<boolean>>
  newCampaignDraft: CampaignConfig
  setNewCampaignDraft: React.Dispatch<React.SetStateAction<CampaignConfig>>
  // Manual override
  manualLeadOverride: string
  setManualLeadOverride: (v: string) => void
  // Status flags
  savingCampaign: boolean
  runningCampaign: boolean
  runStartDisabled: boolean
  hasActiveCampaign: boolean
  adminActionMessage: string | null
  adminActionError: string | null
  // Live run
  liveCampaign: CampaignRun | null
  liveCampaignProgress: LiveCampaignProgress | null
  pendingRun: PendingRun | null
  // Run history
  latestCampaignRuns: ListCardRow[]
  setSelectedRunId: (id: string | null) => void
  selectedRun: CampaignRun | null
  selectedRunInsights: string[]
  selectedRunActions: string[]
  followUpPerformance: FollowUpBranch[]
  // Handlers
  onRunCampaign: (definitionId: string) => Promise<void>
  onSaveCampaign: () => Promise<void>
  onSetDefault: (definitionId: string) => Promise<void>
  onCreateCampaign: () => Promise<void>
  onCampaignAction: (definitionId: string, action: 'pause' | 'restart' | 'archive') => Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampaignEditor({
  role,
  campaignDefinitions,
  campaignsLoading,
  selectedCampaignId,
  onSelectCampaign,
  editingCampaign,
  setEditingCampaign,
  selectedCampaignDefinition,
  selectedCampaignAnalytics,
  showNewCampaignForm,
  setShowNewCampaignForm,
  newCampaignDraft,
  setNewCampaignDraft,
  manualLeadOverride,
  setManualLeadOverride,
  savingCampaign,
  runningCampaign,
  runStartDisabled,
  hasActiveCampaign,
  adminActionMessage,
  adminActionError,
  liveCampaign,
  liveCampaignProgress,
  pendingRun,
  latestCampaignRuns,
  setSelectedRunId,
  selectedRun,
  selectedRunInsights,
  selectedRunActions,
  followUpPerformance,
  onRunCampaign,
  onSaveCampaign,
  onSetDefault,
  onCreateCampaign,
  onCampaignAction,
}: CampaignEditorProps) {
  return (
    <div className="space-y-6">
      {role === 'ivera_admin' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Campaign Manager</p>
                <h3 className="mt-1 text-sm font-semibold text-neutral-900">Outreach campaigns</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Create campaigns, tune their copy, and control which ones can start, pause, restart, or archive.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewCampaignForm((current) => !current)
                  setNewCampaignDraft({
                    name: '',
                    product_name: editingCampaign?.product_name || selectedCampaignDefinition?.product_name || '',
                    product_context: editingCampaign?.product_context || selectedCampaignDefinition?.product_context || '',
                    target_description: editingCampaign?.target_description || selectedCampaignDefinition?.target_description || '',
                    num_leads_per_run: editingCampaign?.num_leads_per_run || selectedCampaignDefinition?.num_leads_per_run || 40,
                  })
                }}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
              >
                <Plus size={12} />
                Add Campaign
              </button>
            </div>

            {campaignsLoading ? (
              <p className="mt-4 text-sm text-neutral-500">Loading campaigns...</p>
            ) : (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {campaignDefinitions.map((campaign) => {
                  const analytics = selectedCampaignAnalytics && campaign.id === selectedCampaignId
                    ? selectedCampaignAnalytics
                    : null
                  const topBranch = analytics
                    ? [
                        { label: 'clicked', count: analytics.branchMix.clicked },
                        { label: 'opened', count: analytics.branchMix.opened },
                        { label: 'cold', count: analytics.branchMix.cold },
                        { label: 'replied later', count: analytics.branchMix.replied_later },
                      ].sort((a, b) => b.count - a.count)[0]
                    : null
                  const sourceEntries = analytics
                    ? [
                        { label: 'Exa', count: analytics.sourceMix.exa },
                        { label: 'Scraped', count: analytics.sourceMix.scraped },
                        { label: 'Pattern', count: analytics.sourceMix.pattern },
                      ].filter((entry) => entry.count > 0).sort((a, b) => b.count - a.count)
                    : []
                  const strongestSource = analytics?.sourcePerformance.length
                    ? [...analytics.sourcePerformance]
                      .sort((a, b) => {
                        const aReply = a.leads > 0 ? a.replied / a.leads : 0
                        const bReply = b.leads > 0 ? b.replied / b.leads : 0
                        if (bReply !== aReply) return bReply - aReply
                        return b.leads - a.leads
                      })[0]
                    : null

                  return (
                    <div
                      key={campaign.id}
                      onClick={() => onSelectCampaign(campaign.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onSelectCampaign(campaign.id)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        selectedCampaignId === campaign.id
                          ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                          : 'border-neutral-200 bg-white/80 hover:border-neutral-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-neutral-900">{campaign.name}</p>
                            {campaign.is_default ? (
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-blue-700">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 truncate text-xs text-neutral-500">{campaign.product_name}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1">
                              {campaign.num_leads_per_run} leads/run
                            </span>
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1">
                              {campaign.total_runs || 0} runs
                            </span>
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1">
                              {campaign.last_run_at ? `last run ${timeAgo(campaign.last_run_at)}` : 'never run'}
                            </span>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${statusColors[campaign.status] ?? statusColors.paused}`}>
                          {campaign.status}
                        </span>
                      </div>

                      {analytics ? (
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          <div className={`rounded-xl border px-3 py-3 ${healthTone(analytics.healthScore)}`}>
                            <p className="text-[10px] uppercase tracking-[0.18em]">Health</p>
                            <p className="mt-1 text-lg font-semibold">{analytics.healthScore}/100</p>
                            <p className="mt-1 text-[11px]">
                              {replyRate(analytics.replied, analytics.sent)} reply · {analytics.sent ? `${Math.round((analytics.bounced / analytics.sent) * 100)}%` : '—'} bounce
                            </p>
                          </div>
                          <div className="rounded-xl border border-neutral-200 bg-white px-3 py-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Top Branch</p>
                            <p className="mt-1 text-sm font-semibold text-neutral-900">
                              {topBranch && topBranch.count > 0 ? `${topBranch.label} ${topBranch.count}` : 'No follow-ups yet'}
                            </p>
                            <p className="mt-1 text-[11px] text-neutral-500">
                              {analytics.latestRun ? `Latest run ${formatRunDate(analytics.latestRun.created_at)}` : 'Waiting for first run'}
                            </p>
                          </div>
                          <div className="rounded-xl border border-neutral-200 bg-white px-3 py-3">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Source Quality</p>
                            <p className="mt-1 text-sm font-semibold text-neutral-900">
                              {strongestSource
                                ? `${sourceLabel(strongestSource.source)} ${replyRate(strongestSource.replied, strongestSource.leads)} reply`
                                : (sourceEntries.length ? sourceEntries.map((entry) => `${entry.label} ${entry.count}`).join(' · ') : 'No source data yet')}
                            </p>
                            <p className="mt-1 text-[11px] text-neutral-500">
                              {strongestSource
                                ? `${strongestSource.leads} leads · ${strongestSource.bounced} bounced`
                                : `${analytics.totalRuns} tracked runs · ${analytics.sent} sent`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-white/70 px-3 py-3 text-sm text-neutral-500">
                          No run analytics yet. Start this campaign to build branch and source performance history.
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            void onRunCampaign(campaign.id)
                          }}
                          disabled={runStartDisabled || campaign.status === 'archived'}
                          className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Play size={11} />
                          Start
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            void onSetDefault(campaign.id)
                          }}
                          disabled={savingCampaign || campaign.is_default || campaign.status === 'archived'}
                          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Set Default
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            void onCampaignAction(campaign.id, 'pause')
                          }}
                          disabled={savingCampaign}
                          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pause size={11} />
                          Pause
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            void onCampaignAction(campaign.id, 'restart')
                          }}
                          disabled={runStartDisabled}
                          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw size={11} />
                          Restart
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            void onCampaignAction(campaign.id, 'archive')
                          }}
                          disabled={savingCampaign}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Archive size={11} />
                          Archive
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* New campaign form */}
            {showNewCampaignForm ? (
              <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Campaign Name</span>
                    <input
                      type="text"
                      value={newCampaignDraft.name || ''}
                      onChange={(event) => setNewCampaignDraft((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Leads Per Run</span>
                    <input
                      type="number"
                      min={5}
                      step={1}
                      value={newCampaignDraft.num_leads_per_run}
                      onChange={(event) => setNewCampaignDraft((current) => ({ ...current, num_leads_per_run: Number(event.target.value) || 40 }))}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                    />
                  </label>
                </div>
                <label className="mt-3 block space-y-2">
                  <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Product Name</span>
                  <input
                    type="text"
                    value={newCampaignDraft.product_name}
                    onChange={(event) => setNewCampaignDraft((current) => ({ ...current, product_name: event.target.value }))}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                  />
                </label>
                <label className="mt-3 block space-y-2">
                  <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Product Context</span>
                  <textarea
                    value={newCampaignDraft.product_context}
                    onChange={(event) => setNewCampaignDraft((current) => ({ ...current, product_context: event.target.value }))}
                    rows={4}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
                  />
                </label>
                <label className="mt-3 block space-y-2">
                  <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Target Description</span>
                  <textarea
                    value={newCampaignDraft.target_description}
                    onChange={(event) => setNewCampaignDraft((current) => ({ ...current, target_description: event.target.value }))}
                    rows={6}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
                  />
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onCreateCampaign}
                    disabled={savingCampaign}
                    className="rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingCampaign ? 'Creating...' : 'Create Campaign'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewCampaignForm(false)}
                    className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Edit selected campaign */}
            {selectedCampaignDefinition && editingCampaign ? (
              <div className="mt-5 rounded-xl border border-neutral-200 bg-white/80 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] tracking-widests uppercase text-neutral-400">Selected Campaign</p>
                    <h4 className="mt-1 text-sm font-semibold text-neutral-900">{selectedCampaignDefinition.name}</h4>
                    <p className="mt-1 text-xs text-neutral-500">
                      {selectedCampaignDefinition.is_default ? 'Default campaign config' : 'Save changes here, then use Set Default only if you want this campaign to become the default'}
                    </p>
                  </div>
                  <label className="space-y-2">
                    <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Manual Override This Run</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={manualLeadOverride}
                      onChange={(event) => setManualLeadOverride(event.target.value)}
                      placeholder={String(selectedCampaignDefinition.num_leads_per_run)}
                      className="w-full min-w-40 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Campaign Name</span>
                    <input
                      type="text"
                      value={editingCampaign.name || ''}
                      onChange={(event) => setEditingCampaign((current) => (current ? { ...current, name: event.target.value } : current))}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Leads Per Run</span>
                    <input
                      type="number"
                      min={5}
                      step={1}
                      value={editingCampaign.num_leads_per_run}
                      onChange={(event) => setEditingCampaign((current) => (current ? { ...current, num_leads_per_run: Number(event.target.value) || 40 } : current))}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                    />
                  </label>
                </div>

                {selectedCampaignAnalytics ? (
                  <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Campaign Analytics</p>
                        <p className="mt-1 text-sm text-neutral-700">
                          All tracked runs: {selectedCampaignAnalytics.totalRuns} · latest run {selectedCampaignAnalytics.latestRun ? formatRunDate(selectedCampaignAnalytics.latestRun.created_at) : '—'}
                        </p>
                      </div>
                      <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${healthTone(selectedCampaignAnalytics.healthScore)}`}>
                        Health {selectedCampaignAnalytics.healthScore}/100
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-4">
                      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Reply Rate</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{replyRate(selectedCampaignAnalytics.replied, selectedCampaignAnalytics.sent)}</p>
                        <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.replied} replies from {selectedCampaignAnalytics.sent} sent</p>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Booked Rate</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{bookingRate(selectedCampaignAnalytics.booked, selectedCampaignAnalytics.sent)}</p>
                        <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.booked} booked</p>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Bounce Rate</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{selectedCampaignAnalytics.sent ? `${Math.round((selectedCampaignAnalytics.bounced / selectedCampaignAnalytics.sent) * 100)}%` : '—'}</p>
                        <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.bounced} bounced</p>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Unsub Rate</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{unsubscribeRate(selectedCampaignAnalytics.unsubscribed, selectedCampaignAnalytics.sent)}</p>
                        <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.unsubscribed} unsubscribed</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 xl:grid-cols-2">
                      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Branch Mix</p>
                        <div className="mt-3 space-y-2">
                          {([
                            ['clicked', selectedCampaignAnalytics.branchMix.clicked],
                            ['opened', selectedCampaignAnalytics.branchMix.opened],
                            ['cold', selectedCampaignAnalytics.branchMix.cold],
                            ['replied_later', selectedCampaignAnalytics.branchMix.replied_later],
                          ] as const).map(([branch, count]) => (
                            <div key={branch} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-2">
                              <span className="text-sm font-medium text-neutral-700">{branchLabel(branch)}</span>
                              <span className="text-sm text-neutral-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Email Source Mix</p>
                        <div className="mt-3 space-y-2">
                          {([
                            ['Exa', selectedCampaignAnalytics.sourceMix.exa],
                            ['Scraped', selectedCampaignAnalytics.sourceMix.scraped],
                            ['Pattern', selectedCampaignAnalytics.sourceMix.pattern],
                          ] as const).map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-2">
                              <span className="text-sm font-medium text-neutral-700">{label}</span>
                              <span className="text-sm text-neutral-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {selectedCampaignAnalytics.sourcePerformance.length ? (
                      <div className="mt-4 rounded-lg border border-neutral-200 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Source Quality By Campaign</p>
                        <div className="mt-3 space-y-2">
                          {selectedCampaignAnalytics.sourcePerformance.map((source) => (
                            <div key={source.source} className="grid grid-cols-[minmax(0,1.1fr)_repeat(4,minmax(0,0.8fr))] gap-2 rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-3 text-sm">
                              <div>
                                <p className="font-medium text-neutral-900">{sourceLabel(source.source)}</p>
                                <p className="mt-1 text-xs text-neutral-500">{source.leads} leads tracked</p>
                              </div>
                              <div>
                                <p className="text-[11px] tracking-widests uppercase text-neutral-400">Replies</p>
                                <p className="mt-1 font-medium text-neutral-900">{source.replied}</p>
                              </div>
                              <div>
                                <p className="text-[11px] tracking-widests uppercase text-neutral-400">Booked</p>
                                <p className="mt-1 font-medium text-neutral-900">{source.booked}</p>
                              </div>
                              <div>
                                <p className="text-[11px] tracking-widests uppercase text-neutral-400">Bounced</p>
                                <p className="mt-1 font-medium text-neutral-900">{source.bounced}</p>
                              </div>
                              <div>
                                <p className="text-[11px] tracking-widests uppercase text-neutral-400">Reply Rate</p>
                                <p className="mt-1 font-medium text-neutral-900">{replyRate(source.replied, source.leads)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <label className="mt-3 block space-y-2">
                  <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Product Name</span>
                  <input
                    type="text"
                    value={editingCampaign.product_name}
                    onChange={(event) => setEditingCampaign((current) => (current ? { ...current, product_name: event.target.value } : current))}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                  />
                </label>

                <label className="mt-3 block space-y-2">
                  <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Product Context</span>
                  <textarea
                    value={editingCampaign.product_context}
                    onChange={(event) => setEditingCampaign((current) => (current ? { ...current, product_context: event.target.value } : current))}
                    rows={4}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
                  />
                </label>

                <label className="mt-3 block space-y-2">
                  <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Campaign Description</span>
                  <textarea
                    value={editingCampaign.target_description}
                    onChange={(event) => setEditingCampaign((current) => (current ? { ...current, target_description: event.target.value } : current))}
                    rows={8}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
                  />
                </label>

                {/* Sender settings */}
                <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                  <p className="text-[11px] tracking-widests uppercase text-neutral-400">Sender Settings</p>
                  <p className="mt-1 text-xs text-neutral-500">Overrides the default sender for this campaign. Leave blank to use the client-level defaults.</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Sender Name</span>
                      <input
                        type="text"
                        value={editingCampaign.sender_name ?? ''}
                        onChange={(event) => setEditingCampaign((current) => (current ? { ...current, sender_name: event.target.value || null } : current))}
                        placeholder="e.g. Alex from Ivera"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Sender Email</span>
                      <input
                        type="email"
                        value={editingCampaign.sender_email ?? ''}
                        onChange={(event) => setEditingCampaign((current) => (current ? { ...current, sender_email: event.target.value || null } : current))}
                        placeholder="e.g. alex@ivera.ca"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Reply-To Email</span>
                      <input
                        type="email"
                        value={editingCampaign.reply_to_email ?? ''}
                        onChange={(event) => setEditingCampaign((current) => (current ? { ...current, reply_to_email: event.target.value || null } : current))}
                        placeholder="Defaults to sender email"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widests uppercase text-neutral-400">Booking URL</span>
                      <input
                        type="url"
                        value={editingCampaign.cal_booking_url ?? ''}
                        onChange={(event) => setEditingCampaign((current) => (current ? { ...current, cal_booking_url: event.target.value || null } : current))}
                        placeholder="e.g. https://cal.com/yourname"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onSaveCampaign}
                    disabled={savingCampaign || runningCampaign}
                    className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 transition hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingCampaign ? 'Saving...' : 'Save Campaign'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSetDefault(selectedCampaignDefinition.id)}
                    disabled={savingCampaign || selectedCampaignDefinition.is_default || selectedCampaignDefinition.status === 'archived'}
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {selectedCampaignDefinition.is_default ? 'Default Campaign' : 'Set Default'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onRunCampaign(selectedCampaignDefinition.id)}
                    disabled={runStartDisabled || selectedCampaignDefinition.status === 'archived'}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Play size={12} />
                    {runningCampaign ? 'Starting...' : hasActiveCampaign ? 'Campaign Running' : 'Start Campaign'}
                  </button>
                </div>
              </div>
            ) : null}

            {hasActiveCampaign && !pendingRun ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                A campaign is already running. Wait for it to finish before starting another one.
              </div>
            ) : null}

            {/* Live run progress */}
            {liveCampaign && liveCampaignProgress ? (
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[11px] tracking-widests uppercase text-neutral-400">
                      {liveCampaignProgress.isComplete ? 'Run Complete' : 'Campaign In Progress'}
                    </p>
                    <h4 className="mt-1 text-sm font-semibold text-neutral-900">
                      {pendingRun?.title || liveCampaign.product_name || 'Campaign run'}
                    </h4>
                    <p className="mt-1 text-xs text-neutral-500">{liveCampaignProgress.summary}</p>
                  </div>
                  <span className={`inline-flex self-start rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                    liveCampaignProgress.isComplete
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-neutral-200 bg-white text-neutral-500'
                  }`}>
                    {liveCampaignProgress.badge}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      liveCampaignProgress.isComplete ? 'bg-emerald-500' : 'bg-neutral-900'
                    }`}
                    style={{ width: `${liveCampaignProgress.progressPercent}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-5">
                  {liveCampaignProgress.steps.map((step) => (
                    <div
                      key={step.key}
                      className={`rounded-lg border px-3 py-3 ${
                        step.state === 'complete'
                          ? 'border-emerald-200 bg-emerald-50/80'
                          : step.state === 'current'
                            ? 'border-neutral-900 bg-white'
                            : 'border-neutral-100 bg-white/70'
                      }`}
                    >
                      <p className="text-[11px] tracking-widests uppercase text-neutral-400">{step.label}</p>
                      <p className={`mt-1 text-sm font-semibold ${
                        step.state === 'complete'
                          ? 'text-emerald-700'
                          : step.state === 'current'
                            ? 'text-neutral-900'
                            : 'text-neutral-400'
                      }`}>
                        {step.state === 'complete' ? 'Done' : step.state === 'current' ? 'In progress' : 'Waiting'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-5">
                  {liveCampaignProgress.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-2.5">
                      <p className="text-[11px] tracking-widests uppercase text-neutral-400">{metric.label}</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {adminActionMessage ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {adminActionMessage}
              </div>
            ) : null}
            {adminActionError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {adminActionError}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <ListCard
        title="Recent Runs"
        subtitle="Click any run to open the full targeting, positioning, and delivery details"
        rows={latestCampaignRuns}
        emptyLabel="No runs yet"
        onRowClick={setSelectedRunId}
      />

      {/* Selected run modal */}
      {selectedRun ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 px-4 py-8">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
              <div>
                <p className="text-[11px] tracking-widests uppercase text-neutral-400">Campaign Run</p>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                  {formatCampaignRunTitle(selectedRun)}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {formatRunDate(selectedRun.created_at)} · {selectedRun.product_name} · {selectedRun.total_leads || 0} leads
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRunId(null)}
                className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4">
                  <p className="text-[11px] tracking-widests uppercase text-neutral-400">Run Metrics</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                    {[
                      { label: 'Qualified', value: selectedRun.qualified_leads || 0 },
                      { label: 'Emailed', value: selectedRun.emailed || 0 },
                      { label: 'Replies', value: selectedRun.replied || 0 },
                      { label: 'Booked', value: selectedRun.booked || 0 },
                      { label: 'Unsubscribed', value: selectedRun.unsubscribed || 0 },
                      { label: 'Bounced', value: selectedRun.bounced || 0 },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">{m.label}</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{m.value}</p>
                      </div>
                    ))}
                    <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                      <p className="text-[11px] tracking-widests uppercase text-neutral-400">Avg Score</p>
                      <p className="mt-1 text-lg font-semibold text-neutral-900">
                        {typeof selectedRun.avg_score === 'number' ? `${selectedRun.avg_score.toFixed(1)}/10` : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3 md:col-span-2 xl:col-span-1">
                      <p className="text-[11px] tracking-widests uppercase text-neutral-400">Last Lead Activity</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900">
                        {selectedRun.last_lead_at ? formatRunDate(selectedRun.last_lead_at) : 'No lead activity recorded'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedRun.funnel_diagnostics ? (
                  <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Funnel Diagnostics</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          This shows exactly where the run narrowed from search to outreach.
                        </p>
                      </div>
                      <p className="text-xs text-neutral-400">
                        requested {selectedRun.funnel_diagnostics.requested_leads ?? '—'} · effective {selectedRun.funnel_diagnostics.effective_run_limit ?? '—'}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                      {[
                        { label: 'Raw', value: selectedRun.funnel_diagnostics.raw_candidates },
                        { label: 'Duplicates', value: selectedRun.funnel_diagnostics.duplicate_candidates },
                        { label: 'Fresh', value: selectedRun.funnel_diagnostics.fresh_candidates },
                        { label: 'Qualified', value: selectedRun.funnel_diagnostics.qualified },
                        { label: 'Email Found', value: selectedRun.funnel_diagnostics.email_found },
                        { label: 'No Email', value: selectedRun.funnel_diagnostics.no_email_found },
                      ].map((m) => (
                        <div key={m.label} className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                          <p className="text-[11px] tracking-widests uppercase text-neutral-400">{m.label}</p>
                          <p className="mt-1 text-lg font-semibold text-neutral-900">{m.value ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Report Delivery</p>
                        <p className="mt-1 text-sm font-medium text-neutral-900">
                          {reportStatusLabel(
                            selectedRun.funnel_diagnostics.report_status,
                            selectedRun.funnel_diagnostics.report_error_message,
                          )}
                        </p>
                      </div>
                      <div className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Follow-Up Sequence</p>
                        <p className="mt-1 text-sm text-neutral-700">
                          Touch 2 on day 4 with email + SMS, then touches 3–6 by email on days 11, 25, 39, and 53.
                        </p>
                      </div>
                    </div>
                    {selectedRunInsights.length ? (
                      <div className="mt-4 rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Run Insights</p>
                        <div className="mt-3 space-y-2">
                          {selectedRunInsights.map((insight) => (
                            <p key={insight} className="text-sm text-neutral-700">{insight}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {selectedRunActions.length ? (
                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-blue-700">Recommended Actions</p>
                        <div className="mt-3 space-y-2">
                          {selectedRunActions.map((action) => (
                            <p key={action} className="text-sm text-neutral-700">{action}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {followUpPerformance.length ? (
                      <div className="mt-4 rounded-lg border border-neutral-100 bg-white px-3 py-3">
                        <p className="text-[11px] tracking-widests uppercase text-neutral-400">Follow-Up Branch Performance</p>
                        <div className="mt-3 space-y-2">
                          {followUpPerformance.map((branch) => (
                            <div key={`modal-${branch.branch}`} className="overflow-x-auto rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-3">
                              <div className="grid min-w-[620px] grid-cols-[minmax(0,1.1fr)_repeat(5,minmax(0,0.75fr))] gap-2 text-sm">
                                <div>
                                  <p className="font-medium text-neutral-900">{branchLabel(branch.branch)}</p>
                                  <p className="mt-1 text-xs text-neutral-500">{branch.leads} leads tracked</p>
                                </div>
                                <div>
                                  <p className="text-[11px] tracking-widests uppercase text-neutral-400">Sent</p>
                                  <p className="mt-1 font-medium text-neutral-900">{branch.sent}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] tracking-widests uppercase text-neutral-400">Replies</p>
                                  <p className="mt-1 font-medium text-neutral-900">{branch.replied}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] tracking-widests uppercase text-neutral-400">Booked</p>
                                  <p className="mt-1 font-medium text-neutral-900">{branch.booked}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] tracking-widests uppercase text-neutral-400">Bounced</p>
                                  <p className="mt-1 font-medium text-neutral-900">{branch.bounced}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] tracking-widests uppercase text-neutral-400">Reply Rate</p>
                                  <p className="mt-1 font-medium text-neutral-900">{replyRate(branch.replied, branch.leads)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {selectedRun.funnel_diagnostics.search_passes?.length ? (
                      <div className="mt-4 space-y-2">
                        {selectedRun.funnel_diagnostics.search_passes.map((pass, index) => (
                          <div key={`${selectedRun.id}-pass-${index}`} className="rounded-lg border border-neutral-100 bg-white px-3 py-3">
                            <p className="text-[11px] tracking-widests uppercase text-neutral-400">
                              Search Pass {index + 1}
                            </p>
                            <p className="mt-1 text-sm text-neutral-700">{pass.query}</p>
                            <p className="mt-2 text-xs text-neutral-500">
                              raw {pass.raw_candidates} · fresh {pass.fresh_added} · duplicates {pass.duplicate_candidates ?? 0}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4">
                  <p className="text-[11px] tracking-widests uppercase text-neutral-400">Targeting</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                    {selectedRun.target_description || 'No targeting description saved for this run.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
