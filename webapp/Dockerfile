FROM --platform=$BUILDPLATFORM node:20-slim AS deps

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# === BUILD STAGE ===
FROM --platform=$BUILDPLATFORM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL in builder stage too
RUN apt-get update -y && apt-get install -y openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# === PRODUCTION STAGE ===
FROM --platform=$BUILDPLATFORM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL for runtime
RUN apt-get update -y && apt-get install -y openssl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]