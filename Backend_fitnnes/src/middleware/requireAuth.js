import { verificarJWT } from '../utils/jwt.js'

// ── Middleware: exige un JWT válido en el header Authorization ────────────
// Uso: router.get('/ruta-protegida', requireAuth, controller)
export const requireAuth = (req, res, next) => {
    const { authorization } = req.headers

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Acceso denegado: token no proporcionado' })
    }

    const token = authorization.split(' ')[1]

    try {
        const { userId } = verificarJWT(token)
        req.userId = userId
        next()
    } catch (error) {
        return res.status(401).json({ msg: 'Token inválido o expirado' })
    }
}
