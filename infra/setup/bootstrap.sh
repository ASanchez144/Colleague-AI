#!/usr/bin/env bash
# ============================================================
#  Tu Socia! — Bootstrap autónomo del servidor
#  Objetivo: tras un `reboot` todo debe volver solo.
#
#  Qué hace este script, en orden y de forma idempotente:
#    0. Comprueba que es root y que el repo está donde dice.
#    1. Instala dependencias base (node 22, pm2, tsx, tmux, jq, curl).
#    2. Instala/repara Ollama y lo deja como servicio systemd.
#    3. Copia /etc/tusocia/orchestrator.env con el puente Ollama ↔ Claude Code.
#    4. Copia las unidades systemd a /etc/systemd/system y las habilita.
#    5. npm install + build del frontend y backend.
#    6. `pm2 start ecosystem.config.cjs` + `pm2 save` → estado persistente.
#    7. Instala el timer del watchdog (healthcheck cada minuto).
#    8. Verifica que todo responde.
#
#  Uso:  sudo bash infra/setup/bootstrap.sh
#        (opcional) TUSOCIA_HOME=/opt/tusocia sudo -E bash infra/setup/bootstrap.sh
# ============================================================
set -euo pipefail

# ── Config ──────────────────────────────────────────────────
TUSOCIA_HOME="${TUSOCIA_HOME:-/root/tusocia}"
CLAUDE_MODEL="${CLAUDE_MODEL:-qwen3.5}"
PRELOAD_MODELS="${PRELOAD_MODELS:-$CLAUDE_MODEL}"

# Colores
C='\033[0;36m'; G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
log()  { printf "${C}[bootstrap]${N} %s\n" "$*"; }
ok()   { printf "${G}[bootstrap]${N} ✓ %s\n" "$*"; }
warn() { printf "${Y}[bootstrap]${N} ⚠ %s\n" "$*"; }
err()  { printf "${R}[bootstrap]${N} ✗ %s\n" "$*" >&2; }

# ── 0. sanity ───────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  err "Necesito root (systemd, /etc, apt). Relanza con: sudo -E bash $0"
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
REPO_DIR="$(dirname "$INFRA_DIR")"

if [[ "$REPO_DIR" != "$TUSOCIA_HOME" ]]; then
  warn "El repo está en $REPO_DIR pero TUSOCIA_HOME=$TUSOCIA_HOME."
  warn "Ajusta las unidades systemd o mueve el repo para que coincidan."
  warn "Voy a reescribir las unidades con la ruta real ($REPO_DIR) al instalarlas."
fi

cd "$REPO_DIR"
ok "Repo detectado en $REPO_DIR"

# ── 1. dependencias del SO ──────────────────────────────────
log "[1/8] Dependencias del SO (tmux, jq, curl, build-essential)…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y >/dev/null
apt-get install -y --no-install-recommends \
  tmux jq curl ca-certificates gnupg build-essential git >/dev/null
ok "Paquetes base instalados"

# Node 22 (si no está)
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v 2>/dev/null | cut -dv -f2 | cut -d. -f1)" -lt 20 ]]; then
  log "Instalando Node.js 22 (NodeSource)…"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
fi
ok "Node $(node -v) / npm $(npm -v)"

# pm2 + tsx globales
if ! command -v pm2 >/dev/null 2>&1; then
  log "Instalando PM2 global..."
  npm install -g pm2 >/dev/null
fi
if ! command -v tsx >/dev/null 2>&1; then
  log "Instalando tsx global..."
  npm install -g tsx >/dev/null
fi
ok "pm2 $(pm2 -v) / tsx $(tsx --version 2>/dev/null || echo 'ok')"

# claude CLI (Claude Code). Requerido por el orquestador.
if ! command -v claude >/dev/null 2>&1; then
  log "Instalando Claude Code CLI…"
  npm install -g @anthropic-ai/claude-code >/dev/null 2>&1 \
    || warn "No pude instalar claude-code vía npm; revisa https://docs.claude.com/claude-code manualmente."
fi
command -v claude >/dev/null 2>&1 && ok "claude CLI disponible" || warn "claude CLI NO instalado — el orquestador fallará hasta resolverlo"

# ── 2. Ollama ───────────────────────────────────────────────
log "[2/8] Instalando/reparando Ollama…"
MODELS="$PRELOAD_MODELS" bash "$INFRA_DIR/ollama/install-ollama.sh"

