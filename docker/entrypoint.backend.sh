#!/usr/bin/env sh
set -e

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is required" >&2
  exit 1
fi

echo "Starting backend service..."
echo "Running database migrations..."

# Change to database package directory to use prisma.config.ts
cd /repo/packages/database

# Apply database migrations using locally installed prisma
if ! /repo/node_modules/.bin/prisma migrate deploy; then
  echo "ERROR: Database migration failed" >&2
  exit 1
fi

echo "Migrations completed successfully"
echo "Running database seed..."

# Run database seed (same as local: uses tsx via prisma.config.ts)
if ! /repo/node_modules/.bin/prisma db seed; then
  echo "ERROR: Database seed failed" >&2
  exit 1
fi

# Return to backend directory
cd /repo/apps/backend

echo "Database seed completed successfully"
echo "Starting application..."

# Start backend
exec node /repo/apps/backend/dist/main.js


