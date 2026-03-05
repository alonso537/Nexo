# Nexo API

REST API construida con Node.js, Express y TypeScript siguiendo los principios de **Clean Architecture** y **Domain-Driven Design (DDD)**.

---

## Stack

- **Runtime:** Node.js 22
- **Framework:** Express 5
- **Lenguaje:** TypeScript (strict)
- **Base de datos:** MongoDB
- **Logger:** Pino
- **Testing:** Vitest
- **Contenedores:** Docker + Docker Compose

---

## Estructura del proyecto

```
src/
├── config/           # Variables de entorno y configuración global
├── modules/          # Módulos de negocio (DDD)
│   └── user/
│       ├── domain/       # Entidades, VOs, puertos, repositorio (interfaz)
│       ├── application/  # Casos de uso
│       └── infrastructure/ # Implementaciones (repositorio, adaptadores)
└── shared/           # Código compartido entre módulos
    ├── domain/           # Errores, VOs base, puertos compartidos
    └── infrastructure/   # Logger, middlewares
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

Las más importantes:

| Variable | Descripción |
|---|---|
| `MONGO_URI` | URI de conexión a MongoDB |
| `JWT_ACCESS_SECRET` | Secret para firmar access tokens |
| `JWT_REFRESH_SECRET` | Secret para firmar refresh tokens |
| `SECRET` | Secret general de la app |

---

## Arquitectura

El proyecto sigue **Clean Architecture** con las siguientes capas:

- **Domain** — Entidades, Value Objects, puertos (interfaces). Sin dependencias externas.
- **Application** — Casos de uso. Solo depende del dominio.
- **Infrastructure** — Implementaciones concretas (MongoDB, JWT, bcrypt, S3, etc.).

Las reglas de dependencia fluyen siempre hacia adentro: `Infrastructure → Application → Domain`.
