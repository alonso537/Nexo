src/
# Nexo API

REST API built with Node.js, Express, and TypeScript, following **Clean Architecture** and **Domain-Driven Design (DDD)** principles. All user-facing text and documentation are in English for portfolio/demo purposes.

---

## Stack

- **Runtime:** Node.js 22
- **Framework:** Express 5
- **Language:** TypeScript (strict)
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT (access + refresh tokens)
- **Hashing:** bcryptjs
- **Validation:** Zod
- **Email:** Nodemailer (SMTP, HTML templates)
- **Storage:** AWS S3 / Cloudflare R2 (`@aws-sdk/client-s3`)
- **File Uploads:** Multer
- **Logger:** Pino
- **Testing:** Vitest
- **Containers:** Docker + Docker Compose

---

## Project Structure

```
src/
├── config/           # Environment variables (Zod) and dependency container
├── modules/          # Business modules (DDD)
│   └── user/
│       ├── domain/           # Entities, VOs, ports, repository (interface)
│       ├── application/      # Use cases and DTOs
│       └── infrastructure/   # Mongoose model, mapper, repository, JWT/bcrypt/email adapters, controller, presenter
└── shared/           # Code shared between modules
    ├── domain/           # AppError, base VOs
    └── infrastructure/   # Logger, middlewares, routes, asyncHandler, S3Adapter
```

---

## Requirements

- Node.js >= 22
- MongoDB running locally or via Docker

---

## Installation

```bash
npm install
```

Copy the environment file and adjust the values:

```bash
cp .env.example .env
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start in development mode with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the production build |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format code with Prettier |

---


## Docker

To run the app in a container locally:
```bash
docker compose up --build
```

---

## GitHub Actions: Build & Push Docker Image to GHCR

This project includes a GitHub Actions workflow that automatically builds and pushes a Docker image to GitHub Container Registry (GHCR) on every push to the `main` branch.

**How it works:**

- The workflow is defined in `.github/workflows/docker-ghcr.yml`.
- On every push to `main`, GitHub Actions will:
    1. Build the Docker image using your `Dockerfile`.
    2. Authenticate to GHCR using the repository's GitHub token.
    3. Push the image to `ghcr.io/<your-username>/<your-repo>:latest`.

**Requirements:**

- Your repository must be hosted on GitHub.
- You must have a valid `Dockerfile` in the root of your project.
- The workflow uses the built-in `GITHUB_TOKEN` for authentication (no extra secrets needed).

**How to use:**

1. Push your code to the `main` branch on GitHub.
2. The workflow will run automatically. You can check progress in the "Actions" tab of your repository.
3. Your Docker image will be available at:
     `ghcr.io/<your-username>/<your-repo>:latest`

For more information, see the [GitHub Container Registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

---

## Environment Variables

See [.env.example](.env.example) for the full list of required variables.

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection URI | — |
| `SECRET` | General secret (cookie parser) | — |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | — |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | — |
| `JWT_ACCESS_TTL` | Access token TTL | `15m` |
| `JWT_REFRESH_TTL` | Refresh token TTL | `7d` |
| `COOKIE_SECURE` | Cookies only HTTPS | `false` |
| `COOKIE_DOMAIN` | Cookie domain | — |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | — |
| `SMTP_HOST` | SMTP server host | — |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP user | — |
| `SMTP_PASS` | SMTP password | — |
| `SMTP_FROM` | Sender address | `Nexo <no-reply@nexo.app>` |
| `FRONTEND_URL` | Frontend base URL (for email links) | `http://localhost:3000` |
| `STORAGE_ENDPOINT` | S3-compatible endpoint (required for R2, omit for AWS S3) | — |
| `STORAGE_REGION` | Bucket region | `auto` |
| `STORAGE_ACCESS_KEY` | Access Key ID | — |
| `STORAGE_SECRET_KEY` | Secret Access Key | — |
| `STORAGE_BUCKET` | Bucket name | — |
| `STORAGE_PUBLIC_URL` | Public base URL for bucket | — |

