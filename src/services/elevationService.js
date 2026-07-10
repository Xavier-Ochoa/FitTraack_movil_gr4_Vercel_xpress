import { fetchConTimeout } from '../utils/fetchConTimeout.js'

/**
 * Suma las subidas y bajadas acumuladas a partir de una lista ordenada
 * de elevaciones (metros), ignorando valores null/undefined.
 */
const acumularGanancePerdida = (elevaciones) => {
    let elevationGain = 0
    let elevationLoss = 0

    for (let i = 1; i < elevaciones.length; i++) {
        const anterior = elevaciones[i - 1]
        const actual = elevaciones[i]

        if (anterior === null || actual === null || anterior === undefined || actual === undefined) {
            continue
        }

        const diff = actual - anterior
        if (diff > 0) elevationGain += diff
        else elevationLoss += Math.abs(diff)
    }

    return {
        elevationGain: Number(elevationGain.toFixed(1)),
        elevationLoss: Number(elevationLoss.toFixed(1)),
    }
}

/**
 * Calcula elevationGain/elevationLoss para una actividad a partir de sus
 * track_points, usando Open-Elevation. Si la API falla (timeout/error),
 * cae de vuelta a la `altitude` que ya venía del GPS en cada punto, para
 * que el flujo de creación de la actividad nunca se rompa por esto.
 *
 * @param {Array<{lat:number, lng:number, altitude?: number|null}>} trackPoints
 * @returns {Promise<{elevationGain:number, elevationLoss:number, source:'open-elevation'|'gps'|'none'}>}
 */
export const getElevationGainLoss = async (trackPoints) => {
    if (!trackPoints || trackPoints.length < 2) {
        return { elevationGain: 0, elevationLoss: 0, source: 'none' }
    }

    try {
        const locations = trackPoints.map((p) => ({ latitude: p.lat, longitude: p.lng }))

        const response = await fetchConTimeout(
            'https://api.open-elevation.com/api/v1/lookup',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locations }),
            },
            6000
        )

        if (!response.ok) {
            throw new Error(`Open-Elevation respondió con status ${response.status}`)
        }

        const data = await response.json()
        const elevaciones = (data.results || []).map((r) => r.elevation ?? null)

        const { elevationGain, elevationLoss } = acumularGanancePerdida(elevaciones)
        return { elevationGain, elevationLoss, source: 'open-elevation' }
    } catch (error) {
        console.error('⚠️ Open-Elevation falló, usando altitud GPS como respaldo:', error.message)

        // Fallback: altitud reportada por el propio GPS en cada track_point
        const altitudesGps = trackPoints.map((p) => (typeof p.altitude === 'number' ? p.altitude : null))
        const hayAltitudGps = altitudesGps.some((a) => a !== null)

        if (!hayAltitudGps) {
            return { elevationGain: 0, elevationLoss: 0, source: 'none' }
        }

        const { elevationGain, elevationLoss } = acumularGanancePerdida(altitudesGps)
        return { elevationGain, elevationLoss, source: 'gps' }
    }
}
