import { Schema, model } from 'mongoose'

const activityStatsSchema = new Schema({
    activityId: {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
        required: true,
        unique: true,
    },
    elevationGain: {
        type: Number, // vía Open-Elevation, con altitud GPS como respaldo
        default: null,
    },
    elevationLoss: {
        type: Number,
        default: null,
    },
    maxSpeed: {
        type: Number, // km/h
        default: null,
    },
    minPace: {
        type: Number, // min/km — mejor ritmo puntual de esa actividad
        default: null,
    },
    samplingFrequency: {
        type: Number, // segundos entre puntos
        default: null,
    },
})

// unique: true en el campo `activityId` ya crea el índice único.

export default model('ActivityStats', activityStatsSchema, 'activity_stats')
