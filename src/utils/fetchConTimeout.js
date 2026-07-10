// Wrapper de fetch con timeout, para que una API externa caída/lenta
// (OpenWeatherMap, Open-Elevation, Nominatim) nunca cuelgue una petición
// del cliente indefinidamente.
export const fetchConTimeout = async (url, options = {}, timeoutMs = 5000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, { ...options, signal: controller.signal })
        return response
    } finally {
        clearTimeout(timeoutId)
    }
}
