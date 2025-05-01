# Base image using Node.js 20 on Debian Bookworm (which uses OpenSSL 3.0)
FROM node:20-slim AS deps

# Install libssl3 (the package for OpenSSL 3.0 on Debian Bookworm)
# ca-certificates is good practice for making HTTPS requests
RUN apt-get update && \
    apt-get install -y --no-install-recommends libssl3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy prisma schema first (might be needed by dependency installation if using scripts)
COPY prisma ./prisma

# Copy package manager files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install dependencies using the appropriate lock file
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then \
        # Ensure pnpm is available if needed
        npm install -g pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi


##### BUILDER STAGE #####
# Use the same base image
FROM node:20-slim AS builder

# Install libssl3 again - needed if 'prisma generate' links against it during its execution
RUN apt-get update && \
    apt-get install -y --no-install-recommends libssl3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Set build arguments if needed (e.g., DATABASE_URL for prisma generate/migrate during build)
ARG DATABASE_URL
ARG NEXT_PUBLIC_CLIENTVAR

WORKDIR /app

# Copy installed dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy prisma schema (again, explicitly)
COPY --from=deps /app/prisma ./prisma
# Copy the rest of the application code
COPY . .

# ---- Prisma Generation ----
# IMPORTANT: Ensure your schema.prisma targets the correct runtime environment:
# generator client {
#   provider      = "prisma-client-js"
#   binaryTargets = ["native", "debian-openssl-3.0.x"] # <--- MUST MATCH libssl3!
# }
# Clean any potentially incorrect engines from previous builds (optional but safe)
RUN rm -rf node_modules/.prisma/client/libquery_engine-*
# Generate the Prisma client - this MUST happen before the build
RUN npx prisma generate
# -------------------------

# Disable Next.js telemetry during build (optional)
# ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
# SKIP_ENV_VALIDATION=1 can be useful if build-time env vars aren't critical for the build itself
RUN \
    if [ -f yarn.lock ]; then SKIP_ENV_VALIDATION=1 yarn build; \
    elif [ -f package-lock.json ]; then SKIP_ENV_VALIDATION=1 npm run build; \
    elif [ -f pnpm-lock.yaml ]; then \
        # Ensure pnpm is available if build script uses it
        npm install -g pnpm && SKIP_ENV_VALIDATION=1 pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi


##### RUNNER STAGE #####
# Use the same slim base image
FROM node:20-slim AS runner
WORKDIR /app

# Install only the runtime dependencies: libssl3 for the Prisma engine
RUN apt-get update && \
    apt-get install -y --no-install-recommends libssl3 && \
    # Clean up apt cache
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
# Disable Next.js telemetry at runtime (optional)
# ENV NEXT_TELEMETRY_DISABLED 1

# Copy necessary files from the builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy the Next.js standalone output
# This includes the built server code, node_modules (including prisma client/engine), etc.
COPY --from=builder /app/.next/standalone ./
# Copy static assets
COPY --from=builder /app/.next/static ./.next/static


EXPOSE 3000
# Set port environment variable if your app uses it
ENV PORT=3000

# Command to run the application using the standalone server.js
CMD ["node", "server.js"]