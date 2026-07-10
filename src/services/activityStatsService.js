import { haversineDistanceKm } from '../utils/geo.js'

/**
 * Calcula maxSpeed (km/h), minPace (min/km, el mejor ritmo puntual) y
 * samplingFrequency (segundos promedio entre puntos GPS) a partir de los
 * track_points ordenados cronológicamente de una actividad.
 *
 * Prioriza el campo `speed` (m/s) que reporta el GPS si está presente;
 * si no, estima la velocidad del segmento con Haversine (distancia) /
 * diferencia de tiempo entre puntos consecutivos.
 */
export const computeSpeedAndSamplingStats = (trackPointsOrdenados) => {
    if (!trackPointsOrdenados || trackPointsOrdenados.length < 2) {
        return { maxSpeed: null, minPace: null, samplingFrequency: null }
    }

    let maxSpeedKmH = 0
    const intervalosSegundos = []

    for (let i = 1; i < trackPointsOrdenados.length; i++) {
        const anterior = trackPointsOrdenados[i - 1]
        const actual = trackPointsOrdenados[i]

        const deltaSegundos =
            (new Date(actual.timestamp).getTime() - new Date(anterior.timestamp).getTime()) / 1000

        if (deltaSegundos > 0) {
            intervalosSegundos.push(deltaSegundos)
        }

        let velocidadSegmentoKmH

        if (typeof actual.speed === 'number' && actual.speed >= 0) {
            // GPS ya reporta velocidad instantánea en m/s
            velocidadSegmentoKmH = actual.speed * 3.6
        } else if (deltaSegundos > 0) {
            const distanciaKm = haversineDistanceKm(anterior, actual)
            velocidadSegmentoKmH = distanciaKm / (deltaSegundos / 3600)
        } else {
            continue
        }

        if (velocidadSegmentoKmH > maxSpeedKmH) {
            maxSpeedKmH = velocidadSegmentoKmH
        }
    }

    const samplingFrequency =
        intervalosSegundos.length > 0
            ? Number(
                  (intervalosSegundos.reduce((a, b) => a + b, 0) / intervalosSegundos.length).toFixed(1)
              )
            : null

    // El mejor ritmo puntual corresponde al segmento de mayor velocidad
    const minPace = maxSpeedKmH > 0 ? Number((60 / maxSpeedKmH).toFixed(2)) : null

    return {
        maxSpeed: maxSpeedKmH > 0 ? Number(maxSpeedKmH.toFixed(2)) : null,
        minPace,
        samplingFrequency,
    }
}
