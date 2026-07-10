import { Schema, model } from 'mongoose'

const nutritionLogSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        queryText: {
            type: String, // texto en lenguaje natural ingresado por el usuario
            required: true,
            trim: true,
        },
        calories: {
            type: Number,
            default: 0,
        },
        proteinG: {
            type: Number,
            default: 0,
        },
        carbsG: {
            type: Number,
            default: 0,
        },
        fatG: {
            type: Number,
            default: 0,
        },
        loggedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
)

nutritionLogSchema.index({ userId: 1 })

export default model('NutritionLog', nutritionLogSchema, 'nutrition_logs')
