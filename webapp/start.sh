#!/bin/bash
set -e

echo "Starting webapp..."

# Wait for database
echo "Waiting for database..."
until nc -z db 3306; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
echo "Database is up!"

# Run migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Seed database if needed
echo "Seeding database..."
npm run db:seed || echo "Seeding skipped or failed"

# Start the application
echo "Starting Next.js application..."
exec node server.js