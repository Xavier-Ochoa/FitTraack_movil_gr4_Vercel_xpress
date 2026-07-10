import { fetchConTimeout } from '../utils/fetchConTimeout.js'

// ── Nutrición (Sprint B7) — API Ninjas Nutrition API ────────────────────
// API Ninjas (sucesora de CalorieNinjas, absorbida por esa plataforma en
// 2025) ofrece un plan gratuito con solo registrarse (sin tarjeta) y
// acepta texto en lenguaje natural (ej. "2 huevos y una tostada"), por
// lo que el resto del backend (controller, modelo, rutas) no necesita
// cambios: esta función devuelve la misma forma de objeto de siempre.
//
// Documentación: https://api-ninjas.com/api/nutrition
// Cuenta gratuita: https://api-ninjas.com (botón "Sign Up", sin tarjeta)
//
// Nota: el plan gratuito de API Ninjas es para uso personal/no comercial
// y de desarrollo/pruebas (ver sus Términos de Servicio). Para un MVP
// académico esto es adecuado; si el proyecto se monetiza más adelante,
// habría que pasar a un plan pago de API Ninjas.

const ENDPOINT = 'https://api.api-ninjas.com/v1/nutrition'

/**
 * Envía un texto en lenguaje natural (ej. "2 huevos y una tostada") a
 * API Ninjas (Nutrition API) y devuelve los macros totales sumando todos
 * los alimentos que la API identificó en el texto.
 *
 * @param {string} queryText
 * @returns {Promise<{ calories:number, proteinG:number, carbsG:number, fatG:number, foods: object[] }>}
 * @throws si la credencial no está configurada o la petición falla
 */
export const analizarTextoNutricional = async (queryText) => {
    const apiKey = process.env.API_NINJAS_KEY

    if (!apiKey) {
        throw new Error('API_NINJAS_KEY no está configurada en el .env')
    }

    const url = `${ENDPOINT}?query=${encodeURIComponent(queryText)}`

    const response = await fetchConTimeout(
        url,
        {
            method: 'GET',
            headers: { 'X-Api-Key': apiKey },
        },
        8000
    )

    if (response.status === 401 || response.status === 403) {
        throw new Error('Credencial de API Ninjas inválida (revisa API_NINJAS_KEY)')
    }

    if (response.status === 429) {
        throw new Error('Se alcanzó el límite gratuito de API Ninjas (revisa tu cuota mensual)')
    }

    if (!response.ok) {
        const detalle = await response.text().catch(() => '')
        throw new Error(`API Ninjas respondió con status ${response.status}: ${detalle}`)
    }

    const items = await response.json()

    if (!Array.isArray(items) || items.length === 0) {
        // La API no reconoció ningún alimento en el texto
        throw new Error(
            'No se pudo reconocer ningún alimento en el texto. Intenta ser más específico (ej. "2 huevos y una tostada")'
        )
    }

    // API Ninjas a veces devuelve los campos numéricos como strings
    // (ej. "protein_g": "13.0"), así que forzamos conversión a número
    // antes de sumar/operar para evitar concatenación de texto.
    const aNumero = (valor) => {
        const n = Number(valor)
        return Number.isFinite(n) ? n : 0
    }

    // API Ninjas devuelve un array con un objeto por cada alimento
    // detectado en el texto, cada uno con sus propios macros. Sumamos
    // todo para reportar el total de la comida, y devolvemos también
    // el desglose por alimento en `foods`.
    const totales = items.reduce(
        (acc, item) => ({
            calories: acc.calories + aNumero(item.calories),
            proteinG: acc.proteinG + aNumero(item.protein_g),
            carbsG: acc.carbsG + aNumero(item.carbohydrates_total_g),
            fatG: acc.fatG + aNumero(item.fat_total_g),
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    )

    return {
        calories: Math.round(totales.calories),
        proteinG: Number(totales.proteinG.toFixed(1)),
        carbsG: Number(totales.carbsG.toFixed(1)),
        fatG: Number(totales.fatG.toFixed(1)),
        foods: items.map((item) => ({
            name: item.name,
            calories: Math.round(aNumero(item.calories)),
            proteinG: Number(aNumero(item.protein_g).toFixed(1)),
            carbsG: Number(aNumero(item.carbohydrates_total_g).toFixed(1)),
            fatG: Number(aNumero(item.fat_total_g).toFixed(1)),
            servingSizeG: aNumero(item.serving_size_g),
        })),
    }
}
