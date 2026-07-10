import { fetchConTimeout } from '../utils/fetchConTimeout.js'

/**
 * Consulta el clima actual para unas coordenadas dadas.
 * Devuelve un snapshot simplificado — nunca expone la API key al cliente,
 * porque esta función corre en el backend, no en el navegador/app.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<object>} snapshot de clima
 * @throws si la API key no está configurada o la petición falla
 */
export const getWeatherByCoords = async (lat, lng) => {
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
        throw new Error('OPENWEATHER_API_KEY no está configurada en el .env')
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&lang=es&appid=${apiKey}`

    const response = await fetchConTimeout(url, {}, 5000)

    if (!response.ok) {
        throw new Error(`OpenWeatherMap respondió con status ${response.status}`)
    }

    const data = await response.json()

    // Snapshot simplificado — evitamos guardar/exponer el payload crudo completo
    return {
        tempC: data.main?.temp ?? null,
        feelsLikeC: data.main?.feels_like ?? null,
        humidity: data.main?.humidity ?? null,
        windSpeedMs: data.wind?.speed ?? null,
        condition: data.weather?.[0]?.main ?? null,
        description: data.weather?.[0]?.description ?? null,
        icon: data.weather?.[0]?.icon ?? null,
        fetchedAt: new Date().toISOString(),
    }
}
