import type { Response } from 'express'
import type { AuthRequest } from '../middleware/requireAuth'
import {
  getUserRole,
  getUserProducts,
  getAllPlans,
  listCustomers,
  assignProduct,
  updateProduct,
  deactivateProduct,
} from '../models/userModel'

// GET /api/user/me
// Returns the current user's role and active product subscriptions
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
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
