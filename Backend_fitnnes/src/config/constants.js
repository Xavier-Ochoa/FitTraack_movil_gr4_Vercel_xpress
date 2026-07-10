// ── Constantes de configuración centralizadas ──────────────────────────────
// Definidas acá (en vez de hardcodeadas en los controllers) para que B2/B3
// las puedan ajustar sin tocar lógica de negocio.

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const RESET_TOKEN_EXPIRES_MINUTES = Number(
    process.env.RESET_TOKEN_EXPIRES_MINUTES || 60
)

export const BCRYPT_SALT_ROUNDS = 10

// ── Sprint B7 ────────────────────────────────────────────────────────────
// Referencia de la OMS: 150 min/semana de actividad física moderada.
// Es una constante estática (no una integración en vivo).
export const OMS_MINUTOS_RECOMENDADOS_SEMANA = 150

// TTL del caché en memoria de la frase motivacional (ZenQuotes),
// para no exceder el rate limit gratuito (~5 req/30s por IP).
export const QUOTE_CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutos
