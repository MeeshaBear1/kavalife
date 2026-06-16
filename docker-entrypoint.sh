#!/bin/sh
set -e

echo "==> Kava Life starting up"

# The Prisma schema references DIRECT_URL (used by the CLI for db push). In
# Docker there's a single, non-pooled Postgres, so default it to DATABASE_URL.
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

# Wait for the database to accept connections, then sync the schema.
echo "==> Syncing database schema (prisma db push)..."
ATTEMPTS=0
until npx prisma db push --skip-generate --accept-data-loss; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 20 ]; then
    echo "!! Database not reachable after 20 attempts, giving up."
    exit 1
  fi
  echo "   database not ready yet, retrying in 3s ($ATTEMPTS/20)..."
  sleep 3
done

# Seed is idempotent: it only inserts products/admin/settings when missing.
echo "==> Seeding (idempotent)..."
npm run db:seed || echo "   seed step reported an issue (continuing)"

echo "==> Launching Next.js server on port ${PORT:-3000}"
exec npm run start
