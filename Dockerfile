# ==================== Stage 1: Dependencies ====================
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ==================== Stage 2: Build ====================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate + Next.js build
RUN npm run build

# ==================== Stage 3: Production ====================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install tini for proper signal handling
RUN apk add --no-cache tini

# node_modules（localized text devDeps，localized text npm run start localized text concurrently + tsx）
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Next.js localized text
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Prisma schema（db push localized text）
COPY --from=builder /app/prisma ./prisma

# Worker localized text Watchdog localized text（tsx localized text TypeScript）
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib

# localized text
COPY --from=builder /app/standards ./standards

# localized text + localized text
COPY --from=builder /app/messages ./messages
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/middleware.ts ./middleware.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs

# localized text + localized text .env（tsx --env-file=.env localized text，localized text env localized text docker-compose localized text）
RUN mkdir -p /app/logs && touch /app/.env

EXPOSE 3000 3010

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "run", "start"]
