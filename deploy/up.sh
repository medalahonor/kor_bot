#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

SERVER_CONTAINER="tainted-grail-server"
NGINX_CONTAINER="tainted-grail-nginx"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file .env)

# 1. .env
if [[ ! -f .env ]]; then
    echo "ERROR: .env не найден. cp .env.example .env и заполни"
    exit 1
fi
set -a; source .env; set +a
for v in DOMAIN URL_PREFIX DB_PASSWORD CERTBOT_EMAIL FILM_BOT_COMPOSE; do
    if [[ -z "${!v:-}" ]]; then
        echo "ERROR: не задано $v в .env"
        exit 1
    fi
done

# 2. Серт
CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
if [[ ! -f "$CERT" ]]; then
    echo "→ Серт не найден, выпускаем"
    bash deploy/cert.sh
fi

# 3. git pull (если в репо)
if git remote get-url origin &>/dev/null; then
    git pull --ff-only
fi

# 4. Генерация nginx.conf — детектим изменения через sha1
if [[ ! -f deploy/nginx.conf.tmpl ]]; then
    echo "ERROR: deploy/nginx.conf.tmpl отсутствует"
    exit 1
fi
NEW_CONF=$(sed -e "s|__URL_PREFIX__|$URL_PREFIX|g" -e "s|__DOMAIN__|$DOMAIN|g" deploy/nginx.conf.tmpl)
OLD_SUM=""
[[ -f deploy/nginx.conf ]] && OLD_SUM=$(sha1sum deploy/nginx.conf | awk '{print $1}')
NEW_SUM=$(printf '%s' "$NEW_CONF" | sha1sum | awk '{print $1}')
printf '%s\n' "$NEW_CONF" > deploy/nginx.conf
PREFIX_CHANGED=0
[[ "$OLD_SUM" != "$NEW_SUM" ]] && PREFIX_CHANGED=1

# 5. Поднимаем compose — entrypoint сервера сам применяет миграции
# BuildKit отключён: на этом хосте висит на build-этапе
DOCKER_BUILDKIT=0 "${COMPOSE[@]}" build --progress plain --pull=false
"${COMPOSE[@]}" up -d

# 6. Hot-reload nginx при изменении конфига (избегаем рестарта контейнера)
if [[ $PREFIX_CHANGED == 1 ]]; then
    for _ in {1..10}; do
        if docker exec "$NGINX_CONTAINER" nginx -t &>/dev/null; then break; fi
        sleep 1
    done
    docker exec "$NGINX_CONTAINER" nginx -t
    docker exec "$NGINX_CONTAINER" nginx -s reload
    echo "✓ nginx reload с новым конфигом"
fi

# 7. Healthy server = миграции прошли успешно
echo "→ ждём healthy server..."
STATUS=""
for _ in {1..30}; do
    STATUS=$(docker inspect -f '{{.State.Health.Status}}' "$SERVER_CONTAINER" 2>/dev/null || echo "")
    [[ "$STATUS" == "healthy" ]] && break
    sleep 2
done
if [[ "$STATUS" != "healthy" ]]; then
    echo "ERROR: server не поднялся. Последние логи:"
    "${COMPOSE[@]}" logs --tail=50 server
    exit 1
fi

docker image prune -f >/dev/null

echo ""
echo "✓ Готово: https://$DOMAIN:8443/$URL_PREFIX/"
"${COMPOSE[@]}" ps
