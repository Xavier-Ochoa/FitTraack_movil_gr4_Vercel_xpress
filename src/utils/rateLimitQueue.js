// ── Cola de tasa fija (rate limiter) ───────────────────────────────────────
// Nominatim exige máximo 1 request/segundo. Esta cola encapsula esa regla
// para que, sin importar cuántas actividades se creen "al mismo tiempo",
// las llamadas a Nominatim salgan espaciadas.
//
// Implementación simple en memoria del proceso: alcanza para un backend
// de una sola instancia (MVP). Si se escalara a múltiples instancias,
// habría que mover esto a un lock distribuido (Redis, etc.).
class ColaConLimiteDeTasa {
    constructor(minIntervaloMs) {
        this.minIntervaloMs = minIntervaloMs
        this.colaPromesas = Promise.resolve()
    }

    /** Encola `tarea` (una función async) y la ejecuta respetando el intervalo mínimo. */
    encolar(tarea) {
        const resultado = this.colaPromesas.then(async () => {
            await tarea()
        })
        // Aunque `tarea` falle, seguimos encadenando (catch silencioso interno)
        // para no bloquear las siguientes peticiones de la cola.
        this.colaPromesas = resultado.catch(() => {}).then(
            () => new Promise((resolve) => setTimeout(resolve, this.minIntervaloMs))
        )
        return resultado
    }
}

export const nominatimQueue = new ColaConLimiteDeTasa(1050) // 1 req/seg + margen
