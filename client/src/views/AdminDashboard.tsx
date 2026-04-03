import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X, ChevronRight } from 'lucide-react'
import {
  fetchCustomers,
  fetchPlans,
  assignProductToCustomer,
  updateCustomerProduct,
  removeCustomerProduct,
  updateCustomerPhone,
  type CustomerSummary,
  type Plan,
  type UserProduct,
} from '../services/api'

// Products available to assign. Mirrors PRODUCT_REGISTRY in App.tsx.
// Add a new entry here when a new product is launched.
const PRODUCTS = [
  { slug: 'receptionist', name: 'Receptionist' },
  { slug: 'sales',        name: 'Sales Agent' },
  { slug: 'consultant',   name: 'Consultant' },
  { slug: 'support',      name: 'Support' },
]

interface EditState {
  planId: number
  customPriceCad: string
  customNotes: string
}

function planBadgeClass(slug: string) {
  const map: Record<string, string> = {
    free:    'bg-neutral-100 text-neutral-500',
    starter: 'bg-blue-50 text-blue-600',
    pro:     'bg-violet-50 text-violet-600',
    max:     'bg-emerald-50 text-emerald-600',
    custom:  'bg-amber-50 text-amber-600',
  }
  return map[slug] ?? 'bg-neutral-100 text-neutral-500'
}

