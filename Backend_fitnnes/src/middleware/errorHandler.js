// ── Manejo de errores centralizado ─────────────────────────────────────────
// Se coloca al final de la cadena de middlewares en server.js.
export const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err)

    // Errores de Multer al subir un archivo (foto de perfil, etc.)
    if (err.name === 'MulterError') {
        const mensajes = {
            LIMIT_FILE_SIZE: 'La imagen supera el tamaño máximo permitido (5MB)',
            LIMIT_UNEXPECTED_FILE: 'El archivo debe ser una imagen (jpg, png, webp, etc.) enviada en el campo "photo"',
        }
        return res.status(400).json({
            msg: mensajes[err.code] || `Error al subir el archivo: ${err.message}`,
        })
    }

    // Errores de validación de Mongoose (ej. enum inválido, campo requerido)
    if (err.name === 'ValidationError') {
        const errores = Object.values(err.errors).map((e) => e.message)
        return res.status(400).json({ msg: 'Error de validación', errores })
    }

    // ID con formato inválido para ObjectId (ej. /api/activities/abc)
    if (err.name === 'CastError') {
        return res.status(400).json({ msg: `El valor "${err.value}" no tiene un formato válido` })
    }

    // Índice único duplicado (ej. email ya registrado)
    if (err.code === 11000) {
        return res.status(409).json({ msg: 'El recurso ya existe (valor duplicado)' })
    }

    res.status(500).json({
        msg: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
}

// ── 404 para rutas no definidas ────────────────────────────────────────────
export const notFoundHandler = (req, res) => {
    res.status(404).json({ msg: 'Endpoint no encontrado' })
}
