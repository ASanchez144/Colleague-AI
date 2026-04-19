#!/usr/bin/env bash
# ============================================================
#  Tu Socia! — Instalador/reparador de Ollama
#  - Instala Ollama si no está.
#  - Aplica el drop-in de systemd.
#  - Precarga los modelos que usa Claude Code.
#  - Verifica que el endpoint responde.
#
#  Uso:  sudo bash infra/ollama/install-ollama.sh
#        MODELS="qwen3.5 kimi-k2.5:cloud" sudo -E bash infra/ollama/install-ollama.sh
# ============================================================
set -euo pipefail

# Modelos a precargar. Sobrescribible desde el entorno.
MODELS="${MODELS:-qwen3.5}"

log() { printf '\033[0;36m[ollama-setup]\033[0m %s\n' "$*"; }
ok()  { printf '\033[0;32m[ollama-setup]\033[0m ✓ %s\n' "$*"; }
err() { printf '\033[0;31m[ollama-setup]\033[0m ✗ %s\n' "$*" >&2; }

# --- 0. sanity -----------------------------------------------
if [[ $EUID -ne 0 ]]; then
  err "Este script necesita root (systemd drop-ins en /etc/systemd). Relanza con: sudo bash $0"
  exit 1
fi

# --- 1. instalar ollama si falta -----------------------------
if ! command -v ollama >/dev/null 2>&1; then
  log "Ollama no encontrado; instalando con el script oficial…"
  curl -fsSL https://ollama.com/install.sh | sh
  ok "Ollama instalado"
else
  ok "Ollama ya instalado ($(ollama --version 2>/dev/null | head -n1))"
fi

# --- 2. drop-in de systemd -----------------------------------
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
DROPIN_SRC="${SCRIPT_DIR}/ollama.service.override.conf"
DROPIN_DIR="/etc/systemd/system/ollama.service.d"
DROPIN_DST="${DROPIN_DIR}/override.conf"

if [[ ! -f "$DROPIN_SRC" ]]; then
  err "No encuentro el drop-in en $DROPIN_SRC"
  exit 1
fi

mkdir -p "$DROPIN_DIR"
cp "$DROPIN_SRC" "$DROPIN_DST"
chmod 644 "$DROPIN_DST"
ok "Drop-in copiado a $DROPIN_DST"

# --- 3. enable + restart -------------------------------------
systemctl daemon-reload
systemctl enable ollama.service >/dev/null 2>&1 || true
systemctl restart ollama.service
ok "ollama.service reiniciado y habilitado al boot"

# --- 4. esperar a que el endpoint esté vivo ------------------
log "Esperando a que Ollama responda en http://127.0.0.1:11434 …"
for i in {1..30}; do
  if curl -fsS http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    ok "Ollama responde"
    break
  fi
  sleep 1
  if [[ $i -eq 30 ]]; then
    err "Ollama no responde tras 30s. Revisa 'journalctl -u ollama -n 50'."
    exit 1
  fi
done

# --- 5. precargar modelos ------------------------------------
for m in $MODELS; do
  log "Descargando modelo '$m' (puede tardar varios minutos la primera vez)…"
  if ollama pull "$m"; then
    ok "Modelo '$m' listo"
  else
    err "No pude descargar '$m'. Continúo con el siguiente."
  fi
done

# --- 6. resumen ----------------------------------------------
echo
log "Modelos disponibles:"
ollama list
echo
ok "Ollama configurado como servicio persistente. Un reinicio NO lo va a tumbar."
