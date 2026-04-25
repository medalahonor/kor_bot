#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: запусти под root (sudo) — нужен setfacl, certbot, systemctl"
    exit 1
fi

# 1. Проверка пользователя bot
if ! id -u bot >/dev/null 2>&1; then
    echo "ERROR: пользователь 'bot' не найден на хосте."
    echo "  Создай: sudo useradd -m -s /bin/bash -G docker bot"
    exit 1
fi

# 2. .env
if [[ ! -f .env ]]; then
    echo "ERROR: .env не найден. Сначала: sudo -u bot cp .env.example .env && sudo -u bot nano .env"
    exit 1
fi
set -a; source .env; set +a
if [[ -z "${DOMAIN:-}" ]]; then
    echo "ERROR: не задано DOMAIN в .env"
    exit 1
fi

# 3. acl-пакет (для setfacl)
if ! command -v setfacl >/dev/null; then
    echo "→ ставим пакет acl"
    apt-get update -q
    apt-get install -y -q acl
fi

# 4. ACL: bot читает /etc/letsencrypt/{live,archive} (включая default — для будущих ротаций)
mkdir -p /etc/letsencrypt/live /etc/letsencrypt/archive
echo "→ выставляем ACL для bot на /etc/letsencrypt/{live,archive}"
setfacl -R -m u:bot:rX /etc/letsencrypt/live /etc/letsencrypt/archive
setfacl -R -d -m u:bot:rX /etc/letsencrypt/live /etc/letsencrypt/archive

# 5. Серт: skip если есть, иначе выпускаем
CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
if [[ -f "$CERT" ]]; then
    echo "✓ серт уже есть: $CERT (skip cert.sh)"
else
    echo "→ серт отсутствует, выпускаем через cert.sh"
    bash deploy/cert.sh
fi

# 6. systemd timer (идемпотентно)
bash deploy/autorenew-install.sh

# 7. Verification
echo ""
echo "=== Проверки ==="
echo "→ ACL на /etc/letsencrypt/live:"
getfacl /etc/letsencrypt/live 2>/dev/null | grep -E "^(user:bot|default:user:bot)" || echo "  WARN: ACL для bot не виден"
echo "→ Доступ для bot:"
if sudo -u bot test -r "$CERT"; then
    echo "  ✓ bot читает $CERT"
else
    echo "  ERROR: bot не читает $CERT — проверь ACL"
    exit 1
fi
echo "→ Cert renewal timer:"
systemctl list-timers tainted-grail-cert-renew.timer --no-pager

echo ""
echo "✓ setup завершён. Дальше под bot: cd ~/kor_bot && make up"
