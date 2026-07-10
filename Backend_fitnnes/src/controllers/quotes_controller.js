import { getRandomQuoteCached } from '../services/quotesService.js'

// ── GET /api/quotes/random ────────────────────────────────────────────────
// Proxy hacia ZenQuotes con caché de 30 min (ver quotesService.js).
export const getRandomQuote = async (req, res, next) => {
    try {
        const quote = await getRandomQuoteCached()
        res.status(200).json({ quote })
    } catch (error) {
        // API externa caída/lenta, no un error de nuestro lado — 502 en
        // vez de 500 genérico, mismo criterio que weather_controller.js
        console.error('❌ Error consultando ZenQuotes:', error.message)
        res.status(502).json({ msg: 'No se pudo obtener la frase motivacional en este momento' })
    }
}
