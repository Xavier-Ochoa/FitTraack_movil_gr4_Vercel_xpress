import { Router } from 'express'
import { getMyStats } from '../controllers/stats_controller.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.get('/me', requireAuth, getMyStats)

export default router