# ── 3. env file ─────────────────────────────────────────────
log "[3/8] Desplegando /etc/tusocia/orchestrator.env…"
mkdir -p /etc/tusocia
# Reescribimos TUSOCIA_HOME y CLAUDE_MODEL al valor real.
sed \
  -e "s|^TUSOCIA_HOME=.*|TUSOCIA_HOME=${REPO_DIR}|" \
  -e "s|^CLAUDE_MODEL=.*|CLAUDE_MODEL=${CLAUDE_MODEL}|" \
  "$INFRA_DIR/orchestrator/orchestrator.env" > /etc/tusocia/orchestrator.env
chmod 640 /etc/tusocia/orchestrator.env
chown root:root /etc/tusocia/orchestrator.env
ok "orchestrator.env desplegado (CLAUDE_MODEL=$CLAUDE_MODEL, HOME=$REPO_DIR)"

# ── 4. unidades systemd ─────────────────────────────────────
log "[4/8] Copiando unidades systemd…"

install_unit() {
  local src="$1" dst="$2"
  # Sustituimos /root/tusocia por la ruta real antes de copiar.
  sed "s|/root/tusocia|${REPO_DIR}|g" "$src" > "$dst"
  chmod 644 "$dst"
}

install_unit "$INFRA_DIR/systemd/tusocia-orchestrator.service" /etc/systemd/system/tusocia-orchestrator.service
install_unit "$INFRA_DIR/systemd/tusocia-pm2.service"          /etc/systemd/system/tusocia-pm2.service
install_unit "$INFRA_DIR/systemd/tusocia-healthcheck.service"  /etc/systemd/system/tusocia-healthcheck.service
install_unit "$INFRA_DIR/systemd/tusocia-healthcheck.timer"    /etc/systemd/system/tusocia-healthcheck.timer

# Ajustamos el PATH de node en la unit de pm2 al binario real:
NODE_BIN_DIR="$(dirname "$(command -v node)")"
PM2_BIN="$(command -v pm2)"
sed -i \
  -e "s|^Environment=PATH=.*|Environment=PATH=${NODE_BIN_DIR}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin|" \
  -e "s|^ExecStart=.*pm2 resurrect|ExecStart=${PM2_BIN} resurrect|" \
  -e "s|^ExecReload=.*pm2 reload all|ExecReload=${PM2_BIN} reload all|" \
  -e "s|^ExecStop=.*pm2 kill|ExecStop=${PM2_BIN} kill|" \
  /etc/systemd/system/tusocia-pm2.service

systemctl daemon-reload
ok "Unidades copiadas y daemon-reload hecho"

# ── 5. npm install + build ──────────────────────────────────
log "[5/8] npm install del backend…"
( cd "$REPO_DIR/server" && npm install --no-audit --no-fund ) >/dev/null
ok "Backend listo"

log "    npm install + build del frontend…"
( cd "$REPO_DIR" && npm install --no-audit --no-fund ) >/dev/null
( cd "$REPO_DIR" && npm run build ) >/dev/null
ok "Frontend construido"

mkdir -p "$REPO_DIR/logs" "$REPO_DIR/clients"

if [[ ! -f "$REPO_DIR/server/.env" ]]; then
  warn "Falta server/.env — copia server/.env.example y rellena RESEND_API_KEY, FROM_EMAIL, WEBHOOK_SECRET antes de arrancar PM2."
fi

# ── 6. PM2 save + habilitar tusocia-pm2.service ─────────────
log "[6/8] Arrancando PM2 y guardando estado…"
cd "$REPO_DIR"
pm2 start ecosystem.config.cjs --update-env || true
pm2 save
systemctl enable --now tusocia-pm2.service
ok "PM2 procesos arrancados y persistidos"

# ── 7. orquestador + healthcheck ────────────────────────────
log "[7/8] Habilitando tusocia-orchestrator y healthcheck…"
find "$INFRA_DIR" -type f -name '*.sh' -exec chmod +x {} \;

systemctl enable --now tusocia-orchestrator.service
systemctl enable --now tusocia-healthcheck.timer
ok "Orchestrator y healthcheck activos"

# ── 8. verificación final ───────────────────────────────────
log "[8/8] Verificando estado…"
sleep 3
bash "$INFRA_DIR/health/healthcheck.sh" || warn "Healthcheck avisa de problemas — revisa el output."

echo
ok "Bootstrap terminado. Un 'sudo reboot' debería recuperar TODO automáticamente."
echo
echo -e "${C}Comandos útiles:${N}"
echo "  systemctl status ollama tusocia-orchestrator tusocia-pm2 tusocia-healthcheck.timer"
echo "  journalctl -u tusocia-orchestrator -f"
echo "  journalctl -u ollama -f"
echo "  tmux attach -t tusocia           # conectar al Claude Code en vivo"
echo "  pm2 status"
echo "  bash $INFRA_DIR/health/healthcheck.sh"
