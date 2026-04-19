#!/usr/bin/env bash
# ============================================================
#  Tu Socia! — Launcher del orquestador Claude dentro de tmux
#  Se ejecuta desde tusocia-orchestrator.service.
#  Mantiene una sesión tmux "tusocia" viva con Claude Code apuntando a Ollama.
# ============================================================
set -euo pipefail

ENV_FILE="${ENV_FILE:-/etc/tusocia/orchestrator.env}"
SESSION_NAME="tusocia"

log() { printf '\033[0;36m[orchestrator]\033[0m %s\n' "$*"; }
err() { printf '\033[0;31m[orchestrator]\033[0m ✗ %s\n' "$*" >&2; }

# --- 1. cargar entorno ---------------------------------------
if [[ ! -f "$ENV_FILE" ]]; then
  err "No encuentro $ENV_FILE. Ejecuta primero infra/setup/bootstrap.sh."
  exit 1
fi
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

# --- 2. pre-flight check Ollama ------------------------------
log "Verificando que Ollama responde en $ANTHROPIC_BASE_URL…"
for i in {1..60}; do
  if curl -fsS "${ANTHROPIC_BASE_URL%/}/api/tags" >/dev/null 2>&1; then
    log "Ollama está vivo."
    break
  fi
  sleep 2
  if [[ $i -eq 60 ]]; then
    err "Ollama no responde tras 120s. Abortando — systemd reintentará."
    exit 2
  fi
done

# --- 3. dependencias -----------------------------------------
for bin in tmux claude ollama; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    err "Falta '$bin' en PATH. Revisa el bootstrap."
    exit 3
  fi
done

# --- 4. (re)crear la sesión tmux -----------------------------
cd "$TUSOCIA_HOME"

# Si ya existe, la matamos para empezar limpio tras reinicios.
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

log "Creando sesión tmux '$SESSION_NAME' en $TUSOCIA_HOME…"
tmux new-session -d -s "$SESSION_NAME" -c "$TUSOCIA_HOME" -n claude

# Exportar el entorno dentro de la sesión tmux
tmux send-keys -t "${SESSION_NAME}:claude" \
  "export ANTHROPIC_AUTH_TOKEN='${ANTHROPIC_AUTH_TOKEN}'" C-m
tmux send-keys -t "${SESSION_NAME}:claude" \
  "export ANTHROPIC_API_KEY='${ANTHROPIC_API_KEY}'" C-m
tmux send-keys -t "${SESSION_NAME}:claude" \
  "export ANTHROPIC_BASE_URL='${ANTHROPIC_BASE_URL}'" C-m
tmux send-keys -t "${SESSION_NAME}:claude" \
  "export API_TIMEOUT_MS='${API_TIMEOUT_MS}'" C-m

# Arrancamos Claude Code apuntando al modelo configurado.
# `ollama launch claude --model X` hace lo mismo, pero lanzar `claude --model`
# directamente nos deja el prompt interactivo listo para pegar instrucciones.
tmux send-keys -t "${SESSION_NAME}:claude" \
  "claude --model '${CLAUDE_MODEL}' --dangerously-skip-permissions" C-m

log "Sesión tmux '$SESSION_NAME' lista. Conéctate con: tmux attach -t $SESSION_NAME"

# --- 5. bucle de guardia -------------------------------------
# systemd considera el servicio "activo" mientras este proceso viva.
# Hacemos polling a tmux cada 10s: si la sesión muere, salimos con error
# y systemd la relanzará (Restart=always).
while tmux has-session -t "$SESSION_NAME" 2>/dev/null; do
  sleep 10
done

err "La sesión tmux '$SESSION_NAME' ha desaparecido. Saliendo para que systemd relance."
exit 4