---

## Endpoints

Base URL: `/api`

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Register a new user |
| `POST` | `/login` | — | Login, returns access token and refresh cookie |
| `GET` | `/me` | ✅ Bearer | Returns the authenticated user |
| `POST` | `/refresh-token` | Cookie | Issues a new access token |
| `POST` | `/logout` | ✅ Bearer | Invalidates the session and clears the cookie |
| `GET` | `/verify-email` | — | Verifies email with the token sent by email (`?token=`) |
| `POST` | `/resend-verification` | — | Resends the verification email |
| `POST` | `/forgot-password` | — | Requests password reset link |
| `POST` | `/reset-password` | — | Resets password with the token sent by email (`?token=`) |

### User — `/api/user`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ ADMIN | List all users with pagination and filters |
| `GET` | `/:username` | ✅ Bearer | Get a user by username |
| `PATCH` | `/name` | ✅ Bearer | Update user's name |
| `PATCH` | `/last-name` | ✅ Bearer | Update user's last name |
| `PATCH` | `/username` | ✅ Bearer | Update username |
| `PATCH` | `/email` | ✅ Bearer | Update email and send verification |
| `PATCH` | `/password` | ✅ Bearer | Change password (requires current password) |
| `PATCH` | `/avatar` | ✅ Bearer | Upload or replace profile picture (`multipart/form-data`, field `avatar`) |
| `DELETE` | `/avatar` | ✅ Bearer | Delete profile picture |
| `PATCH` | `/:id/role` | ✅ ADMIN | Change user role to `USER` or `SUPPORT` |
| `PATCH` | `/:id/role/admin` | ✅ SUPER_ADMIN | Change user role to `ADMIN`, `USER`, or `SUPPORT` |
| `PATCH` | `/:id/status/deactivate` | ✅ ADMIN | Deactivate user account |
| `PATCH` | `/:id/status/suspend` | ✅ ADMIN | Suspend user account |
| `PATCH` | `/:id/status/block` | ✅ SUPER_ADMIN | Block user account (requires reason) |

#### Filtering parameters for `GET /api/user/`

| Parameter | Type | Description |
|---|---|---|
| `page` | `number` | Page (default: `1`) |
| `limit` | `number` | Results per page (default: `10`) |
| `username` | `string` | Filter by username (partial match) |
| `email` | `string` | Filter by email (partial match) |
| `name` | `string` | Filter by name (partial match) |
| `lastName` | `string` | Filter by last name (partial match) |
| `role` | `string` | Filter by exact role |
| `status` | `string` | Filter by exact status |
| `includeDeleted` | `boolean` | Include soft-deleted users |

---

## Architecture

This project follows **Clean Architecture** with the following layers:

- **Domain** — Entities, Value Objects, ports (interfaces). No external dependencies.
- **Application** — Use cases. Depends only on domain.
- **Infrastructure** — Concrete implementations (MongoDB, JWT, bcrypt, S3, etc.).

Dependency rules always flow inward: `Infrastructure → Application → Domain`.

---

## Security

- **Helmet** — Secure HTTP headers on all responses
- **Rate limiting** — global 100 req/15 min; auth routes 10 req/15 min
- **Session invalidation** — each token has a `tokenVersion`; on logout, block, suspend, deactivate, or password/email change, the version is incremented in the DB, invalidating all previous tokens immediately
- **Request ID** — each request receives a unique `x-request-id` propagated in responses (useful for tracing)
- **Cookies** — `httpOnly`, `secure` (configurable), `sameSite: lax/none`
- **Validation** — all inputs validated with Zod before reaching use cases; strings are sanitized with `.trim()`
- **ReDoS** — search fields with regex escape special characters before passing to MongoDB
- **Soft delete** — deleted users are not exposed in queries by default
- **Soft delete** — los usuarios eliminados no se exponen en las consultas por defecto

