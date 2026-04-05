import { Router } from 'express'
import type { RequestHandler } from 'express'
import { getClients } from '../controllers/clientController'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.get('/', requireAuth as RequestHandler, getClients as RequestHandler)

export default router
