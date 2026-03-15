import type { Request, Response } from 'express'
import { getAllBookings } from '../models/bookingModel'

export async function getBookings(_req: Request, res: Response) {
  try {
    const bookings = await getAllBookings()
    res.json(bookings)
  } catch (err) {
    console.error('Failed to fetch bookings:', err)
    res.status(500).json({ error: 'Failed to fetch bookings' })
  }
}
