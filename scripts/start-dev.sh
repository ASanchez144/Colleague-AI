#!/bin/bash
# ============================================================
#  Tu Socia! — Arranque en modo DESARROLLO con tmux
#  Ideal para sesiones SSH donde quieres ver logs en vivo
#  Uso: bash scripts/start-dev.sh
# ============================================================

SESSION="tu-socia"

# Matar sesión anterior si existe
tmux kill-session -t $SESSION 2>/dev/null || true

# Crear sesión con panel para el backend
tmux new-session -d -s $SESSION -n "server" -x 220 -y 50

# Panel 0: Backend
tmux send-keys -t $SESSION:server "cd $(pwd)/server && npm run dev" Enter

# Panel 1: Frontend
tmux new-window -t $SESSION -n "frontend"
tmux send-keys -t $SESSION:frontend "cd $(pwd) && npm run dev" Enter

# Panel 2: Logs en vivo
tmux new-window -t $SESSION -n "logs"
tmux send-keys -t $SESSION:logs "tail -f logs/combined.log 2>/dev/null || echo 'Esperando logs...'" Enter

echo "✅ Sesión tmux '${SESSION}' iniciada."
echo "   → Conectar:    tmux attach -t ${SESSION}"
echo "   → Desconectar: Ctrl+B, luego D  (el proceso sigue corriendo)"
echo "   → Matar todo:  tmux kill-session -t ${SESSION}"

tmux attach -t $SESSION
