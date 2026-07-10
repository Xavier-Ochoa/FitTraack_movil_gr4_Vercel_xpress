import { Router } from 'express'
import {
    createNutritionLog,
    listNutritionLogs,
    deleteNutritionLog,
} from '../controllers/nutrition_controller.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// Todas las rutas de nutrición requieren JWT
router.use(requireAuth)

router.post('/log', createNutritionLog)
router.get('/logs', listNutritionLogs)
router.delete('/logs/:id', deleteNutritionLog)

export default router
