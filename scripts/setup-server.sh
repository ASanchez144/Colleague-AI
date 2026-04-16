#!/bin/bash
# ============================================================
#  Tu Socia! — Setup de Autonomía del Servidor
#  Ejecuta UNA VEZ en el servidor para dejarlo funcionando 24/7
#  Uso: bash scripts/setup-server.sh
# ============================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   💜 Tu Socia! — Server Autonomy Setup           ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ─── 0. Prerequisitos ────────────────────────────────────────
echo -e "${YELLOW}[0/6] Verificando Node.js y npm...${NC}"
node --version || { echo -e "${RED}ERROR: Node.js no instalado. Instala via nvm.${NC}"; exit 1; }
npm --version

# ─── 1. Instalar PM2 globalmente ─────────────────────────────
echo -e "${YELLOW}[1/6] Instalando PM2...${NC}"
npm install -g pm2 tsx 2>/dev/null || true
pm2 --version

# ─── 2. Instalar dependencias del backend ────────────────────
echo -e "${YELLOW}[2/6] Instalando dependencias del servidor...${NC}"
cd server
npm install
cd ..

# ─── 3. Instalar dependencias del frontend y build ───────────
echo -e "${YELLOW}[3/6] Instalando dependencias del frontend y construyendo...${NC}"
npm install
npm run build

# ─── 4. Verificar .env del servidor ──────────────────────────
echo -e "${YELLOW}[4/6] Verificando configuración .env...${NC}"
if [ ! -f "server/.env" ]; then
  echo -e "${RED}  ⚠  No existe server/.env. Copiando plantilla...${NC}"
  cp server/.env.example server/.env
  echo -e "${RED}  ⚠  EDITA server/.env con tus claves antes de continuar!${NC}"
  echo -e "${RED}  ⚠  Variables críticas: RESEND_API_KEY, FROM_EMAIL${NC}"
  exit 1
else
  echo -e "${GREEN}  ✓  server/.env encontrado${NC}"
fi

# ─── 5. Crear directorio de logs ─────────────────────────────
echo -e "${YELLOW}[5/6] Preparando directorios...${NC}"
mkdir -p logs clients

# ─── 6. Iniciar PM2 ──────────────────────────────────────────
echo -e "${YELLOW}[6/6] Iniciando procesos con PM2...${NC}"
pm2 start ecosystem.config.cjs

# Guardar lista de procesos para que sobrevivan reinicios
pm2 save

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Pipeline activo en background               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Para que sobreviva al reinicio del servidor:${NC}"
echo -e "  ${YELLOW}pm2 startup${NC}  ← ejecuta el comando que te sugiera"
echo ""
echo -e "${CYAN}Comandos útiles:${NC}"
echo -e "  pm2 status                   → Estado de todos los procesos"
echo -e "  pm2 logs tusocia-server    → Logs del webhook en vivo"
echo -e "  pm2 logs tusocia-frontend  → Logs del frontend"
echo -e "  pm2 restart all              → Reiniciar todo"
echo -e "  pm2 stop all                 → Parar todo"
echo -e "  pm2 delete all               → Limpiar PM2"
echo ""
