import multer from 'multer'

// Guardamos el archivo en memoria (buffer), NO en disco: el backend no
// necesita persistir la imagen localmente, solo reenviarla a Cloudinary.
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'photo'))
    }
    cb(null, true)
}

// Límite de 5MB por imagen — suficiente para una foto de perfil,
// evita que alguien suba archivos gigantes por error o abuso.
const MAX_SIZE_BYTES = 5 * 1024 * 1024

export const uploadPhoto = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_SIZE_BYTES },
}).single('photo') // el campo del form-data debe llamarse "photo"
