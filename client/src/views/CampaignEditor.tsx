import React from 'react'
import { Plus } from 'lucide-react'
import { statusColors, type CampaignAssessment, type CampaignConfig, type CampaignDefinition } from './salesUtils'

interface CampaignEditorProps {
  role: string
  campaignDefinitions: CampaignDefinition[]
  campaignsLoading: boolean
  selectedCampaignId: string | null
  onSelectCampaign: (id: string) => void
  editingCampaign: CampaignConfig | null
  setEditingCampaign: React.Dispatch<React.SetStateAction<CampaignConfig | null>>
  selectedCampaignDefinition: CampaignDefinition | null
  selectedCampaignAnalytics?: unknown
  showNewCampaignForm: boolean
  setShowNewCampaignForm: React.Dispatch<React.SetStateAction<boolean>>
  newCampaignDraft: CampaignConfig
  setNewCampaignDraft: React.Dispatch<React.SetStateAction<CampaignConfig>>
  manualLeadOverride?: string
  setManualLeadOverride?: (v: string) => void
  savingCampaign: boolean
  reassessingCampaign?: boolean
  reassessInput?: string
  setReassessInput?: React.Dispatch<React.SetStateAction<string>>
  assessment?: CampaignAssessment | null
  runningCampaign?: boolean
  runStartDisabled?: boolean
  hasActiveCampaign?: boolean
  adminActionMessage: string | null
  adminActionError: string | null
  liveCampaign?: unknown
  liveCampaignProgress?: unknown
  pendingRun?: unknown
  latestCampaignRuns?: unknown
  setSelectedRunId?: (id: string | null) => void
  selectedRun?: unknown
  selectedRunInsights?: string[]
  selectedRunActions?: string[]
  followUpPerformance?: unknown
  onRunCampaign?: (definitionId: string) => Promise<void>
  onSaveCampaign: () => Promise<void>
  onReassessCampaign?: () => Promise<void>
  onApplyAssessment?: () => void
  onSetDefault: (definitionId: string) => Promise<void>
  onCreateCampaign: () => Promise<void>
  onCampaignAction?: (definitionId: string, action: 'pause' | 'restart' | 'archive') => Promise<void>
}

