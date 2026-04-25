#!/bin/bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: запусти под root (sudo)"
    exit 1
fi

DST=/etc/systemd/system
UNIT=tainted-grail-cert-renew

if systemctl list-unit-files "$UNIT.timer" --no-legend --no-pager 2>/dev/null | grep -q "$UNIT.timer"; then
    systemctl disable --now "$UNIT.timer"
fi
rm -f "$DST/$UNIT.service" "$DST/$UNIT.timer"
systemctl daemon-reload

echo "✓ systemd-юниты $UNIT.{service,timer} удалены"
