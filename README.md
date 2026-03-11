# Nexo API

REST API construida con Node.js, Express y TypeScript siguiendo los principios de **Clean Architecture** y **Domain-Driven Design (DDD)**.

---

## Stack

- **Runtime:** Node.js 22
- **Framework:** Express 5
- **Lenguaje:** TypeScript (strict)
- **Base de datos:** MongoDB + Mongoose
- **Autenticación:** JWT (access + refresh tokens)
- **Hashing:** bcryptjs
- **Validación:** Zod
- **Email:** Nodemailer (SMTP)
- **Almacenamiento:** AWS S3 / Cloudflare R2 (`@aws-sdk/client-s3`)
- **Subida de archivos:** Multer
- **Logger:** Pino
- **Testing:** Vitest
- **Contenedores:** Docker + Docker Compose

---

## Estructura del proyecto

```
src/
├── config/           # Variables de entorno (Zod) y contenedor de dependencias
├── modules/          # Módulos de negocio (DDD)
│   └── user/
│       ├── domain/       # Entidades, VOs, puertos, repositorio (interfaz)
│       ├── application/  # Casos de uso y DTOs
│       └── infrastructure/ # Modelo Mongoose, mapper, repositorio, adaptadores JWT/bcrypt/email, controller, presenter
└── shared/           # Código compartido entre módulos
    ├── domain/           # AppError, VOs base
    └── infrastructure/   # Logger, middlewares, rutas, asyncHandler, S3Adapter
```

---

## Requisitos

- Node.js >= 22
- MongoDB corriendo localmente o via Docker

---

## Instalación

```bash
npm install
```

Copia el archivo de entorno y ajusta los valores:

```bash
cp .env.example .env
```

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia en modo desarrollo con hot reload |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta el build de producción |
| `npm test` | Corre los tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run lint` | Linting con ESLint |
| `npm run format` | Formatea el código con Prettier |

---

## Docker

Levantar la app en contenedor:

```bash
docker compose up --build
```

---

## Variables de entorno

Ver [.env.example](.env.example) para la lista completa de variables requeridas.

| Variable | Descripción | Default |
|---|---|---|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3000` |
| `MONGO_URI` | URI de conexión a MongoDB | — |
| `SECRET` | Secret general (cookie parser) | — |
| `JWT_ACCESS_SECRET` | Secret para firmar access tokens | — |
| `JWT_REFRESH_SECRET` | Secret para firmar refresh tokens | — |
| `JWT_ACCESS_TTL` | TTL del access token | `15m` |
| `JWT_REFRESH_TTL` | TTL del refresh token | `7d` |
| `COOKIE_SECURE` | Cookies solo HTTPS | `false` |
| `COOKIE_DOMAIN` | Dominio de las cookies | — |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) | — |
| `SMTP_HOST` | Host del servidor SMTP | — |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_USER` | Usuario SMTP | — |
| `SMTP_PASS` | Contraseña SMTP | — |
| `SMTP_FROM` | Dirección remitente | `Nexo <no-reply@nexo.app>` |
| `FRONTEND_URL` | URL base del frontend (para links en emails) | `http://localhost:3000` |
| `STORAGE_ENDPOINT` | Endpoint S3-compatible (requerido para R2, omitir para AWS S3) | — |
| `STORAGE_REGION` | Región del bucket | `auto` |
| `STORAGE_ACCESS_KEY` | Access Key ID | — |
| `STORAGE_SECRET_KEY` | Secret Access Key | — |
| `STORAGE_BUCKET` | Nombre del bucket | — |
| `STORAGE_PUBLIC_URL` | URL pública base del bucket | — |

---

## Endpoints

Base URL: `/api`

### Auth — `/api/auth`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/register` | — | Registra un nuevo usuario |
| `POST` | `/login` | — | Inicia sesión, devuelve access token y cookie de refresh |
| `GET` | `/me` | ✅ Bearer | Devuelve el usuario autenticado |
| `POST` | `/refresh-token` | Cookie | Emite un nuevo access token |
| `POST` | `/logout` | ✅ Bearer | Invalida la sesión y limpia la cookie |
| `GET` | `/verify-email` | — | Verifica el email con el token recibido por correo (`?token=`) |
| `POST` | `/resend-verification` | — | Reenvía el correo de verificación |
| `POST` | `/forgot-password` | — | Solicita el enlace de recuperación de contraseña |
| `POST` | `/reset-password` | — | Restablece la contraseña con el token recibido por correo (`?token=`) |

