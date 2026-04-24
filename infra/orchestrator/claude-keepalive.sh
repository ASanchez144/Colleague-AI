#!/usr/bin/env bash
# ============================================================
#  Tu Socia! — Keepalive de `claude` dentro de tmux
#
#  Bucle que mantiene a `claude` vivo pase lo que pase:
#   - Source del env propio (self-contained, no depende de quién lo lance)
#   - Espera a que Ollama responda antes de cada arranque.
#   - Usa --continue para retomar la conversación anterior.
#   - Backoff exponencial con techo (max 60s entre intentos).
# ============================================================
set -uo pipefail

# ── Source del env propio — funciona independientemente de cómo se lance ──────
# Esto hace el script self-contained: si lo lanza tmux, systemd, o root directo,
# siempre tendrá las variables correctas.
if [[ -f /etc/tusocia/orchestrator.env ]]; then
  set -a
  # shellcheck source=/etc/tusocia/orchestrator.env
  source /etc/tusocia/orchestrator.env
  set +a
fi

# Validar que las variables críticas existen
: "${ANTHROPIC_BASE_URL:?falta ANTHROPIC_BASE_URL en /etc/tusocia/orchestrator.env}"
: "${CLAUDE_MODEL:?falta CLAUDE_MODEL en /etc/tusocia/orchestrator.env}"
: "${TUSOCIA_HOME:=/root/tusocia}"

BACKOFF=2
MAX_BACKOFF=60
ATTEMPT=0

# Fichero que marca si ya hubo una sesión previa (para --continue)
LAST_SESSION_FILE="${TUSOCIA_HOME}/.claude_last_session"

banner() {
  local msg="$1"
  printf '\n\033[0;35m═══ %s ═══\033[0m\n' "$msg"
}

wait_for_ollama() {
  local i
  for i in {1..90}; do
    if curl -fsS --max-time 3 "${ANTHROPIC_BASE_URL%/}/api/tags" >/dev/null 2>&1; then
      return 0
    fi
    if (( i == 1 )); then
      printf '\033[1;33m[keepalive]\033[0m Ollama no responde, esperando… '
    elif (( i % 5 == 0 )); then
      printf '%ds… ' "$((i*2))"
    fi
    sleep 2
  done
  printf '\n'
  echo "[keepalive] ✗ Ollama sigue KO tras 180s. Relanzo igual."
  return 1
}

trap 'echo "[keepalive] señal recibida, saliendo…"; exit 0' INT TERM

while true; do
  ATTEMPT=$((ATTEMPT+1))
  banner "Intento #$ATTEMPT — modelo: $CLAUDE_MODEL"

  wait_for_ollama

  cd "${TUSOCIA_HOME}"

  # Decidir si usar --continue (retoma conversación previa) o arrancar fresh
  # --continue preserva el historial de herramientas y decisiones pasadas
  CONTINUE_FLAG=""
  if [[ -f "${LAST_SESSION_FILE}" ]]; then
    CONTINUE_FLAG="--continue"
    echo "[keepalive] Retomando sesión anterior (--continue)…"
  else
    echo "[keepalive] Primera sesión — arrancando fresh…"
    touch "${LAST_SESSION_FILE}"
  fi

  # Arranca Claude Code
  # --dangerously-skip-permissions: evita prompts interactivos
  # --continue: retoma la última conversación (preserva "memoria" de la sesión)
  if claude \
      --model "${CLAUDE_MODEL}" \
      --dangerously-skip-permissions \
      ${CONTINUE_FLAG}; then
    EXIT_REASON="salida limpia"
  else
    EXIT_CODE=$?
    EXIT_REASON="exit code ${EXIT_CODE}"
    # Si falla con error de permisos de root, intentar sin --dangerously-skip-permissions
    if [[ ${EXIT_CODE} -eq 1 ]] && [[ -z "${CONTINUE_FLAG}" ]]; then
      echo "[keepalive] Reintentando sin --dangerously-skip-permissions…"
      claude --model "${CLAUDE_MODEL}" ${CONTINUE_FLAG} || true
    fi
  fi

  banner "claude terminó (${EXIT_REASON}). Reintento en ${BACKOFF}s."
  sleep "${BACKOFF}"

  BACKOFF=$(( BACKOFF * 2 ))
  (( BACKOFF > MAX_BACKOFF )) && BACKOFF=${MAX_BACKOFF}

  if (( ATTEMPT > 1 )) && (( SECONDS % 300 == 0 )); then
    BACKOFF=2
  fi
done
