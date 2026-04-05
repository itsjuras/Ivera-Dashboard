import { useEffect, useMemo, useState } from 'react'
import {
  fetchExaUsage,
  fetchProviderSpend,
  fetchSendGridUsage,
  saveProviderSpend,
  syncProviderSpend,
} from '../../services/api'

type SpendProviderKey =
  | 'twilio'
  | 'aws'
  | 'openai'
  | 'claude'
  | 'digitalocean'
  | 'sendgrid'
  | 'exa'
  | 'supabase'
  | 'vercel'
  | 'stripe'
  | 'deepgram'
  | 'cal'
  | 'other'

const SPEND_PROVIDERS: Array<{ key: SpendProviderKey; label: string }> = [
  { key: 'twilio', label: 'Twilio' },
  { key: 'aws', label: 'AWS' },
  { key: 'openai', label: 'OpenAI' },
  { key: 'claude', label: 'Claude' },
  { key: 'digitalocean', label: 'DigitalOcean' },
  { key: 'sendgrid', label: 'SendGrid' },
  { key: 'exa', label: 'Exa' },
  { key: 'supabase', label: 'Supabase' },
  { key: 'vercel', label: 'Vercel' },
  { key: 'stripe', label: 'Stripe' },
  { key: 'deepgram', label: 'Deepgram' },
  { key: 'cal', label: 'Cal.com' },
  { key: 'other', label: 'Other' },
]

const AUTO_SYNC_PROVIDER_KEYS = new Set<SpendProviderKey>([
  'openai',
  'claude',
  'twilio',
  'digitalocean',
  'aws',
])

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7)
}

