import { getUserStats } from '../services/statsService.js'

// ── GET /api/stats/me ─────────────────────────────────────────────────────
// Estadísticas agregadas del usuario autenticado: totales, comparación
// OMS de la última semana, balance calórico de hoy e IMC.
export const getMyStats = async (req, res, next) => {
    try {
        const stats = await getUserStats(req.userId)
        res.status(200).json({ stats })
    } catch (error) {
        next(error)
    }
}
