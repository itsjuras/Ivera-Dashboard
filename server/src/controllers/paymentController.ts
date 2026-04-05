import type { Request, Response } from 'express'
import type { AuthRequest } from '../middleware/requireAuth'
import { getAllPayments } from '../models/paymentModel'
import { resolveReceptionistCustomerId } from '../models/receptionistScopeModel'

export async function getPayments(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest
    const customerId = await resolveReceptionistCustomerId(authReq.userId)
    const payments = await getAllPayments(customerId)
    res.json(payments)
  } catch (err) {
    console.error('Failed to fetch payments:', err)
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
}
