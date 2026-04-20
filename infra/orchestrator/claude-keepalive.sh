#!/usr/bin/env bash
# ============================================================
#  Tu Socia! — Keepalive de `claude` dentro de tmux
#
#  Bucle que mantiene a `claude` vivo pase lo que pase:
#   - Espera a que Ollama responda antes de cada arranque.
#   - Si `claude` sale por cualquier razón (Ollama parpadeó, Ctrl+C,
#     crash del modelo), imprime el motivo y reintenta tras backoff.
#   - Backoff exponencial con techo (max 60s entre intentos).
#
#  Se lanza desde launch-orchestrator.sh y vive dentro del pane
#  "tusocia:claude" de tmux.
# ============================================================
set -uo pipefail

# Las envs llegan exportadas desde launch-orchestrator.sh
: "${ANTHROPIC_BASE_URL:?falta ANTHROPIC_BASE_URL}"
: "${CLAUDE_MODEL:?falta CLAUDE_MODEL}"

BACKOFF=2
MAX_BACKOFF=60
ATTEMPT=0

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
  echo "[keepalive] ✗ Ollama sigue KO tras 180s. Relanzo igual y dejo que claude falle rápido."
  return 1
}

trap 'echo "[keepalive] señal recibida, saliendo…"; exit 0' INT TERM

while true; do
  ATTEMPT=$((ATTEMPT+1))
  banner "Intento #$ATTEMPT — modelo: $CLAUDE_MODEL"

  wait_for_ollama

  # Arranca Claude Code. --dangerously-skip-permissions nos evita prompts
  # interactivos al ejecutar tools cuando el orquestador tiene que trabajar solo.
  # Si prefieres confirmar cada acción, quita ese flag.
  if claude --model "$CLAUDE_MODEL" --dangerously-skip-permissions; then
    EXIT_REASON="salida limpia"
  else
    EXIT_REASON="exit code $?"
  fi

  banner "claude terminó ($EXIT_REASON). Reintento en ${BACKOFF}s."
  sleep "$BACKOFF"

  # Backoff exponencial con techo — evita flood si algo está realmente roto
  BACKOFF=$(( BACKOFF * 2 ))
  (( BACKOFF > MAX_BACKOFF )) && BACKOFF=$MAX_BACKOFF

  # Tras 5 minutos sin fallos seguidos, reseteamos el backoff
  if (( ATTEMPT > 1 )) && (( SECONDS % 300 == 0 )); then
    BACKOFF=2
  fi
done
