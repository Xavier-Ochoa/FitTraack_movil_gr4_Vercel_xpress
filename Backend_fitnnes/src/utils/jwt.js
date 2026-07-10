import jwt from 'jsonwebtoken'
import { JWT_EXPIRES_IN } from '../config/constants.js'

export const generarJWT = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    })
}

export const verificarJWT = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET)
}
