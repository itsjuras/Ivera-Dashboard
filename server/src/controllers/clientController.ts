import type { Request, Response } from 'express'
import { getAllClients } from '../models/clientModel'

export async function getClients(_req: Request, res: Response) {
  try {
    const clients = await getAllClients()
    res.json(clients)
  } catch (err) {
    console.error('Failed to fetch clients:', err)
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
}
