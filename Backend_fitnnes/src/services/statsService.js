import mongoose from 'mongoose'
import Activity from '../models/Activity.js'
import NutritionLog from '../models/NutritionLog.js'
import User from '../models/User.js'
import { OMS_MINUTOS_RECOMENDADOS_SEMANA } from '../config/constants.js'

// ── Decisión de estrategia (Sprint B7) ──────────────────────────────────
// Se eligió calcular TODO al vuelo con agregación de Mongo sobre
// `activities`/`nutrition_logs`, en vez de mantener un documento cacheado
// en la colección `stats` que haya que ir actualizando en cada
// POST/DELETE de actividad (lo cual obligaría a tocar activity_controller
// y agregaría una fuente más de verdad para mantener sincronizada).
// Con el volumen de datos de un MVP (decenas/cientos de actividades por
// usuario), una agregación en el momento es más simple y no tiene
// problemas de performance. El modelo `Stats` (B1) queda definido para
// una futura optimización (cache) si el proyecto creciera, pero no se
// escribe en él desde este sprint.

/** Rango [inicio, fin) del día de hoy en UTC. */
const rangoDeHoyUTC = () => {
    const ahora = new Date()
    const inicio = new Date(
        Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate())
    )
    const fin = new Date(inicio)
    fin.setUTCDate(fin.getUTCDate() + 1)
    return { inicio, fin }
}

/** Rango [inicio, fin) de los últimos 7 días (incluyendo hoy) en UTC. */
const rangoUltimaSemanaUTC = () => {
    const { fin } = rangoDeHoyUTC()
    const inicio = new Date(fin)
    inicio.setUTCDate(inicio.getUTCDate() - 7)
    return { inicio, fin }
}

/**
 * Estadísticas globales del usuario: distancia total, cantidad de
 * actividades y mejor ritmo (avgPace más bajo = más rápido).
 */
const getGlobalStats = async (userId) => {
    const [resultado] = await Activity.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalDistance: { $sum: '$distance' },
                totalActivities: { $sum: 1 },
                bestPace: { $min: '$avgPace' },
            },
        },
    ])

    return {
        totalDistance: resultado ? Number(resultado.totalDistance.toFixed(2)) : 0,
        totalActivities: resultado ? resultado.totalActivities : 0,
        bestPace: resultado?.bestPace ?? null,
    }
}

/**
 * Minutos de actividad de la última semana vs recomendación de la OMS
 * (constante de 150 min/semana).
 */
const getComparacionOMS = async (userId) => {
    const { inicio, fin } = rangoUltimaSemanaUTC()

    const [resultado] = await Activity.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                startedAt: { $gte: inicio, $lt: fin },
            },
        },
        { $group: { _id: null, totalSegundos: { $sum: '$duration' } } },
    ])

    const minutosUltimaSemana = resultado ? Math.round(resultado.totalSegundos / 60) : 0

    return {
        minutosUltimaSemana,
        recomendadoMinutosSemana: OMS_MINUTOS_RECOMENDADOS_SEMANA,
        cumpleRecomendacionOMS: minutosUltimaSemana >= OMS_MINUTOS_RECOMENDADOS_SEMANA,
        porcentajeCumplido: Number(
            ((minutosUltimaSemana / OMS_MINUTOS_RECOMENDADOS_SEMANA) * 100).toFixed(1)
        ),
    }
}

/**
 * Balance calórico del día actual: calorías quemadas (actividades de hoy,
 * por `startedAt`) vs calorías consumidas (nutrition_logs de hoy, por
 * `loggedAt`).
 */
const getBalanceCaloricoHoy = async (userId) => {
    const { inicio, fin } = rangoDeHoyUTC()
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const [quemadas, consumidas] = await Promise.all([
        Activity.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    startedAt: { $gte: inicio, $lt: fin },
                },
            },
            { $group: { _id: null, total: { $sum: '$caloriesBurned' } } },
        ]),
        NutritionLog.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    loggedAt: { $gte: inicio, $lt: fin },
                },
            },
            { $group: { _id: null, total: { $sum: '$calories' } } },
        ]),
    ])

    const caloriesBurnedHoy = quemadas[0]?.total ?? 0
    const caloriesConsumedHoy = consumidas[0]?.total ?? 0

    return {
        caloriesBurnedHoy,
        caloriesConsumedHoy,
        balance: caloriesConsumedHoy - caloriesBurnedHoy, // positivo = superávit calórico del día
    }
}

/** IMC calculado al vuelo (`weightKg / (heightCm/100)²`). null si falta algún dato del perfil. */
const calcularIMC = (usuario) => {
    if (!usuario?.weightKg || !usuario?.heightCm) return null

    const alturaMetros = usuario.heightCm / 100
    return Number((usuario.weightKg / alturaMetros ** 2).toFixed(1))
}

/**
 * Compila el objeto completo de `GET /api/stats/me`.
 */
export const getUserStats = async (userId) => {
    const [usuario, global, oms, balanceCalorico] = await Promise.all([
        User.findById(userId),
        getGlobalStats(userId),
        getComparacionOMS(userId),
        getBalanceCaloricoHoy(userId),
    ])

    return {
        ...global,
        oms,
        balanceCalorico,
        imc: calcularIMC(usuario),
    }
}
