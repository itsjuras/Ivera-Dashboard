import { Router } from 'express'
import { requireAuth, requireIveraAdmin } from '../middleware/requireAuth'
import type { RequestHandler } from 'express'
import {
  getMe,
  getPlans,
  getCustomers,
  createNewCustomer,
  addProductToCustomer,
  updateCustomerProduct,
  removeProductFromCustomer,
  updatePhone,
  updateEmail,
  upsertProfile,
} from '../controllers/userController'

const router = Router()

const auth = requireAuth as RequestHandler
const iveraAdmin = requireIveraAdmin as RequestHandler

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const h = (fn: (...args: any[]) => unknown) => fn as RequestHandler

router.get('/me',    auth,       h(getMe))
router.get('/plans', auth,       h(getPlans))

router.get('/customers',                                   iveraAdmin, h(getCustomers))
router.post('/customers',                                  iveraAdmin, h(createNewCustomer))
router.post('/customers/:userId/products',                 iveraAdmin, h(addProductToCustomer))
router.patch('/customers/:userId/products/:productSlug',   iveraAdmin, h(updateCustomerProduct))
router.delete('/customers/:userId/products/:productSlug',  iveraAdmin, h(removeProductFromCustomer))
router.patch('/customers/:userId/phone',                   iveraAdmin, h(updatePhone))
router.patch('/customers/:userId/email',                   iveraAdmin, h(updateEmail))
router.patch('/customers/:userId/profile',                 iveraAdmin, h(upsertProfile))

export default router
