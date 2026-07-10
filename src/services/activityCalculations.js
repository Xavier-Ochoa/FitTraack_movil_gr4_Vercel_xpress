// ── Cálculos derivados de una actividad (Sprint B5) ────────────────────────
// Aislados en un servicio para poder testearlos sin tocar Express/Mongoose,
// y para reutilizarlos luego en B6/B7 (activity_stats, stats agregados).

const MET_POR_TIPO = {
    running: 8,
    walking: 3.8,
}

const PESO_KG_POR_DEFECTO = 70 // fallback si el usuario no tiene weightKg en su perfil

/**
 * Duración en segundos. Si el cliente ya la envía, se respeta (por ejemplo
 * si el tracking se pausó y la duración "en movimiento" difiere del
 * endedAt - startedAt bruto). Si no, se calcula a partir de las fechas.
 */
export const computeDuration = ({ startedAt, endedAt, duration }) => {
    if (typeof duration === 'number' && duration > 0) {
        return duration
    }
    const segundos = (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
    return segundos > 0 ? segundos : 0
}

/** Ritmo promedio en min/km. */
export const computeAvgPace = (distanceKm, durationSeconds) => {
    if (!distanceKm || distanceKm <= 0) return null
    const minutos = durationSeconds / 60
    return Number((minutos / distanceKm).toFixed(2))
}

/** Velocidad promedio en km/h. */
export const computeAvgSpeed = (distanceKm, durationSeconds) => {
    if (!durationSeconds || durationSeconds <= 0) return null
    const horas = durationSeconds / 3600
    return Number((distanceKm / horas).toFixed(2))
}

/**
 * Calorías quemadas con fórmula MET: MET × pesoKg × horas.
 * Si el usuario no tiene `weightKg` en su perfil, se usa un peso por
 * defecto y se marca `estimated: true` para que el cliente pueda avisarlo.
 */
export const computeCaloriesBurned = ({ type, durationSeconds, weightKg }) => {
    const met = MET_POR_TIPO[type]
    if (!met) return { caloriesBurned: null, estimated: false }

    const pesoUsado = typeof weightKg === 'number' && weightKg > 0 ? weightKg : PESO_KG_POR_DEFECTO
    const horas = durationSeconds / 3600
    const calorias = Math.round(met * pesoUsado * horas)

    return {
        caloriesBurned: calorias,
        estimated: !(typeof weightKg === 'number' && weightKg > 0),
    }
}
