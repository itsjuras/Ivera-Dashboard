export interface CampaignSourcePerformanceRow {
  campaign_definition_id: string
  source: 'exa' | 'scraped' | 'pattern' | 'unknown'
  leads: number
  replied: number
  booked: number
  bounced: number
  unsubscribed: number
}

export interface CampaignRun {
  id: string
  product_name: string
  campaign_name?: string | null
  campaign_definition_id?: string | null
  target_description: string
  created_at: string
  status?: string
  funnel_diagnostics?: {
    email_sources?: {
      exa?: number
      scraped?: number
      pattern?: number
    }
    follow_up_branches?: {
      clicked?: number
      opened?: number
      cold?: number
      replied_later?: number
    }
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
}

export interface CampaignDefinitionSummary {
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
}

export interface CampaignAnalytics {
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
  latestRun: CampaignRun | null
  healthScore: number
}

export function replyRate(replied: number, emailed: number) {
  if (!emailed) return '—'
  return `${((replied / emailed) * 100).toFixed(1)}%`
}

export function branchLabel(branch: string) {
  if (branch === 'replied_later') return 'Replied Later'
  return branch.charAt(0).toUpperCase() + branch.slice(1)
}

export function sourceLabel(source: string) {
  if (source === 'exa') return 'Exa'
  if (source === 'scraped') return 'Scraped'
  if (source === 'pattern') return 'Pattern'
  return 'Unknown'
}

export function buildCampaignAnalytics(
  definition: CampaignDefinitionSummary,
  runs: CampaignRun[],
  sourcePerformanceRows: CampaignSourcePerformanceRow[],
): CampaignAnalytics | null {
  const scopedRuns = runs
    .filter((run) => run.campaign_definition_id === definition.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (!scopedRuns.length) return null

  const totals = scopedRuns.reduce(
    (acc, run) => {
      acc.sent += run.emailed || 0
      acc.replied += run.replied || 0
      acc.booked += run.booked || 0
      acc.bounced += run.bounced || 0
      acc.unsubscribed += run.unsubscribed || 0
      acc.branchMix.clicked += run.funnel_diagnostics?.follow_up_branches?.clicked ?? 0
      acc.branchMix.opened += run.funnel_diagnostics?.follow_up_branches?.opened ?? 0
      acc.branchMix.cold += run.funnel_diagnostics?.follow_up_branches?.cold ?? 0
      acc.branchMix.replied_later += run.funnel_diagnostics?.follow_up_branches?.replied_later ?? 0
      acc.sourceMix.exa += run.funnel_diagnostics?.email_sources?.exa ?? 0
      acc.sourceMix.scraped += run.funnel_diagnostics?.email_sources?.scraped ?? 0
      acc.sourceMix.pattern += run.funnel_diagnostics?.email_sources?.pattern ?? 0
      return acc
    },
    {
      sent: 0,
      replied: 0,
      booked: 0,
      bounced: 0,
      unsubscribed: 0,
      branchMix: { clicked: 0, opened: 0, cold: 0, replied_later: 0 },
      sourceMix: { exa: 0, scraped: 0, pattern: 0 },
    },
  )

  const sent = totals.sent || 0
  const replyRateValue = sent > 0 ? totals.replied / sent : 0
  const bounceRateValue = sent > 0 ? totals.bounced / sent : 0
  const unsubscribeRateValue = sent > 0 ? totals.unsubscribed / sent : 0
  const bookedRateValue = sent > 0 ? totals.booked / sent : 0
  const patternShare = sent > 0
    ? totals.sourceMix.pattern / Math.max(1, totals.sourceMix.exa + totals.sourceMix.scraped + totals.sourceMix.pattern)
    : 0
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        72
          + bookedRateValue * 40
          + replyRateValue * 25
          - bounceRateValue * 45
          - unsubscribeRateValue * 20
          - patternShare * 10,
      ),
    ),
  )

  return {
    definitionId: definition.id,
    totalRuns: scopedRuns.length,
    sent: totals.sent,
    replied: totals.replied,
    booked: totals.booked,
    bounced: totals.bounced,
    unsubscribed: totals.unsubscribed,
    branchMix: totals.branchMix,
    sourceMix: totals.sourceMix,
    sourcePerformance: sourcePerformanceRows
      .filter((row) => row.campaign_definition_id === definition.id)
      .sort((a, b) => b.leads - a.leads),
    latestRun: scopedRuns[0] ?? null,
    healthScore,
  }
}

export function healthTone(score: number) {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (score >= 65) return 'text-blue-700 bg-blue-50 border-blue-200'
  if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-red-700 bg-red-50 border-red-200'
}

export function bookingRate(booked: number, emailed: number) {
  if (!emailed) return '—'
  return `${((booked / emailed) * 100).toFixed(1)}%`
}

export function unsubscribeRate(unsubscribed: number, emailed: number) {
  if (!emailed) return '—'
  return `${((unsubscribed / emailed) * 100).toFixed(1)}%`
}
