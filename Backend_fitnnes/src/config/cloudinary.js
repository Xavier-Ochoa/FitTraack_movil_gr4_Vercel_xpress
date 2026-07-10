import { v2 as cloudinary } from 'cloudinary'

// Cloudinary puede configurarse de dos formas:
//   1) Una sola variable CLOUDINARY_URL (formato:
//      cloudinary://<api_key>:<api_secret>@<cloud_name>), que es lo que
//      Cloudinary muestra en el Dashboard → "API Environment variable".
//   2) Tres variables sueltas (cloud_name / api_key / api_secret), por si
//      se prefiere así en el .env.
//
// cloudinary.config(true) le indica al SDK que lea automáticamente
// process.env.CLOUDINARY_URL. Si no existe, caemos a las variables sueltas.
if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true)
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    })
}

export default cloudinary
