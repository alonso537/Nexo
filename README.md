# Nexo API

A production-ready REST API for user management, authentication, and authorization — built with **Node.js**, **Express 5**, and **TypeScript** following **Clean Architecture** and **Domain-Driven Design (DDD)** principles.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| Framework | Express 5 |
| Language | TypeScript (strict) |
| Database | MongoDB + Mongoose |
| Cache & Queue | Redis (ioredis) + BullMQ |
| Auth | JWT (access + refresh tokens) |
| Hashing | bcryptjs |
| Validation | Zod |
| Email | Resend HTTP API |
| Storage | AWS S3 / Cloudflare R2 |
| File Uploads | Multer |
| Logger | Pino |
| Testing | Vitest (unit, integration, e2e) |
| Containers | Docker + Docker Compose |
| CI/CD | GitHub Actions → GHCR + Docker Hub |

---

## Architecture

This project follows **Hexagonal Architecture (Ports & Adapters)** with strict DDD layering:

```
Domain ← Application ← Infrastructure
```

Dependencies always flow inward. The domain has zero external dependencies.

```
src/
├── config/
│   ├── env.ts              # Zod-validated environment variables
│   └── container.ts        # Manual dependency injection container
├── modules/
│   └── user/
│       ├── domain/         # Entities, Value Objects, Repository interface, Ports
│       ├── application/    # Use cases + DTOs (pure business logic)
│       └── infrastructure/ # MongoDB, JWT, bcrypt, email adapters, HTTP controller
└── shared/
    ├── domain/             # AppError, shared VOs, CachePort, QueuePort
    └── infrastructure/     # Redis, BullMQ worker, S3, middlewares, Swagger, logger
```

### Key design decisions

- **Entities with behavior** — `UserEntity` encapsulates all state transitions (`activate`, `block`, `suspend`, `incrementTokenVersion`, etc.) with domain invariants enforced inside.
- **Value Objects** — `EmailVo`, `UsernameVO`, `PersonNameVO`, `UserIdVO`, `PhotoProfileVO`, `ExpiringTokenVO` validate and wrap primitives.
- **Ports** — `MailerPort`, `PasswordPort`, `TokenPort`, `StoragePort`, `CachePort`, `QueuePort` define contracts; infrastructure provides the implementations.
- **Use cases** — one file per use case, each with a single `execute()` method. No framework dependencies.
- **Presenter** — separates the HTTP response shape from the domain entity.

---

## Features

### Authentication
- Register with email verification (async via BullMQ)
- Login with access token (Bearer) + refresh token (httpOnly cookie)
- Refresh access token via cookie
- Logout with immediate session invalidation
- Forgot password / reset password flow (async email via BullMQ)
- Resend email verification (async via BullMQ)

### User Management
- Get own profile (`/me`)
- Update name, last name, username, email, password
- Upload / delete profile picture (S3/R2)
- Admin: list users with pagination and filters
- Admin: change roles, deactivate, suspend accounts
- Super Admin: assign any role, block accounts

### Security
- **JWT blacklist** — revoked access tokens are stored in Redis on logout; checked on every authenticated request
- **Token versioning** — `tokenVersion` stored in MongoDB; incremented on logout, password change, email change, block, suspend, deactivate — immediately invalidates all active sessions
- **Rate limiting** — auth routes 10 req/15 min; user routes 100 req/15 min; backed by Redis for distributed environments
- **Helmet** — secure HTTP headers
- **Cookies** — `httpOnly`, `secure` (configurable), `sameSite: lax/none`
- **Input validation** — all inputs validated with Zod before reaching use cases
- **Request ID** — unique `x-request-id` on every request for tracing
- **ReDoS protection** — search fields escape special characters before MongoDB regex queries
- **Soft delete** — deleted users hidden from all queries by default

### Caching (Redis)
- `getUserBySlug` — cached by username slug, TTL 5 min
- `getAllUsers` — cached by filter key, TTL 2 min
- Automatic invalidation on any write operation (update, block, suspend, etc.)
- Graceful degradation — app functions normally if Redis is unavailable

### Async Email Processing (BullMQ)
- All emails (verification, password reset) processed in background workers via Resend HTTP API
- 3 retry attempts with exponential backoff (5s, 10s, 20s)
- Worker concurrency: 5 parallel jobs
- Failed jobs retained for inspection

---

## Requirements

- Node.js >= 22
- Docker + Docker Compose (recommended)

---

## Quick Start

### With Docker (recommended)

```bash
cp .env.example .env
# Fill in the required values in .env
docker compose up --build
```

This starts MongoDB, Redis, and the Nexo API together.

### Local development

