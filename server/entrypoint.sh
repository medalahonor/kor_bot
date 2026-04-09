#!/bin/sh
set -e

echo "Applying migrations..."
for f in /app/migrations/*.sql; do
  [ -f "$f" ] || continue
  case "$(basename "$f")" in
    001_*) continue ;;
  esac
  echo "  → $(basename "$f")"
  psql "$DATABASE_URL" -f "$f"
done

echo "Starting server..."
exec node dist/server.js