export default function SpendTrackerPanel() {
  const [spendMonth] = useState(currentMonthKey())
  const [providerSpend, setProviderSpend] = useState<Record<SpendProviderKey, string>>({
    twilio: '',
    aws: '',
    openai: '',
    claude: '',
    digitalocean: '',
    sendgrid: '',
    exa: '',
    supabase: '',
    vercel: '',
    stripe: '',
    deepgram: '',
    cal: '',
    other: '',
  })
  const [spendLoading, setSpendLoading] = useState(false)
  const [spendSaving, setSpendSaving] = useState(false)
  const [spendSyncing, setSpendSyncing] = useState(false)
  const [spendStatus, setSpendStatus] = useState<string | null>(null)
  const [spendApiAvailable, setSpendApiAvailable] = useState(false)
  const [lastSharedUpdate, setLastSharedUpdate] = useState<string | null>(null)
  const [sendGridUsage, setSendGridUsage] = useState<{
    creditsRemaining: number | null
    creditsTotal: number | null
    usedQuotaPercent: number | null
  } | null>(null)
  const [sendGridUsageError, setSendGridUsageError] = useState<string | null>(null)
  const [exaUsage, setExaUsage] = useState<{
    totalCostUsd: number | null
    apiKeyName: string | null
    breakdownCount: number
    topLineItems: Array<{
      priceName: string
      quantity: number | null
      amountUsd: number | null
    }>
  } | null>(null)
  const [exaUsageError, setExaUsageError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storageKey = `ivera-sales-admin-spend:${spendMonth}`
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      setProviderSpend((current) => ({ ...current, ...parsed }))
    } catch {
      // Ignore malformed local cache.
    }
  }, [spendMonth])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storageKey = `ivera-sales-admin-spend:${spendMonth}`
    window.localStorage.setItem(storageKey, JSON.stringify(providerSpend))
  }, [providerSpend, spendMonth])

  useEffect(() => {
    let cancelled = false
    setSpendLoading(true)

    fetchProviderSpend(spendMonth)
      .then((data) => {
        if (cancelled) return
        setProviderSpend((current) => {
          const nextState = { ...current }
          for (const entry of data.entries) {
            if (entry.providerSlug in nextState) {
              nextState[entry.providerSlug as SpendProviderKey] =
                entry.amountCad === null || entry.amountCad === undefined ? '' : String(entry.amountCad)
            }
          }
          return nextState
        })
        const latest = data.entries
          .map((entry) => entry.updatedAt)
          .filter((value): value is string => Boolean(value))
          .sort()
          .at(-1) ?? null
        setLastSharedUpdate(latest)
        setSpendApiAvailable(true)
        setSpendStatus('Shared spend tracker connected.')
      })
      .catch((err) => {
        if (cancelled) return
        setSpendApiAvailable(false)
        setSpendStatus(err instanceof Error ? err.message : 'Using browser fallback until the shared spend table is ready.')
      })
      .finally(() => {
        if (!cancelled) setSpendLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [spendMonth])

  useEffect(() => {
    let cancelled = false

    fetchSendGridUsage(spendMonth)
      .then((data) => {
        if (cancelled) return
        setSendGridUsageError(null)
        setSendGridUsage({
          creditsRemaining: data.creditsRemaining,
          creditsTotal: data.creditsTotal,
          usedQuotaPercent: data.usedQuotaPercent,
        })
      })
      .catch((err) => {
        if (cancelled) return
        setSendGridUsage(null)
        setSendGridUsageError(err instanceof Error ? err.message : 'Could not load SendGrid usage.')
      })

    return () => {
      cancelled = true
    }
  }, [spendMonth])

  useEffect(() => {
    let cancelled = false

    fetchExaUsage(spendMonth)
      .then((data) => {
        if (cancelled) return
        setExaUsageError(null)
        setExaUsage({
          totalCostUsd: data.totalCostUsd,
          apiKeyName: data.apiKeyName,
          breakdownCount: data.breakdownCount,
          topLineItems: data.topLineItems,
        })
      })
      .catch((err) => {
        if (cancelled) return
        setExaUsage(null)
        setExaUsageError(err instanceof Error ? err.message : 'Could not load Exa usage.')
      })

    return () => {
      cancelled = true
    }
  }, [spendMonth])

  const totalProviderSpend = useMemo(
    () =>
      SPEND_PROVIDERS.reduce((sum, provider) => {
        const amount = Number(providerSpend[provider.key])
        return sum + (Number.isFinite(amount) ? amount : 0)
      }, 0),
    [providerSpend],
  )

  async function handleSaveProviderSpend() {
    setSpendSaving(true)
    setSpendStatus(null)

    try {
      const payload = SPEND_PROVIDERS.map((provider) => ({
        providerSlug: provider.key,
        amountCad:
          providerSpend[provider.key].trim() === ''
            ? null
            : Number(providerSpend[provider.key]),
        notes: null,
      }))

      await saveProviderSpend(spendMonth, payload)
      setSpendApiAvailable(true)
      setSpendStatus('Shared spend tracker saved.')
    } catch (err) {
      setSpendApiAvailable(false)
      setSpendStatus(err instanceof Error ? err.message : 'Could not save spendings.')
    } finally {
      setSpendSaving(false)
    }
  }

  async function handleSyncProviderSpend() {
    setSpendSyncing(true)
    setSpendStatus(null)

    try {
      const result = await syncProviderSpend(spendMonth)

      setProviderSpend((current) => {
        const nextState = { ...current }
        for (const entry of result.entries) {
          if (entry.providerSlug in nextState) {
            nextState[entry.providerSlug as SpendProviderKey] =
              entry.amountCad === null || entry.amountCad === undefined ? '' : String(entry.amountCad)
          }
        }
        return nextState
      })

      const latest = result.entries
        .map((entry) => entry.updatedAt)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null
      setLastSharedUpdate(latest)

      setSpendApiAvailable(true)

      const syncedLabels = result.syncedProviders
        .map((providerSlug) => SPEND_PROVIDERS.find((provider) => provider.key === providerSlug)?.label || providerSlug)
      const skippedLabels = result.skippedProviders
        .map((item) => SPEND_PROVIDERS.find((provider) => provider.key === item.providerSlug)?.label || item.providerSlug)

      if (syncedLabels.length > 0 && skippedLabels.length > 0) {
        setSpendStatus(`Auto-synced ${syncedLabels.join(', ')}. Still manual: ${skippedLabels.join(', ')}.`)
      } else if (syncedLabels.length > 0) {
        setSpendStatus(`Auto-synced ${syncedLabels.join(', ')}.`)
      } else if (skippedLabels.length > 0) {
        setSpendStatus(`No provider values were auto-synced yet. Still manual: ${skippedLabels.join(', ')}.`)
      } else {
        setSpendStatus('No supported provider values were auto-synced yet.')
      }
    } catch (err) {
      setSpendApiAvailable(false)
      setSpendStatus(err instanceof Error ? err.message : 'Could not auto-sync provider spend yet.')
    } finally {
      setSpendSyncing(false)
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200/60 bg-white/70 p-5">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] tracking-widest uppercase text-neutral-400">Spend Tracker</p>
            <h2 className="text-lg font-semibold text-neutral-900">Provider costs and usage</h2>
            <p className="max-w-3xl text-sm text-neutral-700">
              Track shared monthly provider spend in one place. Supported providers auto-sync first, while the remaining rows stay editable until their billing APIs are wired in.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            {spendMonth}
          </div>
        </div>

        {spendStatus && (
          <div className={`rounded-lg px-4 py-3 text-sm ${
            spendApiAvailable
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            {spendStatus}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SPEND_PROVIDERS.map((provider) => (
            <label key={provider.key} className="space-y-2">
              <span className="flex items-center gap-2 text-[11px] tracking-widest uppercase text-neutral-400">
                <span>{provider.label}</span>
                {AUTO_SYNC_PROVIDER_KEYS.has(provider.key) ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold tracking-[0.18em] text-emerald-700">
                    Auto
                  </span>
                ) : null}
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400">$</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={providerSpend[provider.key]}
                  onChange={(event) =>
                    setProviderSpend((current) => ({
                      ...current,
                      [provider.key]: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white/80 py-3 pl-8 pr-4 text-sm text-neutral-700 outline-none transition focus:border-neutral-400"
                />
              </div>
            </label>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-4 text-white">
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Tracked Monthly Spend</p>
          <p className="mt-1 text-2xl font-semibold">${totalProviderSpend.toFixed(2)}</p>
          <p className="mt-1 text-xs text-neutral-400">Auto-sync is live for OpenAI, Claude, Twilio, DigitalOcean, and AWS. SendGrid and Exa stay manual in the ledger, with usage helpers shown below.</p>
          {lastSharedUpdate ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              Last shared update {new Date(lastSharedUpdate).toLocaleString()}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">SendGrid Usage</p>
            {sendGridUsage ? (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-neutral-500">Credits Remaining</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">{sendGridUsage.creditsRemaining ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Credits Total</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">{sendGridUsage.creditsTotal ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Quota Used</p>
                  <p className="mt-1 text-lg font-semibold text-neutral-900">
                    {sendGridUsage.usedQuotaPercent !== null && sendGridUsage.usedQuotaPercent !== undefined
                      ? `${sendGridUsage.usedQuotaPercent}%`
                      : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-neutral-500">
                {sendGridUsageError || 'Usage helper unavailable right now. SendGrid spend stays manual.'}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">Exa Usage</p>
            {exaUsage ? (
              <div className="mt-2 space-y-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-neutral-500">Total Cost (USD)</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">
                      {exaUsage.totalCostUsd !== null && exaUsage.totalCostUsd !== undefined
                        ? `$${exaUsage.totalCostUsd.toFixed(2)}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">API Key</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{exaUsage.apiKeyName || 'Configured key'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Line Items</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">{exaUsage.breakdownCount}</p>
                  </div>
                </div>
                {exaUsage.topLineItems.length > 0 ? (
                  <div className="space-y-2">
                    {exaUsage.topLineItems.map((item) => (
                      <div
                        key={`${item.priceName}-${item.amountUsd ?? 'na'}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-900">{item.priceName}</p>
                          <p className="text-xs text-neutral-500">
                            {item.quantity !== null && item.quantity !== undefined ? `${item.quantity} units` : 'Usage quantity unavailable'}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {item.amountUsd !== null && item.amountUsd !== undefined ? `$${item.amountUsd.toFixed(2)}` : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-xs text-neutral-500">
                {exaUsageError || 'Exa usage helper unavailable right now. This needs `EXA_SERVICE_API_KEY` and `EXA_API_KEY_ID` on the server.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs text-neutral-500">
            {spendLoading
              ? 'Checking shared spend ledger...'
              : spendApiAvailable
                ? 'Saving updates writes to the shared admin ledger.'
                : 'Saving updates will stay in browser fallback mode until the shared ledger table is created.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncProviderSpend}
              disabled={spendSyncing || spendSaving || spendLoading}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 transition hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {spendSyncing ? 'Syncing...' : 'Auto Sync Supported'}
            </button>
            <button
              type="button"
              onClick={handleSaveProviderSpend}
              disabled={spendSaving || spendSyncing || spendLoading}
              className="rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {spendSaving ? 'Saving...' : 'Save Spendings'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
