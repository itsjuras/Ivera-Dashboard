import { Router } from 'express'
import type { RequestHandler } from 'express'
import { getPayments } from '../controllers/paymentController'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.get('/', requireAuth as RequestHandler, getPayments as RequestHandler)

export default router
