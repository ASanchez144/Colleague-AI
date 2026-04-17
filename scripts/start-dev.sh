#!/bin/bash
# ============================================================
#  Tu Socia! — Arranque en modo DESARROLLO con tmux
#  Levanta: Backend Express + Frontend Vite + Ngrok + Logs
#  Uso: bash scripts/start-dev.sh
# ============================================================

SESSION="tu-socia"

# Matar sesión anterior si existe
tmux kill-session -t $SESSION 2>/dev/null || true

# ── Ventana 1: Backend Express (puerto 3001) ─────────────
tmux new-session -d -s $SESSION -n "backend" -x 220 -y 50
tmux send-keys -t $SESSION:backend "cd $(pwd)/server && npm run dev" Enter

# ── Ventana 2: Frontend Vite (puerto 3000) ───────────────
tmux new-window -t $SESSION -n "frontend"
tmux send-keys -t $SESSION:frontend "cd $(pwd) && npm run dev" Enter

# ── Ventana 3: Ngrok (túnel público → localhost:3001) ────
tmux new-window -t $SESSION -n "ngrok"
tmux send-keys -t $SESSION:ngrok "echo '🌐 Iniciando túnel ngrok...' && sleep 2 && ngrok http 3001" Enter

# ── Ventana 4: Logs en vivo ──────────────────────────────
tmux new-window -t $SESSION -n "logs"
tmux send-keys -t $SESSION:logs "tail -f $(pwd)/logs/combined.log 2>/dev/null || echo 'Esperando logs... (se crean al llegar el primer webhook)'" Enter

# Volver a la ventana del backend
tmux select-window -t $SESSION:backend

echo ""
echo "✅ Sesión tmux 'tu-socia' iniciada con 4 ventanas:"
echo ""
echo "   [1] backend  → Express en localhost:3001"
echo "   [2] frontend → Vite en localhost:3000"
echo "   [3] ngrok    → Túnel público HTTPS → :3001"
echo "   [4] logs     → Tail de logs en vivo"
echo ""
echo "   → Conectar:           tmux attach -t tu-socia"
echo "   → Cambiar ventana:    Ctrl+B, luego [1] [2] [3] [4]"
echo "   → Desconectar:        Ctrl+B, luego D  (todo sigue corriendo)"
echo "   → Matar todo:         tmux kill-session -t tu-socia"
echo ""

tmux attach -t $SESSION
