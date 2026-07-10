import { Schema, model } from 'mongoose'

const activitySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['running', 'walking'],
            required: true,
        },
        title: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        startedAt: {
            type: Date,
            required: true,
        },
        endedAt: {
            type: Date,
            required: true,
        },
        locationName: {
            type: String, // vía Nominatim (B6)
            default: null,
        },
        distance: {
            type: Number, // km
            required: true,
        },
        duration: {
            type: Number, // segundos
            required: true,
        },
        avgPace: {
            type: Number, // min/km
        },
        avgSpeed: {
            type: Number, // km/h
        },
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'cancelled'],
            default: 'completed',
        },
        weather: {
            type: Schema.Types.Mixed, // snapshot OpenWeatherMap (B6)
            default: null,
        },
        caloriesBurned: {
            type: Number, // MET × weightKg × horas (MET 8 running, 3.8 caminata)
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: false },
    }
)

activitySchema.index({ userId: 1 })

export default model('Activity', activitySchema, 'activities')
