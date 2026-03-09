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
    └── infrastructure/   # Logger, middlewares, rutas, asyncHandler
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

---

## Arquitectura

El proyecto sigue **Clean Architecture** con las siguientes capas:

- **Domain** — Entidades, Value Objects, puertos (interfaces). Sin dependencias externas.
- **Application** — Casos de uso. Solo depende del dominio.
- **Infrastructure** — Implementaciones concretas (MongoDB, JWT, bcrypt, S3, etc.).

Las reglas de dependencia fluyen siempre hacia adentro: `Infrastructure → Application → Domain`.