```bash
npm install
cp .env.example .env
# Requires MongoDB and Redis running locally
npm run dev
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start in development mode with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the production build |
| `npm test` | Run all tests (unit + integration + e2e) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |
| `npm run seed` | Seed a super admin account |

---

## API Docs

Swagger UI is available at:

```
http://localhost:8000/api-docs
```

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Register a new user |
| `POST` | `/login` | — | Login, returns access token + sets refresh cookie |
| `GET` | `/me` | Bearer | Get authenticated user profile |
| `POST` | `/refresh-token` | Cookie | Issue a new access token |
| `POST` | `/logout` | Bearer | Invalidate session, blacklist token, clear cookie |
| `GET` | `/verify-email` | — | Verify email with token (`?token=`) |
| `POST` | `/resend-verification` | — | Resend verification email |
| `POST` | `/forgot-password` | — | Request password reset link |
| `POST` | `/reset-password` | — | Reset password with token (`?token=`) |

### User — `/api/user`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ADMIN | List users with pagination and filters |
| `GET` | `/:username` | Bearer | Get user by username |
| `PATCH` | `/name` | Bearer | Update first name |
| `PATCH` | `/last-name` | Bearer | Update last name |
| `PATCH` | `/username` | Bearer | Update username |
| `PATCH` | `/email` | Bearer | Update email + send verification |
| `PATCH` | `/password` | Bearer | Change password (requires current) |
| `PATCH` | `/avatar` | Bearer | Upload/replace profile picture |
| `DELETE` | `/avatar` | Bearer | Delete profile picture |
| `PATCH` | `/:id/role` | ADMIN | Assign USER or SUPPORT role |
| `PATCH` | `/:id/role/admin` | SUPER_ADMIN | Assign any role |
| `PATCH` | `/:id/status/deactivate` | ADMIN | Deactivate account |
| `PATCH` | `/:id/status/suspend` | ADMIN | Suspend account |
| `PATCH` | `/:id/status/block` | SUPER_ADMIN | Block account (requires reason) |

#### Filter parameters for `GET /api/user`

| Parameter | Type | Description |
|---|---|---|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Results per page (default: 10, max: 100) |
| `username` | string | Partial match |
| `email` | string | Partial match |
| `name` | string | Partial match |
| `lastName` | string | Partial match |
| `role` | string | Exact match |
| `status` | string | Exact match |
| `includeDeleted` | boolean | Include soft-deleted users |

---

## Environment Variables

Copy `.env.example` and fill in the required values.

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `8000` |
| `MONGO_URI` | MongoDB connection URI | — |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `SECRET` | Cookie parser secret | — |
| `JWT_ACCESS_SECRET` | Access token signing secret | — |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | — |
| `JWT_ACCESS_TTL` | Access token TTL | `15m` |
| `JWT_REFRESH_TTL` | Refresh token TTL | `7d` |
| `COOKIE_SECURE` | HTTPS-only cookies | `false` |
| `COOKIE_DOMAIN` | Cookie domain | — |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | — |
| `SMTP_FROM` | Sender address | `Nexo <no-reply@nexo.app>` |
| `SMTP_PASS` | Resend API key | — |
| `FRONTEND_URL` | Frontend base URL (for email links) | `http://localhost:8000/api/auth` |
| `STORAGE_ENDPOINT` | S3-compatible endpoint (R2, MinIO, etc.) | — |
| `STORAGE_REGION` | Bucket region | `auto` |
| `STORAGE_ACCESS_KEY` | Access Key ID | — |
| `STORAGE_SECRET_KEY` | Secret Access Key | — |
| `STORAGE_BUCKET` | Bucket name | — |
| `STORAGE_PUBLIC_URL` | Public base URL for assets | — |
| `SEED_EMAIL` | Super admin seed email | — |
| `SEED_PASSWORD` | Super admin seed password | — |
| `SEED_USERNAME` | Super admin seed username | — |

---

## Testing

Tests are organized in three levels:

```
test/
├── auth/
│   ├── unit/        # Use case unit tests (mocked dependencies)
│   ├── integration/ # Repository integration tests (mongodb-memory-server)
│   └── e2e/         # Full HTTP flow tests (supertest)
├── user/
│   ├── unit/
│   └── e2e/
└── shared/
    └── unit/        # Shared domain unit tests
```

```bash
npm test
```

---

## Deployment

### Railway (recommended)

1. Push to `main` — GitHub Actions builds and pushes the Docker image automatically
2. In Railway → **New Project** → **Deploy from GitHub repo**
3. Add **MongoDB** and **Redis** from the Railway marketplace
4. Set all environment variables (see table above)
5. In **Public Networking** → set port to `8000`

**Key variables for Railway:**
```env
NODE_ENV=production
PORT=8000
COOKIE_SECURE=true
MONGO_URI=          # from Railway MongoDB service
REDIS_URL=          # from Railway Redis service (use the private internal URL)
```

---

### Resend (email)

Nexo uses the [Resend](https://resend.com) HTTP API for transactional emails — no SMTP ports required (Railway blocks outbound SMTP).

1. Create an account at [resend.com](https://resend.com)
2. **API Keys** → **Create API Key** → copy the key (`re_xxxxxxxx`)
3. **Domains** → **Add Domain** → enter your domain
4. Add the DNS records Resend provides to your DNS provider (see Cloudflare below)
5. Click **Verify Domain** in Resend

**Railway variables:**
```env
SMTP_FROM=no-reply@yourdomain.com
SMTP_PASS=re_xxxxxxxx
```

> `SMTP_HOST`, `SMTP_PORT` and `SMTP_USER` are not used — Resend sends via HTTP API.

---

### Cloudflare (DNS + Storage)

#### DNS records for Resend

1. [dash.cloudflare.com](https://dash.cloudflare.com) → your domain → **DNS** → **Records**
2. Add each record Resend provides (SPF, DKIM, CNAME)
3. ⚠️ Set **Proxy status** to **DNS only** (grey cloud) for all Resend records — proxied records break email verification

#### Cloudflare R2 (file storage)

1. Cloudflare dashboard → **R2 Object Storage** → **Create bucket**
2. **R2** → **Manage R2 API Tokens** → **Create API Token** with Object Read & Write permissions
3. Copy credentials and endpoint

**Railway variables:**
```env
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=your-bucket-name
STORAGE_PUBLIC_URL=https://pub-xxxx.r2.dev
```

To get `STORAGE_PUBLIC_URL`: bucket → **Settings** → **Public Access** → enable and copy the URL.

---

## CI/CD

On every push to `main`, GitHub Actions:
1. Runs lint, typecheck and all tests
2. Builds the Docker image
3. Pushes to GitHub Container Registry (`ghcr.io/<username>/<repo>:latest`)
4. Pushes to Docker Hub (`<username>/nexo:latest`)

**Required GitHub secrets:**

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (Account Settings → Security) |
