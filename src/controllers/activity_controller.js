import mongoose from 'mongoose'
import Activity from '../models/Activity.js'
import TrackPoint from '../models/TrackPoint.js'
import ActivityStats from '../models/ActivityStats.js'
import User from '../models/User.js'
import {
    computeDuration,
    computeAvgPace,
    computeAvgSpeed,
    computeCaloriesBurned,
} from '../services/activityCalculations.js'
import { enrichActivity } from '../services/activityEnrichment.js'

const TIPOS_VALIDOS = ['running', 'walking']

// ── POST /api/activities ────────────────────────────────────────────────
// Recibe la actividad + un array de track_points en una sola llamada.
export const createActivity = async (req, res, next) => {
    try {
        const {
            type,
            title,
            description,
            startedAt,
            endedAt,
            distance,
            duration: durationRecibida,
            trackPoints = [],
            weather: weatherProvisto, // opcional: snapshot ya capturado por el cliente al INICIAR (GET /api/weather)
        } = req.body

        // ── Validaciones de entrada ─────────────────────────────────────
        if (!type || !TIPOS_VALIDOS.includes(type)) {
            return res.status(400).json({
                msg: `El campo "type" es obligatorio. Valores permitidos: ${TIPOS_VALIDOS.join(', ')}`,
            })
        }

        if (!startedAt || !endedAt) {
            return res.status(400).json({ msg: 'Debes enviar "startedAt" y "endedAt"' })
        }

        if (new Date(endedAt) <= new Date(startedAt)) {
            return res.status(400).json({ msg: '"endedAt" debe ser posterior a "startedAt"' })
        }

        if (typeof distance !== 'number' || distance < 0) {
            return res.status(400).json({ msg: 'El campo "distance" (km) debe ser un número >= 0' })
        }

        if (!Array.isArray(trackPoints)) {
            return res.status(400).json({ msg: '"trackPoints" debe ser un array' })
        }

        for (const [i, punto] of trackPoints.entries()) {
            if (typeof punto.lat !== 'number' || typeof punto.lng !== 'number' || !punto.timestamp) {
                return res.status(400).json({
                    msg: `trackPoints[${i}] debe incluir "lat", "lng" y "timestamp"`,
                })
            }
        }

        // ── Cálculos derivados ──────────────────────────────────────────
        const duration = computeDuration({ startedAt, endedAt, duration: durationRecibida })
        const avgPace = computeAvgPace(distance, duration)
        const avgSpeed = computeAvgSpeed(distance, duration)

        // Se usa el weightKg del perfil del usuario autenticado, si existe
        const usuario = await User.findById(req.userId)
        const { caloriesBurned, estimated } = computeCaloriesBurned({
            type,
            durationSeconds: duration,
            weightKg: usuario?.weightKg,
        })

        // ── Persistencia ─────────────────────────────────────────────────
        let actividad
        try {
            actividad = await Activity.create({
                userId: req.userId,
                type,
                title,
                description,
                startedAt,
                endedAt,
                distance,
                duration,
                avgPace,
                avgSpeed,
                caloriesBurned,
                status: 'completed',
            })

            if (trackPoints.length > 0) {
                await TrackPoint.insertMany(
                    trackPoints.map((p) => ({
                        activityId: actividad._id,
                        lat: p.lat,
                        lng: p.lng,
                        altitude: p.altitude ?? null,
                        speed: p.speed ?? null,
                        accuracy: p.accuracy ?? null,
                        timestamp: p.timestamp,
                    }))
                )
            }
        } catch (errorInterno) {
            // Rollback manual: si falló el insertMany de track_points,
            // no dejamos una actividad huérfana sin su ruta GPS.
            if (actividad) {
                await Activity.findByIdAndDelete(actividad._id)
            }
            throw errorInterno
        }

        // ── Enriquecimiento (Sprint B6): clima, geocodificación, elevación,
        // maxSpeed/minPace/samplingFrequency ────────────────────────────────
        // Se ejecuta DESPUÉS de guardar lo esencial (actividad + ruta GPS),
        // y ninguna falla acá debe tumbar la respuesta: la actividad ya
        // existe de todas formas si algo de esto no se puede resolver.
        const trackPointsOrdenados = [...trackPoints].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        )

        const { weather, locationName, activityStatsData } = await enrichActivity({
            trackPointsOrdenados,
            weatherProvisto,
        })

        if (weather || locationName) {
            actividad.weather = weather ?? actividad.weather
            actividad.locationName = locationName ?? actividad.locationName
            await actividad.save()
        }

        const hayDatosDeStats = Object.values(activityStatsData).some((v) => v !== null)
        let activityStats = null
        if (hayDatosDeStats) {
            activityStats = await ActivityStats.create({
                activityId: actividad._id,
                ...activityStatsData,
            })
        }

        res.status(201).json({
            activity: actividad.toObject(),
            activityStats,
            trackPointsGuardados: trackPoints.length,
            caloriesBurnedEstimated: estimated, // true si no había weightKg en el perfil
        })
    } catch (error) {
        next(error)
    }
}

// ── GET /api/activities ─────────────────────────────────────────────────
// Lista del usuario autenticado, sin track_points (solo resumen), más reciente primero.
export const listActivities = async (req, res, next) => {
    try {
        const actividades = await Activity.find({ userId: req.userId }).sort({ startedAt: -1 })

        res.status(200).json({ activities: actividades })
    } catch (error) {
        next(error)
    }
}

// ── GET /api/activities/:id ──────────────────────────────────────────────
// Detalle completo: track_points + activity_stats (si ya existe, B6).
export const getActivityDetail = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: 'El id de actividad no tiene un formato válido' })
        }

        const actividad = await Activity.findById(req.params.id)

        if (!actividad) {
            return res.status(404).json({ msg: 'Actividad no encontrada' })
        }

        if (actividad.userId.toString() !== req.userId) {
            return res.status(403).json({ msg: 'No tienes permiso para ver esta actividad' })
        }

        const [trackPoints, activityStats] = await Promise.all([
            TrackPoint.find({ activityId: actividad._id }).sort({ timestamp: 1 }),
            ActivityStats.findOne({ activityId: actividad._id }),
        ])

        res.status(200).json({
            activity: actividad,
            trackPoints,
            activityStats: activityStats || null,
        })
    } catch (error) {
        next(error)
    }
}

// ── DELETE /api/activities/:id ───────────────────────────────────────────
// Elimina la actividad y en cascada sus track_points y activity_stats.
export const deleteActivity = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: 'El id de actividad no tiene un formato válido' })
        }

        const actividad = await Activity.findById(req.params.id)

        if (!actividad) {
            return res.status(404).json({ msg: 'Actividad no encontrada' })
        }

        if (actividad.userId.toString() !== req.userId) {
            return res.status(403).json({ msg: 'No tienes permiso para eliminar esta actividad' })
        }

        await Promise.all([
            Activity.findByIdAndDelete(actividad._id),
            TrackPoint.deleteMany({ activityId: actividad._id }),
            ActivityStats.deleteOne({ activityId: actividad._id }),
        ])

        res.status(200).json({ msg: 'Actividad eliminada correctamente' })
    } catch (error) {
        next(error)
    }
}
