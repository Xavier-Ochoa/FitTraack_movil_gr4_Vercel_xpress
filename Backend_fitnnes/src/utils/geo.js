// Distancia entre dos coordenadas GPS usando la fórmula de Haversine.
// Se usa para estimar la velocidad entre dos track_points consecutivos
// cuando el GPS no reporta `speed` directamente.
const RADIO_TIERRA_KM = 6371

export const haversineDistanceKm = (a, b) => {
    const toRad = (deg) => (deg * Math.PI) / 180

    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)

    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)

    const h =
        Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))

    return RADIO_TIERRA_KM * c
}
