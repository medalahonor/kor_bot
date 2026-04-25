#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: запусти под root (sudo) — нужен доступ к /etc/systemd/system/"
    exit 1
fi

REPO_DIR=$(pwd)
SRC=deploy/systemd
DST=/etc/systemd/system
UNIT=tainted-grail-cert-renew

if [[ ! -f "$SRC/$UNIT.service" || ! -f "$SRC/$UNIT.timer" ]]; then
    echo "ERROR: $SRC/$UNIT.{service,timer} не найдены"
    exit 1
fi

echo "→ ставим systemd-юниты в $DST (REPO_DIR=$REPO_DIR)"
sed "s|__REPO_DIR__|$REPO_DIR|g" "$SRC/$UNIT.service" > "$DST/$UNIT.service"
cp "$SRC/$UNIT.timer" "$DST/$UNIT.timer"
chmod 644 "$DST/$UNIT.service" "$DST/$UNIT.timer"

systemctl daemon-reload
systemctl enable --now "$UNIT.timer"

echo "✓ Установлен и запущен таймер $UNIT.timer:"
systemctl list-timers "$UNIT.timer" --all --no-pager
