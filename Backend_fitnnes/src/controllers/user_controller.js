import User from '../models/User.js'
import cloudinary from '../config/cloudinary.js'

// Quita campos sensibles antes de responder al cliente
const toPublicUser = (userDoc) => {
    const user = userDoc.toObject ? userDoc.toObject() : userDoc
    delete user.passwordHash
    delete user.resetPasswordTokenHash
    delete user.resetPasswordExpires
    delete user.__v
    return user
}

// Campos que PATCH /api/users/me tiene permitido modificar.
// Todo lo demás (email, passwordHash, tokens de reset) queda fuera
// a propósito: cambiar el email o la contraseña van por otros flujos.
const CAMPOS_EDITABLES = ['name', 'photoUrl', 'age', 'weightKg', 'heightCm', 'gender', 'activityLevel']

const GENEROS_VALIDOS = ['male', 'female', 'other']
const NIVELES_ACTIVIDAD_VALIDOS = ['sedentary', 'light', 'moderate', 'active', 'very_active']

// ── GET /api/users/me ────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
    try {
        const usuario = await User.findById(req.userId)

        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' })
        }

        res.status(200).json({ user: toPublicUser(usuario) })
    } catch (error) {
        next(error)
    }
}

// ── PATCH /api/users/me ──────────────────────────────────────────────────
export const updateMe = async (req, res, next) => {
    try {
        const updates = {}

        // Solo se toman los campos permitidos que realmente vinieron en el body,
        // así los campos no enviados no se tocan (actualización parcial real).
        for (const campo of CAMPOS_EDITABLES) {
            if (req.body[campo] !== undefined) {
                updates[campo] = req.body[campo]
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ msg: 'No se envió ningún campo válido para actualizar' })
        }

        // Validaciones explícitas de enums (además de las del schema) para
        // devolver un mensaje claro y controlado en vez de un error genérico.
        if (updates.gender !== undefined && !GENEROS_VALIDOS.includes(updates.gender)) {
            return res.status(400).json({
                msg: `Género inválido. Valores permitidos: ${GENEROS_VALIDOS.join(', ')}`,
            })
        }

        if (
            updates.activityLevel !== undefined &&
            !NIVELES_ACTIVIDAD_VALIDOS.includes(updates.activityLevel)
        ) {
            return res.status(400).json({
                msg: `Nivel de actividad inválido. Valores permitidos: ${NIVELES_ACTIVIDAD_VALIDOS.join(', ')}`,
            })
        }

        for (const campoNumerico of ['age', 'weightKg', 'heightCm']) {
            if (updates[campoNumerico] !== undefined && typeof updates[campoNumerico] !== 'number') {
                return res.status(400).json({ msg: `El campo "${campoNumerico}" debe ser numérico` })
            }
        }

        const usuario = await User.findByIdAndUpdate(
            req.userId,
            { $set: updates },
            { new: true, runValidators: true, context: 'query' }
        )

        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' })
        }

        res.status(200).json({ user: toPublicUser(usuario) })
    } catch (error) {
        next(error)
    }
}

// ── POST /api/users/me/photo ─────────────────────────────────────────────
// Recibe la imagen como multipart/form-data (campo "photo", ver
// middleware/uploadPhoto.js), la sube a Cloudinary y guarda la URL
// resultante en el campo `photoUrl` del usuario autenticado.
export const uploadProfilePhoto = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                msg: 'Debes enviar una imagen en el campo "photo" (multipart/form-data)',
            })
        }

        // Subimos el buffer directamente desde memoria, sin escribir a disco.
        // - public_id fijo por usuario + overwrite:true → cada usuario tiene
        //   como máximo UNA foto de perfil en Cloudinary; si sube una nueva,
        //   reemplaza la anterior en vez de acumular archivos huérfanos.
        // - transformation recorta/ajusta a un cuadrado de 512x512
        //   centrado en el rostro, ideal para avatar de perfil.
        const resultadoSubida = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'fittrack/profile_photos',
                    public_id: `user_${req.userId}`,
                    overwrite: true,
                    resource_type: 'image',
                    transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }],
                },
                (error, result) => {
                    if (error) return reject(error)
                    resolve(result)
                }
            )
            stream.end(req.file.buffer)
        })

        const usuario = await User.findByIdAndUpdate(
            req.userId,
            { $set: { photoUrl: resultadoSubida.secure_url } },
            { new: true }
        )

        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' })
        }

        res.status(200).json({ user: toPublicUser(usuario) })
    } catch (error) {
        // Error propio de Cloudinary (credenciales inválidas, cuota, etc.)
        // No es un error de nuestra DB, así que no lo mandamos como 500
        // genérico; devolvemos 502 (fallo de servicio externo).
        if (error?.http_code) {
            console.error('❌ Error subiendo imagen a Cloudinary:', error.message)
            return res.status(502).json({
                msg: 'No se pudo subir la imagen en este momento. Intenta nuevamente.',
            })
        }
        next(error)
    }
}
