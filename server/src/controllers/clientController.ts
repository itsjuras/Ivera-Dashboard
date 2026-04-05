import type { Request, Response } from 'express'
import type { AuthRequest } from '../middleware/requireAuth'
import { getAllClients } from '../models/clientModel'
import { resolveReceptionistCustomerId } from '../models/receptionistScopeModel'

export async function getClients(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest
    const customerId = await resolveReceptionistCustomerId(authReq.userId)
    const clients = await getAllClients(customerId)
    res.json(clients)
  } catch (err) {
    console.error('Failed to fetch clients:', err)
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
}
