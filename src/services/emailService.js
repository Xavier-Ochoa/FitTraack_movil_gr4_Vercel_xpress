import { sendMail } from '../config/nodemailer.js'
import { RESET_TOKEN_EXPIRES_MINUTES } from '../config/constants.js'

/**
 * Envía el email de "olvidé mi contraseña" con el token EN TEXTO PLANO
 * (el hash del token es lo único que se guarda en la base de datos).
 *
 * @param {string} destino    - email del usuario
 * @param {string} resetToken - token plano (crypto.randomBytes(32).toString('hex'))
 */
export const sendMailRecuperarPassword = (destino, resetToken) => {
    const baseUrl = process.env.APP_RESET_PASSWORD_URL || 'https://fittrackpro.app/reset-password'
    const link = `${baseUrl}?token=${resetToken}`

    return sendMail(
        destino,
        '🔐 Recuperación de contraseña — FitTrack Pro',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px;
                    border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">

            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #ff6a3d; margin: 0 0 6px 0;">🏃 FitTrack Pro</h1>
                <p style="color: #666; font-size: 15px; margin: 0;">Recuperación de contraseña</p>
            </div>

            <p style="color: #333; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
                Recibimos una solicitud para restablecer tu contraseña. Toca el botón de abajo
                para elegir una nueva. Si no fuiste tú, ignora este mensaje.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
                <a href="${link}"
                   style="display: inline-block; background: #ff6a3d; color: #ffffff;
                          text-decoration: none; font-weight: 700; font-size: 15px;
                          padding: 14px 28px; border-radius: 8px;">
                    Restablecer contraseña
                </a>
            </div>

            <p style="color: #888; font-size: 13px; text-align: center; margin-bottom: 24px;">
                O copia y pega este enlace en tu navegador:<br>
                <span style="word-break: break-all;">${link}</span>
            </p>

            <div style="background: #fff5f0; border-left: 4px solid #ff6a3d; border-radius: 6px;
                        padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; color: #333; font-size: 13px; line-height: 1.6;">
                    <strong>⏱ Este enlace expira en ${RESET_TOKEN_EXPIRES_MINUTES} minutos</strong>
                    y solo puede usarse una vez.
                </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">

            <footer style="text-align: center; color: #aaa; font-size: 12px;">
                <p style="margin: 4px 0;"><strong style="color: #ff6a3d;">FitTrack Pro</strong></p>
                <p style="margin: 12px 0 0 0; color: #bbb;">
                    Este es un mensaje automático, por favor no respondas a este correo.
                </p>
            </footer>
        </div>
        `
    )
}

/**
 * Notificación de contraseña cambiada exitosamente.
 */
export const sendMailPasswordCambiada = (destino, name) => {
    const fecha = new Date().toLocaleString('es-EC', {
        dateStyle: 'full',
        timeStyle: 'short',
    })

    return sendMail(
        destino,
        '🔒 Tu contraseña fue cambiada — FitTrack Pro',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px;
                    border: 1px solid #e0e0e0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #ff6a3d; margin: 0 0 6px 0;">🏃 FitTrack Pro</h1>
            </div>
            <p style="color: #333; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">
                Hola <strong>${name}</strong>, tu contraseña fue actualizada exitosamente el
                <strong>${fecha}</strong>.
            </p>
            <div style="background: #fff3e0; border-radius: 8px; padding: 16px 20px;
                        border-left: 4px solid #ff9800; margin-bottom: 24px;">
                <p style="margin: 0; color: #444; font-size: 14px; line-height: 1.8;">
                    <strong>⚠️ ¿No reconoces este cambio?</strong> Contacta con soporte de
                    inmediato.
                </p>
            </div>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
            <footer style="text-align: center; color: #aaa; font-size: 12px;">
                <p style="margin: 4px 0;"><strong style="color: #ff6a3d;">FitTrack Pro</strong></p>
            </footer>
        </div>
        `
    )
}
