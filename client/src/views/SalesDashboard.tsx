import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
const LazyCampaignEditor = lazy(() => import('./CampaignEditor'))
import {
  Users,
  CalendarCheck,
  Send,
  Reply,
  Building2,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import {
  bookingRate,
  branchLabel,
  buildCampaignAnalytics,
  healthTone,
  replyRate,
  sourceLabel,
  unsubscribeRate,
} from './salesAnalytics'

const SALES_API = 'https://sales.ivera.ca'

interface PortalStats {
  totalCampaignRuns?: number
  crm?: {
    accounts: number
    opportunities: number
    open_opportunities: number
    engaged_opportunities: number
    meetings_booked: number
    total_pipeline: number
    total_won: number
    won_opps: number
    lost_opps: number
    win_rate: number | null
    avg_deal_size: number | null
  }
  totals: {
    emailed: number
    replied: number
    booked: number
    unsubscribed: number
    bounced?: number
    weekEmailed: number
  }
  recentLeads: Array<{
    id: string
    company: string
    email: string
    status: string
    qualify_score: number | null
    created_at: string
  }>
  leadActivity?: Array<{
    date: string
    sent: number
    replied: number
    booked: number
    unsubscribed: number
  }>
  followUpPerformance?: Array<{
    branch: 'clicked' | 'opened' | 'cold' | 'replied_later'
    sent: number
    leads: number
    replied: number
    booked: number
    bounced: number
    unsubscribed: number
  }>
  campaignSourcePerformance?: Array<{
    campaign_definition_id: string
    source: 'exa' | 'scraped' | 'pattern' | 'unknown'
    leads: number
    replied: number
    booked: number
    bounced: number
    unsubscribed: number
  }>
  campaigns: Array<{
    id: string
    product_name: string
    campaign_name?: string | null
    campaign_definition_id?: string | null
    target_description: string
    created_at: string
    status?: string
    funnel_diagnostics?: {
      requested_leads?: number
      effective_run_limit?: number
      manual_override?: boolean
      raw_candidates?: number
      duplicate_candidates?: number
      fresh_candidates?: number
      enriched_contacts?: number
      qualified?: number
      email_found?: number
      no_email_found?: number
      leads_saved?: number
      sent?: number
      send_errors?: number
      risky_domains_suppressed?: number
      report_status?: string
      report_error_message?: string
      warmup_limit?: number | null
      reached_warmup_limit?: boolean
      reached_run_target?: boolean
      search_queries?: string[]
      search_passes?: Array<{
        query: string
        raw_candidates: number
        fresh_added: number
        duplicate_candidates?: number
      }>
      best_search_pass?: {
        query: string
        raw_candidates: number
        fresh_added: number
        duplicate_candidates?: number
      } | null
      email_sources?: {
        exa?: number
        scraped?: number
        pattern?: number
        skipped?: number
      }
      follow_up_branches?: {
        clicked?: number
        opened?: number
        cold?: number
        replied_later?: number
      }
      status_breakdown?: {
        replied?: number
        booked?: number
        unsubscribed?: number
        bounced?: number
      }
      updated_at?: string
    }
    total_leads: number
    qualified_leads: number
    emailed: number
    replied: number
    booked: number
    unsubscribed: number
    bounced?: number
    avg_score: number | null
    last_lead_at: string | null
  }>
}

interface CampaignConfig {
  id?: string
  name?: string
  product_name: string
  product_context: string
  target_description: string
  num_leads_per_run: number
  sender_name?: string | null
  sender_email?: string | null
  reply_to_email?: string | null
  cal_booking_url?: string | null
}

interface CampaignDefinition {
  id: string
  name: string
  product_name: string
  product_context: string
  target_description: string
  num_leads_per_run: number
  status: 'active' | 'paused' | 'archived'
  is_default: boolean
  created_at: string
  updated_at: string
  total_runs?: number
  last_run_at?: string | null
  last_run_status?: string | null
  active_run_id?: string | null
  sender_name?: string | null
  sender_email?: string | null
  reply_to_email?: string | null
  cal_booking_url?: string | null
}

interface CampaignAnalytics {
  definitionId: string
  totalRuns: number
  sent: number
  replied: number
  booked: number
  bounced: number
  unsubscribed: number
  branchMix: {
    clicked: number
    opened: number
    cold: number
    replied_later: number
  }
  sourceMix: {
    exa: number
    scraped: number
    pattern: number
  }
  sourcePerformance: Array<{
    source: 'exa' | 'scraped' | 'pattern' | 'unknown'
    leads: number
    replied: number
    booked: number
    bounced: number
    unsubscribed: number
  }>
  latestRun: PortalStats['campaigns'][number] | null
  healthScore: number
}

interface CampaignAssessment {
  summary: string
  strengths: string[]
  issues: string[]
  recommendations: string[]
  suggestedConfig: {
    product_name: string
    product_context: string
    target_description: string
    num_leads_per_run: number
  }
  changeSet: Array<{
    field: string
    from: unknown
    to: unknown
    reason: string
  }>
}

interface CrmAccountSummary {
  id: string
  name: string
  domain: string | null
  industry: string | null
  segment: string | null
  geo: string | null
  employee_band: string | null
  website: string | null
  phone: string | null
  status: string
  lifecycle_stage: string
  created_at: string
  updated_at: string
}

interface CrmContact {
  id: string
  full_name: string | null
  role: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  is_primary: boolean
  contact_source: string | null
  status: string
  email_suppressed: boolean
  sms_suppressed: boolean
}

interface CrmOpportunity {
  id: string
  account_id: string
  primary_contact_id: string | null
  owner_user_id: string | null
  stage: string
  amount_estimate: number | null
  priority: string
  source: string | null
  qualified_summary: string | null
  pain_summary: string | null
  next_step: string | null
  next_step_due_at: string | null
  last_activity_at: string | null
  won_at: string | null
  lost_at: string | null
  lost_reason: string | null
  proposal_sent_at: string | null
  proposal_status: string
  closed_amount: number | null
  created_at: string
  updated_at: string
}

interface ReportingSummary {
  total_pipeline: number
  total_won: number
  total_lost: number
  win_rate: number | null
  avg_deal_size: number | null
  open_opps: number
  won_opps: number
}

interface ReportingData {
  summary: ReportingSummary & { forecast_total: number }
  funnel: Array<{ stage: string; count: number }>
  conversion_rates: Array<{ from: string; to: string; rate: number | null }>
  forecast: Record<string, { count: number; pipeline: number; weighted: number; probability: number }>
  by_stage: Record<string, { count: number; amount: number }>
  by_campaign: Array<{ campaign: string; count: number; amount: number; won: number; lost: number; won_amount: number }>
  lost_reasons: Record<string, number>
}

interface CrmComment {
  id: string
  opportunity_id: string
  author_user_id: string | null
  body: string
  created_at: string
}

interface DeliverabilityOverall {
  total_sent: number
  bounce_count: number
  bounce_rate: number | null
  spam_count: number
  spam_rate: number | null
  unsub_count: number
  unsub_rate: number | null
  open_count: number
  open_rate: number | null
  click_count: number
  click_rate: number | null
}

interface DeliverabilityDomainRow {
  domain: string
  sent: number
  bounced: number
  spam: number
  unsubscribed: number
  opened: number
  bounce_rate: number
  spam_rate: number
  open_rate: number
}

interface DeliverabilityByCampaign {
  campaign_id: string | null
  campaign_name: string
  sent: number
  bounced: number
  spam: number
  unsubscribed: number
  opened: number
  replied: number
  bounce_rate: number | null
  spam_rate: number | null
  open_rate: number | null
  reply_rate: number | null
  unsub_rate: number | null
}

interface SuppressionAuditRow {
  id: string
  full_name: string | null
  email: string | null
  email_suppressed: boolean
  sms_suppressed: boolean
  account_id: string | null
  account_name: string | null
  account_domain: string | null
  suppressed_since: string
}

interface DeliverabilityData {
  overall: DeliverabilityOverall
  by_domain: DeliverabilityDomainRow[]
  by_campaign: DeliverabilityByCampaign[]
  suppression_audit: SuppressionAuditRow[]
  suppression_summary: { email_suppressed: number; sms_suppressed: number; total: number }
}

interface CrmActivity {
  id: string
  type: string
  direction: string | null
  channel: string | null
  subject: string | null
  body: string | null
  meta?: Record<string, string | number | boolean | null>
  occurred_at: string
}

interface CrmTask {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  priority: string
  owner_user_id: string | null
  due_at: string | null
  completed_at: string | null
  account_id: string | null
  opportunity_id: string | null
  contact_id: string | null
  lead_id: string | null
  accounts?: {
    id: string
    name: string
    domain: string | null
    lifecycle_stage: string
  } | null
  opportunities?: {
    id: string
    stage: string
    next_step: string | null
    next_step_due_at: string | null
  } | null
  account_contacts?: {
    id: string
    full_name: string | null
    email: string | null
  } | null
}

interface ContactCoverage {
  total: number
  active: number
  suppressed: number
  primary: number
}

interface TouchSummaryEntry {
  type: string
  count: number
  last_at: string | null
}

interface CrmAccountDetail {
  account: CrmAccountSummary
  contacts: CrmContact[]
  opportunities: CrmOpportunity[]
  activities: CrmActivity[]
  contact_coverage: ContactCoverage
  touch_summary: TouchSummaryEntry[]
}

interface DuplicateGroup {
  key: string
  reason: 'domain' | 'name'
  accounts: Array<{ id: string; name: string; domain: string | null; lifecycle_stage: string; status: string; updated_at: string }>
}

interface ProspectHistory {
  lead: {
    id: string
    company: string | null
    contact_name: string | null
    contact_role: string | null
    email: string | null
    phone: string | null
    qualify_score: number | null
    status: string
    created_at: string
  }
  timeline: Array<{
    id: string
    type: string
    at: string
    title: string
    body: string
    meta?: Record<string, string | number | boolean | null>
  }>
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-neutral-100 text-neutral-600',
  replied: 'bg-emerald-100 text-emerald-700',
  opened: 'bg-blue-100 text-blue-700',
  booked: 'bg-neutral-900 text-white',
  emailed: 'bg-neutral-100 text-neutral-500',
  sent: 'bg-neutral-100 text-neutral-500',
  unsubscribed: 'bg-red-50 text-red-400',
  bounced: 'bg-orange-50 text-orange-600',
  disqualified: 'bg-neutral-50 text-neutral-400',
}

type OverviewDays = 0 | 7 | 14 | 30
type ProspectDays = 0 | 7 | 14 | 30
type LayerKey = 'sent' | 'replied' | 'booked' | 'unsubscribed'
type TabKey = 'outreach' | 'engagement' | 'pipeline' | 'reporting' | 'leadQuality' | 'deliverability' | 'prospects' | 'editCampaign'
type ProspectStatus = 'all' | 'sent' | 'replied' | 'booked' | 'unsubscribed'
type ProspectScore = 'all' | 'scored' | 'high'
type PipelineView = 'board' | 'workspace'
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function leadStatusBucket(status: string): LayerKey {
  if (status === 'replied') return 'replied'
  if (status === 'booked') return 'booked'
  if (status === 'unsubscribed') return 'unsubscribed'
  return 'sent'
}

function leadWithinDays(iso: string, days: number) {
  if (days === 0) return true
  const now = Date.now()
  const diff = now - new Date(iso).getTime()
  return diff <= days * 24 * 60 * 60 * 1000
}

function averageLeadScore(leads: PortalStats['recentLeads']) {
  const scored = leads.filter((lead) => typeof lead.qualify_score === 'number')
  if (scored.length === 0) return '—'
  const total = scored.reduce((sum, lead) => sum + (lead.qualify_score ?? 0), 0)
  return `${(total / scored.length).toFixed(1)}/10`
}

function highIntentCount(leads: PortalStats['recentLeads']) {
  return leads.filter((lead) => (lead.qualify_score ?? 0) >= 7).length
}

function recentReplyCount(leads: PortalStats['recentLeads']) {
  return leads.filter((lead) => lead.status === 'replied' || lead.status === 'booked').length
}

function latestRunLabel(campaigns: PortalStats['campaigns']) {
  if (campaigns.length === 0) return 'No runs yet'
  return `Latest ${timeAgo(campaigns[0].created_at)}`
}

function formatRunDate(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatElapsedTimer(startedAt: number, now = Date.now()) {
  const totalSeconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getNextScheduledCampaignRun(now = new Date()) {
  const targetDays = new Set([2, 3, 4]) // Tue-Thu in UTC

  for (let offset = 0; offset < 14; offset += 1) {
    const candidate = new Date(now)
    candidate.setUTCDate(now.getUTCDate() + offset)
    candidate.setUTCHours(17, 0, 0, 0)

    if (!targetDays.has(candidate.getUTCDay())) continue
    if (candidate.getTime() <= now.getTime()) continue

    return candidate
  }

  return null
}

function formatScheduledRun(date: Date | null) {
  if (!date) return 'Unavailable'
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatCampaignRunTitle(run: PortalStats['campaigns'][number]) {
  if (run.campaign_name) return run.campaign_name
  return run.product_name || 'Campaign run'
}

function buildFunnelSummary(
  diagnostics: PortalStats['campaigns'][number]['funnel_diagnostics'] | undefined,
) {
  if (!diagnostics) return null

  const parts = [
    ['raw', diagnostics.raw_candidates],
    ['fresh', diagnostics.fresh_candidates],
    ['qualified', diagnostics.qualified],
    ['email', diagnostics.email_found],
    ['sent', diagnostics.sent],
  ]
    .filter(([, value]) => typeof value === 'number')
    .map(([label, value]) => `${label} ${value}`)

  return parts.length ? parts.join(' → ') : null
}

function reportStatusLabel(status: string | undefined, error: string | undefined) {
  if (status === 'sent') return 'Report sent'
  if (status === 'failed') return error ? `Report failed: ${error}` : 'Report failed'
  return 'Report status unavailable'
}

function buildRunInsights(
  diagnostics: PortalStats['campaigns'][number]['funnel_diagnostics'] | undefined,
) {
  if (!diagnostics) return []

  const insights: string[] = []
  const bestSearchPass = diagnostics.best_search_pass
  if (bestSearchPass?.query && typeof bestSearchPass.fresh_added === 'number') {
    insights.push(`Best search pass added ${bestSearchPass.fresh_added} fresh leads from "${bestSearchPass.query.slice(0, 72)}${bestSearchPass.query.length > 72 ? '…' : ''}"`)
  }

  const riskySuppressed = diagnostics.risky_domains_suppressed ?? 0
  if (riskySuppressed > 0) {
    insights.push(`${riskySuppressed} leads were suppressed because their domains already had risky bounce history`)
  }

  const sources = diagnostics.email_sources
  if (sources) {
    const sourceEntries = [
      { label: 'Exa', count: sources.exa ?? 0 },
      { label: 'Scraped', count: sources.scraped ?? 0 },
      { label: 'Pattern', count: sources.pattern ?? 0 },
    ]
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)

    if (sourceEntries.length > 0) {
      insights.push(`Most emails came from ${sourceEntries.map((entry) => `${entry.label.toLowerCase()} ${entry.count}`).join(', ')}`)
    }

    if ((sources.pattern ?? 0) > 0 && (diagnostics.status_breakdown?.bounced ?? 0) > 0) {
      insights.push('Pattern-guessed emails are still active in this run, so watch bounce pressure closely')
    }
  }

  const branches = diagnostics.follow_up_branches
  if (branches) {
    const branchEntries = [
      { label: 'clicked', count: branches.clicked ?? 0 },
      { label: 'opened', count: branches.opened ?? 0 },
      { label: 'cold', count: branches.cold ?? 0 },
      { label: 'replied later', count: branches.replied_later ?? 0 },
    ]
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)

    if (branchEntries.length > 0) {
      insights.push(`Follow-up branch mix: ${branchEntries.map((entry) => `${entry.label} ${entry.count}`).join(', ')}`)
    }
  }

  const noEmailFound = diagnostics.no_email_found ?? 0
  const qualified = diagnostics.qualified ?? 0
  if (qualified > 0 && noEmailFound / qualified >= 0.4) {
    insights.push('Contact discovery was a bottleneck on this run, with many qualified leads missing usable personal email')
  }

  const bounced = diagnostics.status_breakdown?.bounced ?? 0
  const sent = diagnostics.sent ?? 0
  if (sent >= 5 && bounced / sent >= 0.2) {
    insights.push(`Bounce pressure stayed elevated at ${Math.round((bounced / sent) * 100)}% of sent leads`)
  }

  return insights.slice(0, 4)
}

function buildRecommendedActions(
  diagnostics: PortalStats['campaigns'][number]['funnel_diagnostics'] | undefined,
) {
  if (!diagnostics) return []

  const actions: string[] = []
  const qualified = diagnostics.qualified ?? 0
  const noEmailFound = diagnostics.no_email_found ?? 0
  const sent = diagnostics.sent ?? 0
  const bounced = diagnostics.status_breakdown?.bounced ?? 0
  const riskySuppressed = diagnostics.risky_domains_suppressed ?? 0
  const patternEmails = diagnostics.email_sources?.pattern ?? 0
  const coldBranch = diagnostics.follow_up_branches?.cold ?? 0
  const clickedBranch = diagnostics.follow_up_branches?.clicked ?? 0
  const openedBranch = diagnostics.follow_up_branches?.opened ?? 0

  if (qualified > 0 && noEmailFound / qualified >= 0.4) {
    actions.push('Tighten contact discovery for this ICP before the next run. Too many qualified leads are failing at the personal-email step.')
  }

  if (sent >= 5 && bounced / sent >= 0.2) {
    actions.push('Reduce risky sends next run. Prefer scraped or Exa-confirmed emails and trim pattern-guessed addresses for this campaign.')
  }

  if (patternEmails > 0 && bounced > 0) {
    actions.push('Review whether this campaign should temporarily disable pattern guesses. They are still contributing risk here.')
  }

  if (riskySuppressed > 0) {
    actions.push('Refine targeting away from domains with repeat bounce history, or create a separate campaign wedge with cleaner account sources.')
  }

  if (coldBranch > openedBranch + clickedBranch && coldBranch >= 3) {
    actions.push('Your follow-up sequence is staying mostly cold. Test a stronger touch-2 subject line or a narrower ICP before scaling this campaign.')
  }

  if (clickedBranch > 0) {
    actions.push('Clicked leads are showing intent. Consider a more direct CTA or a faster human handoff for that branch.')
  }

  if (!actions.length && sent > 0) {
    actions.push('This run looks operationally healthy. Keep the same campaign live and use the next run to compare reply and click behavior by follow-up branch.')
  }

  return actions.slice(0, 3)
}

function buildLiveRunProgress(
  run: PortalStats['campaigns'][number] | null,
  startedAt: number,
  requestedLeadCount: number | null,
  now = Date.now(),
) {
  const diagnostics = run?.funnel_diagnostics
  const rawCandidates = diagnostics?.raw_candidates ?? 0
  const freshCandidates = diagnostics?.fresh_candidates ?? run?.total_leads ?? 0
  const qualified = diagnostics?.qualified ?? run?.qualified_leads ?? 0
  const emailFound = diagnostics?.email_found ?? 0
  const noEmail = diagnostics?.no_email_found ?? 0
  const sent = diagnostics?.sent ?? run?.emailed ?? 0
  const isComplete = run?.status === 'complete'

  const hasSearch = rawCandidates > 0 || freshCandidates > 0
  const hasQualified = qualified > 0 || sent > 0
  const hasContacts = emailFound > 0 || noEmail > 0 || sent > 0
  const hasSent = sent > 0

  const stages = [
    { key: 'search', label: 'Searching', done: hasSearch },
    { key: 'qualify', label: 'Qualifying', done: hasQualified },
    { key: 'contacts', label: 'Finding Contacts', done: hasContacts },
    { key: 'sending', label: 'Sending', done: hasSent },
    { key: 'complete', label: 'Completed', done: isComplete },
  ]

  const currentIndex = isComplete ? stages.length - 1 : stages.findIndex((stage) => !stage.done)
  const completedCount = stages.filter((stage) => stage.done).length
  const progressPercent = isComplete
    ? 100
    : Math.max(10, Math.round(((completedCount + (currentIndex >= 0 ? 0.45 : 0)) / stages.length) * 100))

  const steps = stages.map((stage, index) => ({
    ...stage,
    state: stage.done ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
  }))

  let summary = `Campaign queued · ${formatElapsedTimer(startedAt, now)} elapsed`
  if (run && !hasQualified) {
    summary = `Searching and cleaning candidates · ${rawCandidates || '—'} raw found so far`
  } else if (run && hasQualified && !hasContacts) {
    summary = `Qualifying best-fit accounts · ${qualified} leads passed scoring`
  } else if (run && hasContacts && !hasSent) {
    summary = `Finding real contacts · ${emailFound} found, ${noEmail} skipped`
  } else if (run && hasSent && !isComplete) {
    summary = `Sending outreach · ${sent} sent so far`
  } else if (run && isComplete) {
    summary = `Run complete · ${sent} sent, ${qualified} qualified, ${freshCandidates} fresh candidates reviewed`
  }

  return {
    isComplete,
    summary,
    progressPercent,
    steps,
    badge: isComplete ? 'completed' : `${formatElapsedTimer(startedAt, now)}`,
    metrics: [
      { label: 'Requested', value: requestedLeadCount ?? run?.funnel_diagnostics?.requested_leads ?? '—' },
      { label: 'Raw', value: rawCandidates ?? '—' },
      { label: 'Fresh', value: freshCandidates ?? '—' },
      { label: 'Qualified', value: qualified ?? '—' },
      { label: 'Sent', value: sent ?? '—' },
    ],
  }
}

function buildLeadActivity(leads: PortalStats['recentLeads'], days: number) {
  const byDay = new Map<
    string,
    {
      day: string
      sent: number
      replied: number
      booked: number
      unsubscribed: number
    }
  >()

  if (days === 0) {
    const sortedKeys = Array.from(
      new Set(leads.map((lead) => new Date(lead.created_at).toISOString().slice(0, 10))),
    ).sort()

    for (const key of sortedKeys) {
      const date = new Date(`${key}T00:00:00.000Z`)
      byDay.set(key, {
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: 0,
        replied: 0,
        booked: 0,
        unsubscribed: 0,
      })
    }
  } else {
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - offset)
      const key = date.toISOString().slice(0, 10)
      byDay.set(key, {
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: 0,
        replied: 0,
        booked: 0,
        unsubscribed: 0,
      })
    }
  }

  for (const lead of leads) {
    const key = new Date(lead.created_at).toISOString().slice(0, 10)
    const bucket = byDay.get(key)
    if (!bucket) continue
    bucket[leadStatusBucket(lead.status)] += 1
  }

  return Array.from(byDay.values())
}

