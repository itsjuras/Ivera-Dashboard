import type { Request, Response } from 'express'
import { findClientByPhone } from '../models/authModel'

export async function verifyPhone(req: Request, res: Response) {
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
