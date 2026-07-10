import { Schema, model } from 'mongoose'

const statsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    totalDistance: {
        type: Number, // km
        default: 0,
    },
    totalActivities: {
        type: Number,
        default: 0,
    },
    bestPace: {
        type: Number, // min/km
        default: null,
    },
})

// unique: true en el campo `userId` ya crea el índice.

export default model('Stats', statsSchema, 'stats')
