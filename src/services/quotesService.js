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
 * Traduce un texto de inglés a español usando MyMemory (API gratuita,
 * no requiere API key). Si la traducción falla por cualquier motivo,
 * se devuelve el texto original en inglés (fallback silencioso) para
 * que el endpoint nunca se caiga por un problema del traductor.
 */
const traducirAlEspanol = async (texto) => {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|es`
        const response = await fetchConTimeout(url, {}, 5000)

        if (!response.ok) {
            return texto
        }

        const data = await response.json()
        const traducido = data?.responseData?.translatedText

        return traducido && traducido.trim() ? traducido : texto
    } catch (error) {
        return texto
    }
}

/**
 * Devuelve una frase motivacional traducida al español, usando el caché
 * si todavía es válido o consultando ZenQuotes + traductor si expiró
 * (o si nunca se consultó).
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
        quote: await traducirAlEspanol(primera.q),
        author: primera.a,
    }

    cache = { quote, cachedAt: Date.now() }

    return { ...quote, cached: false }
}
