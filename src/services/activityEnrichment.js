import { getWeatherByCoords } from './weatherService.js'
import { reverseGeocode } from './geocodingService.js'
import { getElevationGainLoss } from './elevationService.js'
import { computeSpeedAndSamplingStats } from './activityStatsService.js'

/**
 * Enriquece una actividad recién creada con clima, nombre de lugar,
 * elevación, velocidad máxima, mejor ritmo y frecuencia de muestreo.
 *
 * Cada integración externa está aislada en su propio try/catch: si una
 * falla (timeout, rate limit, API caída), las demás igual se calculan y
 * la actividad se guarda de todos modos con lo que sí se pudo obtener.
 * Nada de esto debe romper el flujo de POST /api/activities.
 *
 * @param {object} params
 * @param {Array}  params.trackPointsOrdenados - track_points ordenados por timestamp
 * @param {object|undefined} params.weatherProvisto - snapshot de clima ya capturado por el cliente al iniciar (opcional)
 * @returns {Promise<{ weather: object|null, locationName: string|null, activityStatsData: object }>}
 */
export const enrichActivity = async ({ trackPointsOrdenados, weatherProvisto }) => {
    const primerPunto = trackPointsOrdenados?.[0] || null

    // ── Clima ────────────────────────────────────────────────────────────
    // El plan indica que el clima normalmente ya se captura en el momento
    // de INICIAR el recorrido (la app llama GET /api/weather y lo manda en
    // el payload). Si no vino, intentamos resolverlo aquí como respaldo
    // usando el primer track_point.
    let weather = weatherProvisto || null
    if (!weather && primerPunto && process.env.OPENWEATHER_API_KEY) {
        try {
            weather = await getWeatherByCoords(primerPunto.lat, primerPunto.lng)
        } catch (error) {
            console.error('⚠️ No se pudo obtener el clima al guardar la actividad:', error.message)
        }
    }

    // ── Geocodificación inversa ─────────────────────────────────────────
    let locationName = null
    if (primerPunto) {
        try {
            locationName = await reverseGeocode(primerPunto.lat, primerPunto.lng)
        } catch (error) {
            console.error('⚠️ No se pudo resolver el nombre del lugar (Nominatim):', error.message)
        }
    }

    // ── Elevación (con fallback a altitud GPS ya manejado en el servicio) ─
    const { elevationGain, elevationLoss } = await getElevationGainLoss(trackPointsOrdenados)

    // ── Velocidad máxima, mejor ritmo y frecuencia de muestreo ───────────
    const { maxSpeed, minPace, samplingFrequency } = computeSpeedAndSamplingStats(trackPointsOrdenados)

    return {
        weather,
        locationName,
        activityStatsData: {
            elevationGain,
            elevationLoss,
            maxSpeed,
            minPace,
            samplingFrequency,
        },
    }
}
