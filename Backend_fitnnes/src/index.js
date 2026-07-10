// ── Punto de entrada SOLO para desarrollo local (npm run dev / npm start) ──
// En Vercel, el handler real es api/index.js; este archivo no se usa allí.
import dotenv from 'dotenv'
dotenv.config()

import app from './server.js'

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    console.log(`✅ Servidor FitTrack Pro corriendo en el puerto ${PORT}`)
})
