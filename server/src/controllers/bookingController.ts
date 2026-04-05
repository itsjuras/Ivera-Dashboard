import type { Request, Response } from 'express'
import type { AuthRequest } from '../middleware/requireAuth'
import { getAllBookings } from '../models/bookingModel'
import { resolveReceptionistCustomerId } from '../models/receptionistScopeModel'

export async function getBookings(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest
    const customerId = await resolveReceptionistCustomerId(authReq.userId)
    const bookings = await getAllBookings(customerId)
    res.json(bookings)
  } catch (err) {
    console.error('Failed to fetch bookings:', err)
    res.status(500).json({ error: 'Failed to fetch bookings' })
  }
}
