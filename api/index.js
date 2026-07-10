// ── Entry point para Vercel Serverless Functions ───────────────────────────
// Vercel detecta cualquier archivo dentro de /api como una función.
// Aquí simplemente exportamos la app de Express ya configurada; Vercel se
// encarga de invocarla como handler (req, res) en cada request.
import 'dotenv/config'
import app from '../src/server.js'

export default app
