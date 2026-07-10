import { Schema, model } from 'mongoose'

const trackPointSchema = new Schema({
    activityId: {
        type: Schema.Types.ObjectId,
        ref: 'Activity',
        required: true,
    },
    lat: {
        type: Number,
        required: true,
    },
    lng: {
        type: Number,
        required: true,
    },
    altitude: {
        type: Number,
        default: null,
    },
    speed: {
        type: Number, // m/s
        default: null,
    },
    accuracy: {
        type: Number, // metros
        default: null,
    },
    timestamp: {
        type: Date,
        required: true,
    },
})

trackPointSchema.index({ activityId: 1 })

export default model('TrackPoint', trackPointSchema, 'track_points')
