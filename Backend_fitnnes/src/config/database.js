import mongoose from 'mongoose'

// ── Conexión cacheada para entornos serverless (Vercel) ────────────────────
// En serverless, cada invocación puede reutilizar el mismo proceso Node,
// así que cacheamos la promesa de conexión en `global` para no reconectar
// en cada request (y para no agotar el pool de conexiones de Mongo Atlas).
let cached = global._mongooseConn
if (!cached) {
    cached = global._mongooseConn = { conn: null, promise: null }
}

export const conectarDB = async () => {
    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(process.env.MONGODB_URI, {
                bufferCommands: false,
            })
            .then((mongooseInstance) => {
                console.log('✅ Conexión a MongoDB Atlas establecida')
                return mongooseInstance
            })
            .catch((error) => {
                cached.promise = null
                console.error('❌ Error al conectar MongoDB:', error.message)
                throw error
            })
    }

    cached.conn = await cached.promise
    return cached.conn
}
