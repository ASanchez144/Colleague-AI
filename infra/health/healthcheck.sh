#!/usr/bin/env bash
# ============================================================
#  Tu Socia! — Healthcheck + watchdog suave
#  - Verifica Ollama, orquestador, PM2 y endpoints HTTP.
#  - Si detecta algo caído, intenta reiniciar la unit responsable.
#  - Se ejecuta cada minuto desde tusocia-healthcheck.timer.
#
#  Códigos de salida:
#    0 → todo OK
#    1 → algo estaba caído; se intentó remediar
#    2 → fallo irrecuperable (no se pudo reiniciar)
# ============================================================
set -uo pipefail

ENV_FILE="${ENV_FILE:-/etc/tusocia/orchestrator.env}"
[[ -f "$ENV_FILE" ]] && { set -a; source "$ENV_FILE"; set +a; }

BASE_URL="${ANTHROPIC_BASE_URL:-http://127.0.0.1:11434}"
WEBHOOK_URL="${WEBHOOK_URL:-http://127.0.0.1:3001/api/health}"
WA_URL="${WA_URL:-http://127.0.0.1:3002/webhook/whatsapp/health}"
FRONT_URL="${FRONT_URL:-http://127.0.0.1:3000}"

PROBLEMS=0
RECOVERED=0

# Detecta si corremos bajo systemd (para saber si podemos lanzar systemctl).
HAS_SYSTEMCTL=0
command -v systemctl >/dev/null 2>&1 && HAS_SYSTEMCTL=1

tag()  { printf '[%(%H:%M:%S)T] %s\n' -1 "$*"; }
pass() { tag "✓ $*"; }
fail() { tag "✗ $*"; PROBLEMS=$((PROBLEMS+1)); }
fixed(){ tag "↻ $*"; RECOVERED=$((RECOVERED+1)); }

try_restart() {
  local unit="$1"
  [[ $HAS_SYSTEMCTL -eq 1 ]] || return 1
  systemctl restart "$unit" 2>/dev/null && fixed "reiniciado $unit" || return 1
}

# --- 1. Ollama endpoint -------------------------------------
if curl -fsS --max-time 4 "${BASE_URL%/}/api/tags" >/dev/null 2>&1; then
  pass "Ollama responde en $BASE_URL"
else
  fail "Ollama NO responde en $BASE_URL"
  try_restart ollama.service || tag "  no pude reiniciar ollama"
fi

# --- 2. Orquestador (tmux + claude) -------------------------
if [[ $HAS_SYSTEMCTL -eq 1 ]] && systemctl is-active --quiet tusocia-orchestrator.service; then
  pass "tusocia-orchestrator activo"
  # Verificación extra: ¿sigue viva la sesión tmux?
  if command -v tmux >/dev/null 2>&1 && ! tmux has-session -t tusocia 2>/dev/null; then
    fail "tusocia-orchestrator activo pero sin sesión tmux"
    try_restart tusocia-orchestrator.service
  fi
else
  fail "tusocia-orchestrator inactivo"
  try_restart tusocia-orchestrator.service
fi

# --- 3. PM2 procesos ----------------------------------------
if command -v pm2 >/dev/null 2>&1; then
  online_count="$(pm2 jlist 2>/dev/null | jq '[.[] | select(.pm2_env.status=="online")] | length' 2>/dev/null || echo 0)"
  if [[ "${online_count:-0}" -ge 1 ]]; then
    pass "PM2: ${online_count} proceso(s) online"
  else
    fail "PM2: ningún proceso online"
    try_restart tusocia-pm2.service
  fi
else
  fail "pm2 no está en PATH"
fi

# --- 4. Endpoints HTTP (best-effort) ------------------------
check_http() {
  local name="$1" url="$2"
  if curl -fsS --max-time 4 "$url" >/dev/null 2>&1; then
    pass "$name ($url)"
  else
    fail "$name no responde ($url)"
  fi
}
check_http "webhook Express"    "$WEBHOOK_URL"
check_http "webhook WhatsApp"   "$WA_URL"
check_http "frontend"           "$FRONT_URL"

# --- resumen ------------------------------------------------
echo
if [[ $PROBLEMS -eq 0 ]]; then
  tag "Resultado: OK (0 problemas)"
  exit 0
elif [[ $PROBLEMS -le $RECOVERED ]]; then
  tag "Resultado: problemas detectados pero remediados ($RECOVERED/$PROBLEMS)"
  exit 1
else
  tag "Resultado: $((PROBLEMS-RECOVERED)) problema(s) sin remediar"
  exit 2
fi
