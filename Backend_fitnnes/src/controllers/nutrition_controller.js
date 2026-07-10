import mongoose from 'mongoose'
import NutritionLog from '../models/NutritionLog.js'
import { analizarTextoNutricional } from '../services/nutritionService.js'

// Formato esperado del query param `?date=YYYY-MM-DD`
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Rango [inicio, fin) del día indicado (UTC) a partir de "YYYY-MM-DD". */
const rangoDelDiaUTC = (fechaStr) => {
    const inicio = new Date(`${fechaStr}T00:00:00.000Z`)
    const fin = new Date(inicio)
    fin.setUTCDate(fin.getUTCDate() + 1)
    return { inicio, fin }
}

// ── POST /api/nutrition/log ─────────────────────────────────────────────
export const createNutritionLog = async (req, res, next) => {
    try {
        const { queryText } = req.body

        if (!queryText || typeof queryText !== 'string' || !queryText.trim()) {
            return res.status(400).json({ msg: 'Debes proporcionar "queryText" (texto no vacío)' })
        }

        let resultado
        try {
            resultado = await analizarTextoNutricional(queryText.trim())
        } catch (errorExterno) {
            // Fallo de la API externa (credenciales, timeout, texto no
            // reconocido, límite gratuito alcanzado) — no es un error de
            // nuestra base de datos.
            console.error('❌ Error consultando la API de nutrición (API Ninjas):', errorExterno.message)
            return res.status(502).json({
                msg: 'No se pudo analizar el texto nutricional en este momento. Intenta ser más específico (ej. "2 huevos y una tostada").',
                detalle: errorExterno.message,
            })
        }

        const registro = await NutritionLog.create({
            userId: req.userId,
            queryText: queryText.trim(),
            calories: resultado.calories,
            proteinG: resultado.proteinG,
            carbsG: resultado.carbsG,
            fatG: resultado.fatG,
            loggedAt: new Date(),
        })

        res.status(201).json({ nutritionLog: registro, foods: resultado.foods })
    } catch (error) {
        next(error)
    }
}

// ── GET /api/nutrition/logs?date=YYYY-MM-DD ─────────────────────────────
export const listNutritionLogs = async (req, res, next) => {
    try {
        const { date } = req.query
        const filtro = { userId: req.userId }

        if (date !== undefined) {
            if (!FORMATO_FECHA.test(date)) {
                return res.status(400).json({ msg: 'El query param "date" debe tener formato YYYY-MM-DD' })
            }
            const { inicio, fin } = rangoDelDiaUTC(date)
            filtro.loggedAt = { $gte: inicio, $lt: fin }
        }

        const registros = await NutritionLog.find(filtro).sort({ loggedAt: -1 })

        res.status(200).json({ nutritionLogs: registros })
    } catch (error) {
        next(error)
    }
}

// ── DELETE /api/nutrition/logs/:id ──────────────────────────────────────
export const deleteNutritionLog = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: 'El id de registro no tiene un formato válido' })
        }

        const registro = await NutritionLog.findById(req.params.id)

        if (!registro) {
            return res.status(404).json({ msg: 'Registro de nutrición no encontrado' })
        }

        if (registro.userId.toString() !== req.userId) {
            return res.status(403).json({ msg: 'No tienes permiso para eliminar este registro' })
        }

        await NutritionLog.findByIdAndDelete(registro._id)

        res.status(200).json({ msg: 'Registro de nutrición eliminado correctamente' })
    } catch (error) {
        next(error)
    }
}
