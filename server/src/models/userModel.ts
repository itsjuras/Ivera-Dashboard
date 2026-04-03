import supabase from '../config/db'

export type Role = 'ivera_admin' | 'customer'

export interface Plan {
  id: number
  slug: string
  name: string
  description: string | null
  priceCad: number | null
}

export interface UserProduct {
  productSlug: string
  productName: string
  planId: number
  planSlug: string
  planName: string
  customPriceCad: number | null
  customNotes: string | null
  active: boolean
}

export interface CustomerSummary {
  userId: string
  email: string
  phone: string | null
  products: UserProduct[]
}

// All known product slugs — add new ones here as new products launch.
// The source of truth is the `products` DB table; this list is only used
// for the Ivera-admin auto-provisioning on first signup.
export const ALL_PRODUCT_SLUGS = [
  'receptionist',
  'sales',
  'consultant',
  'support',
] as const

export async function getUserRole(userId: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return (data?.role as Role) ?? null
}

export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data, error } = await supabase
    .from('user_products')
    .select(`
      product_slug,
      plan_id,
      custom_price_cad,
      custom_notes,
      active,
      products ( name ),
      plans ( slug, name )
    `)
    .eq('user_id', userId)
    .eq('active', true)

  if (error) throw error

  return (data ?? []).map((row) => ({
    productSlug: row.product_slug as string,
    productName: (row.products as unknown as { name: string } | null)?.name ?? row.product_slug as string,
    planId: row.plan_id as number,
    planSlug: (row.plans as unknown as { slug: string; name: string } | null)?.slug ?? '',
    planName: (row.plans as unknown as { slug: string; name: string } | null)?.name ?? '',
    customPriceCad: row.custom_price_cad as number | null,
    customNotes: row.custom_notes as string | null,
    active: row.active as boolean,
  }))
}

export async function getAllPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('id, slug, name, description, price_cad')
    .order('price_cad', { ascending: true, nullsFirst: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as number,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string | null,
    priceCad: row.price_cad as number | null,
  }))
}

export async function provisionIveraAdmin(userId: string): Promise<void> {
  const { error: roleErr } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'ivera_admin' }, { onConflict: 'user_id' })

  if (roleErr) throw roleErr

  // Resolve the max plan id
  const { data: maxPlan, error: planErr } = await supabase
    .from('plans')
    .select('id')
    .eq('slug', 'max')
    .single()

  if (planErr || !maxPlan) throw planErr ?? new Error('max plan not found')

  const rows = ALL_PRODUCT_SLUGS.map((slug) => ({
    user_id: userId,
    product_slug: slug,
    plan_id: maxPlan.id,
    active: true,
  }))

  const { error: prodErr } = await supabase
    .from('user_products')
    .upsert(rows, { onConflict: 'user_id,product_slug' })

  if (prodErr) throw prodErr
}

export async function provisionCustomer(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'customer' }, { onConflict: 'user_id' })

  if (error) throw error
  // No products assigned — Ivera admin does that via /api/user/customers endpoints
}

export async function assignProduct(
  userId: string,
  productSlug: string,
  planId: number,
  customPriceCad?: number | null,
  customNotes?: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('user_products')
    .upsert(
      {
        user_id: userId,
        product_slug: productSlug,
        plan_id: planId,
        custom_price_cad: customPriceCad ?? null,
        custom_notes: customNotes ?? null,
        active: true,
      },
      { onConflict: 'user_id,product_slug' },
    )

  if (error) throw error
}

export async function updateProduct(
  userId: string,
  productSlug: string,
  updates: {
    planId?: number
    customPriceCad?: number | null
    customNotes?: string | null
  },
): Promise<void> {
  const patch: Record<string, unknown> = {}
  if (updates.planId !== undefined) patch.plan_id = updates.planId
  if ('customPriceCad' in updates) patch.custom_price_cad = updates.customPriceCad ?? null
  if ('customNotes' in updates) patch.custom_notes = updates.customNotes ?? null

  const { error } = await supabase
    .from('user_products')
    .update(patch)
    .eq('user_id', userId)
    .eq('product_slug', productSlug)

  if (error) throw error
}

export async function deactivateProduct(userId: string, productSlug: string): Promise<void> {
  const { error } = await supabase
    .from('user_products')
    .update({ active: false })
    .eq('user_id', userId)
    .eq('product_slug', productSlug)

  if (error) throw error
}

export async function updateCustomerPhone(userId: string, phone: string | null): Promise<void> {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { phone: phone ?? '' },
  })
  if (error) throw error
}

export async function listCustomers(): Promise<CustomerSummary[]> {
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'customer')

  if (error) throw error

  const results = await Promise.all(
    (roles ?? []).map(async (row) => {
      const { data: authData } = await supabase.auth.admin.getUserById(row.user_id as string)
      const products = await getUserProducts(row.user_id as string)
      return {
        userId: row.user_id as string,
        email: authData.user?.email ?? '',
        phone: (authData.user?.user_metadata?.phone as string) ?? null,
        products,
      }
    }),
  )

  return results
}
