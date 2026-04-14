#!/bin/sh
set -e

echo "Applying migrations..."

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

applied_list=$(psql "$DATABASE_URL" -tAc "SELECT filename FROM schema_migrations")

for f in /app/migrations/*.sql; do
  [ -f "$f" ] || continue
  name=$(basename "$f")
  if echo "$applied_list" | grep -qx "$name"; then
    echo "  ✓ $name (already applied)"
    continue
  fi
  echo "  → $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -v name="$name" \
    -f "$f" \
    -c "INSERT INTO schema_migrations (filename) VALUES (:'name')"
done

echo "Starting server..."
exec node dist/server.js
