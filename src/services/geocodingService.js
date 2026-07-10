import { fetchConTimeout } from '../utils/fetchConTimeout.js'
import { nominatimQueue } from '../utils/rateLimitQueue.js'

// Nominatim EXIGE un User-Agent identificable (rechaza o banea IPs que usan
// el User-Agent por defecto de librerías HTTP genéricas).
const NOMINATIM_USER_AGENT = 'FitTrackPro/1.0 (contacto: soporte@fittrackpro.app)'

/**
 * Resuelve un nombre de lugar legible a partir de coordenadas GPS.
 * Respeta el límite de 1 request/segundo de Nominatim encolando la llamada.
 *
 * @returns {Promise<string|null>} nombre del lugar, o null si no se pudo resolver
 */
export const reverseGeocode = (lat, lng) => {
    return nominatimQueue.encolar(async () => {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`

        const response = await fetchConTimeout(
            url,
            { headers: { 'User-Agent': NOMINATIM_USER_AGENT } },
            5000
        )

        if (!response.ok) {
            throw new Error(`Nominatim respondió con status ${response.status}`)
        }

        const data = await response.json()

        // display_name suele ser muy largo ("Calle X, Barrio Y, Ciudad, País");
        // preferimos armar algo más corto con barrio/ciudad si está disponible.
        const address = data.address || {}
        const partes = [
            address.suburb || address.neighbourhood || address.road,
            address.city || address.town || address.village,
            address.country,
        ].filter(Boolean)

        return partes.length > 0 ? partes.join(', ') : data.display_name || null
    })
}
