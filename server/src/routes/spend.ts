import { Router } from 'express'
import type { RequestHandler } from 'express'
import { requireIveraAdmin } from '../middleware/requireAuth'
import {
  getExaUsage,
  getProviderSpend,
  saveProviderSpend,
  syncProviderSpendController,
  getSendGridUsage,
} from '../controllers/spendController'

const router = Router()
const iveraAdmin = requireIveraAdmin as RequestHandler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const h = (fn: (...args: any[]) => unknown) => fn as unknown as RequestHandler

router.get('/', iveraAdmin, h(getProviderSpend))
router.get('/sendgrid-usage', iveraAdmin, h(getSendGridUsage))
router.get('/exa-usage', iveraAdmin, h(getExaUsage))
router.put('/', iveraAdmin, h(saveProviderSpend))
router.post('/sync', iveraAdmin, h(syncProviderSpendController))

export default router
