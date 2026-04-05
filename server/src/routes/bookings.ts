import { Router } from 'express'
import type { RequestHandler } from 'express'
import { getBookings } from '../controllers/bookingController'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.get('/', requireAuth as RequestHandler, getBookings as RequestHandler)

export default router
