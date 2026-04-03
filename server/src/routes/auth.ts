import { Router } from 'express'
import type { RequestHandler } from 'express'
import { verifyPhone, postSignup } from '../controllers/authController'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.post('/verify-phone', verifyPhone)
router.post('/post-signup', requireAuth as RequestHandler, postSignup as RequestHandler)

export default router
