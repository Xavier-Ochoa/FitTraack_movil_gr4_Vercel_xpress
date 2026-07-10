import { Router } from 'express'
import {
    register,
    login,
    recuperarPassword,
    validarTokenRecuperacion,
    nuevoPassword,
    me,
} from '../controllers/auth_controller.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// ── Rutas públicas ──────────────────────────────────────────────────────────
router.post('/register', register)
router.post('/login', login)

// ── Flujo de recuperación de contraseña (3 fases) ───────────────────────────
// Fase 1: el usuario solicita el enlace de recuperación con su email.
router.post('/recuperarpassword', recuperarPassword)
// Fase 2: el frontend valida el token recibido por correo antes de mostrar
// el formulario de nueva contraseña.
router.get('/recuperarpassword/:token', validarTokenRecuperacion)
// Fase 3: el usuario envía la nueva contraseña asociada a ese token.
router.post('/nuevopassword/:token', nuevoPassword)

// ── Ruta protegida de prueba (para validar requireAuth en Postman, B2) ─────
router.get('/me', requireAuth, me)

export default router
