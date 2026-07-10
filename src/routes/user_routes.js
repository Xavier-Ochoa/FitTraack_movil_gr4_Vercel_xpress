import { Router } from 'express'
import { getMe, updateMe, uploadProfilePhoto } from '../controllers/user_controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { uploadPhoto } from '../middleware/uploadPhoto.js'

const router = Router()

// Todas las rutas protegidas: requieren JWT válido
router.get('/me', requireAuth, getMe)
router.patch('/me', requireAuth, updateMe)

// multipart/form-data, campo "photo" — sube la imagen a Cloudinary y
// actualiza el photoUrl del usuario autenticado
router.post('/me/photo', requireAuth, uploadPhoto, uploadProfilePhoto)

export default router
