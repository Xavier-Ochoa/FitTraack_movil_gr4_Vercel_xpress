import nodemailer from 'nodemailer'

// Funciona tanto con Gmail (App Password) como con cualquier SMTP genérico
// (Resend, SendGrid, etc. suelen exponer host/port/user/pass tipo SMTP).
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 465),
    secure: Number(process.env.EMAIL_PORT || 465) === 465, // true para 465, false para 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

export const sendMail = async (destino, asunto, html) => {
    await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'FitTrack Pro'}" <${process.env.EMAIL_USER}>`,
        to: destino,
        subject: asunto,
        html,
    })
}
