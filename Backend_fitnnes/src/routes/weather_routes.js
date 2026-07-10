import { Router } from 'express'
import { getWeather } from '../controllers/weather_controller.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.get('/', requireAuth, getWeather)

export default router
