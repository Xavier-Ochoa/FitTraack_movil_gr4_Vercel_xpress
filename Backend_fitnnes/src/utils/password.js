import bcrypt from 'bcryptjs'
import { BCRYPT_SALT_ROUNDS } from '../config/constants.js'

export const hashPassword = async (plainPassword) => {
    return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS)
}

export const comparePassword = async (plainPassword, passwordHash) => {
    return bcrypt.compare(plainPassword, passwordHash)
}
