import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Check, X, ChevronRight, Phone, Building2, Hash, Calendar, Mail, UserPlus } from 'lucide-react'
import {
  fetchCustomers,
  fetchPlans,
  assignProductToCustomer,
  updateCustomerProduct,
  removeCustomerProduct,
  updateCustomerPhone,
  updateCustomerEmail,
  upsertCustomerProfile,
  createCustomer,
  type CustomerSummary,
  type CustomerProfile,
  type Plan,
  type UserProduct,
} from '../services/api'

const PRODUCTS = [
  { slug: 'receptionist', name: 'Receptionist' },
  { slug: 'sales',        name: 'Sales Agent' },
  { slug: 'consultant',   name: 'Consultant' },
  { slug: 'support',      name: 'Support' },
]

interface ProductEditState {
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

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

function displayName(c: CustomerSummary) {
  const { firstName, lastName } = c.profile
  if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(' ')
  return c.email
}

// Inline editable field
function Field({
  label,
  icon: Icon,
  value,
  placeholder,
  type = 'text',
  onSave,
}: {
  label: string
  icon: React.ElementType
  value: string | null
  placeholder: string
  type?: string
  onSave: (val: string | null) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  function start() {
    setDraft(value ?? '')
    setEditing(true)
  }

  async function save() {
    setSaving(true)
    await onSave(draft.trim() || null)
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-100 last:border-0">
      <Icon size={14} className="text-neutral-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-400 mb-0.5">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
              autoFocus
              className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <button onClick={save} disabled={saving} className="text-neutral-500 hover:text-neutral-900 disabled:opacity-40 shrink-0">
              <Check size={13} />
            </button>
            <button onClick={cancel} className="text-neutral-400 hover:text-neutral-600 shrink-0">
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={start}
            className="flex items-center gap-1.5 group text-left w-full"
          >
            <span className={`text-sm ${value ? 'text-neutral-800' : 'text-neutral-300'}`}>
              {value ?? placeholder}
            </span>
            <Pencil size={11} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Product edit state
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editState, setEditState] = useState<ProductEditState>({ planId: 0, customPriceCad: '', customNotes: '' })

  // Add product form
  const [adding, setAdding] = useState(false)
  const [addState, setAddState] = useState({ productSlug: '', planId: 0, customPriceCad: '', customNotes: '' })
  const [saving, setSaving] = useState(false)

  // New customer modal
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [newCustomerState, setNewCustomerState] = useState({ email: '', firstName: '', lastName: '' })
  const [newCustomerSaving, setNewCustomerSaving] = useState(false)
  const [newCustomerError, setNewCustomerError] = useState<string | null>(null)
  const newCustomerEmailRef = useRef<HTMLInputElement>(null)

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
    fetchCustomers().then(setCustomers).catch(() => setError('Failed to reload'))
  }

  // ── Profile field savers ────────────────────────────────────────────────

  async function saveProfileField(field: keyof CustomerProfile, value: string | null) {
    if (!selectedId) return
    await upsertCustomerProfile(selectedId, { [field]: value })
    reload()
  }

  async function savePhone(value: string | null) {
    if (!selectedId) return
    await updateCustomerPhone(selectedId, value)
    reload()
  }

  async function saveEmail(value: string | null) {
    if (!selectedId || !value) return
    await updateCustomerEmail(selectedId, value)
    reload()
  }

  async function handleCreateCustomer() {
    if (!newCustomerState.email.trim()) return
    setNewCustomerSaving(true)
    setNewCustomerError(null)
    try {
      const result = await createCustomer(
        newCustomerState.email.trim(),
        newCustomerState.firstName.trim() || null,
        newCustomerState.lastName.trim() || null,
      )
      setNewCustomerOpen(false)
      setNewCustomerState({ email: '', firstName: '', lastName: '' })
      // Reload and select the new customer
      const updated = await fetchCustomers()
      setCustomers(updated)
      setSelectedId(result.userId)
    } catch (err: unknown) {
      setNewCustomerError(err instanceof Error ? err.message : 'Failed to create customer')
    } finally {
      setNewCustomerSaving(false)
    }
  }

  // ── Product management ──────────────────────────────────────────────────

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
    } catch { setError('Failed to save changes') }
    finally { setSaving(false) }
  }

  async function handleRemove(productSlug: string) {
    if (!selectedId) return
    setSaving(true)
    try { await removeCustomerProduct(selectedId, productSlug); reload() }
    catch { setError('Failed to remove product') }
    finally { setSaving(false) }
  }

  const assignedSlugs = new Set(selected?.products.map((p) => p.productSlug) ?? [])
  const availableProducts = PRODUCTS.filter((p) => !assignedSlugs.has(p.slug))

  function openAdd() {
    setAddState({ productSlug: availableProducts[0]?.slug ?? '', planId: plans[0]?.id ?? 0, customPriceCad: '', customNotes: '' })
    setAdding(true)
  }

  async function saveAdd() {
    if (!selectedId || !addState.productSlug || !addState.planId) return
    setSaving(true)
    try {
      await assignProductToCustomer(
        selectedId, addState.productSlug, addState.planId,
        addState.customPriceCad !== '' ? parseFloat(addState.customPriceCad) : null,
        addState.customNotes || null,
      )
      setAdding(false)
      reload()
    } catch { setError('Failed to assign product') }
    finally { setSaving(false) }
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

      {/* Customer list sidebar */}
      <aside className="w-64 bg-white/80 border-r border-neutral-200/60 flex flex-col shrink-0 overflow-y-auto">
        <div className="px-5 pt-16 pb-4 border-b border-neutral-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wider uppercase text-neutral-900">Customers</p>
              <p className="text-xs text-neutral-400 mt-0.5">{customers.length} account{customers.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => { setNewCustomerOpen(true); setNewCustomerError(null); setTimeout(() => newCustomerEmailRef.current?.focus(), 50) }}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Add customer"
            >
              <UserPlus size={15} />
            </button>
          </div>
        </div>
        <div className="flex-1 py-2">
          {customers.length === 0 ? (
            <p className="px-5 py-4 text-xs text-neutral-400">No customers yet.</p>
          ) : (
            customers.map((c) => (
              <button
                key={c.userId}
                onClick={() => { setSelectedId(c.userId); setAdding(false); setEditingSlug(null) }}
                className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
                  selectedId === c.userId ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{displayName(c)}</p>
                  <p className="text-xs text-neutral-400 mt-0.5 truncate">
                    {c.profile.companyName ?? c.email}
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
          <div className="max-w-2xl space-y-6">

            {/* Profile card */}
            <div className="bg-white/70 border border-neutral-200/60 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400">Profile</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Member since</span>
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <Calendar size={11} />
                    {formatDate(selected.memberSince)}
                  </span>
                </div>
              </div>

              <Field
                label="First name"
                icon={Pencil}
                value={selected.profile.firstName}
                placeholder="Add first name"
                onSave={(v) => saveProfileField('firstName', v)}
              />
              <Field
                label="Last name"
                icon={Pencil}
                value={selected.profile.lastName}
                placeholder="Add last name"
                onSave={(v) => saveProfileField('lastName', v)}
              />
              <Field
                label="Company"
                icon={Building2}
                value={selected.profile.companyName}
                placeholder="Add company name"
                onSave={(v) => saveProfileField('companyName', v)}
              />
              <Field
                label="Email"
                icon={Mail}
                value={selected.email}
                placeholder="—"
                type="email"
                onSave={saveEmail}
              />
              <Field
                label="Phone"
                icon={Phone}
                value={selected.phone}
                placeholder="Add phone number"
                type="tel"
                onSave={savePhone}
              />
              <Field
                label="Twilio number"
                icon={Hash}
                value={selected.profile.twilioNumber}
                placeholder="Add Twilio number"
                type="tel"
                onSave={(v) => saveProfileField('twilioNumber', v)}
              />
            </div>

            {/* Products card */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400">
                  Products
                  <span className="ml-2 text-neutral-300 font-normal">
                    {selected.products.length} active
                  </span>
                </p>
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

              <div className="space-y-3">
                {selected.products.length === 0 && !adding && (
                  <p className="text-xs text-neutral-400">No products assigned yet.</p>
                )}

                {selected.products.map((p) => {
                  const isEditing = editingSlug === p.productSlug
                  return (
                    <div key={p.productSlug} className="bg-white/70 border border-neutral-200/60 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-4">
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
                        {!isEditing && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => startEdit(p)} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleRemove(p.productSlug)} disabled={saving} className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

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
                                type="number" min="0" step="0.01"
                                placeholder="Use plan default"
                                value={editState.customPriceCad}
                                onChange={(e) => setEditState((s) => ({ ...s, customPriceCad: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-500 mb-1">Notes</label>
                            <input
                              type="text" placeholder="e.g. Q1 deal — 20% off for 3 months"
                              value={editState.customNotes}
                              onChange={(e) => setEditState((s) => ({ ...s, customNotes: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => saveEdit(p.productSlug)} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-40">
                              <Check size={13} /> Save
                            </button>
                            <button onClick={() => setEditingSlug(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-500 text-xs rounded-lg hover:bg-neutral-100">
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
                            type="number" min="0" step="0.01" placeholder="Use plan default"
                            value={addState.customPriceCad}
                            onChange={(e) => setAddState((s) => ({ ...s, customPriceCad: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">Notes</label>
                          <input
                            type="text" placeholder="e.g. Q1 deal"
                            value={addState.customNotes}
                            onChange={(e) => setAddState((s) => ({ ...s, customNotes: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={saveAdd} disabled={saving || !addState.productSlug || !addState.planId} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-40">
                          <Check size={13} /> Assign
                        </button>
                        <button onClick={() => setAdding(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-500 text-xs rounded-lg hover:bg-neutral-100">
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New customer modal */}
      {newCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setNewCustomerOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-neutral-200 w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold tracking-wider uppercase text-neutral-900">New Customer</p>
              <button onClick={() => setNewCustomerOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={16} />
              </button>
            </div>

            {newCustomerError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                {newCustomerError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Email <span className="text-red-400">*</span></label>
                <input
                  ref={newCustomerEmailRef}
                  type="email"
                  required
                  value={newCustomerState.email}
                  onChange={(e) => setNewCustomerState((s) => ({ ...s, email: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCustomer() }}
                  placeholder="customer@business.com"
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">First name</label>
                  <input
                    type="text"
                    value={newCustomerState.firstName}
                    onChange={(e) => setNewCustomerState((s) => ({ ...s, firstName: e.target.value }))}
                    placeholder="Jane"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Last name</label>
                  <input
                    type="text"
                    value={newCustomerState.lastName}
                    onChange={(e) => setNewCustomerState((s) => ({ ...s, lastName: e.target.value }))}
                    placeholder="Smith"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={handleCreateCustomer}
                disabled={newCustomerSaving || !newCustomerState.email.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition-colors"
              >
                {newCustomerSaving ? 'Creating...' : <><Plus size={13} /> Create customer</>}
              </button>
              <button
                onClick={() => setNewCustomerOpen(false)}
                className="px-4 py-2 text-neutral-500 text-xs rounded-lg hover:bg-neutral-100"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-neutral-400 mt-3 text-center">
              Customer can set their password via "Forgot password" on the login page.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
