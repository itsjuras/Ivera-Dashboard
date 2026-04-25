import React from 'react'
import { Plus } from 'lucide-react'
import {
  statusColors,
  type CampaignDefinition,
  type CampaignConfig,
} from './salesUtils'
import { healthTone, replyRate, type CampaignAnalytics } from './salesAnalytics'

const TARGET_SECTION_HEADINGS = [
  'OVERVIEW',
  'HIGH-PRIORITY SEGMENTS',
  'SECONDARY SEGMENTS',
  'SIGNALS TO TARGET',
  'REFERRAL PROGRAM',
  'GEOGRAPHIC PRIORITY',
  'MESSAGING ANGLES BY PRODUCT',
  'REASSESSMENT NOTES',
] as const

function normalizeHeading(value: string) {
  return String(value || '')
    .replace(/[:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function extractSectionBody(source: string | null | undefined, heading: string) {
  const lines = String(source || '').split('\n')
  const known = new Set(TARGET_SECTION_HEADINGS.map((value) => normalizeHeading(value)))
  const target = normalizeHeading(heading)
  const collected: string[] = []
  let capture = false

  for (const line of lines) {
    const trimmed = line.trim()
    const normalized = normalizeHeading(trimmed)
    if (!capture && normalized === target) {
      capture = true
      continue
    }
    if (capture && trimmed && known.has(normalized)) break
    if (capture) collected.push(line)
  }

  return collected.join('\n').trim()
}

function upsertSection(source: string | null | undefined, heading: string, body: string) {
  const text = String(source || '').trim()
  const normalizedHeading = normalizeHeading(heading)
  const known = new Set(TARGET_SECTION_HEADINGS.map((value) => normalizeHeading(value)))
  const lines = text ? text.split('\n') : []
  const kept: string[] = []
  let skip = false

  for (const line of lines) {
    const trimmed = line.trim()
    const normalized = normalizeHeading(trimmed)
    if (!skip && normalized === normalizedHeading) {
      skip = true
      continue
    }
    if (skip && trimmed && known.has(normalized)) {
      skip = false
    }
    if (!skip) kept.push(line)
  }

  const cleanedBody = String(body || '').trim()
  if (!cleanedBody) return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  const sectionBlock = `${heading}\n${cleanedBody}`
  const anchor = kept.findIndex((line) => {
    const normalized = normalizeHeading(line.trim())
    return normalized === 'GEOGRAPHIC PRIORITY' || normalized === 'REASSESSMENT NOTES'
  })

  if (anchor >= 0) {
    const before = kept.slice(0, anchor).join('\n').trim()
    const after = kept.slice(anchor).join('\n').trim()
    return [before, sectionBlock, after].filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
  }

  return [kept.join('\n').trim(), sectionBlock]
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const SCHEDULE_DAY_OPTIONS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
] as const

const SCHEDULE_TIMEZONE_OPTIONS = [
  { value: 'America/Vancouver', label: 'Pacific' },
  { value: 'America/Edmonton', label: 'Mountain' },
  { value: 'America/Winnipeg', label: 'Central' },
  { value: 'America/Toronto', label: 'Eastern' },
] as const

const REFERRAL_PROGRAM_TEMPLATE = `- Wedding planners and venues can resell Ivera Stream to their clients.
- We provide special partner pricing per order.
- Partners keep all margin above partner pricing as profit.
- Include a simple onboarding CTA for referral partners.`

interface CampaignEditorProps {
  role: string
  campaignDefinitions: CampaignDefinition[]
  campaignsLoading: boolean
  selectedCampaignId: string | null
  onSelectCampaign: (id: string) => void
  editingCampaign: CampaignConfig | null
  setEditingCampaign: React.Dispatch<React.SetStateAction<CampaignConfig | null>>
  selectedCampaignDefinition: CampaignDefinition | null
  selectedCampaignAnalytics?: CampaignAnalytics | null
  campaignAnalyticsByDefinition?: Map<string, CampaignAnalytics>
  showNewCampaignForm: boolean
  setShowNewCampaignForm: React.Dispatch<React.SetStateAction<boolean>>
  newCampaignDraft: CampaignConfig
  setNewCampaignDraft: React.Dispatch<React.SetStateAction<CampaignConfig>>
  manualLeadOverride?: string
  setManualLeadOverride?: (v: string) => void
  savingCampaign: boolean
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
  onOpenReassessModal?: () => void
  onSetDefault: (definitionId: string) => Promise<void>
  onCreateCampaign: () => Promise<void>
  onCampaignAction?: (definitionId: string, action: 'pause' | 'restart' | 'archive') => Promise<void>
  externalCampaignPicker?: boolean
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
  campaignAnalyticsByDefinition,
  showNewCampaignForm,
  setShowNewCampaignForm,
  newCampaignDraft,
  setNewCampaignDraft,
  savingCampaign,
  adminActionMessage,
  adminActionError,
  onSaveCampaign,
  onOpenReassessModal,
  onSetDefault,
  onCreateCampaign,
  externalCampaignPicker = false,
}: CampaignEditorProps) {
  function campaignDisplayStatus(campaign: CampaignDefinition, analytics: CampaignAnalytics | null) {
    if (campaign.status === 'paused' && (analytics?.totalRuns ?? campaign.total_runs ?? 0) === 0) {
      return { label: 'ready', className: 'bg-blue-100 text-blue-700' }
    }
    return {
      label: campaign.status,
      className: statusColors[campaign.status] ?? statusColors.paused,
    }
  }

  const toggleScheduleDay = (
    current: string[] | undefined,
    day: string,
  ) => {
    const set = new Set(current && current.length ? current : ['tue', 'wed', 'thu'])
    if (set.has(day)) set.delete(day)
    else set.add(day)
    const next = Array.from(set)
    return next.length ? next : ['tue', 'wed', 'thu']
  }

  const newCampaignReferralProgram = React.useMemo(
    () => extractSectionBody(newCampaignDraft.target_description, 'REFERRAL PROGRAM'),
    [newCampaignDraft.target_description],
  )

  const editingCampaignReferralProgram = React.useMemo(
    () => extractSectionBody(editingCampaign?.target_description, 'REFERRAL PROGRAM'),
    [editingCampaign?.target_description],
  )

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
                  {externalCampaignPicker
                    ? 'Use the campaign list on the left to switch context. This view edits the selected campaign.'
                    : 'Use Outreach to run and monitor campaigns. This view is only for campaign settings and defaults.'}
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
                    schedule_days: editingCampaign?.schedule_days || selectedCampaignDefinition?.schedule_days || ['tue', 'wed', 'thu'],
                    schedule_time_local: editingCampaign?.schedule_time_local || selectedCampaignDefinition?.schedule_time_local || '08:00',
                    schedule_timezone: editingCampaign?.schedule_timezone || selectedCampaignDefinition?.schedule_timezone || 'America/Vancouver',
                    contact_name: editingCampaign?.contact_name || selectedCampaignDefinition?.contact_name || null,
                    contact_email: editingCampaign?.contact_email || selectedCampaignDefinition?.contact_email || null,
                    contact_phone: editingCampaign?.contact_phone || selectedCampaignDefinition?.contact_phone || null,
                    sender_name: editingCampaign?.sender_name || selectedCampaignDefinition?.sender_name || null,
                    sender_email: editingCampaign?.sender_email || selectedCampaignDefinition?.sender_email || null,
                    reply_to_email: editingCampaign?.reply_to_email || selectedCampaignDefinition?.reply_to_email || null,
                    cal_booking_url: editingCampaign?.cal_booking_url || selectedCampaignDefinition?.cal_booking_url || null,
                    website_url: editingCampaign?.website_url || selectedCampaignDefinition?.website_url || null,
                  })
                }}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
              >
                <Plus size={12} />
                Add Campaign
              </button>
            </div>

            {!externalCampaignPicker ? (
              campaignsLoading ? (
                <p className="mt-4 text-sm text-neutral-500">Loading campaigns...</p>
              ) : (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {campaignDefinitions.map((campaign) => (
                  (() => {
                    const analytics = campaignAnalyticsByDefinition?.get(campaign.id) ?? null
                    const displayStatus = campaignDisplayStatus(campaign, analytics)
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
                            <p className="mt-2 text-xs text-neutral-500">
                              {analytics?.latestRun
                                ? `Last run ${new Date(analytics.latestRun.created_at).toLocaleString('en-CA', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}`
                                : 'No runs yet'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {analytics ? (
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${healthTone(analytics.healthScore)}`}>
                                Health {analytics.healthScore}/100
                              </span>
                            ) : null}
                            <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${displayStatus.className}`}>
                              {displayStatus.label}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Runs</p>
                            <p className="mt-1 text-sm font-semibold text-neutral-900">{analytics?.totalRuns ?? campaign.total_runs ?? 0}</p>
                          </div>
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Sent</p>
                            <p className="mt-1 text-sm font-semibold text-neutral-900">{analytics?.sent ?? 0}</p>
                          </div>
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Reply Rate</p>
                            <p className="mt-1 text-sm font-semibold text-neutral-900">{analytics ? replyRate(analytics.replied, analytics.sent) : '—'}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                  ))}
                </div>
              )
            ) : null}

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
                <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-[11px] tracking-widest uppercase text-neutral-400">Scheduled Runs</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SCHEDULE_DAY_OPTIONS.map((day) => {
                      const active = (newCampaignDraft.schedule_days || ['tue', 'wed', 'thu']).includes(day.value)
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => setNewCampaignDraft((current) => ({
                            ...current,
                            schedule_days: toggleScheduleDay(current.schedule_days, day.value),
                          }))}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            active ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white text-neutral-600'
                          }`}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Run Time</span>
                      <input
                        type="time"
                        value={newCampaignDraft.schedule_time_local || '08:00'}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, schedule_time_local: event.target.value || '08:00' }))}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Time Zone</span>
                      <select
                        value={newCampaignDraft.schedule_timezone || 'America/Vancouver'}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, schedule_timezone: event.target.value }))}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                      >
                        {SCHEDULE_TIMEZONE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
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
                <label className="mt-3 block space-y-2">
                  <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Referral Program</span>
                  <textarea
                    value={newCampaignReferralProgram}
                    onChange={(event) => setNewCampaignDraft((current) => ({
                      ...current,
                      target_description: upsertSection(current.target_description, 'REFERRAL PROGRAM', event.target.value),
                    }))}
                    rows={5}
                    placeholder="Define partner pricing and resale terms for wedding planners and venues."
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setNewCampaignDraft((current) => ({
                      ...current,
                      target_description: upsertSection(current.target_description, 'REFERRAL PROGRAM', newCampaignReferralProgram || REFERRAL_PROGRAM_TEMPLATE),
                    }))}
                    className="w-fit rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-700"
                  >
                    Insert Template
                  </button>
                </label>
                <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-[11px] tracking-widest uppercase text-neutral-400">Sender Settings</p>
                  <p className="mt-1 text-xs text-neutral-500">Leave blank to use client-level defaults and fallbacks.</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Contact Name</span>
                      <input
                        type="text"
                        value={newCampaignDraft.contact_name ?? ''}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, contact_name: event.target.value || null }))}
                        placeholder="e.g. Alex from Ivera"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Contact Email</span>
                      <input
                        type="email"
                        value={newCampaignDraft.contact_email ?? ''}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, contact_email: event.target.value || null }))}
                        placeholder="e.g. alex@ivera.ca"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Contact Phone</span>
                      <input
                        type="tel"
                        value={newCampaignDraft.contact_phone ?? ''}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, contact_phone: event.target.value || null }))}
                        placeholder="e.g. +1 604 555 0100"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Sender Name</span>
                      <input
                        type="text"
                        value={newCampaignDraft.sender_name ?? ''}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, sender_name: event.target.value || null }))}
                        placeholder="e.g. Alex from Ivera"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Sender Email</span>
                      <input
                        type="email"
                        value={newCampaignDraft.sender_email ?? ''}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, sender_email: event.target.value || null }))}
                        placeholder="e.g. alex@ivera.ca"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Reply-To Email</span>
                      <input
                        type="email"
                        value={newCampaignDraft.reply_to_email ?? ''}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, reply_to_email: event.target.value || null }))}
                        placeholder="Defaults to sender email"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Booking URL</span>
                      <input
                        type="url"
                        value={newCampaignDraft.cal_booking_url ?? ''}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, cal_booking_url: event.target.value || null }))}
                        placeholder="e.g. https://cal.com/yourname"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Website</span>
                      <input
                        type="url"
                        value={newCampaignDraft.website_url ?? ''}
                        onChange={(event) => setNewCampaignDraft((current) => ({ ...current, website_url: event.target.value || null }))}
                        placeholder="e.g. https://streaming.ivera.ca"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                      />
                    </label>
                  </div>
                </div>
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
          <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Scheduled Runs</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SCHEDULE_DAY_OPTIONS.map((day) => {
                const active = (editingCampaign.schedule_days || ['tue', 'wed', 'thu']).includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => setEditingCampaign((current) => (current ? {
                      ...current,
                      schedule_days: toggleScheduleDay(current.schedule_days, day.value),
                    } : current))}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      active ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white text-neutral-600'
                    }`}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Run Time</span>
                <input
                  type="time"
                  value={editingCampaign.schedule_time_local || '08:00'}
                  onChange={(event) => setEditingCampaign((current) => (current ? { ...current, schedule_time_local: event.target.value || '08:00' } : current))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Time Zone</span>
                <select
                  value={editingCampaign.schedule_timezone || 'America/Vancouver'}
                  onChange={(event) => setEditingCampaign((current) => (current ? { ...current, schedule_timezone: event.target.value } : current))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                >
                  {SCHEDULE_TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
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
          <label className="mt-3 block space-y-2">
            <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Referral Program</span>
            <textarea
              value={editingCampaignReferralProgram}
              onChange={(event) => setEditingCampaign((current) => (
                current
                  ? {
                    ...current,
                    target_description: upsertSection(current.target_description, 'REFERRAL PROGRAM', event.target.value),
                  }
                  : current
              ))}
              rows={5}
              placeholder="Define partner pricing and resale terms for wedding planners and venues."
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-relaxed text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
            />
            <button
              type="button"
              onClick={() => setEditingCampaign((current) => (
                current
                  ? {
                    ...current,
                    target_description: upsertSection(current.target_description, 'REFERRAL PROGRAM', editingCampaignReferralProgram || REFERRAL_PROGRAM_TEMPLATE),
                  }
                  : current
              ))}
              className="w-fit rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-700"
            >
              Insert Template
            </button>
          </label>

          <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Sender Settings</p>
            <p className="mt-1 text-xs text-neutral-500">Overrides the default sender for this campaign. Leave blank to use the client-level defaults and fallbacks.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Contact Name</span>
                <input
                  type="text"
                  value={editingCampaign.contact_name ?? ''}
                  onChange={(event) => setEditingCampaign((current) => (current ? { ...current, contact_name: event.target.value || null } : current))}
                  placeholder="e.g. Alex from Ivera"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Contact Email</span>
                <input
                  type="email"
                  value={editingCampaign.contact_email ?? ''}
                  onChange={(event) => setEditingCampaign((current) => (current ? { ...current, contact_email: event.target.value || null } : current))}
                  placeholder="e.g. alex@ivera.ca"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                />
              </label>
              <label className="space-y-2">
                <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Contact Phone</span>
                <input
                  type="tel"
                  value={editingCampaign.contact_phone ?? ''}
                  onChange={(event) => setEditingCampaign((current) => (current ? { ...current, contact_phone: event.target.value || null } : current))}
                  placeholder="e.g. +1 604 555 0100"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                />
              </label>
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
              <label className="space-y-2">
                <span className="block text-[11px] tracking-widest uppercase text-neutral-400">Website</span>
                <input
                  type="url"
                  value={editingCampaign.website_url ?? ''}
                  onChange={(event) => setEditingCampaign((current) => (current ? { ...current, website_url: event.target.value || null } : current))}
                  placeholder="e.g. https://streaming.ivera.ca"
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
              onClick={onOpenReassessModal}
              disabled={savingCampaign}
              className="rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Self Reassess
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
