import type { Request, Response } from 'express'
import { getAllPayments } from '../models/paymentModel'

export async function getPayments(_req: Request, res: Response) {
  try {
    const payments = await getAllPayments()
    res.json(payments)
  } catch (err) {
    console.error('Failed to fetch payments:', err)
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
}
