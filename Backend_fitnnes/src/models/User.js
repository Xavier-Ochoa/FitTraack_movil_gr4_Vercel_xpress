import { Schema, model } from 'mongoose'

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            select: false, // nunca se devuelve por defecto en queries
        },
        name: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true,
        },
        photoUrl: {
            type: String,
            default: null,
        },

        // ── Recuperación de contraseña (Sprint B3) ──────────────────────
        resetPasswordTokenHash: {
            type: String,
            default: null,
            select: false,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
            select: false,
        },

        // ── Datos de perfil / fisiológicos (usados desde B4 en adelante) ─
        age: {
            type: Number,
            default: null,
        },
        weightKg: {
            type: Number,
            default: null,
        },
        heightCm: {
            type: Number,
            default: null,
        },
        gender: {
            type: String,
            enum: {
                values: ['male', 'female', 'other'],
                message: 'Género inválido',
            },
            default: null,
        },
        activityLevel: {
            type: String,
            enum: {
                values: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
                message: 'Nivel de actividad inválido',
            },
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: false },
    }
)

// unique: true en el campo `email` ya crea el índice único; no se declara
// un .index() adicional para evitar advertencias de índice duplicado.

export default model('User', userSchema, 'users')