### User — `/api/user`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/` | ✅ ADMIN | Lista todos los usuarios con paginación y filtros |
| `GET` | `/:username` | ✅ Bearer | Obtiene un usuario por su username |
| `PATCH` | `/name` | ✅ Bearer | Actualiza el nombre del usuario |
| `PATCH` | `/last-name` | ✅ Bearer | Actualiza el apellido del usuario |
| `PATCH` | `/username` | ✅ Bearer | Actualiza el nombre de usuario |
| `PATCH` | `/email` | ✅ Bearer | Actualiza el email y envía verificación al nuevo correo |
| `PATCH` | `/password` | ✅ Bearer | Cambia la contraseña (requiere contraseña actual) |
| `PATCH` | `/avatar` | ✅ Bearer | Sube o reemplaza la foto de perfil (`multipart/form-data`, campo `avatar`) |
| `DELETE` | `/avatar` | ✅ Bearer | Elimina la foto de perfil |
| `PATCH` | `/:id/role` | ✅ ADMIN | Cambia el rol de un usuario a `USER` o `SUPPORT` |
| `PATCH` | `/:id/role/admin` | ✅ SUPER_ADMIN | Cambia el rol de un usuario a `ADMIN`, `USER` o `SUPPORT` |
| `PATCH` | `/:id/status/deactivate` | ✅ ADMIN | Desactiva la cuenta de un usuario |
| `PATCH` | `/:id/status/suspend` | ✅ ADMIN | Suspende la cuenta de un usuario |
| `PATCH` | `/:id/status/block` | ✅ SUPER_ADMIN | Bloquea la cuenta de un usuario (requiere motivo) |

#### Parámetros de filtrado para `GET /api/user/`

| Parámetro | Tipo | Descripción |
|---|---|---|
| `page` | `number` | Página (default: `1`) |
| `limit` | `number` | Resultados por página (default: `10`) |
| `username` | `string` | Filtrar por username (búsqueda parcial) |
| `email` | `string` | Filtrar por email (búsqueda parcial) |
| `name` | `string` | Filtrar por nombre (búsqueda parcial) |
| `lastName` | `string` | Filtrar por apellido (búsqueda parcial) |
| `role` | `string` | Filtrar por rol exacto |
| `status` | `string` | Filtrar por estado exacto |
| `includeDeleted` | `boolean` | Incluir usuarios eliminados (soft-delete) |

---

## Arquitectura

El proyecto sigue **Clean Architecture** con las siguientes capas:

- **Domain** — Entidades, Value Objects, puertos (interfaces). Sin dependencias externas.
- **Application** — Casos de uso. Solo depende del dominio.
- **Infrastructure** — Implementaciones concretas (MongoDB, JWT, bcrypt, S3, etc.).

Las reglas de dependencia fluyen siempre hacia adentro: `Infrastructure → Application → Domain`.

---

## Seguridad

- **Helmet** — cabeceras HTTP seguras en todas las respuestas
- **Rate limiting** — global 100 req/15 min; rutas de auth 10 req/15 min
- **Session invalidation** — cada token lleva `tokenVersion`; al hacer logout, bloquear, suspender, desactivar o cambiar contraseña/email se incrementa la versión en la DB, invalidando todos los tokens anteriores de forma inmediata
- **Request ID** — cada request recibe un `x-request-id` único propagado en las respuestas (útil para trazabilidad)
- **Cookies** — `httpOnly`, `secure` (configurable), `sameSite: lax/none`
- **Validación** — todos los inputs validados con Zod antes de llegar a los casos de uso; los strings se sanitizan con `.trim()`
- **ReDoS** — los campos de búsqueda con regex escapan caracteres especiales antes de pasarlos a MongoDB
- **Soft delete** — los usuarios eliminados no se exponen en las consultas por defecto

