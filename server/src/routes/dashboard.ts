import { Router } from 'express'
import type { RequestHandler } from 'express'
import { getStats } from '../controllers/dashboardController'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.get('/stats', requireAuth as RequestHandler, getStats as RequestHandler)

export default router
