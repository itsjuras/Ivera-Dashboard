import { Router } from 'express'
import { getPayments } from '../controllers/paymentController'

const router = Router()

router.get('/', getPayments)

export default router
