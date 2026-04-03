import type { Request, Response } from 'express'
import type { AuthRequest } from '../middleware/requireAuth'
import { findClientByPhone } from '../models/authModel'
import { getUserRole, provisionIveraAdmin, provisionCustomer } from '../models/userModel'

export async function verifyPhone(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body

    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ error: 'Phone number is required' })
      return
    }

    const client = await findClientByPhone(phone.trim())

    if (!client) {
      res.status(404).json({ error: 'No account found with this phone number. Please contact support.' })
      return
    }

    res.json({
      clientId: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
    })
  } catch (err) {
    console.error('Phone verification failed:', err)
    res.status(500).json({ error: 'Verification failed' })
  }
}

// POST /api/auth/post-signup
// Called by the client immediately after Supabase creates the user account.
// Idempotent — safe to call more than once.
//
// Logic:
//   @ivera.ca email  →  ivera_admin role + all products on max plan
//   any other email  →  customer role, no products (Ivera admin assigns later)
export async function postSignup(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthRequest

  try {
    const existing = await getUserRole(authReq.userId)

    if (existing) {
      // Already provisioned — just return current role
      res.json({ role: existing })
      return
    }

    if (authReq.userEmail.endsWith('@ivera.ca')) {
      await provisionIveraAdmin(authReq.userId)
      res.json({ role: 'ivera_admin' })
    } else {
      await provisionCustomer(authReq.userId)
      res.json({ role: 'customer' })
    }
  } catch (err) {
    console.error('postSignup provisioning failed:', err)
    res.status(500).json({ error: 'Failed to provision user' })
  }
}
