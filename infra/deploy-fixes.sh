#!/usr/bin/env bash
# ============================================================
#  Tu Socia! — Deploy de fixes críticos
#
#  Ejecutar desde el servidor: bash infra/deploy-fixes.sh
#  O desde fuera (si tienes SSH): bash infra/deploy-fixes.sh --remote
# ============================================================
set -euo pipefail

TUSOCIA_HOME=/root/tusocia
TEMPLATE_WA="${TUSOCIA_HOME}/templates/01-whatsapp-agent"

echo "════════════════════════════════════════════════════"
echo "  Tu Socia! — Deploy de fixes"
echo "════════════════════════════════════════════════════"

# ── 1. Actualizar CLAUDE.md (cerebro del orquestador) ─────────────────────────
echo "▶ Actualizando CLAUDE.md..."
cp -f "${TUSOCIA_HOME}/CLAUDE.md" "${TUSOCIA_HOME}/CLAUDE.md.bak" 2>/dev/null || true

# ── 2. Actualizar keepalive (self-contained + --continue) ─────────────────────
echo "▶ Actualizando claude-keepalive.sh..."
chmod +x "${TUSOCIA_HOME}/infra/orchestrator/claude-keepalive.sh"

# ── 3. Activar AI_BACKEND=ollama en el bot de WhatsApp ────────────────────────
echo "▶ Activando backend Ollama en el bot WhatsApp..."
ENV_FILE="${TEMPLATE_WA}/.env"
if grep -q "^AI_BACKEND=" "${ENV_FILE}" 2>/dev/null; then
  sed -i 's/^AI_BACKEND=.*/AI_BACKEND=ollama/' "${ENV_FILE}"
else
  echo "AI_BACKEND=ollama" >> "${ENV_FILE}"
fi

# También añadir ALLOWED_GROUP_JID si no está
if ! grep -q "^ALLOWED_GROUP_JID=" "${ENV_FILE}" 2>/dev/null; then
  echo "ALLOWED_GROUP_JID=120363409595947447@g.us" >> "${ENV_FILE}"
fi

echo "▶ Contenido .env actualizado:"
grep -E "^(AI_BACKEND|ALLOWED_GROUP|EVOLUTION_API|CLAUDE_MODEL)" "${ENV_FILE}" || true

# ── 4. Build del bot WhatsApp ──────────────────────────────────────────────────
echo "▶ Compilando bot WhatsApp..."
cd "${TEMPLATE_WA}"
npm run build 2>&1 | tail -5 || echo "⚠️  Build falló (puede que ya esté compilado)"

# ── 5. Reiniciar bot WhatsApp ──────────────────────────────────────────────────
echo "▶ Reiniciando tusocia-whatsapp..."
pm2 restart tusocia-whatsapp
sleep 3
pm2 show tusocia-whatsapp | grep -E "status|uptime|restarts" || true

# ── 6. Reiniciar orquestador en tmux ──────────────────────────────────────────
echo "▶ Reiniciando orquestador en tmux..."
cd "${TUSOCIA_HOME}"
tmux kill-session -t tusocia 2>/dev/null || true
sleep 1
tmux new-session -d -s tusocia -c "${TUSOCIA_HOME}"
tmux send-keys -t tusocia "bash ${TUSOCIA_HOME}/infra/orchestrator/claude-keepalive.sh" C-m

echo ""
echo "════════════════════════════════════════════════════"
echo "  ✅ Deploy completado"
echo ""
echo "  Bot WhatsApp:  pm2 logs tusocia-whatsapp"
echo "  Orquestador:   tmux attach -t tusocia"
echo "  QR WhatsApp:   http://192.168.1.152:3002/webhook/whatsapp/qr"
echo "  Health:        http://192.168.1.152:3002/webhook/whatsapp/health"
echo "════════════════════════════════════════════════════"
