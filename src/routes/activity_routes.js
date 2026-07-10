import { Router } from 'express'
import {
    createActivity,
    listActivities,
    getActivityDetail,
    deleteActivity,
} from '../controllers/activity_controller.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// Todas las rutas de actividades requieren JWT
router.use(requireAuth)

router.post('/', createActivity)
router.get('/', listActivities)
router.get('/:id', getActivityDetail)
router.delete('/:id', deleteActivity)

export default router
