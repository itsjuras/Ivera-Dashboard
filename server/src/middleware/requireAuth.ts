import type { Request, Response, NextFunction } from 'express'
import supabase from '../config/db'
import { getUserRole, provisionCustomer, provisionIveraAdmin } from '../models/userModel'

export interface AuthRequest extends Request {
  userId: string
  userEmail: string
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' })
    return
  }

  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  (req as AuthRequest).userId = user.id
  ;(req as AuthRequest).userEmail = user.email ?? ''
  next()
}

export async function requireIveraAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, async () => {
    try {
      const authReq = req as AuthRequest
      let role = await getUserRole(authReq.userId)
      if (!role) {
        if (authReq.userEmail.endsWith('@ivera.ca')) {
          await provisionIveraAdmin(authReq.userId)
          role = 'ivera_admin'
        } else {
          await provisionCustomer(authReq.userId)
          role = await getUserRole(authReq.userId)
        }
      }
      if (role !== 'ivera_admin') {
        res.status(403).json({ error: 'Forbidden' })
        return
      }
      next()
    } catch (err) {
      console.error('requireIveraAdmin role check failed:', err)
      res.status(500).json({ error: 'Authorization check failed' })
    }
  })
}
