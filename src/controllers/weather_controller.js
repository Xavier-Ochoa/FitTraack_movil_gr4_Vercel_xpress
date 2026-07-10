import { getWeatherByCoords } from '../services/weatherService.js'

// ── GET /api/weather?lat=..&lng=.. ───────────────────────────────────────
// Proxy hacia OpenWeatherMap: el cliente nunca ve la API key.
export const getWeather = async (req, res, next) => {
    try {
        const { lat, lng } = req.query

        const latNum = Number(lat)
        const lngNum = Number(lng)

        if (lat === undefined || lng === undefined || Number.isNaN(latNum) || Number.isNaN(lngNum)) {
            return res.status(400).json({ msg: 'Debes enviar "lat" y "lng" como query params numéricos' })
        }

        const weather = await getWeatherByCoords(latNum, lngNum)
        res.status(200).json({ weather })
    } catch (error) {
        // No es un error del cliente ni de nuestra DB, es la API externa —
        // 502 Bad Gateway comunica mejor esa distinción que un 500 genérico.
        console.error('❌ Error consultando OpenWeatherMap:', error.message)
        res.status(502).json({ msg: 'No se pudo obtener el clima en este momento' })
    }
}
