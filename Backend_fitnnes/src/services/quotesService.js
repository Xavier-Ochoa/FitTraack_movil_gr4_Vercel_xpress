import { fetchConTimeout } from '../utils/fetchConTimeout.js'
import { QUOTE_CACHE_TTL_MS } from '../config/constants.js'

// ── Caché en memoria del proceso ────────────────────────────────────────
// ZenQuotes no requiere API key, pero su plan gratuito limita a ~5
// requests / 30 segundos por IP. Como esta app comparte una sola IP de
// servidor entre todos los usuarios, cacheamos la ÚLTIMA frase obtenida
// y la reutilizamos durante `QUOTE_CACHE_TTL_MS` (30 min) para cualquier
// usuario que pida una frase dentro de esa ventana, en vez de pegarle a
// ZenQuotes en cada llamada.
//
// Limitación conocida y aceptada para el MVP: todos los usuarios ven la
// MISMA frase durante la ventana de caché (no es una frase "random" por
// usuario). Si se escalara a múltiples instancias del backend, este
// caché en memoria dejaría de ser compartido entre instancias y habría
// que moverlo a Mongo/Redis.
let cache = {
    quote: null,
    cachedAt: 0,
}

const cacheVigente = () => cache.quote !== null && Date.now() - cache.cachedAt < QUOTE_CACHE_TTL_MS

/**
 * Devuelve una frase motivacional, usando el caché si todavía es válido
 * o consultando ZenQuotes si expiró (o si nunca se consultó).
 *
 * @returns {Promise<{ quote: string, author: string, cached: boolean }>}
 */
export const getRandomQuoteCached = async () => {
    if (cacheVigente()) {
        return { ...cache.quote, cached: true }
    }

    const response = await fetchConTimeout('https://zenquotes.io/api/random', {}, 5000)

    if (!response.ok) {
        throw new Error(`ZenQuotes respondió con status ${response.status}`)
    }

    const data = await response.json()
    const primera = Array.isArray(data) ? data[0] : null

    if (!primera) {
        throw new Error('ZenQuotes no devolvió ninguna frase')
    }

    const quote = {
        quote: primera.q,
        author: primera.a,
    }

    cache = { quote, cachedAt: Date.now() }

    return { ...quote, cached: false }
}
