# Guía de Endpoints — API FitTrack Pro (para probar en Postman)

**URL base del backend (producción, Render):**
```
https://fittraack-movil-gr4-v2-xpress.onrender.com
```

Todas las URLs de esta guía ya están escritas completas con esta base, listas para pegar en Postman.

> ⚠️ Nota: Render pone a "dormir" el servicio gratis si nadie lo usa. La primera petición después de un tiempo de inactividad puede tardar 20-30 segundos en responder (se está "despertando"). Es normal, no es un error.

---

## Índice

1. [Cómo funciona la autenticación (léelo primero)](#cómo-funciona-la-autenticación)
2. [Auth — Registro, login y contraseña](#1-auth)
3. [Users — Perfil del usuario](#2-users)
4. [Activities — Actividades físicas (correr / caminar)](#3-activities)
5. [Weather — Clima](#4-weather)
6. [Stats — Estadísticas del usuario](#5-stats)
7. [Quotes — Frase motivacional](#6-quotes)
8. [Nutrition — Registro de comidas](#7-nutrition)
9. [Extra — Health check](#8-extra)
10. [Tabla resumen de todos los endpoints](#tabla-resumen)

---

## Cómo funciona la autenticación

Casi todos los endpoints de esta API son **privados**: necesitan que envíes un "token" que identifica al usuario que hizo login.

**Pasos en Postman:**

1. Primero llama a `POST /api/auth/register` o `POST /api/auth/login`. La respuesta te da un `token` (un texto largo tipo `eyJhbGciOi...`).
2. Copia ese `token`.
3. En cualquier endpoint marcado como 🔒 **Privado**, ve a la pestaña **Headers** de Postman y agrega:

| Key | Value |
|---|---|
| `Authorization` | `Bearer TU_TOKEN_AQUI` |

   (Ojo: la palabra `Bearer`, un espacio, y luego el token pegado, todo en el mismo valor).

4. Si el token falta, está mal escrito o expiró, la API responde `401 Acceso denegado: token no proporcionado` o `401 Token inválido o expirado`.

El token expira a los **7 días**. Después de eso hay que volver a hacer login.

💡 **Tip Postman**: puedes crear una variable de entorno `{{token}}` con el valor del token y usar `Authorization: Bearer {{token}}` en todas las peticiones, así no lo vuelves a copiar cada vez.

---

## 1. Auth
Rutas base: `/api/auth`. Sirven para crear cuentas, iniciar sesión y recuperar contraseña.

### 1.1 Registrar usuario
Crea una cuenta nueva. Es el primer paso para poder usar la app: guarda el email, la contraseña (encriptada) y el nombre, y de una vez devuelve el token para que el usuario quede logueado automáticamente tras registrarse.

- **Método:** `POST`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/auth/register`
- **Autenticación:** 🔓 Pública
- **Body (JSON):**
```json
{
  "email": "juan@example.com",
  "password": "123456",
  "name": "Juan Pérez"
}
```
- **Reglas:** `email`, `password` y `name` son obligatorios. `password` mínimo 6 caracteres. El email no puede estar repetido.
- **Respuesta (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "665f...",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "photoUrl": null,
    "age": null,
    "weightKg": null,
    "heightCm": null,
    "gender": null,
    "activityLevel": null,
    "createdAt": "2026-07-10T12:00:00.000Z"
  }
}
```
- **Errores comunes:** `400` si falta algún campo o la contraseña es muy corta. `409` si el email ya existe.

---

### 1.2 Iniciar sesión
Valida email + contraseña y devuelve el token para usar en el resto de endpoints privados.

- **Método:** `POST`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/auth/login`
- **Autenticación:** 🔓 Pública
- **Body (JSON):**
```json
{
  "email": "juan@example.com",
  "password": "123456"
}
```
- **Respuesta (200 OK):** igual formato que el registro (`token` + `user`).
- **Errores comunes:** `400` si falta email o password. `401 Email o contraseña incorrectos` si no coinciden (mensaje genérico a propósito, por seguridad).

---

### 1.3 Olvidé mi contraseña
Inicia el flujo de recuperación: si el email existe, genera un token temporal (válido 60 minutos) y le envía un correo con el link para restablecer la contraseña.

- **Método:** `POST`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/auth/forgot-password`
- **Autenticación:** 🔓 Pública
- **Body (JSON):**
```json
{
  "email": "juan@example.com"
}
```
- **Respuesta (200 OK):** siempre el mismo mensaje, exista o no el email (para no revelar qué correos están registrados):
```json
{
  "msg": "Si el email está registrado, recibirás un enlace para restablecer tu contraseña."
}
```

---

### 1.4 Restablecer contraseña
Segundo paso del flujo anterior: con el token que llegó por correo, define una contraseña nueva.

- **Método:** `POST`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/auth/reset-password`
- **Autenticación:** 🔓 Pública
- **Body (JSON):**
```json
{
  "token": "el_token_que_llegó_por_correo",
  "newPassword": "nuevaClave123"
}
```
- **Respuesta (200 OK):**
```json
{ "msg": "Contraseña actualizada correctamente. Ya puedes iniciar sesión." }
```
- **Errores comunes:** `400` si el token es inválido o ya expiró, o si `newPassword` tiene menos de 6 caracteres.

---

### 1.5 Ver mi usuario (ruta de prueba de login)
Endpoint simple para comprobar que el token funciona: devuelve los datos del usuario dueño del token. (Es prácticamente igual a `GET /api/users/me`, se usa para validar rápido la autenticación).

- **Método:** `GET`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/auth/me`
- **Autenticación:** 🔒 Privado (header `Authorization: Bearer {token}`)
- **Body:** no necesita
- **Respuesta (200 OK):**
```json
{ "user": { "_id": "665f...", "email": "juan@example.com", "name": "Juan Pérez", "...": "..." } }
```

---

## 2. Users
Rutas base: `/api/users`. Ver y editar el perfil del usuario logueado (datos personales y físicos usados para cálculos como calorías e IMC).

### 2.1 Ver mi perfil
Devuelve todos los datos del usuario autenticado.

- **Método:** `GET`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/users/me`
- **Autenticación:** 🔒 Privado
- **Body:** no necesita
- **Respuesta (200 OK):**
```json
{
  "user": {
    "_id": "665f...",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "photoUrl": null,
    "age": 25,
    "weightKg": 70,
    "heightCm": 175,
    "gender": "male",
    "activityLevel": "moderate",
    "createdAt": "2026-07-10T12:00:00.000Z"
  }
}
```

---

### 2.2 Actualizar mi perfil
Edita datos del perfil. Solo se actualizan los campos que envíes (actualización parcial); no hace falta mandarlos todos. **No sirve para cambiar email ni contraseña** (eso va por otros endpoints).

- **Método:** `PATCH`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/users/me`
- **Autenticación:** 🔒 Privado
- **Body (JSON) — todos los campos son opcionales, envía solo los que quieras cambiar:**
```json
{
  "name": "Juan Pérez López",
  "age": 26,
  "weightKg": 71.5,
  "heightCm": 175,
  "gender": "male",
  "activityLevel": "active"
}
```
- **Valores válidos:**
  - `gender`: `"male"`, `"female"`, `"other"`
  - `activityLevel`: `"sedentary"`, `"light"`, `"moderate"`, `"active"`, `"very_active"`
  - `age`, `weightKg`, `heightCm`: deben ser números
- **Respuesta (200 OK):** el usuario actualizado, mismo formato que 2.1.
- **Errores comunes:** `400` si no envías ningún campo válido, si `gender`/`activityLevel` tienen un valor no permitido, o si los campos numéricos no son números.

---

### 2.3 Subir foto de perfil
Sube una imagen (se guarda en Cloudinary) y la asigna como foto de perfil del usuario. Si ya tenía una foto, la reemplaza.

- **Método:** `POST`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/users/me/photo`
- **Autenticación:** 🔒 Privado
- **Body:** en Postman, pestaña **Body → form-data** (NO raw/JSON):

| Key | Type | Value |
|---|---|---|
| `photo` | File | (selecciona la imagen desde tu computadora) |

  - El campo **debe llamarse exactamente `photo`**.
  - Solo se aceptan imágenes (jpg, png, webp, etc.).
  - Tamaño máximo: 5 MB.
- **Respuesta (200 OK):** el usuario actualizado con la nueva `photoUrl`:
```json
{ "user": { "_id": "665f...", "photoUrl": "https://res.cloudinary.com/.../user_665f....jpg", "...": "..." } }
```
- **Errores comunes:** `400` si no envías el archivo o no es una imagen. `502` si Cloudinary falla.

---

## 3. Activities
Rutas base: `/api/activities`. Registro de sesiones de ejercicio (correr o caminar), incluyendo la ruta GPS punto por punto. **Todas requieren token.**

### 3.1 Crear actividad
Guarda una actividad terminada (con su ruta GPS opcional). El backend calcula automáticamente duración, ritmo promedio, velocidad promedio y calorías quemadas; además intenta enriquecerla con clima, nombre del lugar y desnivel.

- **Método:** `POST`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/activities`
- **Autenticación:** 🔒 Privado
- **Body (JSON):**
```json
{
  "type": "running",
  "title": "Carrera matutina",
  "description": "Trote en el parque",
  "startedAt": "2026-07-10T08:00:00.000Z",
  "endedAt": "2026-07-10T08:30:00.000Z",
  "distance": 5.2,
  "trackPoints": [
    { "lat": -0.0378, "lng": -78.1417, "altitude": 2600, "speed": 2.5, "accuracy": 5, "timestamp": "2026-07-10T08:00:00.000Z" },
    { "lat": -0.0380, "lng": -78.1420, "altitude": 2602, "speed": 2.7, "accuracy": 5, "timestamp": "2026-07-10T08:01:00.000Z" }
  ],
  "weather": null
}
```
- **Campos:**
  - `type` (obligatorio): `"running"` o `"walking"`
  - `startedAt`, `endedAt` (obligatorios): fechas ISO, `endedAt` debe ser posterior a `startedAt`
  - `distance` (obligatorio): número en kilómetros, ≥ 0
  - `title`, `description`: opcionales, texto libre
  - `trackPoints`: opcional, array de puntos GPS. Si se envían, cada uno necesita al menos `lat`, `lng` y `timestamp`
  - `weather`: opcional, snapshot de clima ya capturado por el cliente al iniciar (ver endpoint 4.1)
- **Respuesta (201 Created):**
```json
{
  "activity": { "_id": "665f...", "userId": "665f...", "type": "running", "distance": 5.2, "duration": 1800, "avgPace": 5.77, "avgSpeed": 10.4, "caloriesBurned": 420, "status": "completed", "weather": {"...": "..."}, "locationName": "Cayambe, Ecuador", "startedAt": "...", "endedAt": "..." },
  "activityStats": { "elevationGain": 12, "elevationLoss": 5, "maxSpeed": 11.2, "minPace": 5.1, "samplingFrequency": 60 },
  "trackPointsGuardados": 2,
  "caloriesBurnedEstimated": false
}
```
  - `caloriesBurnedEstimated: true` significa que se usó un peso corporal por defecto porque el usuario no tiene `weightKg` en su perfil.
- **Errores comunes:** `400` si falta `type`, fechas inválidas, `distance` inválida, o algún `trackPoint` sin `lat`/`lng`/`timestamp`.

---

### 3.2 Listar mis actividades
Devuelve todas las actividades del usuario autenticado, resumidas (sin los puntos GPS), ordenadas de la más reciente a la más antigua.

- **Método:** `GET`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/activities`
- **Autenticación:** 🔒 Privado
- **Body:** no necesita
- **Respuesta (200 OK):**
```json
{ "activities": [ { "_id": "665f...", "type": "running", "distance": 5.2, "duration": 1800, "startedAt": "...", "...": "..." } ] }
```

---

### 3.3 Ver detalle de una actividad
Devuelve una actividad específica con toda su información: la ruta GPS completa punto por punto y las estadísticas calculadas (desnivel, velocidad máxima, etc.).

- **Método:** `GET`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/activities/{id}`
  - Reemplaza `{id}` por el `_id` de la actividad (lo obtienes de 3.1 o 3.2). Ejemplo: `.../api/activities/665f1a2b3c4d5e6f7g8h9i0j`
- **Autenticación:** 🔒 Privado (solo puedes ver tus propias actividades)
- **Body:** no necesita
- **Respuesta (200 OK):**
```json
{
  "activity": { "_id": "665f...", "type": "running", "...": "..." },
  "trackPoints": [ { "lat": -0.0378, "lng": -78.1417, "timestamp": "..." } ],
  "activityStats": { "elevationGain": 12, "maxSpeed": 11.2, "...": "..." }
}
```
- **Errores comunes:** `400` si el id no tiene formato válido. `404` si no existe. `403` si la actividad es de otro usuario.

---

### 3.4 Eliminar una actividad
Borra la actividad y, en cascada, sus puntos GPS y sus estadísticas asociadas.

- **Método:** `DELETE`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/activities/{id}`
- **Autenticación:** 🔒 Privado (solo puedes borrar tus propias actividades)
- **Body:** no necesita
- **Respuesta (200 OK):**
```json
{ "msg": "Actividad eliminada correctamente" }
```
- **Errores comunes:** `400` id inválido. `404` no existe. `403` es de otro usuario.

---

## 4. Weather

### 4.1 Consultar el clima actual
Devuelve el clima actual para unas coordenadas (útil para mostrarlo antes de iniciar una actividad, o para guardarlo como snapshot al crearla). El backend actúa como intermediario con OpenWeatherMap, así la app nunca necesita la API key.

- **Método:** `GET`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/weather?lat=-0.0378&lng=-78.1417`
- **Autenticación:** 🔒 Privado
- **Query params:**
  - `lat`: latitud (número)
  - `lng`: longitud (número)
- **Respuesta (200 OK):**
```json
{
  "weather": {
    "tempC": 18.5,
    "feelsLikeC": 17.9,
    "humidity": 70,
    "windSpeedMs": 2.1,
    "condition": "Clouds",
    "description": "nubes dispersas",
    "icon": "03d",
    "fetchedAt": "2026-07-10T12:00:00.000Z"
  }
}
```
- **Errores comunes:** `400` si faltan `lat`/`lng` o no son números. `502` si OpenWeatherMap falla.

---

## 5. Stats

### 5.1 Ver mis estadísticas
Devuelve un resumen completo del progreso del usuario: distancia y actividades totales, mejor ritmo histórico, comparación de minutos de actividad de la última semana contra la recomendación de la OMS (150 min/semana), balance calórico del día (calorías quemadas vs consumidas) e IMC calculado con el peso/altura del perfil.

- **Método:** `GET`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/stats/me`
- **Autenticación:** 🔒 Privado
- **Body:** no necesita
- **Respuesta (200 OK):**
```json
{
  "stats": {
    "totalDistance": 42.5,
    "totalActivities": 8,
    "bestPace": 5.1,
    "oms": {
      "minutosUltimaSemana": 120,
      "recomendadoMinutosSemana": 150,
      "cumpleRecomendacionOMS": false,
      "porcentajeCumplido": 80.0
    },
    "balanceCalorico": {
      "caloriesBurnedHoy": 420,
      "caloriesConsumedHoy": 1800,
      "balance": 1380
    },
    "imc": 22.9
  }
}
```
  - `imc` puede salir `null` si el usuario no tiene `weightKg` o `heightCm` cargados en su perfil.

---

## 6. Quotes

### 6.1 Frase motivacional aleatoria
Devuelve una frase motivacional (autor incluido) para mostrar en la app, por ejemplo en la pantalla de inicio. Internamente el backend usa un caché de 30 minutos, así que varias llamadas seguidas pueden devolver la misma frase (`cached: true`).

- **Método:** `GET`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/quotes/random`
- **Autenticación:** 🔒 Privado
- **Body:** no necesita
- **Respuesta (200 OK):**
```json
{
  "quote": {
    "quote": "El único mal entrenamiento es el que no hiciste.",
    "author": "Anónimo",
    "cached": true
  }
}
```
- **Errores comunes:** `502` si el servicio externo (ZenQuotes) falla.

---

## 7. Nutrition
Rutas base: `/api/nutrition`. Registro de comidas descritas en lenguaje natural; el backend calcula automáticamente calorías y macronutrientes. **Todas requieren token.**

### 7.1 Registrar una comida
Recibe una descripción de lo que comiste en texto libre y el backend calcula calorías, proteína, carbohidratos y grasas automáticamente (usando una API externa de nutrición), guardando el resultado.

- **Método:** `POST`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/nutrition/log`
- **Autenticación:** 🔒 Privado
- **Body (JSON):**
```json
{
  "queryText": "2 huevos y una tostada"
}
```
  - Mientras más específico el texto (cantidades incluidas), mejor el resultado.
- **Respuesta (201 Created):**
```json
{
  "nutritionLog": {
    "_id": "665f...",
    "userId": "665f...",
    "queryText": "2 huevos y una tostada",
    "calories": 220,
    "proteinG": 14,
    "carbsG": 18,
    "fatG": 10,
    "loggedAt": "2026-07-10T12:00:00.000Z"
  },
  "foods": [ { "name": "egg", "calories": 155, "...": "..." }, { "name": "toast", "...": "..." } ]
}
```
- **Errores comunes:** `400` si `queryText` está vacío. `502` si la API externa de nutrición falla o no reconoce el texto (intenta ser más específico).

---

### 7.2 Listar mis registros de comida
Devuelve el historial de comidas registradas por el usuario, ordenado de la más reciente a la más antigua. Se puede filtrar por un día específico.

- **Método:** `GET`
- **URL (sin filtro):** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/nutrition/logs`
- **URL (filtrando por fecha):** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/nutrition/logs?date=2026-07-10`
- **Autenticación:** 🔒 Privado
- **Query params (opcional):**
  - `date`: formato `YYYY-MM-DD`, filtra solo los registros de ese día
- **Respuesta (200 OK):**
```json
{ "nutritionLogs": [ { "_id": "665f...", "queryText": "2 huevos y una tostada", "calories": 220, "...": "..." } ] }
```
- **Errores comunes:** `400` si `date` no tiene el formato correcto.

---

### 7.3 Eliminar un registro de comida
Borra un registro de comida específico del historial.

- **Método:** `DELETE`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/api/nutrition/logs/{id}`
  - Reemplaza `{id}` por el `_id` del registro (lo obtienes de 7.1 o 7.2)
- **Autenticación:** 🔒 Privado (solo puedes borrar tus propios registros)
- **Body:** no necesita
- **Respuesta (200 OK):**
```json
{ "msg": "Registro de nutrición eliminado correctamente" }
```
- **Errores comunes:** `400` id inválido. `404` no existe. `403` es de otro usuario.

---

## 8. Extra

### 8.1 Health check
Solo confirma que el servidor está vivo y respondiendo. Útil para probar la conexión antes de hacer cualquier otra cosa en Postman.

- **Método:** `GET`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/health`
- **Autenticación:** 🔓 Pública
- **Respuesta (200 OK):**
```json
{ "status": "ok" }
```

### 8.2 Raíz de la API
Mensaje simple de bienvenida, confirma que la API está corriendo.

- **Método:** `GET`
- **URL:** `https://fittraack-movil-gr4-v2-xpress.onrender.com/`
- **Autenticación:** 🔓 Pública
- **Respuesta (200 OK):**
```json
{ "msg": "API FitTrack Pro" }
```

---

## Tabla resumen

| # | Método | Endpoint | Auth | Qué hace |
|---|---|---|---|---|
| 1.1 | POST | `/api/auth/register` | 🔓 | Crear cuenta |
| 1.2 | POST | `/api/auth/login` | 🔓 | Iniciar sesión |
| 1.3 | POST | `/api/auth/forgot-password` | 🔓 | Solicitar recuperación de contraseña |
| 1.4 | POST | `/api/auth/reset-password` | 🔓 | Definir nueva contraseña con token |
| 1.5 | GET | `/api/auth/me` | 🔒 | Ver mi usuario (prueba de token) |
| 2.1 | GET | `/api/users/me` | 🔒 | Ver mi perfil |
| 2.2 | PATCH | `/api/users/me` | 🔒 | Editar mi perfil |
| 2.3 | POST | `/api/users/me/photo` | 🔒 | Subir foto de perfil |
| 3.1 | POST | `/api/activities` | 🔒 | Crear actividad (con ruta GPS) |
| 3.2 | GET | `/api/activities` | 🔒 | Listar mis actividades |
| 3.3 | GET | `/api/activities/{id}` | 🔒 | Ver detalle de una actividad |
| 3.4 | DELETE | `/api/activities/{id}` | 🔒 | Eliminar una actividad |
| 4.1 | GET | `/api/weather?lat=&lng=` | 🔒 | Consultar clima actual |
| 5.1 | GET | `/api/stats/me` | 🔒 | Ver mis estadísticas |
| 6.1 | GET | `/api/quotes/random` | 🔒 | Frase motivacional |
| 7.1 | POST | `/api/nutrition/log` | 🔒 | Registrar una comida |
| 7.2 | GET | `/api/nutrition/logs` | 🔒 | Listar registros de comida |
| 7.3 | DELETE | `/api/nutrition/logs/{id}` | 🔒 | Eliminar registro de comida |
| 8.1 | GET | `/health` | 🔓 | Health check |
| 8.2 | GET | `/` | 🔓 | Raíz de la API |

**Leyenda:** 🔓 Pública (no necesita token) · 🔒 Privada (necesita header `Authorization: Bearer {token}`)

---

## Errores generales que puedes ver en cualquier endpoint

| Código | Significado |
|---|---|
| `400` | Datos enviados inválidos o incompletos (revisa el body/query params) |
| `401` | Token faltante, inválido o expirado — vuelve a hacer login |
| `403` | Intentaste ver/editar/borrar algo que no te pertenece |
| `404` | El recurso no existe, o la ruta escrita está mal |
| `409` | Conflicto (ej. email ya registrado) |
| `502` | Un servicio externo (clima, frases, nutrición) falló o no respondió |
| `500` | Error interno del servidor |
