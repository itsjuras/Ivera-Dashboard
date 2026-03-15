import { Router } from 'express'
import { verifyPhone } from '../controllers/authController'

const router = Router()

router.post('/verify-phone', verifyPhone)

export default router