export default function CampaignEditor({
  role,
  campaignDefinitions,
  campaignsLoading,
  selectedCampaignId,
  onSelectCampaign,
  editingCampaign,
  setEditingCampaign,
  selectedCampaignDefinition,
  showNewCampaignForm,
  setShowNewCampaignForm,
  newCampaignDraft,
  setNewCampaignDraft,
  savingCampaign,
  reassessingCampaign,
  reassessInput,
  setReassessInput,
  assessment,
  adminActionMessage,
  adminActionError,
  onSaveCampaign,
  onReassessCampaign,
  onApplyAssessment,
  onSetDefault,
  onCreateCampaign,
}: CampaignEditorProps) {
  return (
    <div className="space-y-6">
      {role === 'ivera_admin' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Campaign Setup</p>
                <h3 className="mt-1 text-sm font-semibold text-neutral-900">Choose the campaign you want to configure</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Use Outreach to run and monitor campaigns. This view is only for campaign settings and defaults.
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
                {campaignDefinitions.map((campaign) => (
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
                        <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                          {campaign.num_leads_per_run} leads/run
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${statusColors[campaign.status] ?? statusColors.paused}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                  <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Product Name</span>
                  <input
                    type="text"
                    value={newCampaignDraft.product_name}
                    onChange={(event) => setNewCampaignDraft((current) => ({ ...current, product_name: event.target.value }))}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                  />
                </label>
                <label className="mt-3 block space-y-2">
                  <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Product Context</span>
                  <textarea
                    value={newCampaignDraft.product_context}
                    onChange={(event) => setNewCampaignDraft((current) => ({ ...current, product_context: event.target.value }))}
                    rows={4}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
                  />
                </label>
                <label className="mt-3 block space-y-2">
                  <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Target Description</span>
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
          </div>
        </div>
      ) : null}

      {selectedCampaignDefinition && editingCampaign ? (
        <div className="rounded-xl border border-neutral-200 bg-white/80 p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] tracking-widest uppercase text-neutral-400">Selected Campaign</p>
              <h4 className="mt-1 text-sm font-semibold text-neutral-900">{selectedCampaignDefinition.name}</h4>
              <p className="mt-1 text-xs text-neutral-500">
                Edit the messaging, targeting, and sender settings here. Use Outreach to run or monitor this campaign.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Campaign Name</span>
              <input
                type="text"
                value={editingCampaign.name || ''}
                onChange={(event) => setEditingCampaign((current) => (current ? { ...current, name: event.target.value } : current))}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
              />
            </label>
            <label className="space-y-2">
              <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Leads Per Run</span>
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

          <label className="mt-3 block space-y-2">
            <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Product Name</span>
            <input
              type="text"
              value={editingCampaign.product_name}
              onChange={(event) => setEditingCampaign((current) => (current ? { ...current, product_name: event.target.value } : current))}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
            />
          </label>

          <label className="mt-3 block space-y-2">
            <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Product Context</span>
            <textarea
              value={editingCampaign.product_context}
              onChange={(event) => setEditingCampaign((current) => (current ? { ...current, product_context: event.target.value } : current))}
              rows={4}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
            />
          </label>

          <label className="mt-3 block space-y-2">
            <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Campaign Description</span>
            <textarea
              value={editingCampaign.target_description}
              onChange={(event) => setEditingCampaign((current) => (current ? { ...current, target_description: event.target.value } : current))}
              rows={8}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition focus:border-neutral-400"
            />
          </label>

          <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Sender Settings</p>
            <p className="mt-1 text-xs text-neutral-500">Overrides the default sender for this campaign. Leave blank to use the client-level defaults.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Sender Name</span>
                <input
                  type="text"
                  value={editingCampaign.sender_name ?? ''}
                  onChange={(event) => setEditingCampaign((current) => (current ? { ...current, sender_name: event.target.value || null } : current))}
                  placeholder="e.g. Alex from Ivera"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Sender Email</span>
                <input
                  type="email"
                  value={editingCampaign.sender_email ?? ''}
                  onChange={(event) => setEditingCampaign((current) => (current ? { ...current, sender_email: event.target.value || null } : current))}
                  placeholder="e.g. alex@ivera.ca"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Reply-To Email</span>
                <input
                  type="email"
                  value={editingCampaign.reply_to_email ?? ''}
                  onChange={(event) => setEditingCampaign((current) => (current ? { ...current, reply_to_email: event.target.value || null } : current))}
                  placeholder="Defaults to sender email"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Booking URL</span>
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
              disabled={savingCampaign}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 transition hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingCampaign ? 'Saving...' : 'Save Campaign'}
            </button>
            <button
              type="button"
              onClick={() => void onReassessCampaign?.()}
              disabled={reassessingCampaign || savingCampaign}
              className="rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reassessingCampaign ? 'Reassessing...' : 'Self Reassess'}
            </button>
            <button
              type="button"
              onClick={() => void onSetDefault(selectedCampaignDefinition.id)}
              disabled={savingCampaign || selectedCampaignDefinition.is_default || selectedCampaignDefinition.status === 'archived'}
              className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedCampaignDefinition.is_default ? 'Default Campaign' : 'Set Default'}
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Reassessment Guidance</p>
            <p className="mt-1 text-xs text-neutral-500">
              Add any extra instruction for the AI. Live campaign-health hints will also be folded into the reassessment automatically.
            </p>
            <textarea
              value={reassessInput ?? ''}
              onChange={(event) => setReassessInput?.(event.target.value)}
              rows={3}
              placeholder="Optional: keep Canada primary, focus on mortgage brokers, avoid weak-fit clinics..."
              className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
            />
          </div>

          {assessment ? (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] tracking-widest uppercase text-blue-700">Reassessment Output</p>
                  <p className="mt-1 text-sm text-neutral-700">{assessment.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={onApplyAssessment}
                  className="rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 transition hover:border-blue-300"
                >
                  Apply Suggested Changes
                </button>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-white/80 p-4">
                  <p className="text-[11px] tracking-widest uppercase text-emerald-700">Strengths</p>
                  <div className="mt-3 space-y-2">
                    {assessment.strengths.map((item) => (
                      <p key={item} className="text-sm text-neutral-700">{item}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-white/80 p-4">
                  <p className="text-[11px] tracking-widest uppercase text-amber-700">Issues</p>
                  <div className="mt-3 space-y-2">
                    {assessment.issues.map((item) => (
                      <p key={item} className="text-sm text-neutral-700">{item}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-blue-200 bg-white/80 p-4">
                  <p className="text-[11px] tracking-widest uppercase text-blue-700">Recommendations</p>
                  <div className="mt-3 space-y-2">
                    {assessment.recommendations.map((item) => (
                      <p key={item} className="text-sm text-neutral-700">{item}</p>
                    ))}
                  </div>
                </div>
              </div>

              {assessment.changeSet.length ? (
                <div className="mt-4 rounded-xl border border-neutral-200 bg-white/80 p-4">
                  <p className="text-[11px] tracking-widest uppercase text-neutral-400">Suggested Changes</p>
                  <div className="mt-3 space-y-2">
                    {assessment.changeSet.map((change, index) => (
                      <div key={`${change.field}-${index}`} className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-3">
                        <p className="text-sm font-semibold text-neutral-900">{change.field}</p>
                        <p className="mt-1 text-xs text-neutral-500">{change.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {adminActionMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {adminActionMessage}
        </div>
      ) : null}
      {adminActionError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {adminActionError}
        </div>
      ) : null}
    </div>
  )
}
