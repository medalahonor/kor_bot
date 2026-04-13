#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."
set -a; source .env; set +a

NGINX_CONTAINER="tainted-grail-nginx"

for v in DOMAIN CERTBOT_EMAIL FILM_BOT_COMPOSE; do
    if [[ -z "${!v:-}" ]]; then
        echo "ERROR: не задано $v в .env"
        exit 1
    fi
done

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: запусти под root (sudo) — нужен доступ к /etc/letsencrypt и certbot"
    exit 1
fi

if ! command -v certbot &>/dev/null; then
    echo "→ certbot не найден, ставим"
    apt-get update -q && apt-get install -y -q certbot
fi

if [[ ! -f "$FILM_BOT_COMPOSE" ]]; then
    echo "ERROR: FILM_BOT_COMPOSE=$FILM_BOT_COMPOSE — файл не найден"
    exit 1
fi

echo "→ кратко останавливаем film_bot-nginx для standalone-challenge на :80..."
docker compose -f "$FILM_BOT_COMPOSE" stop nginx
trap 'echo "→ поднимаем film_bot-nginx обратно"; docker compose -f "$FILM_BOT_COMPOSE" start nginx' EXIT

certbot certonly --standalone --non-interactive --agree-tos \
    --email "$CERTBOT_EMAIL" -d "$DOMAIN"

if docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER}$"; then
    docker exec "$NGINX_CONTAINER" nginx -s reload || true
fi

echo "✓ Серт: /etc/letsencrypt/live/$DOMAIN/"
