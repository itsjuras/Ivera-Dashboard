import type { Request, Response } from 'express'
import { getDashboardStats } from '../models/dashboardModel'

export async function getStats(_req: Request, res: Response) {
  try {
    const stats = await getDashboardStats()
    res.json(stats)
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
}
