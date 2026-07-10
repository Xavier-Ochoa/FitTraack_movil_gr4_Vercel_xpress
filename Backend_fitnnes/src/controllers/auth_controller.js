import crypto from 'crypto'

import User from '../models/User.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { generarJWT } from '../utils/jwt.js'
import { RESET_TOKEN_EXPIRES_MINUTES } from '../config/constants.js'
import { sendMailRecuperarPassword, sendMailPasswordCambiada } from '../services/emailService.js'

// Quita campos sensibles antes de responder al cliente
const toPublicUser = (userDoc) => {
    const user = userDoc.toObject ? userDoc.toObject() : userDoc
    delete user.passwordHash
    delete user.resetPasswordTokenHash
    delete user.resetPasswordExpires
    delete user.__v
    return user
}

// ── POST /api/auth/register ────────────────────────────────────────────────
export const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body

        if (!email || !password || !name) {
            return res.status(400).json({ msg: 'Debes proporcionar email, password y name' })
        }

        if (password.length < 6) {
            return res.status(400).json({ msg: 'La contraseña debe tener al menos 6 caracteres' })
        }

        const emailNormalizado = email.toLowerCase().trim()

        const existente = await User.findOne({ email: emailNormalizado })
        if (existente) {
            return res.status(409).json({ msg: 'Ya existe una cuenta registrada con ese email' })
        }

        const passwordHash = await hashPassword(password)

        const nuevoUsuario = await User.create({
            email: emailNormalizado,
            passwordHash,
            name: name.trim(),
        })

        const token = generarJWT(nuevoUsuario._id)

        res.status(201).json({
            token,
            user: toPublicUser(nuevoUsuario),
        })
    } catch (error) {
        next(error)
    }
}

// ── POST /api/auth/login ────────────────────────────────────────────────────
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ msg: 'Debes proporcionar email y password' })
        }

        const emailNormalizado = email.toLowerCase().trim()

        const usuario = await User.findOne({ email: emailNormalizado }).select('+passwordHash')

        // Mensaje genérico: no revelar si el email existe o no
        if (!usuario) {
            return res.status(401).json({ msg: 'Email o contraseña incorrectos' })
        }

        const passwordValido = await comparePassword(password, usuario.passwordHash)
        if (!passwordValido) {
            return res.status(401).json({ msg: 'Email o contraseña incorrectos' })
        }

        const token = generarJWT(usuario._id)

        res.status(200).json({
            token,
            user: toPublicUser(usuario),
        })
    } catch (error) {
        next(error)
    }
}

// ── Regla de seguridad de contraseña ────────────────────────────────────
// Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y
// 1 carácter especial. Ej. válido: "Ejemplo1@"
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

// ── FASE 1 — POST /api/auth/recuperarpassword ───────────────────────────
// El usuario ingresa su correo institucional en la pantalla
// "¿Olvidaste tu contraseña?". Se valida que el correo exista, se genera
// un token temporal de recuperación asociado a ese usuario y se envía
// por correo mediante Nodemailer.
export const recuperarPassword = async (req, res, next) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ msg: 'Debes proporcionar un email' })
        }

        const emailNormalizado = email.toLowerCase().trim()
        const usuario = await User.findOne({ email: emailNormalizado })

        // El correo debe existir en la base de datos.
        if (!usuario) {
            return res.status(404).json({ msg: 'No existe una cuenta registrada con ese correo' })
        }

        // Token plano (se envía por email) — solo el HASH se guarda en Mongo
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

        usuario.resetPasswordTokenHash = resetTokenHash
        usuario.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000)
        await usuario.save()

        await sendMailRecuperarPassword(usuario.email, resetToken)

        res.status(200).json({ msg: 'Revisa tu correo institucional para restablecer tu contraseña' })
    } catch (error) {
        next(error)
    }
}

// ── FASE 2 — GET /api/auth/recuperarpassword/:token ─────────────────────
// El usuario abre el enlace recibido en el correo. El frontend valida el
// token ANTES de mostrar el formulario de nueva contraseña: si el token
// no existe, no pertenece a ningún usuario o ya expiró, el formulario
// nunca debe mostrarse.
export const validarTokenRecuperacion = async (req, res, next) => {
    try {
        const { token } = req.params

        if (!token) {
            return res.status(400).json({ msg: 'Debes proporcionar el token' })
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

        const usuario = await User.findOne({
            resetPasswordTokenHash: tokenHash,
            resetPasswordExpires: { $gt: new Date() },
        }).select('+resetPasswordTokenHash +resetPasswordExpires')

        if (!usuario) {
            return res.status(400).json({ msg: 'El token es inválido o ha expirado' })
        }

        res.status(200).json({ msg: 'Token confirmado. Ya puedes crear tu nueva contraseña.' })
    } catch (error) {
        next(error)
    }
}

// ── FASE 3 — POST /api/auth/nuevopassword/:token ────────────────────────
// El usuario envía su nueva contraseña desde el formulario mostrado tras
// la validación del token (Fase 2). Se revalida el token, se comprueban
// las reglas de seguridad y la coincidencia de ambas contraseñas, se
// encripta y se guarda, y finalmente se invalida el token para que no
// pueda reutilizarse.
export const nuevoPassword = async (req, res, next) => {
    try {
        const { token } = req.params
        const { password, confirmpassword } = req.body

        if (!token) {
            return res.status(400).json({ msg: 'Debes proporcionar el token' })
        }

        if (!password || !confirmpassword) {
            return res.status(400).json({ msg: 'Debes proporcionar password y confirmpassword' })
        }

        if (password !== confirmpassword) {
            return res.status(400).json({ msg: 'Las contraseñas no coinciden' })
        }

        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                msg: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
            })
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

        // Se vuelve a verificar el token: pudo haber expirado entre la
        // Fase 2 (validación) y este envío del formulario.
        const usuario = await User.findOne({
            resetPasswordTokenHash: tokenHash,
            resetPasswordExpires: { $gt: new Date() },
        }).select('+resetPasswordTokenHash +resetPasswordExpires')

        if (!usuario) {
            return res.status(400).json({ msg: 'El token es inválido o ha expirado' })
        }

        usuario.passwordHash = await hashPassword(password)

        // Se invalida el token de recuperación para impedir reutilizarlo.
        usuario.resetPasswordTokenHash = null
        usuario.resetPasswordExpires = null
        await usuario.save()

        // No bloquea la respuesta si el correo de notificación falla
        try {
            await sendMailPasswordCambiada(usuario.email, usuario.name)
        } catch (e) {
            console.error('⚠️ No se pudo enviar el correo de notificación:', e.message)
        }

        res.status(200).json({ msg: '¡Contraseña actualizada! Ya puedes iniciar sesión.' })
    } catch (error) {
        next(error)
    }
}

// ── GET /api/auth/me (endpoint de prueba para requireAuth, B2) ─────────────
export const me = async (req, res, next) => {
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
