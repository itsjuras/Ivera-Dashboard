import type { Response } from 'express'
import type { AuthRequest } from '../middleware/requireAuth'
import {
  getUserRole,
  getUserProducts,
  getAllPlans,
  provisionCustomer,
  provisionIveraAdmin,
  listCustomers,
  assignProduct,
  updateProduct,
  deactivateProduct,
  updateCustomerPhone,
  upsertCustomerProfile,
  createCustomer,
  updateCustomerEmail,
} from '../models/userModel'

async function ensureProvisionedUser(userId: string, userEmail: string): Promise<void> {
  const existingRole = await getUserRole(userId)
  if (existingRole) return

  if (userEmail.endsWith('@ivera.ca')) {
    await provisionIveraAdmin(userId)
    return
  }

  await provisionCustomer(userId)
}

// GET /api/user/me
// Returns the current user's role and active product subscriptions
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    await ensureProvisionedUser(req.userId, req.userEmail)
    const [role, products] = await Promise.all([
      getUserRole(req.userId),
      getUserProducts(req.userId),
    ])

    res.json({ userId: req.userId, role, products })
  } catch (err) {
    console.error('getMe failed:', err)
    res.status(500).json({ error: 'Failed to load user profile' })
  }
}

// GET /api/user/plans
// Returns all available plans (used when Ivera admin assigns a product)
export async function getPlans(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const plans = await getAllPlans()
    res.json(plans)
  } catch (err) {
    console.error('getPlans failed:', err)
    res.status(500).json({ error: 'Failed to load plans' })
  }
}

// GET /api/user/customers
// Ivera admin only — lists all customers and their product subscriptions
export async function getCustomers(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const customers = await listCustomers()
    res.json(customers)
  } catch (err) {
    console.error('getCustomers failed:', err)
    res.status(500).json({ error: 'Failed to load customers' })
  }
}

// POST /api/user/customers/:userId/products
// Ivera admin only — assigns or updates a product for a customer
// Body: { productSlug, planId, customPriceCad?, customNotes? }
export async function addProductToCustomer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string
    const { productSlug, planId, customPriceCad, customNotes } = req.body

    if (!productSlug || typeof productSlug !== 'string') {
      res.status(400).json({ error: 'productSlug is required' })
      return
    }
    if (!planId || typeof planId !== 'number') {
      res.status(400).json({ error: 'planId is required and must be a number' })
      return
    }

    await assignProduct(userId, productSlug, planId, customPriceCad ?? null, customNotes ?? null)
    res.json({ success: true })
  } catch (err) {
    console.error('addProductToCustomer failed:', err)
    res.status(500).json({ error: 'Failed to assign product' })
  }
}

// PATCH /api/user/customers/:userId/products/:productSlug
// Ivera admin only — updates plan, custom price, or notes on an existing subscription
// Body: { planId?, customPriceCad?, customNotes? }
export async function updateCustomerProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string
    const productSlug = req.params.productSlug as string
    const { planId, customPriceCad, customNotes } = req.body

    await updateProduct(userId, productSlug, {
      planId,
      customPriceCad,
      customNotes,
    })

    res.json({ success: true })
  } catch (err) {
    console.error('updateCustomerProduct failed:', err)
    res.status(500).json({ error: 'Failed to update product' })
  }
}

// PATCH /api/user/customers/:userId/profile
// Ivera admin only — upserts name, company, twilio number for a customer
export async function upsertProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string
    const { firstName, lastName, companyName, twilioNumber } = req.body
    await upsertCustomerProfile(userId, { firstName, lastName, companyName, twilioNumber })
    res.json({ success: true })
  } catch (err) {
    console.error('upsertProfile failed:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

// PATCH /api/user/customers/:userId/phone
// Ivera admin only — sets or clears a customer's phone number
export async function updatePhone(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string
    const { phone } = req.body
    await updateCustomerPhone(userId, phone ?? null)
    res.json({ success: true })
  } catch (err) {
    console.error('updatePhone failed:', err)
    res.status(500).json({ error: 'Failed to update phone' })
  }
}

// POST /api/user/customers
// Ivera admin only — creates a new customer account
// Body: { email, firstName?, lastName? }
export async function createNewCustomer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, firstName, lastName } = req.body
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'email is required' })
      return
    }
    const result = await createCustomer(email.trim().toLowerCase(), firstName ?? null, lastName ?? null)
    res.json(result)
  } catch (err: unknown) {
    console.error('createNewCustomer failed:', err)
    const msg = err instanceof Error ? err.message : 'Failed to create customer'
    res.status(500).json({ error: msg })
  }
}

// PATCH /api/user/customers/:userId/email
// Ivera admin only — updates a customer's email address
// Body: { email }
export async function updateEmail(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string
    const { email } = req.body
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'email is required' })
      return
    }
    await updateCustomerEmail(userId, email.trim().toLowerCase())
    res.json({ success: true })
  } catch (err: unknown) {
    console.error('updateEmail failed:', err)
    const msg = err instanceof Error ? err.message : 'Failed to update email'
    res.status(500).json({ error: msg })
  }
}

// DELETE /api/user/customers/:userId/products/:productSlug
// Ivera admin only — deactivates a product for a customer
export async function removeProductFromCustomer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string
    const productSlug = req.params.productSlug as string
    await deactivateProduct(userId, productSlug)
    res.json({ success: true })
  } catch (err) {
    console.error('removeProductFromCustomer failed:', err)
    res.status(500).json({ error: 'Failed to remove product' })
  }
}
