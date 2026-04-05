import type { Request, Response } from 'express'
import type { AuthRequest } from '../middleware/requireAuth'
import { getDashboardStats } from '../models/dashboardModel'
import { resolveReceptionistCustomerId } from '../models/receptionistScopeModel'

export async function getStats(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest
    const customerId = await resolveReceptionistCustomerId(authReq.userId)
    const stats = await getDashboardStats(customerId)
    res.json(stats)
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
}
