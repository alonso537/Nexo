# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:22-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Copia los templates estáticos que TS no incluye en el build
COPY --from=builder /app/src/modules/user/infrastructure/email/templates ./dist/modules/user/infrastructure/email/templates


EXPOSE 8000

CMD ["node", "dist/index.js"]
