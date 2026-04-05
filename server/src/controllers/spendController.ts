import type { Response } from 'express'
import type { AuthRequest } from '../middleware/requireAuth'
import { listProviderSpend, upsertProviderSpend } from '../models/spendModel'
import { syncProviderSpend } from '../lib/providerSpendSync'

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export async function getProviderSpend(req: AuthRequest, res: Response): Promise<void> {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : currentMonth()
    const entries = await listProviderSpend(month)
    res.json({ month, entries })
  } catch (err: unknown) {
    console.error('getProviderSpend failed:', err)
    const message = err instanceof Error ? err.message : 'Failed to load provider spend'
    res.status(500).json({ error: message })
  }
}

export async function saveProviderSpend(req: AuthRequest, res: Response): Promise<void> {
  try {
    const month = typeof req.body?.month === 'string' ? req.body.month : currentMonth()
    const rawEntries = Array.isArray(req.body?.entries)
      ? (req.body.entries as Array<Record<string, unknown>>)
      : null

    if (!rawEntries) {
      res.status(400).json({ error: 'entries array is required' })
      return
    }

    const entries = rawEntries.map((entry: Record<string, unknown>) => ({
      providerSlug: String(entry.providerSlug || '').trim(),
      amountCad:
        entry.amountCad === null || entry.amountCad === undefined || entry.amountCad === ''
          ? null
          : Number(entry.amountCad),
      notes: typeof entry.notes === 'string' && entry.notes.trim() ? entry.notes.trim() : null,
    }))

    if (entries.some((entry: { providerSlug: string }) => !entry.providerSlug)) {
      res.status(400).json({ error: 'Each spend entry requires providerSlug' })
      return
    }

    if (entries.some((entry: { amountCad: number | null }) => entry.amountCad !== null && !Number.isFinite(entry.amountCad))) {
      res.status(400).json({ error: 'Each amountCad must be numeric or null' })
      return
    }

    const savedEntries = await upsertProviderSpend(month, entries, req.userId)
    res.json({ month, entries: savedEntries })
  } catch (err: unknown) {
    console.error('saveProviderSpend failed:', err)
    const message = err instanceof Error ? err.message : 'Failed to save provider spend'
    res.status(500).json({ error: message })
  }
}

export async function syncProviderSpendController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const month = typeof req.body?.month === 'string' ? req.body.month : currentMonth()
    const result = await syncProviderSpend(month, req.userId)
    res.json(result)
  } catch (err: unknown) {
    console.error('syncProviderSpend failed:', err)
    const message = err instanceof Error ? err.message : 'Failed to sync provider spend'
    res.status(500).json({ error: message })
  }
}
