import { Router } from 'express'
import { getRandomQuote } from '../controllers/quotes_controller.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.get('/random', requireAuth, getRandomQuote)

export default router
