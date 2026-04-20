#!/usr/bin/env bash
# ============================================================
#  Tu Socia! — Despliegue y Verificación de Producción
#  Este script automatiza el ciclo completo: Update -> Bootstrap -> Healthcheck -> Stress Test
# ============================================================
set -euo pipefail

# ─── 0. Variables editables ───────────────────────────────────────
export TUSOCIA_HOME="/root/tusocia"
export CLAUDE_MODEL="gemma4:cloud"     # debe existir tal cual en `ollama list`
export PRELOAD_MODELS="gemma4:cloud"   # separados por espacios si hay varios

echo "🚀 Iniciando despliegue en $TUSOCIA_HOME..."

# ─── 1. Asegurar el repo actualizado ──────────────────────────────
if [ ! -d "$TUSOCIA_HOME/.git" ]; then
  echo "Clonando repositorio por primera vez..."
  git clone https://github.com/ASanchez144/Colleague-AI.git "$TUSOCIA_HOME"
fi

cd "$TUSOCIA_HOME"
echo "Actualizando código desde origin/main..."
git fetch --all --prune
git checkout main
git reset --hard origin/main     # descarta cambios locales que estorben
echo "Últimos commits:"
git log --oneline -3

# ─── 2. Bootstrap idempotente (instala todo y enlaza con systemd) ─
echo "Ejecutando bootstrap de infraestructura..."
sudo -E bash "$TUSOCIA_HOME/infra/setup/bootstrap.sh"

# ─── 3. Verificación — todo en verde ──────────────────────────────
echo "Verificando servicios..."
systemctl is-active ollama tusocia-orchestrator tusocia-pm2 tusocia-healthcheck.timer
bash "$TUSOCIA_HOME/infra/health/healthcheck.sh" || true

# ─── 4. Prueba de fuego: reiniciar Ollama y comprobar resiliencia ──
echo "Prueba de fuego: reiniciando Ollama para probar el keepalive de Claude..."
sudo systemctl restart ollama
echo "Esperando a que Ollama vuelva (8s)..."
sleep 8
bash "$TUSOCIA_HOME/infra/health/healthcheck.sh"

# ─── 5. Resumen del estado ────────────────────────────────────────
echo
echo "=== STATUS FINAL ==="
systemctl --no-pager -l status ollama tusocia-orchestrator tusocia-pm2 tusocia-healthcheck.timer | head -60
echo
echo "=== PM2 PROCESSES ==="
pm2 status