export default function AdminDashboard() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Phone edit state
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneValue, setPhoneValue] = useState('')

  // Per-product edit state
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ planId: 0, customPriceCad: '', customNotes: '' })

  // Add-product form
  const [adding, setAdding] = useState(false)
  const [addState, setAddState] = useState<{ productSlug: string; planId: number; customPriceCad: string; customNotes: string }>({
    productSlug: '',
    planId: 0,
    customPriceCad: '',
    customNotes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchPlans()])
      .then(([c, p]) => {
        setCustomers(c)
        setPlans(p)
        if (c.length > 0) setSelectedId(c[0].userId)
      })
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoading(false))
  }, [])

  const selected = customers.find((c) => c.userId === selectedId) ?? null

  function reload() {
    fetchCustomers()
      .then(setCustomers)
      .catch(() => setError('Failed to reload'))
  }

  // ── Edit phone ──────────────────────────────────────────────────────────

  function startEditPhone() {
    setPhoneValue(selected?.phone ?? '')
    setEditingPhone(true)
  }

  async function savePhone() {
    if (!selectedId) return
    setSaving(true)
    try {
      await updateCustomerPhone(selectedId, phoneValue.trim() || null)
      setEditingPhone(false)
      reload()
    } catch {
      setError('Failed to update phone')
    } finally {
      setSaving(false)
    }
  }

  // ── Edit an existing product ────────────────────────────────────────────

  function startEdit(p: UserProduct) {
    setEditingSlug(p.productSlug)
    setEditState({
      planId: p.planId,
      customPriceCad: p.customPriceCad != null ? String(p.customPriceCad) : '',
      customNotes: p.customNotes ?? '',
    })
  }

  async function saveEdit(productSlug: string) {
    if (!selectedId) return
    setSaving(true)
    try {
      await updateCustomerProduct(selectedId, productSlug, {
        planId: editState.planId,
        customPriceCad: editState.customPriceCad !== '' ? parseFloat(editState.customPriceCad) : null,
        customNotes: editState.customNotes || null,
      })
      setEditingSlug(null)
      reload()
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(productSlug: string) {
    if (!selectedId) return
    setSaving(true)
    try {
      await removeCustomerProduct(selectedId, productSlug)
      reload()
    } catch {
      setError('Failed to remove product')
    } finally {
      setSaving(false)
    }
  }

  // ── Add a new product ───────────────────────────────────────────────────

  const assignedSlugs = new Set(selected?.products.map((p) => p.productSlug) ?? [])
  const availableProducts = PRODUCTS.filter((p) => !assignedSlugs.has(p.slug))

  function openAdd() {
    setAddState({
      productSlug: availableProducts[0]?.slug ?? '',
      planId: plans[0]?.id ?? 0,
      customPriceCad: '',
      customNotes: '',
    })
    setAdding(true)
  }

  async function saveAdd() {
    if (!selectedId || !addState.productSlug || !addState.planId) return
    setSaving(true)
    try {
      await assignProductToCustomer(
        selectedId,
        addState.productSlug,
        addState.planId,
        addState.customPriceCad !== '' ? parseFloat(addState.customPriceCad) : null,
        addState.customNotes || null,
      )
      setAdding(false)
      reload()
    } catch {
      setError('Failed to assign product')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-xs tracking-widest text-neutral-400 uppercase animate-pulse">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">

      {/* Customer list */}
      <aside className="w-64 bg-white/80 border-r border-neutral-200/60 flex flex-col shrink-0 overflow-y-auto">
        <div className="px-5 pt-16 pb-4 border-b border-neutral-200/60">
          <p className="text-sm font-semibold tracking-wider uppercase text-neutral-900">Customers</p>
          <p className="text-xs text-neutral-400 mt-0.5">{customers.length} account{customers.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 py-2">
          {customers.length === 0 ? (
            <p className="px-5 py-4 text-xs text-neutral-400">No customers yet.</p>
          ) : (
            customers.map((c) => (
              <button
                key={c.userId}
                onClick={() => { setSelectedId(c.userId); setAdding(false); setEditingSlug(null); setEditingPhone(false) }}
                className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
                  selectedId === c.userId
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{c.email}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {c.products.length} product{c.products.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {selectedId === c.userId && <ChevronRight size={14} className="text-neutral-400 shrink-0 ml-2" />}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex-1 overflow-y-auto px-8 py-8">

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-neutral-400 tracking-widest uppercase">Select a customer</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">{selected.email}</h2>

                {/* Phone — inline editable */}
                {editingPhone ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="tel"
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="px-2 py-1 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 w-44"
                      autoFocus
                    />
                    <button onClick={savePhone} disabled={saving} className="text-neutral-500 hover:text-neutral-900 disabled:opacity-40">
                      <Check size={13} />
                    </button>
                    <button onClick={() => setEditingPhone(false)} className="text-neutral-400 hover:text-neutral-600">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startEditPhone}
                    className="flex items-center gap-1.5 mt-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors group"
                  >
                    <span>{selected.phone ?? 'Add phone'}</span>
                    <Pencil size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}

                <p className="text-xs text-neutral-400 mt-1 tracking-widest uppercase">
                  {selected.products.length} active product{selected.products.length !== 1 ? 's' : ''}
                </p>
              </div>
              {availableProducts.length > 0 && !adding && (
                <button
                  onClick={openAdd}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <Plus size={13} />
                  Add product
                </button>
              )}
            </div>

            {/* Product cards */}
            <div className="space-y-3">
              {selected.products.length === 0 && !adding && (
                <p className="text-xs text-neutral-400">No products assigned. Click "Add product" to get started.</p>
              )}

              {selected.products.map((p) => {
                const isEditing = editingSlug === p.productSlug
                return (
                  <div key={p.productSlug} className="bg-white/70 border border-neutral-200/60 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{p.productName}</p>
                          {!isEditing && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planBadgeClass(p.planSlug)}`}>
                                {p.planName}
                              </span>
                              {p.customPriceCad != null && (
                                <span className="text-xs text-neutral-500">${p.customPriceCad.toFixed(2)}/mo</span>
                              )}
                              {p.customNotes && (
                                <span className="text-xs text-neutral-400 italic truncate max-w-xs">{p.customNotes}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => startEdit(p)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 transition-colors rounded-lg hover:bg-neutral-100"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleRemove(p.productSlug)}
                            disabled={saving}
                            className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline edit form */}
                    {isEditing && (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-neutral-500 mb-1">Plan</label>
                            <select
                              value={editState.planId}
                              onChange={(e) => setEditState((s) => ({ ...s, planId: Number(e.target.value) }))}
                              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            >
                              {plans.map((pl) => (
                                <option key={pl.id} value={pl.id}>{pl.name}{pl.priceCad != null ? ` — $${pl.priceCad}/mo` : ''}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-500 mb-1">Custom price (CAD/mo)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Leave blank to use plan price"
                              value={editState.customPriceCad}
                              onChange={(e) => setEditState((s) => ({ ...s, customPriceCad: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">Notes</label>
                          <input
                            type="text"
                            placeholder="e.g. Q1 deal — 20% off for 3 months"
                            value={editState.customNotes}
                            onChange={(e) => setEditState((s) => ({ ...s, customNotes: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(p.productSlug)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-40"
                          >
                            <Check size={13} /> Save
                          </button>
                          <button
                            onClick={() => setEditingSlug(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-500 text-xs rounded-lg hover:bg-neutral-100"
                          >
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add product form */}
              {adding && (
                <div className="bg-white/70 border border-neutral-200/60 rounded-xl p-5">
                  <p className="text-sm font-medium text-neutral-900 mb-4">Add product</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Product</label>
                        <select
                          value={addState.productSlug}
                          onChange={(e) => setAddState((s) => ({ ...s, productSlug: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        >
                          {availableProducts.map((p) => (
                            <option key={p.slug} value={p.slug}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Plan</label>
                        <select
                          value={addState.planId}
                          onChange={(e) => setAddState((s) => ({ ...s, planId: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        >
                          {plans.map((pl) => (
                            <option key={pl.id} value={pl.id}>{pl.name}{pl.priceCad != null ? ` — $${pl.priceCad}/mo` : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Custom price (CAD/mo)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Leave blank to use plan price"
                          value={addState.customPriceCad}
                          onChange={(e) => setAddState((s) => ({ ...s, customPriceCad: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Notes</label>
                        <input
                          type="text"
                          placeholder="e.g. Q1 deal — 20% off for 3 months"
                          value={addState.customNotes}
                          onChange={(e) => setAddState((s) => ({ ...s, customNotes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveAdd}
                        disabled={saving || !addState.productSlug || !addState.planId}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-40"
                      >
                        <Check size={13} /> Assign
                      </button>
                      <button
                        onClick={() => setAdding(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-500 text-xs rounded-lg hover:bg-neutral-100"
                      >
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
