#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# ── Deployment mode ───────────────────────────────────────────────────────────
# Use DEPLOY_MODE=systemd to deploy without Docker (bare Node + systemd).
# Defaults to Docker.
DEPLOY_MODE=${DEPLOY_MODE:-docker}

if [ "$DEPLOY_MODE" = "docker" ]; then
  echo "==> Building and starting Docker container..."
  docker compose build
  docker compose up -d
  echo "==> Done."
  docker compose ps
  exit 0
fi

# ── Systemd (bare Node) deployment configuration ──────────────────────────────
# Defaults used unless overridden via environment, e.g.:
#   TORAH_ALLOWED_IPS="10.0.0.0/8,127.0.0.0/8" DEPLOY_MODE=systemd ./deploy.sh
SERVICE_USER=${SERVICE_USER:-localadmin}
APP_DIR=${APP_DIR:-/opt/torah}
NODE_BIN=${NODE_BIN:-/usr/bin/node}
PORT=${PORT:-3000}
TORAH_HOST=${TORAH_HOST:-127.0.0.1}
TORAH_DB_PATH=${TORAH_DB_PATH:-${APP_DIR}/torah.db}
TORAH_ALLOWED_IPS=${TORAH_ALLOWED_IPS:-127.0.0.0/8}
# ─────────────────────────────────────────────────────────────────────────────

echo "==> Building..."
npm run build

echo "==> Installing systemd service..."
export SERVICE_USER APP_DIR NODE_BIN PORT TORAH_HOST TORAH_DB_PATH TORAH_ALLOWED_IPS
envsubst < torah-api.service | sudo tee /etc/systemd/system/torah-api.service > /dev/null

echo "==> Reloading systemd and restarting torah-api..."
sudo systemctl daemon-reload
sudo systemctl enable torah-api
sudo systemctl restart torah-api

echo "==> Done. Service status:"
systemctl status torah-api --no-pager -l