function buildLeadActivityFromSeries(series: NonNullable<PortalStats['leadActivity']>, days: number) {
  if (series.length === 0) return []

  const filtered = days === 0
    ? series
    : series.filter((entry) => leadWithinDays(`${entry.date}T12:00:00.000Z`, days))

  return filtered.map((entry) => ({
    day: new Date(`${entry.date}T00:00:00.000Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sent: entry.sent,
    replied: entry.replied,
    booked: entry.booked,
    unsubscribed: entry.unsubscribed,
  }))
}

function summarizeLeadActivitySeries(series: NonNullable<PortalStats['leadActivity']>, days: number) {
  const filtered = days === 0
    ? series
    : series.filter((entry) => leadWithinDays(`${entry.date}T12:00:00.000Z`, days))

  return filtered.reduce(
    (totals, entry) => ({
      sent: totals.sent + (entry.sent || 0) + (entry.replied || 0) + (entry.booked || 0),
      replied: totals.replied + (entry.replied || 0) + (entry.booked || 0),
      booked: totals.booked + (entry.booked || 0),
      unsubscribed: totals.unsubscribed + (entry.unsubscribed || 0),
    }),
    { sent: 0, replied: 0, booked: 0, unsubscribed: 0 },
  )
}

function MetricSection({
  title,
  icon: Icon,
  metrics,
}: {
  title: string
  icon: typeof Send
  metrics: Array<{ label: string; value: string | number; hint: string }>
}) {
  return (
    <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-lg bg-neutral-100 p-2">
          <Icon size={16} className="text-neutral-600" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
            <p className="text-[11px] tracking-widest uppercase text-neutral-400">{metric.label}</p>
            <p className="mt-1 text-lg font-semibold leading-none text-neutral-900">{metric.value}</p>
            <p className="mt-1 text-[11px] leading-snug text-neutral-500">{metric.hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ListCard({
  title,
  subtitle,
  rows,
  emptyLabel,
  onRowClick,
}: {
  title: string
  subtitle: string
  rows: Array<{
    id: string
    title: string
    meta: string
    badge?: string
    badgeClassName?: string
    interactive?: boolean
    metrics?: Array<{ label: string; value: string | number }>
    detail?: string
  }>
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
              className={`flex w-full flex-col gap-3 rounded-lg border border-neutral-100 bg-white/80 px-3 py-3 text-left md:flex-row md:items-start md:justify-between ${
                onRowClick && row.interactive !== false ? 'transition hover:bg-neutral-50/80' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-neutral-900 md:truncate">{row.title}</p>
                <p className="mt-1 break-words text-xs leading-relaxed text-neutral-500">{row.meta}</p>
                {row.detail ? (
                  <p className="mt-2 text-xs text-neutral-600">{row.detail}</p>
                ) : null}
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
                <span className={`inline-flex self-start rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] md:shrink-0 ${row.badgeClassName ?? 'border-neutral-200 bg-white text-neutral-500'}`}>
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

function tabButtonClass(active: boolean) {
  return `rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.18em] uppercase transition ${
    active
      ? 'border-neutral-900 bg-neutral-900 text-white'
      : 'border-neutral-200 bg-white/70 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
  }`
}

function timelineTypeLabel(type: string) {
  const labels: Record<string, string> = {
    outbound_email: 'Outbound Email',
    inbound_reply: 'Inbound Reply',
    email_event: 'Email Event',
    follow_up_sent: 'Follow-up Sent',
    follow_up_scheduled: 'Follow-up Scheduled',
    support_message: 'Support Message',
    call: 'Call Transcript',
  }

  return labels[type] || 'Activity'
}

function priorityBadgeClass(priority: string) {
  if (priority === 'high') return 'border border-red-200 bg-red-50 text-red-700'
  if (priority === 'low') return 'border border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border border-neutral-200 bg-white text-neutral-500'
}

function isHotQueueTask(task: CrmTask) {
  return ['hot_reply', 'booked_demo_follow_up', 'booked_meeting'].includes(task.type) || task.priority === 'high'
}

function formatStageLabel(stage: string) {
  return stage.replace(/_/g, ' ')
}

function lifecycleBadgeClass(stage: string) {
  if (stage === 'won') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (stage === 'lost') return 'border-neutral-200 bg-neutral-100 text-neutral-600'
  if (stage === 'proposal' || stage === 'verbal_commit' || stage === 'qualified') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (stage === 'meeting_booked' || stage === 'engaged') return 'border-violet-200 bg-violet-50 text-violet-700'
  if (stage === 'contacted') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-neutral-200 bg-white text-neutral-500'
}

function formatDateTimeInputValue(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function parseDateTimeInputValue(value: string) {
  if (!value.trim()) return null
  return new Date(value).toISOString()
}

const LOST_REASONS = [
  'No budget',
  'Bad timing',
  'Chose competitor',
  'No decision made',
  'Not a fit',
  'Went silent',
  'Other',
] as const

const STAGE_ORDER = ['new', 'engaged', 'meeting_booked', 'qualified', 'proposal', 'verbal_commit', 'won', 'lost'] as const
function stageIndex(stage: string) {
  const idx = STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number])
  return idx === -1 ? 0 : idx
}

// Returns a warning message if moving to `toStage` violates exit criteria, null if ok
function stageExitWarning(toStage: string, opportunity: CrmOpportunity): string | null {
  if (toStage === 'proposal' && !opportunity.amount_estimate) {
    return 'Add a deal amount before moving to Proposal — it\'s needed for forecasting.'
  }
  if (toStage === 'won' && !opportunity.closed_amount && !opportunity.amount_estimate) {
    return 'Add a closed amount before marking as Won.'
  }
  if (toStage === 'won' && !opportunity.qualified_summary) {
    return 'Add a qualification summary before marking as Won — useful for pattern analysis.'
  }
  return null
}

const opportunityStageOptions = [
  'new',
  'engaged',
  'meeting_booked',
  'qualified',
  'proposal',
  'verbal_commit',
  'won',
  'lost',
] as const

async function salesRequest<T>(token: string, path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SALES_API}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {
      // Keep HTTP fallback
    }
    throw new Error(message)
  }

  return res.json()
}

export default function SalesDashboard() {
  const { session, role, user } = useAuth()
  const [stats, setStats] = useState<PortalStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('outreach')
  const [guidedOpsExpanded, setGuidedOpsExpanded] = useState(true)
  const [overviewDays, setOverviewDays] = useState<OverviewDays>(0)
  const [prospectDays, setProspectDays] = useState<ProspectDays>(30)
  const [prospectStatus, setProspectStatus] = useState<ProspectStatus>('all')
  const [prospectScore, setProspectScore] = useState<ProspectScore>('all')
  const [chartLayers, setChartLayers] = useState<Record<LayerKey, boolean>>({
    sent: true,
    replied: true,
    booked: true,
    unsubscribed: false,
  })
  const [campaignDefinitions, setCampaignDefinitions] = useState<CampaignDefinition[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<CampaignConfig | null>(null)
  const [reassessingCampaign, setReassessingCampaign] = useState(false)
  const [reassessInput, setReassessInput] = useState('')
  const [campaignAssessment, setCampaignAssessment] = useState<CampaignAssessment | null>(null)
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false)
  const [newCampaignDraft, setNewCampaignDraft] = useState<CampaignConfig>({
    name: '',
    product_name: '',
    product_context: '',
    target_description: '',
    num_leads_per_run: 40,
  })
  const [savingCampaign, setSavingCampaign] = useState(false)
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [adminActionMessage, setAdminActionMessage] = useState<string | null>(null)
  const [adminActionError, setAdminActionError] = useState<string | null>(null)
  const [runningCampaign, setRunningCampaign] = useState(false)
  const [manualLeadOverride, setManualLeadOverride] = useState('')
  const [pendingRun, setPendingRun] = useState<{
    startedAt: number
    title: string
    requestedLeadCount: number | null
    campaignId: string | null
    completedAt: number | null
  } | null>(null)
  const [runTimerNow, setRunTimerNow] = useState(Date.now())
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [prospectHistory, setProspectHistory] = useState<ProspectHistory | null>(null)
  const [crmAccounts, setCrmAccounts] = useState<CrmAccountSummary[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<CrmAccountDetail | null>(null)
  const [crmTasks, setCrmTasks] = useState<CrmTask[]>([])
  const [crmOpportunities, setCrmOpportunities] = useState<CrmOpportunity[]>([])
  const [crmLoading, setCrmLoading] = useState(false)
  const [crmError, setCrmError] = useState<string | null>(null)
  const [savingOpportunityId, setSavingOpportunityId] = useState<string | null>(null)
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)
  const [pipelineView, setPipelineView] = useState<PipelineView>('board')
  const [pipelineStageFilter, setPipelineStageFilter] = useState<string>('all')
  const [pipelineOwnerFilter, setPipelineOwnerFilter] = useState<'all' | 'mine' | 'unassigned'>('all')
  const [taskDueBucket, setTaskDueBucket] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'no_date'>('all')
  const [reportingData, setReportingData] = useState<ReportingData | null>(null)
  const [deliverabilityData, setDeliverabilityData] = useState<DeliverabilityData | null>(null)
  const [lostReasonModal, setLostReasonModal] = useState<{ opportunityId: string; reason: string } | null>(null)
  const [stageExitModal, setStageExitModal] = useState<{ opportunityId: string; toStage: string; warning: string } | null>(null)
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [opportunityComments, setOpportunityComments] = useState<Record<string, CrmComment[]>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [postingComment, setPostingComment] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.access_token) return

    let cancelled = false
    setError(null)
    setStats(null)

    fetch(`${SALES_API}/portal/stats`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(
            err.message === 'HTTP 401'
              ? 'Your account is signed in, but it is not mapped to a live sales workspace yet.'
              : 'We could not load live sales data.',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!session?.access_token || role !== 'ivera_admin') {
      setCampaignDefinitions([])
      setSelectedCampaignId(null)
      setEditingCampaign(null)
      return
    }

    let cancelled = false
    setCampaignsLoading(true)

    salesRequest<{ campaigns: CampaignDefinition[] }>(session.access_token, '/campaigns')
      .then((data) => {
        if (cancelled) return
        setCampaignDefinitions(data.campaigns)
      })
      .catch((err: Error) => {
        if (!cancelled) setAdminActionError(err.message)
      })
      .finally(() => {
        if (!cancelled) setCampaignsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [role, session])

  useEffect(() => {
    if (!session?.access_token) {
      setCrmAccounts([])
      setSelectedAccountId(null)
      setSelectedAccountDetail(null)
      setCrmTasks([])
      setCrmOpportunities([])
      return
    }

    let cancelled = false
    setCrmLoading(true)
    setCrmError(null)

    salesRequest<{ accounts: CrmAccountSummary[] }>(session.access_token, '/accounts')
      .then((data) => {
        if (cancelled) return
        setCrmAccounts(data.accounts)
      })
      .catch((err: Error) => {
        if (!cancelled) setCrmError(err.message)
      })
      .finally(() => {
        if (!cancelled) setCrmLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!session?.access_token) return

    let cancelled = false

    salesRequest<{ opportunities: CrmOpportunity[] }>(session.access_token, '/opportunities')
      .then((data) => {
        if (!cancelled) setCrmOpportunities(data.opportunities)
      })
      .catch((err: Error) => {
        if (!cancelled) setCrmError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!session?.access_token) return

    let cancelled = false

    salesRequest<{ tasks: CrmTask[] }>(session.access_token, '/tasks?status=open')
      .then((data) => {
        if (!cancelled) setCrmTasks(data.tasks)
      })
      .catch((err: Error) => {
        if (!cancelled) setCrmError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!crmAccounts.length) {
      setSelectedAccountId(null)
      setSelectedAccountDetail(null)
      return
    }

    setSelectedAccountId((current) => (
      current && crmAccounts.some((account) => account.id === current)
        ? current
        : null
    ))
  }, [crmAccounts])

  useEffect(() => {
    if (!session?.access_token || !selectedAccountId) {
      setSelectedAccountDetail(null)
      return
    }

    let cancelled = false

    salesRequest<CrmAccountDetail>(session.access_token, `/accounts/${selectedAccountId}`)
      .then((data) => {
        if (!cancelled) setSelectedAccountDetail(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setCrmError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [selectedAccountId, session])

  const totals = stats?.totals ?? { emailed: 0, replied: 0, booked: 0, unsubscribed: 0, weekEmailed: 0 }
  const crm = stats?.crm ?? {
    accounts: 0,
    opportunities: 0,
    open_opportunities: 0,
    engaged_opportunities: 0,
    meetings_booked: 0,
    total_pipeline: 0,
    total_won: 0,
    won_opps: 0,
    lost_opps: 0,
    win_rate: null,
    avg_deal_size: null,
  }
  const recentLeads = stats?.recentLeads ?? []
  const leadActivitySeries = stats?.leadActivity ?? []
  const followUpPerformance = stats?.followUpPerformance ?? []
  const campaignSourcePerformance = stats?.campaignSourcePerformance ?? []
  const campaigns = stats?.campaigns ?? []
  const totalCampaignRuns = stats?.totalCampaignRuns ?? campaigns.length
  const campaignAnalyticsByDefinition = useMemo(() => {
    const entries = campaignDefinitions
      .map((definition) => {
        const analytics = buildCampaignAnalytics(definition, campaigns, campaignSourcePerformance)
        return analytics ? [definition.id, analytics] : null
      })
      .filter((entry): entry is [string, CampaignAnalytics] => Boolean(entry))

    return new Map(entries)
  }, [campaignDefinitions, campaignSourcePerformance, campaigns])
  const selectedCampaignDefinition = useMemo(
    () => campaignDefinitions.find((campaign) => campaign.id === selectedCampaignId) ?? null,
    [campaignDefinitions, selectedCampaignId],
  )
  const selectedCampaignAnalytics = useMemo(
    () => (selectedCampaignId ? campaignAnalyticsByDefinition.get(selectedCampaignId) ?? null : null),
    [campaignAnalyticsByDefinition, selectedCampaignId],
  )

  useEffect(() => {
    if (!campaignDefinitions.length) {
      setSelectedCampaignId(null)
      setEditingCampaign(null)
      setCampaignAssessment(null)
      setReassessInput('')
      return
    }

    const preferred = campaignDefinitions.find((campaign) => campaign.is_default) ?? campaignDefinitions[0]

    setSelectedCampaignId((current) => {
      if (current && campaignDefinitions.some((campaign) => campaign.id === current)) {
        return current
      }
      return preferred.id
    })
  }, [campaignDefinitions])

  useEffect(() => {
    if (!selectedCampaignDefinition) {
      setEditingCampaign(null)
      setCampaignAssessment(null)
      return
    }

    setEditingCampaign({
      id: selectedCampaignDefinition.id,
      name: selectedCampaignDefinition.name,
      product_name: selectedCampaignDefinition.product_name,
      product_context: selectedCampaignDefinition.product_context,
      target_description: selectedCampaignDefinition.target_description,
      num_leads_per_run: selectedCampaignDefinition.num_leads_per_run,
      sender_name: selectedCampaignDefinition.sender_name ?? null,
      sender_email: selectedCampaignDefinition.sender_email ?? null,
      reply_to_email: selectedCampaignDefinition.reply_to_email ?? null,
      cal_booking_url: selectedCampaignDefinition.cal_booking_url ?? null,
    })
    setCampaignAssessment(null)
  }, [selectedCampaignDefinition])

  const overviewLeads = useMemo(
    () => recentLeads.filter((lead) => leadWithinDays(lead.created_at, overviewDays)),
    [recentLeads, overviewDays],
  )

  const overviewWindowLabel = overviewDays === 0 ? 'All time' : `Last ${overviewDays} days`

  const filteredProspects = useMemo(() => {
    return recentLeads.filter((lead) => {
      if (!leadWithinDays(lead.created_at, prospectDays)) return false
      if (prospectStatus !== 'all' && leadStatusBucket(lead.status) !== prospectStatus) return false
      if (prospectScore === 'scored' && typeof lead.qualify_score !== 'number') return false
      if (prospectScore === 'high' && (lead.qualify_score ?? 0) < 7) return false
      return true
    })
  }, [recentLeads, prospectDays, prospectScore, prospectStatus])

  const overviewSummary = useMemo(() => {
    const activityTotals = leadActivitySeries.length > 0
      ? summarizeLeadActivitySeries(leadActivitySeries, overviewDays)
      : null

    const sent = activityTotals
      ? activityTotals.sent
      : overviewLeads.filter((lead) => leadStatusBucket(lead.status) === 'sent').length
    const replied = activityTotals
      ? activityTotals.replied
      : overviewLeads.filter((lead) => leadStatusBucket(lead.status) === 'replied').length
    const booked = activityTotals
      ? activityTotals.booked
      : overviewLeads.filter((lead) => leadStatusBucket(lead.status) === 'booked').length
    const unsubscribed = activityTotals
      ? activityTotals.unsubscribed
      : overviewLeads.filter((lead) => leadStatusBucket(lead.status) === 'unsubscribed').length

    return {
      sent,
      replied,
      booked,
      unsubscribed,
      scored: overviewLeads.filter((lead) => typeof lead.qualify_score === 'number').length,
      pipeline: overviewLeads.length,
      avgScore: averageLeadScore(overviewLeads),
      highIntent: highIntentCount(overviewLeads),
      recentReplies: recentReplyCount(overviewLeads),
    }
  }, [leadActivitySeries, overviewDays, overviewLeads])

  const leadActivity = useMemo(
    () => (
      leadActivitySeries.length > 0
        ? buildLeadActivityFromSeries(leadActivitySeries, overviewDays)
        : buildLeadActivity(overviewLeads, overviewDays)
    ),
    [leadActivitySeries, overviewLeads, overviewDays],
  )

  const parsedManualOverride = Number(manualLeadOverride)
  const hasManualOverride = manualLeadOverride.trim().length > 0 && Number.isFinite(parsedManualOverride)

  const matchingPendingCampaign = useMemo(() => {
    if (!pendingRun) return null
    if (pendingRun.campaignId) {
      return campaigns.find((campaign) => campaign.id === pendingRun.campaignId) ?? null
    }
    return (
      campaigns.find(
        (campaign) => new Date(campaign.created_at).getTime() >= pendingRun.startedAt - 60_000,
      ) ?? null
    )
  }, [campaigns, pendingRun])
  const pendingRunProgress = useMemo(
    () => (pendingRun ? buildLiveRunProgress(matchingPendingCampaign, pendingRun.startedAt, pendingRun.requestedLeadCount, runTimerNow) : null),
    [matchingPendingCampaign, pendingRun, runTimerNow],
  )
  const activeCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.status === 'active') ?? null,
    [campaigns],
  )
  const activeCampaignProgress = useMemo(
    () => (
      activeCampaign
        ? buildLiveRunProgress(
          activeCampaign,
          new Date(activeCampaign.created_at).getTime(),
          activeCampaign.funnel_diagnostics?.requested_leads ?? null,
          runTimerNow,
        )
        : null
    ),
    [activeCampaign, runTimerNow],
  )
  const liveCampaign = matchingPendingCampaign ?? activeCampaign
  const liveCampaignProgress = pendingRunProgress ?? activeCampaignProgress
  const hasActiveCampaign = campaigns.some((campaign) => campaign.status === 'active')
  const runStartDisabled = runningCampaign || savingCampaign || hasActiveCampaign
  const latestCampaignRuns = useMemo(
    () => {
      const rows = campaigns.slice(0, 8).map((campaign) => ({
        id: campaign.id,
        title: formatCampaignRunTitle(campaign),
        meta: `${formatRunDate(campaign.created_at)} · ${campaign.product_name}`,
        badge: `${campaign.total_leads || 0} leads`,
        detail: buildFunnelSummary(campaign.funnel_diagnostics) || undefined,
        metrics: [
          { label: 'Qualified', value: campaign.qualified_leads || 0 },
          { label: 'Emailed', value: campaign.emailed || 0 },
          { label: 'Replies', value: campaign.replied || 0 },
          { label: 'Booked', value: campaign.booked || 0 },
          { label: 'Unsub', value: campaign.unsubscribed || 0 },
          { label: 'Bounce', value: campaign.bounced || 0 },
          {
            label: 'Avg Score',
            value: typeof campaign.avg_score === 'number' ? `${campaign.avg_score.toFixed(1)}/10` : '—',
          },
        ],
      }))

      if (!liveCampaign || !liveCampaignProgress) return rows

      return [
        {
          id: `live-${liveCampaign.id}`,
          title: pendingRun?.title || liveCampaign.product_name || 'Campaign run',
          meta: liveCampaignProgress.summary,
          badge: liveCampaignProgress.badge,
          detail: buildFunnelSummary(liveCampaign.funnel_diagnostics) || undefined,
          metrics: liveCampaignProgress.metrics,
          interactive: false,
        },
        ...rows,
      ]
    },
    [campaigns, liveCampaign, liveCampaignProgress, pendingRun],
  )

  const selectedRun = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedRunId) ?? null,
    [campaigns, selectedRunId],
  )
  const latestRunDiagnostics = campaigns[0]?.funnel_diagnostics
  const latestRunInsights = useMemo(
    () => buildRunInsights(latestRunDiagnostics),
    [latestRunDiagnostics],
  )
  const latestRunActions = useMemo(
    () => buildRecommendedActions(latestRunDiagnostics),
    [latestRunDiagnostics],
  )
  const selectedRunInsights = useMemo(
    () => buildRunInsights(selectedRun?.funnel_diagnostics),
    [selectedRun],
  )
  const selectedRunActions = useMemo(
    () => buildRecommendedActions(selectedRun?.funnel_diagnostics),
    [selectedRun],
  )
  const selectedCampaignRunInsights = useMemo(
    () => buildRunInsights(selectedCampaignAnalytics?.latestRun?.funnel_diagnostics),
    [selectedCampaignAnalytics],
  )
  const selectedCampaignRunActions = useMemo(
    () => buildRecommendedActions(selectedCampaignAnalytics?.latestRun?.funnel_diagnostics),
    [selectedCampaignAnalytics],
  )
  const selectedCampaignRuns = useMemo(() => {
    if (!selectedCampaignDefinition) return latestCampaignRuns

    const rows = campaigns
      .filter((campaign) => campaign.campaign_definition_id === selectedCampaignDefinition.id)
      .slice(0, 8)
      .map((campaign) => ({
        id: campaign.id,
        title: formatCampaignRunTitle(campaign),
        meta: `${formatRunDate(campaign.created_at)} · ${campaign.product_name}`,
        badge: `${campaign.total_leads || 0} leads`,
        detail: buildFunnelSummary(campaign.funnel_diagnostics) || undefined,
        metrics: [
          { label: 'Qualified', value: campaign.qualified_leads || 0 },
          { label: 'Emailed', value: campaign.emailed || 0 },
          { label: 'Replies', value: campaign.replied || 0 },
          { label: 'Booked', value: campaign.booked || 0 },
          { label: 'Unsub', value: campaign.unsubscribed || 0 },
          { label: 'Bounce', value: campaign.bounced || 0 },
          {
            label: 'Avg Score',
            value: typeof campaign.avg_score === 'number' ? `${campaign.avg_score.toFixed(1)}/10` : '—',
          },
        ],
      }))

    if (liveCampaign && liveCampaignProgress && liveCampaign.campaign_definition_id === selectedCampaignDefinition.id) {
      return [
        {
          id: `live-${liveCampaign.id}`,
          title: pendingRun?.title || formatCampaignRunTitle(liveCampaign),
          meta: liveCampaignProgress.summary,
          badge: liveCampaignProgress.badge,
          detail: buildFunnelSummary(liveCampaign.funnel_diagnostics) || undefined,
          metrics: liveCampaignProgress.metrics,
          interactive: false,
        },
        ...rows,
      ]
    }

    return rows
  }, [campaigns, latestCampaignRuns, liveCampaign, liveCampaignProgress, pendingRun, selectedCampaignDefinition])

  const engagedProspects = useMemo(
    () =>
      overviewLeads
        .filter((lead) => ['replied', 'booked', 'unsubscribed'].includes(lead.status))
        .slice(0, 6)
        .map((lead) => ({
          id: lead.id,
          title: lead.company || lead.email || 'Prospect',
          meta: `${lead.email || 'No email'} · ${timeAgo(lead.created_at)}`,
          badge: lead.status,
        })),
    [overviewLeads],
  )

  const highIntentProspects = useMemo(
    () =>
      recentLeads
        .filter((lead) => (lead.qualify_score ?? 0) >= 7)
        .sort((a, b) => (b.qualify_score ?? 0) - (a.qualify_score ?? 0))
        .slice(0, 6)
        .map((lead) => ({
          id: lead.id,
          title: lead.company || lead.email || 'Prospect',
          meta: `${lead.email || 'No email'} · ${timeAgo(lead.created_at)}`,
          badge: `${lead.qualify_score}/10`,
        })),
    [recentLeads],
  )

  const nextScheduledRun = useMemo(() => getNextScheduledCampaignRun(), [])

  useEffect(() => {
    if (!liveCampaignProgress || !session?.access_token) return

    const tickTimer = window.setInterval(() => {
      setRunTimerNow(Date.now())
    }, 1000)

    const pollTimer = window.setInterval(() => {
      void refreshStats()
      void refreshCampaignDefinitions()
      void refreshCrmAccounts()
      void refreshCrmTasks()
      void refreshCrmOpportunities()
      void refreshSelectedAccountDetail()
    }, 10000)

    return () => {
      window.clearInterval(tickTimer)
      window.clearInterval(pollTimer)
    }
  }, [liveCampaignProgress, session?.access_token])

  useEffect(() => {
    if (!session?.access_token) return

    function handleResume() {
      setRunTimerNow(Date.now())
      void refreshStats()
      void refreshCampaignDefinitions()
      void refreshCrmAccounts()
      void refreshCrmTasks()
      void refreshCrmOpportunities()
      void refreshSelectedAccountDetail()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        handleResume()
      }
    }

    window.addEventListener('focus', handleResume)
    window.addEventListener('online', handleResume)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleResume)
      window.removeEventListener('online', handleResume)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (!pendingRun) return

    if (matchingPendingCampaign && pendingRun.campaignId !== matchingPendingCampaign.id) {
      setPendingRun((current) => (
        current ? { ...current, campaignId: matchingPendingCampaign.id } : current
      ))
      return
    }

    if (matchingPendingCampaign?.status === 'complete') {
      if (!pendingRun.completedAt) {
        setPendingRun((current) => (
          current ? { ...current, completedAt: Date.now() } : current
        ))
        return
      }

      if (Date.now() - pendingRun.completedAt > 120_000) {
        setPendingRun(null)
      }
      return
    }

    const hasTimedOut = Date.now() - pendingRun.startedAt > 20 * 60_000
    if (hasTimedOut) {
      setPendingRun(null)
    }
  }, [matchingPendingCampaign, pendingRun])

  const outreachMetrics = [
    { label: 'Sent In Window', value: overviewSummary.sent, hint: overviewWindowLabel },
    { label: 'Sent This Week', value: totals.weekEmailed, hint: 'Rolling 7 days' },
    { label: 'Campaign Runs', value: totalCampaignRuns, hint: 'Recorded runs' },
    { label: 'Latest Run', value: latestRunLabel(campaigns), hint: 'Most recent activity' },
    { label: 'Next Run', value: formatScheduledRun(nextScheduledRun), hint: 'Tue–Thu at 17:00 UTC' },
  ]
  const engagementMetrics = [
    { label: 'Replies', value: overviewSummary.replied, hint: overviewWindowLabel },
    { label: 'Reply Rate', value: replyRate(overviewSummary.replied, overviewSummary.sent), hint: 'Replies divided by sent' },
    { label: 'Unsubscribed', value: overviewSummary.unsubscribed, hint: overviewWindowLabel },
    { label: 'Unsub Rate', value: unsubscribeRate(overviewSummary.unsubscribed, overviewSummary.sent), hint: 'Opt-outs divided by sent' },
  ]
  const pipelineMetrics = [
    { label: 'Meetings Booked', value: crm.meetings_booked || overviewSummary.booked, hint: 'All tracked opportunities' },
    { label: 'Booked Rate', value: bookingRate(overviewSummary.booked, overviewSummary.sent), hint: 'Booked divided by sent' },
    { label: 'Accounts', value: crm.accounts, hint: 'Tracked accounts in CRM' },
    { label: 'Open Opps', value: crm.open_opportunities, hint: 'Active opportunities' },
    { label: 'Engaged Opps', value: crm.engaged_opportunities, hint: 'Engaged through proposal stages' },
  ]
  const qualityMetrics = [
    { label: 'Avg Lead Score', value: overviewSummary.avgScore, hint: 'Across scored leads in window' },
    { label: 'High-Intent', value: overviewSummary.highIntent, hint: 'Score 7/10 or higher' },
    { label: 'Scored Leads', value: overviewSummary.scored, hint: 'Leads with a quality score' },
    { label: 'Booked', value: overviewSummary.booked, hint: 'Booked prospects in window' },
  ]
  const selectedAccount = selectedAccountDetail?.account ?? null
  const accountNameById = useMemo(
    () => new Map(crmAccounts.map((account) => [account.id, account.name])),
    [crmAccounts],
  )
  const duplicateGroupByAccountId = useMemo(() => {
    const map = new Map<string, DuplicateGroup>()
    for (const group of duplicateGroups) {
      for (const acc of group.accounts) map.set(acc.id, group)
    }
    return map
  }, [duplicateGroups])
  const openTasks = crmTasks
    .filter((task) => task.status === 'open')
    .sort((a, b) => {
      const aTime = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
  const hotQueueTasks = openTasks.filter(isHotQueueTask)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart.getTime() + 86400000)

  const overdueTasks = openTasks.filter((t) => t.due_at && new Date(t.due_at) < todayStart)
  const todayTasks = openTasks.filter((t) => t.due_at && new Date(t.due_at) >= todayStart && new Date(t.due_at) < tomorrowStart)
  const upcomingTasks = openTasks.filter((t) => t.due_at && new Date(t.due_at) >= tomorrowStart)
  const noDueTasks = openTasks.filter((t) => !t.due_at)
  const myOpenTasks = user?.id ? openTasks.filter((task) => task.owner_user_id === user.id) : []
  const unassignedOpenTasks = openTasks.filter((task) => !task.owner_user_id)

  // Handoff queue: AI-active (no owner) open opportunities that need a human
  // Criteria: unowned + (high priority OR hot stage OR overdue next step)
  const HOT_STAGES = new Set(['meeting_booked', 'qualified', 'proposal', 'verbal_commit'])
  const handoffOpportunities = crmOpportunities.filter((opp) => {
    if (opp.owner_user_id) return false // already claimed
    if (['won', 'lost'].includes(opp.stage)) return false
    const isHotStage = HOT_STAGES.has(opp.stage)
    const isHighPriority = opp.priority === 'high'
    const isOverdue = opp.next_step_due_at && new Date(opp.next_step_due_at) < todayStart
    return isHotStage || isHighPriority || isOverdue
  }).sort((a, b) => stageIndex(b.stage) - stageIndex(a.stage))
  const pipelineStages = opportunityStageOptions
  const filteredPipelineOpportunities = crmOpportunities.filter((opportunity) => {
    if (pipelineStageFilter !== 'all' && opportunity.stage !== pipelineStageFilter) return false
    if (selectedAccountId && pipelineView === 'workspace' && opportunity.account_id !== selectedAccountId) return false
    if (pipelineOwnerFilter === 'mine' && opportunity.owner_user_id !== user?.id) return false
    if (pipelineOwnerFilter === 'unassigned' && opportunity.owner_user_id != null) return false
    return true
  })
  const pipelineBoard = pipelineStages.map((stage) => ({
    stage,
    opportunities: filteredPipelineOpportunities.filter((opportunity) => opportunity.stage === stage),
  }))
  const crmAccountRows = crmAccounts.map((account) => ({
    id: account.id,
    title: account.name,
    meta: [account.domain, account.geo, account.segment].filter(Boolean).join(' · ') || 'Tracked account',
    badge: formatStageLabel(account.lifecycle_stage),
    badgeClassName: lifecycleBadgeClass(account.lifecycle_stage),
    detail: account.updated_at
      ? `Status: ${formatStageLabel(account.lifecycle_stage)} · Updated ${timeAgo(account.updated_at)}`
      : `Status: ${formatStageLabel(account.lifecycle_stage)}`,
    interactive: true,
  }))

  const layerOptions: Array<{ key: LayerKey; label: string }> = [
    { key: 'sent', label: 'Sent' },
    { key: 'replied', label: 'Replies' },
    { key: 'booked', label: 'Booked' },
    { key: 'unsubscribed', label: 'Unsubscribed' },
  ]

  async function refreshStats() {
    if (!session?.access_token) return
    const data = await salesRequest<PortalStats>(session.access_token, '/portal/stats')
    setStats(data)
  }

  async function refreshCampaignDefinitions() {
    if (!session?.access_token || role !== 'ivera_admin') return
    const data = await salesRequest<{ campaigns: CampaignDefinition[] }>(session.access_token, '/campaigns')
    setCampaignDefinitions(data.campaigns)
  }

  async function refreshCrmAccounts() {
    if (!session?.access_token) return
    const [accountsData, dupeData] = await Promise.all([
      salesRequest<{ accounts: CrmAccountSummary[] }>(session.access_token, '/accounts'),
      salesRequest<{ duplicate_groups: DuplicateGroup[] }>(session.access_token, '/accounts/duplicates').catch(() => ({ duplicate_groups: [] })),
    ])
    setCrmAccounts(accountsData.accounts)
    setDuplicateGroups(dupeData.duplicate_groups)
  }

  async function refreshSelectedAccountDetail(accountId = selectedAccountId) {
    if (!session?.access_token || !accountId) return
    const data = await salesRequest<CrmAccountDetail>(session.access_token, `/accounts/${accountId}`)
    setSelectedAccountDetail(data)
  }

  async function refreshCrmTasks() {
    if (!session?.access_token) return
    const data = await salesRequest<{ tasks: CrmTask[] }>(session.access_token, '/tasks?status=open')
    setCrmTasks(data.tasks)
  }

  async function refreshCrmOpportunities() {
    if (!session?.access_token) return
    const data = await salesRequest<{ opportunities: CrmOpportunity[] }>(session.access_token, '/opportunities')
    setCrmOpportunities(data.opportunities)
  }

  async function refreshReportingData() {
    if (!session?.access_token) return
    const data = await salesRequest<ReportingData>(session.access_token, '/opportunities/reporting')
    setReportingData(data)
  }

  async function refreshDeliverabilityData() {
    if (!session?.access_token) return
    const data = await salesRequest<DeliverabilityData>(session.access_token, '/deliverability')
    setDeliverabilityData(data)
  }

  async function loadComments(opportunityId: string) {
    if (!session?.access_token) return
    const data = await salesRequest<{ comments: CrmComment[] }>(session.access_token, `/opportunities/${opportunityId}/comments`)
    setOpportunityComments((prev) => ({ ...prev, [opportunityId]: data.comments }))
  }

  async function postComment(opportunityId: string) {
    if (!session?.access_token) return
    const body = (commentDrafts[opportunityId] || '').trim()
    if (!body) return
    setPostingComment(opportunityId)
    try {
      await salesRequest<{ ok: boolean }>(session.access_token, `/opportunities/${opportunityId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body, author_user_id: user?.id ?? null }),
      })
      setCommentDrafts((prev) => ({ ...prev, [opportunityId]: '' }))
      await loadComments(opportunityId)
    } finally {
      setPostingComment(null)
    }
  }

  async function handleRunCampaign(definitionId: string) {
    if (!session?.access_token) return
    setRunningCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const requestedLeadCount = hasManualOverride ? Math.round(parsedManualOverride) : undefined
      const startedAt = Date.now()
      const data = await salesRequest<{ message: string }>(session.access_token, `/campaigns/${definitionId}/start`, {
        method: 'POST',
        body: JSON.stringify(requestedLeadCount ? { num_leads: requestedLeadCount } : {}),
      })
      setPendingRun({
        startedAt,
        title: selectedCampaignDefinition?.product_name || 'Campaign run',
        requestedLeadCount: requestedLeadCount ?? null,
        campaignId: null,
        completedAt: null,
      })
      setRunTimerNow(startedAt)
      setAdminActionMessage(
        requestedLeadCount
          ? `${data.message || 'Campaign started.'} Manual override: ${requestedLeadCount} leads.`
          : (data.message || 'Campaign started.'),
      )
      await Promise.all([refreshStats(), refreshCampaignDefinitions()])
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to start campaign.')
    } finally {
      setRunningCampaign(false)
    }
  }

  async function saveCampaignDefinition() {
    if (!session?.access_token || !editingCampaign?.id) return
    setSavingCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const data = await salesRequest<{ campaign: CampaignDefinition; message: string }>(
        session.access_token,
        `/campaigns/${editingCampaign.id}`,
        {
        method: 'PATCH',
          body: JSON.stringify({
            name: editingCampaign.name,
            product_name: editingCampaign.product_name,
            product_context: editingCampaign.product_context,
            target_description: editingCampaign.target_description,
            num_leads_per_run: editingCampaign.num_leads_per_run,
            sender_name: editingCampaign.sender_name ?? null,
            sender_email: editingCampaign.sender_email ?? null,
            reply_to_email: editingCampaign.reply_to_email ?? null,
            cal_booking_url: editingCampaign.cal_booking_url ?? null,
          }),
        },
      )
      setSelectedCampaignId(data.campaign.id)
      setAdminActionMessage(data.message || 'Campaign saved.')
      await Promise.all([refreshStats(), refreshCampaignDefinitions()])
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to save campaign.')
    } finally {
      setSavingCampaign(false)
    }
  }

  async function handleReassessCampaign() {
    if (!session?.access_token || !editingCampaign) return
    setReassessingCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const data = await salesRequest<{ assessment: CampaignAssessment }>(session.access_token, '/campaign/reassess', {
        method: 'POST',
        body: JSON.stringify({
          admin_input: reassessInput.trim() || undefined,
        }),
      })
      setCampaignAssessment(data.assessment)
      setAdminActionMessage('Campaign reassessment is ready to review.')
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to reassess campaign.')
    } finally {
      setReassessingCampaign(false)
    }
  }

  function applyCampaignAssessment() {
    if (!campaignAssessment) return
    setEditingCampaign((current) => {
      if (!current) return current
      return {
        ...current,
        product_name: campaignAssessment.suggestedConfig.product_name,
        product_context: campaignAssessment.suggestedConfig.product_context,
        target_description: campaignAssessment.suggestedConfig.target_description,
        num_leads_per_run: campaignAssessment.suggestedConfig.num_leads_per_run,
      }
    })
    setAdminActionMessage('Applied reassessment suggestions to the campaign draft. Save when you are ready.')
    setAdminActionError(null)
  }

  async function setDefaultCampaign(definitionId: string) {
    if (!session?.access_token) return
    setSavingCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const data = await salesRequest<{ campaign: CampaignDefinition; message: string }>(
        session.access_token,
        `/campaigns/${definitionId}/default`,
        { method: 'POST' },
      )
      setSelectedCampaignId(data.campaign.id)
      setAdminActionMessage(data.message || 'Default campaign updated.')
      await Promise.all([refreshStats(), refreshCampaignDefinitions()])
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to update default campaign.')
    } finally {
      setSavingCampaign(false)
    }
  }

  async function createCampaignDefinition() {
    if (!session?.access_token) return
    setSavingCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const data = await salesRequest<{ campaign: CampaignDefinition; message: string }>(session.access_token, '/campaigns', {
        method: 'POST',
        body: JSON.stringify(newCampaignDraft),
      })
      setShowNewCampaignForm(false)
      setNewCampaignDraft({
        name: '',
        product_name: editingCampaign?.product_name || '',
        product_context: editingCampaign?.product_context || '',
        target_description: editingCampaign?.target_description || '',
        num_leads_per_run: editingCampaign?.num_leads_per_run || 40,
      })
      setSelectedCampaignId(data.campaign.id)
      setAdminActionMessage(data.message || 'Campaign created.')
      await refreshCampaignDefinitions()
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Failed to create campaign.')
    } finally {
      setSavingCampaign(false)
    }
  }

  async function handleCampaignAction(definitionId: string, action: 'pause' | 'restart' | 'archive') {
    if (!session?.access_token) return
    const actionLabel = action === 'pause' ? 'pause' : action === 'restart' ? 'restart' : 'archive'
    const confirmationMessage = action === 'archive'
      ? 'Archive this campaign? It will be hidden from active use until you restore it later in code.'
      : action === 'restart'
        ? 'Restart this campaign now? This starts a fresh run using the saved campaign settings.'
        : 'Pause this campaign? Any active run linked to it will be stopped.'

    if (typeof window !== 'undefined' && !window.confirm(confirmationMessage)) {
      return
    }

    setSavingCampaign(true)
    setAdminActionError(null)
    setAdminActionMessage(null)

    try {
      const data = await salesRequest<{ message: string }>(session.access_token, `/campaigns/${definitionId}/${action}`, {
        method: 'POST',
      })
      setAdminActionMessage(data.message || `Campaign ${actionLabel}d.`)
      await Promise.all([refreshStats(), refreshCampaignDefinitions()])
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : `Failed to ${actionLabel} campaign.`)
    } finally {
      setSavingCampaign(false)
    }
  }

  async function updateOpportunity(
    opportunityId: string,
    updates: Partial<Pick<CrmOpportunity, 'stage' | 'next_step' | 'next_step_due_at' | 'priority' | 'owner_user_id' | 'qualified_summary' | 'pain_summary' | 'lost_reason' | 'amount_estimate' | 'won_at' | 'lost_at' | 'proposal_sent_at' | 'proposal_status' | 'closed_amount'>>,
  ) {
    if (!session?.access_token) return

    setSavingOpportunityId(opportunityId)
    setCrmError(null)

    try {
      await salesRequest<{ opportunity: CrmOpportunity }>(session.access_token, `/opportunities/${opportunityId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      await Promise.all([refreshStats(), refreshCrmAccounts(), refreshCrmOpportunities(), refreshSelectedAccountDetail()])
    } catch (err) {
      setCrmError(err instanceof Error ? err.message : 'Failed to update opportunity.')
    } finally {
      setSavingOpportunityId(null)
    }
  }

  async function updateTask(taskId: string, updates: { status?: string; due_at?: string | null }) {
    if (!session?.access_token) return

    setSavingTaskId(taskId)
    setCrmError(null)

    try {
      await salesRequest<{ task: CrmTask }>(session.access_token, `/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      await Promise.all([refreshCrmTasks(), refreshCrmAccounts(), refreshCrmOpportunities(), refreshSelectedAccountDetail()])
    } catch (err) {
      setCrmError(err instanceof Error ? err.message : 'Failed to update task.')
    } finally {
      setSavingTaskId(null)
    }
  }

  async function assignTask(taskId: string, ownerUserId: string | null) {
    if (!session?.access_token) return

    setSavingTaskId(taskId)
    setCrmError(null)

    try {
      await salesRequest<{ task: CrmTask }>(session.access_token, `/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ owner_user_id: ownerUserId }),
      })
      await refreshCrmTasks()
    } catch (err) {
      setCrmError(err instanceof Error ? err.message : 'Failed to assign task.')
    } finally {
      setSavingTaskId(null)
    }
  }

  async function openProspectHistory(leadId: string) {
    if (!session?.access_token) return
    setSelectedLeadId(leadId)
    setHistoryLoading(true)
    setHistoryError(null)
    setProspectHistory(null)

    try {
      const data = await salesRequest<ProspectHistory>(session.access_token, `/leads/${leadId}/history`)
      setProspectHistory(data)
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load prospect history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  function closeProspectHistory() {
    setSelectedLeadId(null)
    setHistoryError(null)
    setProspectHistory(null)
  }

  const guidedOpsCards = [
    liveCampaign && liveCampaignProgress
      ? {
          id: 'live-run',
          tone: liveCampaignProgress.isComplete ? 'emerald' : 'neutral',
          label: liveCampaignProgress.isComplete ? 'Status' : 'Status',
          priority: 2,
          title: pendingRun?.title || formatCampaignRunTitle(liveCampaign),
          detail: liveCampaignProgress.summary,
          actionLabel: 'Open Outreach',
          onClick: () => {
            setActiveTab('outreach')
          },
        }
      : (role === 'ivera_admin' && selectedCampaignDefinition && !hasActiveCampaign
        ? {
            id: 'next-run',
            tone: 'blue' as const,
            label: 'Next Step',
            priority: 3,
            title: `Start ${selectedCampaignDefinition.name}`,
            detail: `${selectedCampaignDefinition.num_leads_per_run} leads/run ready from the selected campaign.`,
            actionLabel: 'Open Campaign Setup',
            onClick: () => {
              setSelectedCampaignId(selectedCampaignDefinition.id)
              setActiveTab('editCampaign')
            },
          }
        : null),
    hotQueueTasks.length
      ? {
          id: 'hot-queue',
          tone: 'amber' as const,
          label: 'Issue',
          priority: 1,
          title: `${hotQueueTasks.length} hot ${hotQueueTasks.length === 1 ? 'reply' : 'replies'} waiting`,
          detail: 'High-priority replies and booked meetings are sitting in the inbox.',
          actionLabel: 'Open Pipeline',
          onClick: () => {
            setActiveTab('pipeline')
          },
        }
      : null,
    overdueTasks.length
      ? {
          id: 'overdue',
          tone: 'amber' as const,
          label: 'Issue',
          priority: 1,
          title: `${overdueTasks.length} overdue ${overdueTasks.length === 1 ? 'task' : 'tasks'}`,
          detail: 'Some next steps are slipping past their due dates.',
          actionLabel: 'Resolve Tasks',
          onClick: () => {
            setActiveTab('pipeline')
          },
        }
      : null,
    handoffOpportunities.length
      ? {
          id: 'handoff',
          tone: 'violet' as const,
          label: 'Issue',
          priority: 1,
          title: `${handoffOpportunities.length} unowned ${handoffOpportunities.length === 1 ? 'opportunity' : 'opportunities'}`,
          detail: 'Engaged or high-priority deals need a human owner.',
          actionLabel: 'Claim Deals',
          onClick: () => {
            setActiveTab('pipeline')
          },
        }
      : null,
    selectedCampaignAnalytics && selectedCampaignAnalytics.healthScore < 65
      ? {
          id: 'campaign-health',
          tone: 'blue' as const,
          label: 'Improve',
          priority: 2,
          title: `${selectedCampaignDefinition?.name || 'Selected campaign'} health is ${selectedCampaignAnalytics.healthScore}/100`,
          detail: latestRunActions[0] || 'Tighten targeting, source mix, or messaging before the next run.',
          actionLabel: 'Edit Campaign',
          onClick: () => {
            setActiveTab('editCampaign')
          },
        }
      : null,
  ].filter((card): card is {
    id: string
    tone: 'neutral' | 'blue' | 'amber' | 'emerald' | 'violet'
    label: string
    priority: number
    title: string
    detail: string
    actionLabel: string
    onClick: () => void
  } => Boolean(card)).sort((a, b) => a.priority - b.priority) as Array<{
    id: string
    tone: 'neutral' | 'blue' | 'amber' | 'emerald' | 'violet'
    label: string
    priority: number
    title: string
    detail: string
    actionLabel: string
    onClick: () => void
  }>

  if (!stats && !error) {
    return (
      <div className="mx-auto flex max-w-7xl justify-center p-8 pt-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <PageHeader
          title="Sales Agent"
          subtitle="Outbound campaign performance and prospect pipeline"
        />
        <div className="rounded-xl border border-red-200/60 bg-white/70 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <PageHeader
        title="Sales Agent"
        subtitle="Outbound campaign performance and prospect pipeline"
      />

      {guidedOpsCards.length ? (
        <div className="mb-5 rounded-xl border border-neutral-200/60 bg-white/70">
          <button
            type="button"
            onClick={() => setGuidedOpsExpanded((current) => !current)}
            className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
          >
            <div className="min-w-0">
              <p className="text-[11px] tracking-widest uppercase text-neutral-400">Guided Ops</p>
              <p className="mt-1 text-sm text-neutral-700">Priority suggestions, ordered from issues to nice next moves.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                {guidedOpsCards.length} items
              </span>
              {guidedOpsExpanded ? <ChevronDown size={16} className="text-neutral-500" /> : <ChevronRight size={16} className="text-neutral-500" />}
            </div>
          </button>

          {guidedOpsExpanded ? (
            <div className="border-t border-neutral-200/70 px-4 py-3">
              <div className="space-y-2">
                {guidedOpsCards.map((card) => (
                  <div key={card.id} className="flex flex-col gap-3 rounded-lg border border-neutral-100 bg-white/80 px-3 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${
                          card.priority === 1
                            ? 'bg-amber-500'
                            : card.priority === 2
                              ? 'bg-blue-500'
                              : 'bg-neutral-400'
                        }`}
                        />
                        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">{card.label}</p>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{card.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-600">{card.detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={card.onClick}
                      className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700 transition hover:border-neutral-300"
                    >
                      {card.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('outreach')}
          className={tabButtonClass(activeTab === 'outreach')}
        >
          Outreach
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('engagement')}
          className={tabButtonClass(activeTab === 'engagement')}
        >
          Engagement
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={tabButtonClass(activeTab === 'pipeline')}
        >
          Pipeline
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('reporting'); void refreshReportingData() }}
          className={tabButtonClass(activeTab === 'reporting')}
        >
          Revenue
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('leadQuality')}
          className={tabButtonClass(activeTab === 'leadQuality')}
        >
          Lead Quality
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('deliverability'); void refreshDeliverabilityData() }}
          className={tabButtonClass(activeTab === 'deliverability')}
        >
          Deliverability
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prospects')}
          className={tabButtonClass(activeTab === 'prospects')}
        >
          Prospects
        </button>
        {role === 'ivera_admin' ? (
          <button
            type="button"
            onClick={() => setActiveTab('editCampaign')}
            className={tabButtonClass(activeTab === 'editCampaign')}
          >
            Edit Campaign
          </button>
        ) : null}
      </div>

      {activeTab === 'editCampaign' ? (
        <Suspense fallback={<div className="py-16 text-center text-sm text-neutral-400">Loading campaign editor…</div>}>
          <LazyCampaignEditor
            role={role ?? ''}
            campaignDefinitions={campaignDefinitions}
            campaignsLoading={campaignsLoading}
            selectedCampaignId={selectedCampaignId}
            onSelectCampaign={setSelectedCampaignId}
            editingCampaign={editingCampaign}
            setEditingCampaign={setEditingCampaign}
            selectedCampaignDefinition={selectedCampaignDefinition}
            selectedCampaignAnalytics={selectedCampaignAnalytics}
            showNewCampaignForm={showNewCampaignForm}
            setShowNewCampaignForm={setShowNewCampaignForm}
            newCampaignDraft={newCampaignDraft}
            setNewCampaignDraft={setNewCampaignDraft}
            manualLeadOverride={manualLeadOverride}
            setManualLeadOverride={setManualLeadOverride}
            savingCampaign={savingCampaign}
            reassessingCampaign={reassessingCampaign}
            reassessInput={reassessInput}
            setReassessInput={setReassessInput}
            assessment={campaignAssessment}
            runningCampaign={runningCampaign}
            runStartDisabled={runStartDisabled}
            hasActiveCampaign={hasActiveCampaign}
            adminActionMessage={adminActionMessage}
            adminActionError={adminActionError}
            liveCampaign={liveCampaign}
            liveCampaignProgress={liveCampaignProgress}
            pendingRun={pendingRun}
            latestCampaignRuns={latestCampaignRuns}
            setSelectedRunId={setSelectedRunId}
            selectedRun={selectedRun}
            selectedRunInsights={selectedRunInsights}
            selectedRunActions={selectedRunActions}
            followUpPerformance={followUpPerformance}
            onRunCampaign={handleRunCampaign}
            onSaveCampaign={saveCampaignDefinition}
            onReassessCampaign={handleReassessCampaign}
            onApplyAssessment={applyCampaignAssessment}
            onSetDefault={setDefaultCampaign}
            onCreateCampaign={createCampaignDefinition}
            onCampaignAction={handleCampaignAction}
          />
        </Suspense>
      ) : activeTab === 'outreach' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Lead Activity</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Live lead activity with time and layer filters. Showing {leadActivity.length}{' '}
                  {leadActivity.length === 1 ? 'day' : 'days'} in {overviewWindowLabel.toLowerCase()}.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setOverviewDays(days as OverviewDays)}
                      className={tabButtonClass(overviewDays === days)}
                    >
                      {days}d
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOverviewDays(0)}
                    className={tabButtonClass(overviewDays === 0)}
                  >
                    All Time
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 text-[11px] tracking-widest uppercase text-neutral-400">
                    <SlidersHorizontal size={12} />
                    Layers
                  </span>
                  {layerOptions.map((layer) => (
                    <button
                      key={layer.key}
                      type="button"
                      onClick={() =>
                        setChartLayers((current) => ({
                          ...current,
                          [layer.key]: !current[layer.key],
                        }))
                      }
                      className={tabButtonClass(chartLayers[layer.key])}
                    >
                      {layer.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadActivity} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    dataKey="day"
                    interval={0}
                    minTickGap={0}
                    height={56}
                    angle={-35}
                    textAnchor="end"
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
                  {chartLayers.sent && <Bar dataKey="sent" stackId="activity" fill="#d4d4d4" radius={[4, 4, 0, 0]} />}
                  {chartLayers.replied && <Bar dataKey="replied" stackId="activity" fill="#93c5fd" radius={[4, 4, 0, 0]} />}
                  {chartLayers.booked && <Bar dataKey="booked" stackId="activity" fill="#171717" radius={[4, 4, 0, 0]} />}
                  {chartLayers.unsubscribed && <Bar dataKey="unsubscribed" stackId="activity" fill="#fca5a5" radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <MetricSection title="Outreach" icon={Send} metrics={outreachMetrics} />
            {latestRunDiagnostics ? (
              <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Latest Funnel</h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      Where the most recent run narrowed from search to sent outreach
                    </p>
                  </div>
                  <p className="text-xs text-neutral-400">
                    target {latestRunDiagnostics.requested_leads ?? '—'} · effective {latestRunDiagnostics.effective_run_limit ?? '—'}
                  </p>
                </div>
                <p className="mt-3 text-xs text-neutral-500">
                  {reportStatusLabel(latestRunDiagnostics.report_status, latestRunDiagnostics.report_error_message)}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-5">
                  <div className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Raw</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{latestRunDiagnostics.raw_candidates ?? '—'}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">Exa candidates returned</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Fresh</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{latestRunDiagnostics.fresh_candidates ?? '—'}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">After dedupe</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Qualified</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{latestRunDiagnostics.qualified ?? '—'}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">Scored 7/10 or higher</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Email Found</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{latestRunDiagnostics.email_found ?? '—'}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">Personal contact found</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-white/70 px-3 py-2.5">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Sent</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{latestRunDiagnostics.sent ?? '—'}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">Delivered into the run</p>
                  </div>
                </div>
                {latestRunInsights.length ? (
                  <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Run Insights</p>
                    <div className="mt-3 space-y-2">
                      {latestRunInsights.map((insight) => (
                        <p key={insight} className="text-sm text-neutral-700">
                          {insight}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {latestRunActions.length ? (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                    <p className="text-[11px] tracking-widest uppercase text-blue-700">Recommended Actions</p>
                    <div className="mt-3 space-y-2">
                      {latestRunActions.map((action) => (
                        <p key={action} className="text-sm text-neutral-700">
                          {action}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {followUpPerformance.length ? (
                  <div className="mt-4 rounded-xl border border-neutral-200 bg-white/75 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Follow-Up Branch Performance</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          How each engagement branch is performing across tracked follow-up touches for this workspace
                        </p>
                      </div>
                      <p className="text-xs text-neutral-400">{followUpPerformance.reduce((sum, branch) => sum + branch.sent, 0)} follow-up sends tracked</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {followUpPerformance.map((branch) => (
                        <div key={branch.branch} className="overflow-x-auto rounded-lg border border-neutral-100 bg-neutral-50/70 px-3 py-3">
                          <div className="grid min-w-[640px] grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,0.8fr))] gap-2 text-sm">
                          <div>
                            <p className="font-medium text-neutral-900">{branchLabel(branch.branch)}</p>
                            <p className="mt-1 text-xs text-neutral-500">{branch.leads} leads in branch</p>
                          </div>
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Sent</p>
                            <p className="mt-1 font-medium text-neutral-900">{branch.sent}</p>
                          </div>
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Replies</p>
                            <p className="mt-1 font-medium text-neutral-900">{branch.replied}</p>
                          </div>
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Booked</p>
                            <p className="mt-1 font-medium text-neutral-900">{branch.booked}</p>
                          </div>
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Bounced</p>
                            <p className="mt-1 font-medium text-neutral-900">{branch.bounced}</p>
                          </div>
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Reply Rate</p>
                            <p className="mt-1 font-medium text-neutral-900">{replyRate(branch.replied, branch.leads)}</p>
                          </div>
                        </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Outreach Operations</p>
                <h3 className="mt-1 text-sm font-semibold text-neutral-900">Run, monitor, and review campaigns here</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Outreach is now the operational home for campaign status, live runs, analytics, and recent run history.
                </p>
              </div>
              {selectedCampaignDefinition ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('editCampaign')}
                  className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 transition hover:border-neutral-300"
                >
                  Edit Settings
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] tracking-widest uppercase text-neutral-400">Campaigns</p>
                    <p className="mt-1 text-xs text-neutral-500">Choose the campaign you want to run or review.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('editCampaign')
                      setShowNewCampaignForm(true)
                    }}
                    className="rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
                  >
                    Add Campaign
                  </button>
                </div>
                <div className="space-y-2">
                  {campaignDefinitions.map((campaign) => {
                    const analytics = campaignAnalyticsByDefinition.get(campaign.id) ?? null
                    const isSelected = selectedCampaignId === campaign.id
                    const canStart =
                      campaign.status !== 'archived' &&
                      campaign.status !== 'active' &&
                      !runningCampaign &&
                      !savingCampaign &&
                      !hasActiveCampaign

                    return (
                      <div
                        key={campaign.id}
                        onClick={() => setSelectedCampaignId(campaign.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedCampaignId(campaign.id)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                            : 'border-neutral-200 bg-white/80 hover:border-neutral-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
                                ? `Last run ${formatRunDate(analytics.latestRun.created_at)}`
                                : 'No runs yet'}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {analytics ? (
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${healthTone(analytics.healthScore)}`}>
                                Health {analytics.healthScore}/100
                              </span>
                            ) : null}
                            <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${statusColors[campaign.status] ?? statusColors.paused}`}>
                              {campaign.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Runs</p>
                            <p className="mt-1 text-sm font-semibold text-neutral-900">{analytics?.totalRuns ?? 0}</p>
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
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleRunCampaign(campaign.id)
                            }}
                            disabled={!canStart}
                            className="rounded-full border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {campaign.status === 'active' ? 'Running' : 'Start'}
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleCampaignAction(campaign.id, 'pause')
                            }}
                            disabled={savingCampaign || campaign.status !== 'active'}
                            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Pause
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleCampaignAction(campaign.id, 'restart')
                            }}
                            disabled={savingCampaign || runningCampaign || hasActiveCampaign || campaign.status === 'archived'}
                            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Restart
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleCampaignAction(campaign.id, 'archive')
                            }}
                            disabled={savingCampaign || campaign.status === 'archived'}
                            className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                {selectedCampaignDefinition ? (
                  <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[11px] tracking-widest uppercase text-neutral-400">Selected Campaign</p>
                        <h4 className="mt-1 text-sm font-semibold text-neutral-900">{selectedCampaignDefinition.name}</h4>
                        <p className="mt-1 text-xs text-neutral-500">
                          Start the next run, monitor live progress, and review health before you change settings.
                        </p>
                      </div>
                      {selectedCampaignAnalytics ? (
                        <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${healthTone(selectedCampaignAnalytics.healthScore)}`}>
                          Health {selectedCampaignAnalytics.healthScore}/100
                        </span>
                      ) : null}
                    </div>

                    {liveCampaign && liveCampaignProgress && liveCampaign.campaign_definition_id === selectedCampaignDefinition.id ? (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-[11px] tracking-widest uppercase text-emerald-700">Live Run</p>
                            <p className="mt-1 text-sm font-semibold text-neutral-900">{pendingRun?.title || formatCampaignRunTitle(liveCampaign)}</p>
                            <p className="mt-1 text-xs text-neutral-600">{liveCampaignProgress.summary}</p>
                          </div>
                          <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-700">
                            {liveCampaignProgress.badge}
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/90">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${Math.max(6, liveCampaignProgress.progressPercent)}%` }}
                          />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
                          {liveCampaignProgress.metrics.map((metric) => (
                            <div key={metric.label} className="rounded-lg border border-emerald-100 bg-white/90 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">{metric.label}</p>
                              <p className="mt-1 text-sm font-semibold text-neutral-900">{metric.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedCampaignAnalytics ? (
                      <>
                        <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Reply Rate</p>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{replyRate(selectedCampaignAnalytics.replied, selectedCampaignAnalytics.sent)}</p>
                            <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.replied} replies from {selectedCampaignAnalytics.sent} sent</p>
                          </div>
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Booked Rate</p>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{bookingRate(selectedCampaignAnalytics.booked, selectedCampaignAnalytics.sent)}</p>
                            <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.booked} booked</p>
                          </div>
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Bounce Rate</p>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{replyRate(selectedCampaignAnalytics.bounced, selectedCampaignAnalytics.sent)}</p>
                            <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.bounced} bounced</p>
                          </div>
                          <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-3">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Unsub Rate</p>
                            <p className="mt-1 text-lg font-semibold text-neutral-900">{unsubscribeRate(selectedCampaignAnalytics.unsubscribed, selectedCampaignAnalytics.sent)}</p>
                            <p className="mt-1 text-[11px] text-neutral-500">{selectedCampaignAnalytics.unsubscribed} unsubscribed</p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          <div className="rounded-xl border border-neutral-200 bg-white/75 p-4">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Branch Mix</p>
                            <div className="mt-3 space-y-2">
                              {Object.entries(selectedCampaignAnalytics.branchMix).map(([branch, value]) => (
                                <div key={branch} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2">
                                  <span className="text-sm font-medium text-neutral-900">{branchLabel(branch as Parameters<typeof branchLabel>[0])}</span>
                                  <span className="text-sm font-semibold text-neutral-700">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-xl border border-neutral-200 bg-white/75 p-4">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Email Source Mix</p>
                            <div className="mt-3 space-y-2">
                              {Object.entries(selectedCampaignAnalytics.sourceMix).map(([source, value]) => (
                                <div key={source} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2">
                                  <span className="text-sm font-medium text-neutral-900">{sourceLabel(source as Parameters<typeof sourceLabel>[0])}</span>
                                  <span className="text-sm font-semibold text-neutral-700">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {selectedCampaignAnalytics.sourcePerformance.length ? (
                          <div className="mt-4 rounded-xl border border-neutral-200 bg-white/75 p-4">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Source Quality</p>
                            <div className="mt-3 space-y-2">
                              {selectedCampaignAnalytics.sourcePerformance.map((row) => (
                                <div key={row.source} className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-3">
                                  <div className="grid gap-2 md:grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,0.7fr))]">
                                    <div>
                                      <p className="text-sm font-semibold text-neutral-900">{sourceLabel(row.source)}</p>
                                      <p className="mt-1 text-xs text-neutral-500">{row.leads} leads tracked</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Replies</p>
                                      <p className="mt-1 text-sm font-semibold text-neutral-900">{row.replied}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Booked</p>
                                      <p className="mt-1 text-sm font-semibold text-neutral-900">{row.booked}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Bounced</p>
                                      <p className="mt-1 text-sm font-semibold text-neutral-900">{row.bounced}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Unsub</p>
                                      <p className="mt-1 text-sm font-semibold text-neutral-900">{row.unsubscribed}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">Reply Rate</p>
                                      <p className="mt-1 text-sm font-semibold text-neutral-900">{replyRate(row.replied, row.leads)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {selectedCampaignRunInsights.length ? (
                          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Run Insights</p>
                            <div className="mt-3 space-y-2">
                              {selectedCampaignRunInsights.map((insight) => (
                                <p key={insight} className="text-sm text-neutral-700">{insight}</p>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {selectedCampaignRunActions.length ? (
                          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                            <p className="text-[11px] tracking-widest uppercase text-blue-700">Recommended Actions</p>
                            <div className="mt-3 space-y-2">
                              {selectedCampaignRunActions.map((action) => (
                                <p key={action} className="text-sm text-neutral-700">{action}</p>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-600">
                        This campaign has no tracked runs yet. Start the first run from Outreach when you’re ready.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-6 text-sm text-neutral-500">
                    Select a campaign to run it, watch its live status, and review its analytics here.
                  </div>
                )}
              </div>
            </div>
          </div>

          <ListCard
            title={selectedCampaignDefinition ? `${selectedCampaignDefinition.name} Runs` : 'Recent Runs'}
            subtitle={selectedCampaignDefinition ? 'Run history and live status for the selected campaign' : 'Most recent runs across all campaigns'}
            rows={selectedCampaignRuns}
            emptyLabel="No runs yet"
            onRowClick={setSelectedRunId}
          />
        </div>
      ) : activeTab === 'engagement' ? (
        <div className="space-y-4">
          <MetricSection title="Engagement" icon={Reply} metrics={engagementMetrics} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ListCard
              title="Active Conversations"
              subtitle="Replies, bookings, and opt-outs in the selected time window"
              rows={engagedProspects}
              emptyLabel="No engagement yet"
            />
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Engagement Notes</h3>
              <p className="mt-1 text-xs text-neutral-500">Use this view to watch reply pressure and opt-out quality before changing messaging.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {engagementMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{metric.label}</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{metric.value}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">{metric.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'pipeline' ? (
        <div className="space-y-4">
          <MetricSection title="Pipeline" icon={CalendarCheck} metrics={pipelineMetrics} />
          <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Pipeline Views</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  See every deal in a board, or switch to the account workspace when you want to work one account deeply.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPipelineView('board')}
                    className={tabButtonClass(pipelineView === 'board')}
                  >
                    Board View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPipelineView('workspace')}
                    className={tabButtonClass(pipelineView === 'workspace')}
                  >
                    Account Workspace
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPipelineStageFilter('all')}
                    className={tabButtonClass(pipelineStageFilter === 'all')}
                  >
                    All Stages
                  </button>
                  {pipelineStages.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setPipelineStageFilter(stage)}
                      className={tabButtonClass(pipelineStageFilter === stage)}
                    >
                      {formatStageLabel(stage)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {([['all', 'All Owners'], ['mine', 'Mine'], ['unassigned', 'Unassigned']] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPipelineOwnerFilter(value)}
                      className={tabButtonClass(pipelineOwnerFilter === value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-red-200/70 bg-red-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">Hot Reply Queue</h3>
                  <p className="mt-1 text-xs text-neutral-600">
                    High-priority reply and booked-meeting tasks that should be picked up first.
                  </p>
                </div>
                <span className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-red-700">
                  {hotQueueTasks.length} hot
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {hotQueueTasks.length ? hotQueueTasks.slice(0, 6).map((task) => {
                  const isMine = Boolean(user?.id && task.owner_user_id === user.id)
                  return (
                    <div key={task.id} className="rounded-xl border border-red-100 bg-white/85 px-4 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-neutral-900">{task.title}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${priorityBadgeClass(task.priority)}`}>
                              {task.priority}
                            </span>
                            {isMine ? (
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-blue-700">
                                Mine
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-neutral-500">
                            {[task.accounts?.name, task.account_contacts?.full_name, task.type].filter(Boolean).join(' · ')}
                          </p>
                          {task.description ? (
                            <p className="mt-2 text-sm text-neutral-600">{task.description}</p>
                          ) : null}
                          <p className="mt-2 text-xs text-neutral-500">
                            {task.due_at ? `Due ${formatRunDate(task.due_at)}` : 'No due date'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (task.account_id) setSelectedAccountId(task.account_id)
                            }}
                            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700"
                          >
                            Open Account
                          </button>
                          {user?.id ? (
                            <button
                              type="button"
                              onClick={() => void assignTask(task.id, isMine ? null : user.id)}
                              disabled={savingTaskId === task.id}
                              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700 disabled:opacity-50"
                            >
                              {isMine ? 'Unassign' : 'Assign to me'}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void updateTask(task.id, { status: 'completed' })}
                            disabled={savingTaskId === task.id}
                            className="rounded-full border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50"
                          >
                            Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }) : (
                  <p className="text-sm text-neutral-500">No hot replies or booked-meeting tasks right now.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Ownership</h3>
              <p className="mt-1 text-xs text-neutral-500">A quick read on whether the queue is claimed or still floating.</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Open</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">{openTasks.length}</p>
                </div>
                <div className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Mine</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">{myOpenTasks.length}</p>
                </div>
                <div className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Unassigned</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">{unassignedOpenTasks.length}</p>
                </div>
              </div>
            </div>
          </div>
          {handoffOpportunities.length > 0 ? (
            <div className="rounded-xl border border-violet-200/70 bg-violet-50/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">Handoff Queue</h3>
                  <p className="mt-1 text-xs text-neutral-600">
                    AI-active opportunities at a hot stage or overdue — ready for a human to pick up.
                  </p>
                </div>
                <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-violet-700">
                  {handoffOpportunities.length} waiting
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {handoffOpportunities.slice(0, 8).map((opp) => {
                  const accountName = accountNameById.get(opp.account_id) || 'Account'
                  const isOverdue = opp.next_step_due_at && new Date(opp.next_step_due_at) < todayStart
                  return (
                    <div key={opp.id} className="rounded-xl border border-violet-100 bg-white/85 px-4 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-neutral-900">{accountName}</p>
                            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                              {formatStageLabel(opp.stage)}
                            </span>
                            {opp.priority === 'high' ? (
                              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-red-600">high</span>
                            ) : null}
                            {isOverdue ? (
                              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-red-600">overdue</span>
                            ) : null}
                            <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-violet-600">AI active</span>
                          </div>
                          {opp.next_step ? (
                            <p className="mt-1 text-xs text-neutral-500">{opp.next_step}</p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-neutral-400">
                            {opp.next_step_due_at ? `Due ${formatRunDate(opp.next_step_due_at)}` : 'No due date'}
                            {opp.amount_estimate ? ` · $${Number(opp.amount_estimate).toLocaleString()}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAccountId(opp.account_id)
                              setPipelineView('workspace')
                            }}
                            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700"
                          >
                            Open
                          </button>
                          {user?.id ? (
                            <button
                              type="button"
                              onClick={() => void updateOpportunity(opp.id, { owner_user_id: user.id })}
                              disabled={savingOpportunityId === opp.id}
                              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700 disabled:opacity-50"
                            >
                              Take over
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Action Inbox</h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Open tasks grouped by urgency. Overdue items surface first.
                </p>
              </div>
              <div className="flex flex-col gap-2 lg:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  {overdueTasks.length > 0 ? (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-red-700">
                      {overdueTasks.length} overdue
                    </span>
                  ) : null}
                  <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                    {openTasks.length} open
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {([['all', 'All'], ['overdue', 'Overdue'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['no_date', 'No date']] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTaskDueBucket(value)}
                      className={tabButtonClass(taskDueBucket === value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {[
                { key: 'overdue' as const, label: 'Overdue', tasks: overdueTasks, borderClass: 'border-red-100', bgClass: 'bg-red-50/60', labelClass: 'text-red-600' },
                { key: 'today' as const, label: 'Today', tasks: todayTasks, borderClass: 'border-amber-100', bgClass: 'bg-amber-50/60', labelClass: 'text-amber-700' },
                { key: 'upcoming' as const, label: 'Upcoming', tasks: upcomingTasks, borderClass: 'border-neutral-100', bgClass: 'bg-neutral-50/80', labelClass: 'text-neutral-500' },
                { key: 'no_date' as const, label: 'No due date', tasks: noDueTasks, borderClass: 'border-neutral-100', bgClass: 'bg-neutral-50/80', labelClass: 'text-neutral-400' },
              ].filter((bucket) => (taskDueBucket === 'all' || taskDueBucket === bucket.key) && bucket.tasks.length > 0).map((bucket) => (
                <div key={bucket.label}>
                  <div className="mb-2 flex items-center gap-2">
                    <p className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${bucket.labelClass}`}>{bucket.label}</p>
                    <span className="text-[10px] text-neutral-400">{bucket.tasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {bucket.tasks.slice(0, 8).map((task) => {
                      const isMine = Boolean(user?.id && task.owner_user_id === user.id)
                      return (
                      <div key={task.id} className={`rounded-xl border ${bucket.borderClass} ${bucket.bgClass} px-4 py-4`}>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-neutral-900">{task.title}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${priorityBadgeClass(task.priority)}`}>
                                {task.priority}
                              </span>
                              {isMine ? (
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-blue-700">Mine</span>
                              ) : task.owner_user_id ? (
                                <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-neutral-500">Assigned</span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">
                              {[task.accounts?.name, task.account_contacts?.full_name, task.type].filter(Boolean).join(' · ')}
                            </p>
                            {task.description ? (
                              <p className="mt-2 text-sm text-neutral-600">{task.description}</p>
                            ) : null}
                            <p className="mt-2 text-xs text-neutral-500">
                              {task.due_at ? `Due ${formatRunDate(task.due_at)}` : 'No due date'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => { if (task.account_id) setSelectedAccountId(task.account_id) }}
                              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700"
                            >
                              Open Account
                            </button>
                            {user?.id ? (
                              <button
                                type="button"
                                onClick={() => void assignTask(task.id, isMine ? null : user.id)}
                                disabled={savingTaskId === task.id}
                                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700 disabled:opacity-50"
                              >
                                {isMine ? 'Unassign' : 'Assign to me'}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void updateTask(task.id, { due_at: new Date(Date.now() + 24 * 3600000).toISOString() })}
                              disabled={savingTaskId === task.id}
                              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-700 disabled:opacity-50"
                            >
                              Snooze 1d
                            </button>
                            <button
                              type="button"
                              onClick={() => void updateTask(task.id, { status: 'completed' })}
                              disabled={savingTaskId === task.id}
                              className="rounded-full border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-50"
                            >
                              Complete
                            </button>
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              {!openTasks.length ? (
                <p className="text-sm text-neutral-500">No open tasks right now.</p>
              ) : null}
            </div>
          </div>
          {pipelineView === 'board' ? (
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">Opportunity Board</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    A stage-by-stage view of the whole pipeline. Click a deal to jump into its account workspace.
                  </p>
                </div>
                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  {filteredPipelineOpportunities.length} visible
                </span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <div className="grid min-w-[1200px] grid-cols-8 gap-3">
                  {pipelineBoard.map((column) => (
                    <div key={column.stage} className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{formatStageLabel(column.stage)}</p>
                        <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                          {column.opportunities.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {column.opportunities.length ? (
                          column.opportunities.map((opportunity) => {
                            const isOverdue = opportunity.next_step_due_at && new Date(opportunity.next_step_due_at) < todayStart
                            const cardBorder = opportunity.stage === 'won'
                              ? 'border-emerald-200'
                              : opportunity.stage === 'lost'
                                ? 'border-neutral-200 opacity-60'
                                : isOverdue
                                  ? 'border-red-200'
                                  : 'border-neutral-100'
                            return (
                            <button
                              key={opportunity.id}
                              type="button"
                              onClick={() => {
                                setSelectedAccountId(opportunity.account_id)
                                setPipelineView('workspace')
                              }}
                              className={`w-full rounded-xl border ${cardBorder} bg-white px-3 py-3 text-left transition hover:bg-neutral-50`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-neutral-900">
                                  {accountNameById.get(opportunity.account_id) || 'Account'}
                                </p>
                                {opportunity.amount_estimate != null ? (
                                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-700">
                                    ${Number(opportunity.amount_estimate).toLocaleString()}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs text-neutral-500">
                                {[opportunity.priority, opportunity.source].filter(Boolean).join(' · ') || 'Opportunity'}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {opportunity.owner_user_id === user?.id ? (
                                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-blue-700">Mine</span>
                                ) : !opportunity.owner_user_id ? (
                                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-600">Unowned</span>
                                ) : null}
                              </div>
                              {opportunity.qualified_summary ? (
                                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-blue-600">{opportunity.qualified_summary}</p>
                              ) : null}
                              {opportunity.next_step ? (
                                <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">{opportunity.next_step}</p>
                              ) : null}
                              {opportunity.lost_reason ? (
                                <p className="mt-1.5 text-xs text-neutral-400">{opportunity.lost_reason}</p>
                              ) : null}
                              <p className={`mt-2 text-[11px] uppercase tracking-[0.16em] ${isOverdue ? 'font-semibold text-red-600' : 'text-neutral-400'}`}>
                                {opportunity.next_step_due_at ? `Due ${formatRunDate(opportunity.next_step_due_at)}` : 'No due date'}
                              </p>
                            </button>
                          )})

                        ) : (
                          <div className="rounded-xl border border-dashed border-neutral-200 bg-white/60 px-3 py-6 text-center text-xs text-neutral-400">
                            No deals
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <ListCard
            title="Accounts"
            subtitle={pipelineView === 'workspace' ? 'Choose the account you want to work right now' : 'Tracked companies now linked into the CRM layer'}
            rows={crmAccountRows}
            emptyLabel={crmLoading ? 'Loading accounts' : 'No tracked accounts yet'}
            onRowClick={(id) => { setSelectedAccountId(id); setPipelineView('workspace') }}
          />
        </div>
      ) : activeTab === 'reporting' ? (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { label: 'Open Pipeline', value: reportingData ? `$${Number(reportingData.summary.total_pipeline).toLocaleString()}` : (crm.total_pipeline ? `$${Number(crm.total_pipeline).toLocaleString()}` : '—'), hint: 'Estimated value of open deals' },
              { label: 'Weighted Forecast', value: reportingData?.summary.forecast_total ? `$${Number(reportingData.summary.forecast_total).toLocaleString()}` : '—', hint: 'Pipeline × stage probability' },
              { label: 'Revenue Won', value: reportingData ? `$${Number(reportingData.summary.total_won).toLocaleString()}` : (crm.total_won ? `$${Number(crm.total_won).toLocaleString()}` : '—'), hint: 'Closed-won total' },
              { label: 'Win Rate', value: reportingData?.summary.win_rate != null ? `${reportingData.summary.win_rate}%` : (crm.win_rate != null ? `${crm.win_rate}%` : '—'), hint: 'Won ÷ (won + lost)' },
              { label: 'Avg Deal Size', value: reportingData?.summary.avg_deal_size ? `$${Number(reportingData.summary.avg_deal_size).toLocaleString()}` : (crm.avg_deal_size ? `$${Number(crm.avg_deal_size).toLocaleString()}` : '—'), hint: 'Among closed-won deals' },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-neutral-200/60 bg-white/70 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-neutral-900">{card.value}</p>
                <p className="mt-1 text-[11px] text-neutral-500">{card.hint}</p>
              </div>
            ))}
          </div>

          {/* Conversion funnel */}
          {reportingData?.funnel.length ? (
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Conversion Funnel</h3>
              <p className="mt-1 text-xs text-neutral-500">How many opportunities reached each stage (cumulative — includes all that passed through).</p>
              <div className="mt-4 flex items-end gap-1 overflow-x-auto pb-2">
                {(() => {
                  const max = reportingData.funnel[0]?.count || 1
                  return reportingData.funnel.map((row, i) => {
                    const prev = i > 0 ? reportingData.funnel[i - 1].count : row.count
                    const pct = Math.round((row.count / max) * 100)
                    const dropPct = prev > 0 ? Math.round(((prev - row.count) / prev) * 100) : 0
                    return (
                      <div key={row.stage} className="flex min-w-[80px] flex-1 flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold text-neutral-700">{row.count}</span>
                        {i > 0 && dropPct > 0 ? (
                          <span className="text-[9px] text-red-400">-{dropPct}%</span>
                        ) : <span className="text-[9px] text-transparent">·</span>}
                        <div className="w-full rounded-t-lg bg-neutral-100" style={{ height: '80px' }}>
                          <div
                            className="w-full rounded-t-lg bg-neutral-800 transition-all"
                            style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                          />
                        </div>
                        <span className="text-center text-[10px] uppercase tracking-[0.12em] text-neutral-400">{formatStageLabel(row.stage)}</span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          ) : null}

          {/* Conversion rates */}
          {reportingData?.conversion_rates.length ? (
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Stage Conversion Rates</h3>
              <p className="mt-1 text-xs text-neutral-500">Percentage of deals that advanced from one stage to the next.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {reportingData.conversion_rates.map((row) => (
                  <div key={`${row.from}-${row.to}`} className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-white/80 px-3 py-2.5">
                    <span className="text-xs text-neutral-500">{formatStageLabel(row.from)}</span>
                    <span className="text-[10px] text-neutral-300">→</span>
                    <span className="text-xs text-neutral-500">{formatStageLabel(row.to)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      row.rate == null ? 'bg-neutral-100 text-neutral-400'
                      : row.rate >= 60 ? 'bg-emerald-50 text-emerald-700'
                      : row.rate >= 30 ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-600'
                    }`}>
                      {row.rate != null ? `${row.rate}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Forecast breakdown by stage */}
          {reportingData?.forecast && Object.keys(reportingData.forecast).length > 0 ? (
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Forecast Breakdown</h3>
              <p className="mt-1 text-xs text-neutral-500">Weighted pipeline using standard stage close probabilities.</p>
              <div className="mt-4 space-y-2">
                {STAGE_ORDER.filter((s) => reportingData.forecast[s]).map((stage) => {
                  const row = reportingData.forecast[stage]
                  return (
                    <div key={stage} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-white/80 px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-neutral-700">{formatStageLabel(stage)}</span>
                        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                          {Math.round(row.probability * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-xs text-neutral-400">${Number(row.pipeline).toLocaleString()} pipeline</span>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-emerald-700">
                          ${Math.round(row.weighted).toLocaleString()} forecast
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-2.5">
                  <span className="text-sm font-semibold text-white">Total Forecast</span>
                  <span className="text-sm font-semibold text-white">
                    ${Number(reportingData.summary.forecast_total).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Pipeline by stage */}
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Pipeline by Stage</h3>
              <p className="mt-1 text-xs text-neutral-500">Deal count and estimated value at each stage.</p>
              <div className="mt-4 space-y-2">
                {reportingData
                  ? STAGE_ORDER.filter((s) => reportingData.by_stage[s]).map((stage) => {
                      const row = reportingData.by_stage[stage]
                      return (
                        <div key={stage} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-white/80 px-3 py-2.5">
                          <span className="text-sm text-neutral-700">{formatStageLabel(stage)}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{row.count} deals</span>
                            {row.amount > 0 ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-700">
                                ${Number(row.amount).toLocaleString()}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )
                    })
                  : <p className="text-sm text-neutral-400">Click Revenue tab to load data.</p>
                }
              </div>
            </div>

            {/* Pipeline by campaign */}
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Pipeline by Campaign</h3>
              <p className="mt-1 text-xs text-neutral-500">Sourced pipeline, wins, and losses broken down by campaign.</p>
              <div className="mt-4 space-y-2">
                {reportingData?.by_campaign.length
                  ? reportingData.by_campaign.sort((a, b) => b.won_amount - a.won_amount).map((row) => (
                      <div key={row.campaign} className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-neutral-900">{row.campaign}</p>
                          {row.won_amount > 0 ? (
                            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-700">
                              ${Number(row.won_amount).toLocaleString()} won
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">
                          {row.count} deals · {row.won} won · {row.lost} lost
                          {row.amount > 0 ? ` · $${Number(row.amount).toLocaleString()} pipeline` : ''}
                        </p>
                      </div>
                    ))
                  : <p className="text-sm text-neutral-400">{reportingData ? 'No campaign data yet.' : 'Click Revenue tab to load data.'}</p>
                }
              </div>
            </div>
          </div>

          {/* Lost reasons */}
          {reportingData && Object.keys(reportingData.lost_reasons).length > 0 ? (
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Loss Analysis</h3>
              <p className="mt-1 text-xs text-neutral-500">Why deals are being lost.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(reportingData.lost_reasons)
                  .sort(([, a], [, b]) => b - a)
                  .map(([reason, count]) => (
                    <div key={reason} className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                      <p className="text-sm font-medium text-neutral-900">{reason}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{count} {count === 1 ? 'deal' : 'deals'}</p>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : activeTab === 'leadQuality' ? (
        <div className="space-y-4">
          <MetricSection title="Lead Quality" icon={Users} metrics={qualityMetrics} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ListCard
              title="High-Intent Leads"
              subtitle="Top scored prospects to prioritize for outreach and follow-up"
              rows={highIntentProspects}
              emptyLabel="No high-intent leads"
            />
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Quality Readout</h3>
              <p className="mt-1 text-xs text-neutral-500">A compact read on whether the current targeting is feeding the right prospects into the pipeline.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {qualityMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{metric.label}</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{metric.value}</p>
                    <p className="mt-1 text-[11px] text-neutral-500">{metric.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'deliverability' ? (
        <div className="space-y-4">
          {/* Health summary cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { label: 'Total Sent', value: deliverabilityData ? deliverabilityData.overall.total_sent.toLocaleString() : '—', hint: 'Emails delivered to leads', color: '' },
              { label: 'Bounce Rate', value: deliverabilityData?.overall.bounce_rate != null ? `${deliverabilityData.overall.bounce_rate}%` : '—', hint: 'Hard + soft bounces', color: (deliverabilityData?.overall.bounce_rate ?? 0) > 5 ? 'text-red-600' : 'text-emerald-600' },
              { label: 'Spam Rate', value: deliverabilityData?.overall.spam_rate != null ? `${deliverabilityData.overall.spam_rate}%` : '—', hint: 'Spam complaint rate', color: (deliverabilityData?.overall.spam_rate ?? 0) > 0.1 ? 'text-red-600' : 'text-emerald-600' },
              { label: 'Unsub Rate', value: deliverabilityData?.overall.unsub_rate != null ? `${deliverabilityData.overall.unsub_rate}%` : '—', hint: 'Unsubscribe rate', color: (deliverabilityData?.overall.unsub_rate ?? 0) > 2 ? 'text-amber-600' : 'text-emerald-600' },
              { label: 'Open Rate', value: deliverabilityData?.overall.open_rate != null ? `${deliverabilityData.overall.open_rate}%` : '—', hint: 'Tracked opens (if enabled)', color: '' },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-neutral-200/60 bg-white/70 px-4 py-4">
                <p className="text-[10px] tracking-widest uppercase text-neutral-400">{card.label}</p>
                <p className={`mt-1 text-xl font-semibold ${card.color || 'text-neutral-900'}`}>{card.value}</p>
                <p className="mt-1 text-[11px] text-neutral-500">{card.hint}</p>
              </div>
            ))}
          </div>

          {/* Suppression summary */}
          {deliverabilityData && deliverabilityData.suppression_summary.total > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-white text-[10px] font-bold">!</div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Suppression audit — {deliverabilityData.suppression_summary.total} contact{deliverabilityData.suppression_summary.total !== 1 ? 's' : ''} suppressed</p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    {deliverabilityData.suppression_summary.email_suppressed} email-suppressed · {deliverabilityData.suppression_summary.sms_suppressed} SMS-suppressed
                  </p>
                </div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[500px] text-xs">
                  <thead>
                    <tr className="border-b border-amber-200 text-left text-[10px] uppercase tracking-widest text-amber-600">
                      <th className="pb-2 pr-4">Contact</th>
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2 pr-4">Account</th>
                      <th className="pb-2 pr-4">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverabilityData.suppression_audit.slice(0, 20).map((row) => (
                      <tr key={row.id} className="border-b border-amber-100 last:border-0">
                        <td className="py-2 pr-4 font-medium text-neutral-900">{row.full_name || '—'}</td>
                        <td className="py-2 pr-4 text-neutral-500">{row.email || '—'}</td>
                        <td className="py-2 pr-4 text-neutral-600">{row.account_name || '—'}</td>
                        <td className="py-2 pr-4">
                          {row.email_suppressed && <span className="mr-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Email</span>}
                          {row.sms_suppressed && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">SMS</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* By domain */}
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Bounce rate by domain</h3>
              <p className="mt-1 text-xs text-neutral-500">Domains with ≥ 2 sent emails, sorted by bounce rate</p>
              {!deliverabilityData ? (
                <p className="mt-6 text-center text-xs text-neutral-400">Loading…</p>
              ) : deliverabilityData.by_domain.length === 0 ? (
                <p className="mt-6 text-center text-xs text-neutral-400">No domain data yet</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-neutral-100 text-left text-[10px] uppercase tracking-widest text-neutral-400">
                        <th className="pb-2 pr-4">Domain</th>
                        <th className="pb-2 pr-3 text-right">Sent</th>
                        <th className="pb-2 pr-3 text-right">Bounced</th>
                        <th className="pb-2 pr-3 text-right">Bounce%</th>
                        <th className="pb-2 text-right">Spam%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliverabilityData.by_domain.slice(0, 15).map((row) => (
                        <tr key={row.domain} className="border-b border-neutral-100 last:border-0">
                          <td className="py-2 pr-4 font-medium text-neutral-900">{row.domain}</td>
                          <td className="py-2 pr-3 text-right text-neutral-500">{row.sent}</td>
                          <td className="py-2 pr-3 text-right text-neutral-500">{row.bounced}</td>
                          <td className={`py-2 pr-3 text-right font-semibold ${row.bounce_rate > 10 ? 'text-red-600' : row.bounce_rate > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {row.bounce_rate}%
                          </td>
                          <td className={`py-2 text-right font-semibold ${row.spam_rate > 0.3 ? 'text-red-600' : row.spam_rate > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>
                            {row.spam_rate > 0 ? `${row.spam_rate}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* By campaign */}
            <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Deliverability by campaign</h3>
              <p className="mt-1 text-xs text-neutral-500">Bounce, unsub, and reply rates per campaign</p>
              {!deliverabilityData ? (
                <p className="mt-6 text-center text-xs text-neutral-400">Loading…</p>
              ) : deliverabilityData.by_campaign.length === 0 ? (
                <p className="mt-6 text-center text-xs text-neutral-400">No campaign data yet</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-neutral-100 text-left text-[10px] uppercase tracking-widest text-neutral-400">
                        <th className="pb-2 pr-4">Campaign</th>
                        <th className="pb-2 pr-3 text-right">Sent</th>
                        <th className="pb-2 pr-3 text-right">Bounce%</th>
                        <th className="pb-2 pr-3 text-right">Unsub%</th>
                        <th className="pb-2 text-right">Reply%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliverabilityData.by_campaign.map((row) => (
                        <tr key={row.campaign_id ?? '_none'} className="border-b border-neutral-100 last:border-0">
                          <td className="py-2 pr-4 font-medium text-neutral-900 max-w-[160px] truncate">{row.campaign_name}</td>
                          <td className="py-2 pr-3 text-right text-neutral-500">{row.sent}</td>
                          <td className={`py-2 pr-3 text-right font-semibold ${(row.bounce_rate ?? 0) > 5 ? 'text-red-600' : (row.bounce_rate ?? 0) > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>
                            {row.bounce_rate != null ? `${row.bounce_rate}%` : '—'}
                          </td>
                          <td className={`py-2 pr-3 text-right font-semibold ${(row.unsub_rate ?? 0) > 2 ? 'text-amber-600' : (row.unsub_rate ?? 0) > 0 ? 'text-neutral-600' : 'text-neutral-400'}`}>
                            {row.unsub_rate != null ? `${row.unsub_rate}%` : '—'}
                          </td>
                          <td className={`py-2 text-right font-semibold ${(row.reply_rate ?? 0) >= 5 ? 'text-emerald-600' : (row.reply_rate ?? 0) > 0 ? 'text-neutral-700' : 'text-neutral-400'}`}>
                            {row.reply_rate != null ? `${row.reply_rate}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Reputation thresholds guide */}
          <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-4">
            <h3 className="text-sm font-semibold text-neutral-900">Sender reputation thresholds</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: 'Bounce rate', safe: '< 2%', warning: '2–5%', danger: '> 5%', note: 'Above 5% risks domain blacklisting' },
                { label: 'Spam complaint', safe: '< 0.08%', warning: '0.08–0.3%', danger: '> 0.3%', note: 'Google/Yahoo threshold for throttling' },
                { label: 'Unsubscribe rate', safe: '< 0.5%', warning: '0.5–2%', danger: '> 2%', note: 'High unsub signals poor targeting' },
              ].map((t) => (
                <div key={t.label} className="rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-3">
                  <p className="text-xs font-semibold text-neutral-900">{t.label}</p>
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex items-center gap-2"><span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" /><span className="text-emerald-700 font-medium">Safe</span><span className="text-neutral-500">{t.safe}</span></div>
                    <div className="flex items-center gap-2"><span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" /><span className="text-amber-700 font-medium">Warn</span><span className="text-neutral-500">{t.warning}</span></div>
                    <div className="flex items-center gap-2"><span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-400" /><span className="text-red-700 font-medium">Danger</span><span className="text-neutral-500">{t.danger}</span></div>
                  </div>
                  <p className="mt-2 text-[10px] text-neutral-400">{t.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200/60 bg-white/70 p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Prospects</h3>
              <p className="mt-1 text-xs text-neutral-500">Filter live prospects by time period, status, and score</p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setProspectDays(days as ProspectDays)}
                    className={tabButtonClass(prospectDays === days)}
                  >
                    {days}d
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setProspectDays(0)}
                  className={tabButtonClass(prospectDays === 0)}
                >
                  All
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'sent', label: 'Sent' },
                  { value: 'replied', label: 'Replies' },
                  { value: 'booked', label: 'Booked' },
                  { value: 'unsubscribed', label: 'Unsubscribed' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProspectStatus(option.value as ProspectStatus)}
                    className={tabButtonClass(prospectStatus === option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: 'all', label: 'All Scores' },
                  { value: 'scored', label: 'Scored' },
                  { value: 'high', label: '7+/10' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProspectScore(option.value as ProspectScore)}
                    className={tabButtonClass(prospectScore === option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredProspects.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-400">No prospects match the current filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left">
                    <th className="px-0 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Company</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Email</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Status</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Score</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProspects.map((lead) => (
                    <tr
                      key={lead.id}
                      className="cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50/70 last:border-0"
                      onClick={() => openProspectHistory(lead.id)}
                    >
                      <td className="px-0 py-3 font-medium text-neutral-900">{lead.company || '—'}</td>
                      <td className="px-4 py-3 text-neutral-500">{lead.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full tracking-widest font-medium uppercase ${statusColors[lead.status] ?? statusColors.emailed}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {typeof lead.qualify_score === 'number' ? `${lead.qualify_score}/10` : '—'}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{timeAgo(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </>
      {selectedLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 px-4 py-8">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
              <div>
                <p className="text-[11px] tracking-widest uppercase text-neutral-400">Prospect History</p>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                  {prospectHistory?.lead.company || 'Loading prospect...'}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {prospectHistory?.lead.email || '—'}
                  {prospectHistory?.lead.phone ? ` · ${prospectHistory.lead.phone}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closeProspectHistory}
                className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              {historyLoading ? (
                <p className="py-16 text-center text-sm text-neutral-500">Loading full correspondence history...</p>
              ) : historyError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {historyError}
                </div>
              ) : prospectHistory?.timeline.length ? (
                <div className="space-y-4">
                  {prospectHistory.timeline.map((item) => (
                    <div key={item.id} className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-4">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] uppercase tracking-widest text-neutral-500">
                              {timelineTypeLabel(item.type)}
                            </span>
                            <span className="text-xs text-neutral-400">{timeAgo(item.at)}</span>
                          </div>
                          <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                        </div>
                      </div>
                      {item.body && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{item.body}</p>
                      )}
                      {item.meta && Object.keys(item.meta).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(item.meta)
                            .filter(([, value]) => value !== null && value !== '')
                            .map(([key, value]) => (
                              <span key={key} className="rounded-full bg-white px-3 py-1 text-[11px] uppercase tracking-wider text-neutral-500">
                                {key.replace(/_/g, ' ')}: {String(value)}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-16 text-center text-sm text-neutral-500">No saved correspondence was found for this prospect yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedAccountId ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/45 px-4 py-8"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAccountId(null) }}
        >
          <div className="relative my-auto w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-neutral-100 p-2">
                  <Building2 size={16} className="text-neutral-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {selectedAccount?.name || 'Account detail'}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {selectedAccount
                      ? [selectedAccount.domain, selectedAccount.geo, selectedAccount.segment].filter(Boolean).join(' · ') || 'Tracked account'
                      : 'Loading account…'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAccountId(null)}
                className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              {crmError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{crmError}</p>
              ) : null}

              {selectedAccountDetail ? (
                <div className="space-y-4">
                  {selectedAccountDetail.account.id && duplicateGroupByAccountId.has(selectedAccountDetail.account.id) ? (() => {
                    const group = duplicateGroupByAccountId.get(selectedAccountDetail.account.id)!
                    const others = group.accounts.filter((a) => a.id !== selectedAccountDetail.account.id)
                    return (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                        <div className="flex items-start gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Possible duplicate</p>
                          <span className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-amber-600">
                            matched by {group.reason}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-amber-700">
                          This account shares the same {group.reason} as:{' '}
                          {others.map((a, i) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => setSelectedAccountId(a.id)}
                              className="font-semibold underline underline-offset-2"
                            >
                              {a.name}{i < others.length - 1 ? ', ' : ''}
                            </button>
                          ))}
                          . Review and suppress the duplicate.
                        </p>
                      </div>
                    )
                  })() : null}

                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
                    <div className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Lifecycle</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{formatStageLabel(selectedAccountDetail.account.lifecycle_stage)}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Contacts</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{selectedAccountDetail.contact_coverage?.total ?? selectedAccountDetail.contacts.length}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600">Active</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{selectedAccountDetail.contact_coverage?.active ?? '—'}</p>
                    </div>
                    <div className={`rounded-lg border px-3 py-3 ${(selectedAccountDetail.contact_coverage?.suppressed ?? 0) > 0 ? 'border-red-100 bg-red-50/60' : 'border-neutral-100 bg-white/80'}`}>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${(selectedAccountDetail.contact_coverage?.suppressed ?? 0) > 0 ? 'text-red-500' : 'text-neutral-400'}`}>Suppressed</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{selectedAccountDetail.contact_coverage?.suppressed ?? '—'}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Opps</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{selectedAccountDetail.opportunities.length}</p>
                    </div>
                    <div className="rounded-lg border border-neutral-100 bg-white/80 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Updated</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{timeAgo(selectedAccountDetail.account.updated_at)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-neutral-200 bg-white/80 p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Contacts</p>
                      <div className="mt-3 space-y-2">
                        {selectedAccountDetail.contacts.length ? selectedAccountDetail.contacts.map((contact) => (
                          <div key={contact.id} className={`rounded-lg border px-3 py-3 ${contact.email_suppressed ? 'border-red-100 bg-red-50/40' : 'border-neutral-100 bg-neutral-50/80'}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-neutral-900">{contact.full_name || contact.email || 'Unnamed contact'}</p>
                              {contact.is_primary ? (
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-blue-700">Primary</span>
                              ) : null}
                              {contact.email_suppressed ? (
                                <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-red-600">Suppressed</span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">
                              {[contact.role, contact.email, contact.phone].filter(Boolean).join(' · ') || 'No contact details yet'}
                            </p>
                          </div>
                        )) : (
                          <p className="text-sm text-neutral-500">No contacts linked yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-white/80 p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Touch History</p>
                      {selectedAccountDetail.touch_summary?.length ? (
                        <div className="mt-3 space-y-2">
                          {selectedAccountDetail.touch_summary.map((entry) => (
                            <div key={entry.type} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-2.5">
                              <span className="text-sm text-neutral-700">{timelineTypeLabel(entry.type)}</span>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-neutral-500">{entry.count}×</span>
                                {entry.last_at ? <span className="text-[11px] text-neutral-400">{timeAgo(entry.last_at)}</span> : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {selectedAccountDetail.activities.length ? selectedAccountDetail.activities.slice(0, 8).map((activity) => (
                            <div key={activity.id} className="rounded-lg border border-neutral-100 bg-neutral-50/80 px-3 py-3">
                              <p className="text-sm font-medium text-neutral-900">{timelineTypeLabel(activity.type)}</p>
                              <p className="mt-1 text-xs text-neutral-500">
                                {[activity.channel, timeAgo(activity.occurred_at)].filter(Boolean).join(' · ')}
                              </p>
                              {activity.subject ? <p className="mt-2 text-sm text-neutral-700">{activity.subject}</p> : null}
                              {activity.body ? <p className="mt-1 text-xs leading-relaxed text-neutral-600">{activity.body}</p> : null}
                            </div>
                          )) : (
                            <p className="text-sm text-neutral-500">No CRM activity logged yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white/80 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Opportunities</p>
                    <p className="mt-1 text-xs text-neutral-500">Move stages, review next actions, and keep booked or engaged deals from stalling.</p>
                    <div className="mt-4 space-y-3">
                      {selectedAccountDetail.opportunities.length ? selectedAccountDetail.opportunities.map((opportunity) => {
                        const si = stageIndex(opportunity.stage)
                        const isTerminal = opportunity.stage === 'won' || opportunity.stage === 'lost'
                        const showQualification = si >= stageIndex('qualified') || !!opportunity.qualified_summary || !!opportunity.pain_summary
                        const showAmount = si >= stageIndex('proposal') || opportunity.amount_estimate != null
                        const showProposal = si >= stageIndex('proposal') || !!opportunity.proposal_sent_at || opportunity.proposal_status !== 'none'
                        return (
                          <div key={opportunity.id} className={`rounded-xl border p-4 ${opportunity.stage === 'won' ? 'border-emerald-200 bg-emerald-50/60' : opportunity.stage === 'lost' ? 'border-neutral-200 bg-neutral-50/60' : 'border-neutral-100 bg-neutral-50/80'}`}>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-neutral-900">{formatStageLabel(opportunity.stage)}</p>
                                  <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-neutral-500">{opportunity.priority}</span>
                                  {opportunity.amount_estimate != null ? (
                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-700">
                                      ${Number(opportunity.amount_estimate).toLocaleString()}
                                    </span>
                                  ) : null}
                                  {opportunity.owner_user_id ? (
                                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-blue-700">Human active</span>
                                  ) : (
                                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-violet-600">AI active</span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-neutral-500">
                                  {[opportunity.source, opportunity.last_activity_at ? `last activity ${timeAgo(opportunity.last_activity_at)}` : null].filter(Boolean).join(' · ')}
                                </p>
                              </div>
                              <div className="text-xs text-neutral-500">
                                {isTerminal
                                  ? (opportunity.stage === 'won' ? 'Closed won' : 'Closed lost')
                                  : opportunity.next_step_due_at ? `Next due ${formatRunDate(opportunity.next_step_due_at)}` : 'No due date set'}
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_220px_auto]">
                              <label className="space-y-2">
                                <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-400">Stage</span>
                                <select
                                  value={opportunity.stage}
                                  onChange={(event) => {
                                    const newStage = event.target.value
                                    if (newStage === 'lost') { setLostReasonModal({ opportunityId: opportunity.id, reason: '' }); return }
                                    const warning = stageExitWarning(newStage, opportunity)
                                    if (warning) { setStageExitModal({ opportunityId: opportunity.id, toStage: newStage, warning }); event.target.value = opportunity.stage; return }
                                    const updates: Record<string, string | null> = { stage: newStage }
                                    if (newStage === 'won') updates.won_at = new Date().toISOString()
                                    void updateOpportunity(opportunity.id, updates as Parameters<typeof updateOpportunity>[1])
                                  }}
                                  disabled={savingOpportunityId === opportunity.id}
                                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                                >
                                  {opportunityStageOptions.map((stage) => (
                                    <option key={stage} value={stage}>{formatStageLabel(stage)}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="space-y-2">
                                <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-400">Next Action</span>
                                <input type="text" defaultValue={opportunity.next_step || ''} onBlur={(event) => { const value = event.target.value.trim(); if (value === (opportunity.next_step || '')) return; void updateOpportunity(opportunity.id, { next_step: value || null }) }} placeholder="Add the next action for this opportunity" disabled={isTerminal} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 disabled:opacity-50" />
                              </label>
                              <label className="space-y-2">
                                <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-400">Due</span>
                                <input type="datetime-local" defaultValue={formatDateTimeInputValue(opportunity.next_step_due_at)} onBlur={(event) => { const nextValue = parseDateTimeInputValue(event.target.value); if ((opportunity.next_step_due_at || null) === nextValue) return; void updateOpportunity(opportunity.id, { next_step_due_at: nextValue }) }} disabled={isTerminal} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 disabled:opacity-50" />
                              </label>
                              <div className="flex flex-col gap-2 items-end justify-end">
                                <div className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-xs text-neutral-500">
                                  {savingOpportunityId === opportunity.id ? 'Saving…' : 'Auto-saves on change'}
                                </div>
                                {user?.id && !isTerminal ? (
                                  <button type="button" onClick={() => void updateOpportunity(opportunity.id, { owner_user_id: opportunity.owner_user_id ? null : user.id } as Parameters<typeof updateOpportunity>[1])} disabled={savingOpportunityId === opportunity.id} className={`rounded-xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] disabled:opacity-50 ${opportunity.owner_user_id ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                                    {opportunity.owner_user_id ? 'Hand to AI' : 'Take over'}
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            {showAmount ? (
                              <div className="mt-3">
                                <label className="space-y-2">
                                  <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-400">Deal Amount ($)</span>
                                  <input type="number" defaultValue={opportunity.amount_estimate ?? ''} onBlur={(event) => { const raw = event.target.value.trim(); const val = raw ? parseFloat(raw) : null; if (val === opportunity.amount_estimate) return; void updateOpportunity(opportunity.id, { amount_estimate: val } as Parameters<typeof updateOpportunity>[1]) }} placeholder="Estimated deal value" disabled={isTerminal} className="w-full max-w-xs rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 disabled:opacity-50" />
                                </label>
                              </div>
                            ) : null}

                            {showProposal ? (
                              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                                <label className="space-y-2">
                                  <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-400">Proposal Status</span>
                                  <select value={opportunity.proposal_status || 'none'} onChange={(event) => { void updateOpportunity(opportunity.id, { proposal_status: event.target.value } as Parameters<typeof updateOpportunity>[1]) }} disabled={isTerminal} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 disabled:opacity-50">
                                    {['none', 'draft', 'sent', 'viewed', 'accepted', 'declined'].map((s) => (
                                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="space-y-2">
                                  <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-400">Proposal Sent</span>
                                  <input type="datetime-local" defaultValue={formatDateTimeInputValue(opportunity.proposal_sent_at)} onBlur={(event) => { const next = parseDateTimeInputValue(event.target.value); if ((opportunity.proposal_sent_at || null) === next) return; void updateOpportunity(opportunity.id, { proposal_sent_at: next } as Parameters<typeof updateOpportunity>[1]) }} disabled={isTerminal} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 disabled:opacity-50" />
                                </label>
                                <label className="space-y-2">
                                  <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-400">Closed Amount ($)</span>
                                  <input type="number" defaultValue={opportunity.closed_amount ?? ''} onBlur={(event) => { const raw = event.target.value.trim(); const val = raw ? parseFloat(raw) : null; if (val === opportunity.closed_amount) return; void updateOpportunity(opportunity.id, { closed_amount: val } as Parameters<typeof updateOpportunity>[1]) }} placeholder="Final closed value" disabled={!isTerminal} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 disabled:opacity-50" />
                                </label>
                              </div>
                            ) : null}

                            {showQualification ? (
                              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                <label className="space-y-2">
                                  <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-400">Qualification Summary</span>
                                  <textarea defaultValue={opportunity.qualified_summary || ''} onBlur={(event) => { const value = event.target.value.trim(); if (value === (opportunity.qualified_summary || '')) return; void updateOpportunity(opportunity.id, { qualified_summary: value || null }) }} placeholder="Why is this a good fit? Budget, authority, need, timeline…" rows={3} disabled={isTerminal} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 disabled:opacity-50" />
                                </label>
                                <label className="space-y-2">
                                  <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-400">Pain / Need</span>
                                  <textarea defaultValue={opportunity.pain_summary || ''} onBlur={(event) => { const value = event.target.value.trim(); if (value === (opportunity.pain_summary || '')) return; void updateOpportunity(opportunity.id, { pain_summary: value || null }) }} placeholder="What problem are they trying to solve?" rows={3} disabled={isTerminal} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 disabled:opacity-50" />
                                </label>
                              </div>
                            ) : null}

                            {opportunity.stage === 'lost' && !opportunity.lost_reason ? (
                              <div className="mt-3">
                                <label className="space-y-2">
                                  <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-400">Lost Reason</span>
                                  <select defaultValue="" onChange={(event) => { if (event.target.value) void updateOpportunity(opportunity.id, { lost_reason: event.target.value }) }} className="w-full max-w-xs rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400">
                                    <option value="" disabled>Select a reason…</option>
                                    {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                </label>
                              </div>
                            ) : null}

                            <div className="mt-4 border-t border-neutral-100 pt-4">
                              <div className="flex items-center justify-between">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Internal Notes</p>
                                {!opportunityComments[opportunity.id] ? (
                                  <button type="button" onClick={() => void loadComments(opportunity.id)} className="text-[11px] text-neutral-400 underline underline-offset-2 hover:text-neutral-600">Load notes</button>
                                ) : null}
                              </div>
                              {opportunityComments[opportunity.id] ? (
                                <div className="mt-2 space-y-2">
                                  {opportunityComments[opportunity.id].length ? opportunityComments[opportunity.id].map((comment) => (
                                    <div key={comment.id} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5">
                                      <p className="text-sm text-neutral-800">{comment.body}</p>
                                      <p className="mt-1 text-[11px] text-neutral-400">{timeAgo(comment.created_at)}</p>
                                    </div>
                                  )) : (
                                    <p className="text-sm text-neutral-400">No notes yet.</p>
                                  )}
                                  <div className="flex gap-2 pt-1">
                                    <input type="text" value={commentDrafts[opportunity.id] || ''} onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [opportunity.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void postComment(opportunity.id) } }} placeholder="Add a note…" disabled={postingComment === opportunity.id} className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 outline-none transition focus:border-neutral-400 disabled:opacity-50" />
                                    <button type="button" onClick={() => void postComment(opportunity.id)} disabled={postingComment === opportunity.id || !(commentDrafts[opportunity.id] || '').trim()} className="rounded-xl border border-neutral-900 bg-neutral-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-40">
                                      {postingComment === opportunity.id ? '…' : 'Post'}
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )
                      }) : (
                        <p className="text-sm text-neutral-500">No opportunities linked to this account yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  {crmLoading ? 'Loading account details…' : 'No account details available.'}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {lostReasonModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-neutral-900">Mark as Lost</h3>
            <p className="mt-1 text-xs text-neutral-500">Select a reason so you can spot patterns later.</p>
            <select
              value={lostReasonModal.reason}
              onChange={(event) => setLostReasonModal({ ...lostReasonModal, reason: event.target.value })}
              className="mt-4 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
            >
              <option value="">Select a reason…</option>
              {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLostReasonModal(null)}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void updateOpportunity(lostReasonModal.opportunityId, {
                    stage: 'lost',
                    lost_at: new Date().toISOString(),
                    lost_reason: lostReasonModal.reason || null,
                  })
                  setLostReasonModal(null)
                }}
                className="rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {stageExitModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-neutral-900">Heads up before you advance</h3>
            <p className="mt-2 text-sm text-amber-700 leading-relaxed">{stageExitModal.warning}</p>
            <p className="mt-3 text-xs text-neutral-500">
              You can still proceed — this is a warning, not a hard block.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStageExitModal(null)}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-700"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={() => {
                  const updates: Record<string, string | null> = { stage: stageExitModal.toStage }
                  if (stageExitModal.toStage === 'won') updates.won_at = new Date().toISOString()
                  void updateOpportunity(stageExitModal.opportunityId, updates as Parameters<typeof updateOpportunity>[1])
                  setStageExitModal(null)
                }}
                className="rounded-full border border-amber-500 bg-amber-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
              >
                Advance anyway
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
