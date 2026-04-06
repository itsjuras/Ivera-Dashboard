import { describe, expect, it } from 'vitest'

import {
  buildCampaignAnalytics,
  bookingRate,
  healthTone,
  replyRate,
  sourceLabel,
  type CampaignDefinitionSummary,
  type CampaignRun,
  type CampaignSourcePerformanceRow,
} from './salesAnalytics'

function makeDefinition(overrides: Partial<CampaignDefinitionSummary> = {}): CampaignDefinitionSummary {
  return {
    id: 'campaign-1',
    name: 'Mortgage Brokers',
    product_name: 'Ivera AI Automation',
    product_context: 'Context',
    target_description: 'Description',
    num_leads_per_run: 40,
    status: 'active',
    is_default: false,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

function makeRun(overrides: Partial<CampaignRun> = {}): CampaignRun {
  return {
    id: 'run-1',
    product_name: 'Ivera AI Automation',
    campaign_definition_id: 'campaign-1',
    target_description: 'Description',
    created_at: '2026-04-01T00:00:00Z',
    total_leads: 10,
    qualified_leads: 10,
    emailed: 10,
    replied: 2,
    booked: 1,
    unsubscribed: 1,
    bounced: 1,
    avg_score: 7.5,
    last_lead_at: '2026-04-01T00:10:00Z',
    funnel_diagnostics: {
      email_sources: { exa: 6, scraped: 3, pattern: 1 },
      follow_up_branches: { clicked: 2, opened: 3, cold: 1, replied_later: 0 },
    },
    ...overrides,
  }
}

describe('sales analytics helpers', () => {
  it('buildCampaignAnalytics aggregates campaign runs and source performance', () => {
    const definition = makeDefinition()
    const runs: CampaignRun[] = [
      makeRun(),
      makeRun({
        id: 'run-2',
        created_at: '2026-04-02T00:00:00Z',
        emailed: 8,
        replied: 1,
        booked: 0,
        unsubscribed: 0,
        bounced: 2,
        funnel_diagnostics: {
          email_sources: { exa: 2, scraped: 4, pattern: 2 },
          follow_up_branches: { clicked: 1, opened: 2, cold: 5, replied_later: 1 },
        },
      }),
      makeRun({
        id: 'run-other',
        campaign_definition_id: 'campaign-2',
        created_at: '2026-04-03T00:00:00Z',
      }),
    ]
    const sourcePerformanceRows: CampaignSourcePerformanceRow[] = [
      { campaign_definition_id: 'campaign-1', source: 'scraped', leads: 5, replied: 2, booked: 1, bounced: 0, unsubscribed: 0 },
      { campaign_definition_id: 'campaign-1', source: 'pattern', leads: 3, replied: 0, booked: 0, bounced: 2, unsubscribed: 0 },
      { campaign_definition_id: 'campaign-1', source: 'exa', leads: 7, replied: 1, booked: 0, bounced: 0, unsubscribed: 1 },
      { campaign_definition_id: 'campaign-2', source: 'exa', leads: 4, replied: 1, booked: 0, bounced: 0, unsubscribed: 0 },
    ]

    const result = buildCampaignAnalytics(definition, runs, sourcePerformanceRows)

    expect(result).not.toBeNull()
    expect(result?.totalRuns).toBe(2)
    expect(result?.sent).toBe(18)
    expect(result?.replied).toBe(3)
    expect(result?.booked).toBe(1)
    expect(result?.bounced).toBe(3)
    expect(result?.unsubscribed).toBe(1)
    expect(result?.branchMix).toEqual({ clicked: 3, opened: 5, cold: 6, replied_later: 1 })
    expect(result?.sourceMix).toEqual({ exa: 8, scraped: 7, pattern: 3 })
    expect(result?.latestRun?.id).toBe('run-2')
    expect(result?.sourcePerformance.map((row) => row.source)).toEqual(['exa', 'scraped', 'pattern'])
  })

  it('buildCampaignAnalytics computes a lower health score for bouncy pattern-heavy runs', () => {
    const healthy = buildCampaignAnalytics(
      makeDefinition({ id: 'healthy' }),
      [
        makeRun({
          campaign_definition_id: 'healthy',
          emailed: 20,
          replied: 5,
          booked: 2,
          unsubscribed: 0,
          bounced: 1,
          funnel_diagnostics: {
            email_sources: { exa: 14, scraped: 6, pattern: 0 },
            follow_up_branches: { clicked: 4, opened: 6, cold: 2, replied_later: 0 },
          },
        }),
      ],
      [],
    )

    const risky = buildCampaignAnalytics(
      makeDefinition({ id: 'risky' }),
      [
        makeRun({
          campaign_definition_id: 'risky',
          emailed: 20,
          replied: 1,
          booked: 0,
          unsubscribed: 2,
          bounced: 7,
          funnel_diagnostics: {
            email_sources: { exa: 2, scraped: 3, pattern: 15 },
            follow_up_branches: { clicked: 0, opened: 2, cold: 10, replied_later: 0 },
          },
        }),
      ],
      [],
    )

    expect(healthy?.healthScore).toBeGreaterThan(risky?.healthScore ?? 0)
    expect(healthTone(healthy?.healthScore ?? 0)).toMatch(/emerald|blue|amber/)
    expect(healthTone(risky?.healthScore ?? 0)).toMatch(/amber|red/)
  })

  it('formats display helpers predictably', () => {
    expect(replyRate(2, 8)).toBe('25.0%')
    expect(replyRate(0, 0)).toBe('—')
    expect(bookingRate(1, 4)).toBe('25.0%')
    expect(sourceLabel('scraped')).toBe('Scraped')
  })
})
