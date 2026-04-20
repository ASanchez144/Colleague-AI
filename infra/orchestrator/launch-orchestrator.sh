#!/usr/bin/env bash
# ============================================================
#  Tu Socia! — Launcher del orquestador Claude dentro de tmux
#  Se ejecuta desde tusocia-orchestrator.service.
#
#  Arquitectura de resiliencia (dos capas):
#
#   [systemd]  ──requires──▶  [ollama.service]      ← si muere, vuelve en 5s
#       │
#       └── [tusocia-orchestrator.service]
#             └── launch-orchestrator.sh (este script)
#                   ├── crea sesión tmux "tusocia"
#                   │     └── claude-keepalive.sh: WHILE TRUE loop que
#                   │         relanza `claude` cada vez que muera (p.ej.
#                   │         porque Ollama parpadeó). Espera a que
#                   │         Ollama vuelva antes de reintentar.
#                   │
#                   └── watchdog: si la sesión tmux entera muere, salimos
#                       con error para que systemd relance el servicio.
# ============================================================
set -euo pipefail

ENV_FILE="${ENV_FILE:-/etc/tusocia/orchestrator.env}"
SESSION_NAME="tusocia"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
KEEPALIVE="${SCRIPT_DIR}/claude-keepalive.sh"

log() { printf '\033[0;36m[orchestrator]\033[0m %s\n' "$*"; }
err() { printf '\033[0;31m[orchestrator]\033[0m ✗ %s\n' "$*" >&2; }

# --- 1. cargar entorno ---------------------------------------
if [[ ! -f "$ENV_FILE" ]]; then
  err "No encuentro $ENV_FILE. Ejecuta primero infra/setup/bootstrap.sh."
  exit 1
fi
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

# --- 2. dependencias -----------------------------------------
for bin in tmux claude ollama curl; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    err "Falta '$bin' en PATH. Revisa el bootstrap."
    exit 3
  fi
done
if [[ ! -x "$KEEPALIVE" ]]; then
  err "No encuentro $KEEPALIVE (o no es ejecutable)."
  exit 4
fi

# --- 3. pre-flight Ollama (esperamos hasta 2 min en el primer arranque) ---
log "Verificando que Ollama responde en $ANTHROPIC_BASE_URL…"
for i in {1..60}; do
  if curl -fsS --max-time 3 "${ANTHROPIC_BASE_URL%/}/api/tags" >/dev/null 2>&1; then
    log "Ollama está vivo."
    break
  fi
  sleep 2
  if [[ $i -eq 60 ]]; then
    err "Ollama no responde tras 120s. Abortando — systemd reintentará."
    exit 2
  fi
done

# --- 4. (re)crear la sesión tmux -----------------------------
cd "$TUSOCIA_HOME"
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

log "Creando sesión tmux '$SESSION_NAME' en $TUSOCIA_HOME…"
tmux new-session -d -s "$SESSION_NAME" -c "$TUSOCIA_HOME" -n claude

# Variables que el keepalive necesita dentro del pane
tmux send-keys -t "${SESSION_NAME}:claude" \
  "export ANTHROPIC_AUTH_TOKEN='${ANTHROPIC_AUTH_TOKEN}' \
          ANTHROPIC_API_KEY='${ANTHROPIC_API_KEY}' \
          ANTHROPIC_BASE_URL='${ANTHROPIC_BASE_URL}' \
          API_TIMEOUT_MS='${API_TIMEOUT_MS}' \
          CLAUDE_MODEL='${CLAUDE_MODEL}' \
          TUSOCIA_HOME='${TUSOCIA_HOME}'" C-m

# Arrancamos el loop keepalive (relanzará claude cuando muera)
tmux send-keys -t "${SESSION_NAME}:claude" "exec '${KEEPALIVE}'" C-m

log "Sesión tmux '$SESSION_NAME' lista con keepalive."
log "Conéctate con:  tmux attach -t $SESSION_NAME     (Ctrl+B, D para salir)"

# --- 5. watchdog de la sesión tmux ---------------------------
# systemd considera este servicio 'active' mientras este proceso viva.
# Si la sesión tmux entera muere (bug, kill manual, etc.) salimos con
# código de error y systemd nos relanza.
while tmux has-session -t "$SESSION_NAME" 2>/dev/null; do
  sleep 10
done

err "Sesión tmux '$SESSION_NAME' ha desaparecido. Saliendo para que systemd relance."
exit 5
