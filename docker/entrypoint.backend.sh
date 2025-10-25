#!/usr/bin/env sh
set -e

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is required" >&2
  exit 1
fi

echo "Starting backend service..."
echo "Running database migrations..."

# Apply database migrations (specify schema path explicitly)
if ! npx prisma migrate deploy --schema=/repo/packages/database/prisma/schema.prisma; then
  echo "ERROR: Database migration failed" >&2
  exit 1
fi

echo "Migrations completed successfully"
echo "Running database seed..."

# Run compiled database seed directly (requires ADMIN_PASSWORD)
if ! node /repo/packages/database/prisma/seed.js; then
  echo "ERROR: Database seed failed" >&2
  exit 1
fi

echo "Database seed completed successfully"
echo "Starting application..."

# Start backend
exec node /repo/apps/backend/dist/main.js


