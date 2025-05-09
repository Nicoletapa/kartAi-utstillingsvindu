FROM --platform=$BUILDPLATFORM node:20-slim AS deps

WORKDIR /app

# Add OpenSSL installation in deps stage
RUN apt-get update -y && apt-get install -y openssl

# Install dependencies only
COPY package.json package-lock.json* pnpm-lock.yaml* ./

RUN npm ci
COPY . .
# Only generate, don't migrate yet
RUN npx prisma generate

# === BUILD STAGE ===
FROM --platform=$BUILDPLATFORM node:20-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# === RUN STAGE ===
FROM --platform=$TARGETPLATFORM node:20-slim AS runner

WORKDIR /app

# Add OpenSSL installation in runner stage
RUN apt-get update -y && apt-get install -y openssl

ENV NODE_ENV=production

# Copy everything needed to run the app and migrations
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Create a startup script
COPY --from=builder /app/package.json ./package.json
RUN echo '#!/bin/sh\nnpx prisma migrate deploy\nnpm start' > /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]