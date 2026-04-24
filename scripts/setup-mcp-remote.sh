#!/bin/bash
# ============================================================
#  Tu Socia! — Instalación del MCP Server en el Servidor Remoto
#
#  PROPÓSITO:
#    Instala y configura el servidor MCP que permite a Claude
#    Code (en tu laptop) controlar este servidor vía SSH.
#
#  CÓMO USARLO:
#    Desde tu laptop, ejecuta:
#      ssh -i C:/Users/artur/.ssh/id_rsa_artur usuario@IP_SERVIDOR \
#        "bash /opt/tusocia/app/scripts/setup-mcp-remote.sh"
#
#    O una vez conectado por SSH:
#      bash /opt/tusocia/app/scripts/setup-mcp-remote.sh
#
#  IDEMPOTENTE: se puede ejecutar múltiples veces sin problema.
# ============================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MCP_DIR="/opt/tusocia/mcp-server"
APP_DIR="/opt/tusocia/app"
MCP_SERVICE="tusocia-mcp"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   💜 Tu Socia! — Setup MCP Server               ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ─── 0. Verificar prerequisitos ──────────────────────────────
echo -e "${YELLOW}[0/5] Verificando prerequisitos...${NC}"

command -v node >/dev/null 2>&1 || {
  echo -e "${RED}ERROR: Node.js no está instalado.${NC}"
  echo "Instala con: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
  echo "Luego: source ~/.bashrc && nvm install 22"
  exit 1
}

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}ERROR: Node.js ${NODE_VERSION} es demasiado antiguo. Necesitas >= 18.${NC}"
  exit 1
fi

echo -e "${GREEN}  ✓  Node.js $(node --version) encontrado${NC}"

command -v npm >/dev/null 2>&1 || { echo -e "${RED}ERROR: npm no encontrado.${NC}"; exit 1; }
echo -e "${GREEN}  ✓  npm $(npm --version) encontrado${NC}"

# Verificar que el proyecto principal existe
if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}ERROR: El directorio $APP_DIR no existe.${NC}"
  echo "Clona el repositorio primero:"
  echo "  mkdir -p /opt/tusocia && cd /opt/tusocia"
  echo "  git clone https://github.com/ASanchez144/Colleague-AI.git app"
  exit 1
fi
echo -e "${GREEN}  ✓  Directorio del proyecto encontrado: $APP_DIR${NC}"

# ─── 1. Crear directorio del MCP server ──────────────────────
echo -e "${YELLOW}[1/5] Preparando directorio $MCP_DIR...${NC}"
mkdir -p "$MCP_DIR"
echo -e "${GREEN}  ✓  Directorio listo${NC}"

# ─── 2. Copiar los archivos del MCP server ───────────────────
echo -e "${YELLOW}[2/5] Copiando archivos del MCP server...${NC}"

cp "$APP_DIR/infra/mcp-server/index.ts"     "$MCP_DIR/index.ts"
cp "$APP_DIR/infra/mcp-server/package.json" "$MCP_DIR/package.json"
cp "$APP_DIR/infra/mcp-server/tsconfig.json" "$MCP_DIR/tsconfig.json"

echo -e "${GREEN}  ✓  Archivos copiados a $MCP_DIR${NC}"

# ─── 3. Instalar dependencias npm ────────────────────────────
echo -e "${YELLOW}[3/5] Instalando dependencias npm en $MCP_DIR...${NC}"
cd "$MCP_DIR"
npm install --omit=dev
echo -e "${GREEN}  ✓  Dependencias instaladas${NC}"

# ─── 4. Crear archivo .env del MCP server ────────────────────
echo -e "${YELLOW}[4/5] Configurando variables de entorno...${NC}"

if [ ! -f "$MCP_DIR/.env" ]; then
  cat > "$MCP_DIR/.env" << EOF
# MCP Server — Variables de entorno
# Ruta absoluta al directorio raíz del proyecto Tu Socia!
PROJECT_ROOT=$APP_DIR
EOF
  echo -e "${GREEN}  ✓  Archivo .env creado con PROJECT_ROOT=$APP_DIR${NC}"
else
  echo -e "${CYAN}  →  .env ya existe, no se sobreescribe.${NC}"
  # Asegurar que PROJECT_ROOT está definido
  grep -q "PROJECT_ROOT" "$MCP_DIR/.env" || echo "PROJECT_ROOT=$APP_DIR" >> "$MCP_DIR/.env"
fi

# ─── 5. Probar que el servidor arranca ───────────────────────
echo -e "${YELLOW}[5/5] Verificando que el MCP server arranca correctamente...${NC}"

# Lanzar el servidor 2 segundos y ver si hay errores de inicialización
TEST_OUTPUT=$(timeout 2 npx tsx "$MCP_DIR/index.ts" 2>&1 || true)

if echo "$TEST_OUTPUT" | grep -q "Servidor iniciado"; then
  echo -e "${GREEN}  ✓  MCP Server arranca correctamente${NC}"
elif echo "$TEST_OUTPUT" | grep -qi "error\|cannot\|fail\|not found"; then
  echo -e "${RED}  ✗  El servidor reportó errores:${NC}"
  echo "$TEST_OUTPUT"
  echo ""
  echo -e "${YELLOW}Intenta manualmente: cd $MCP_DIR && npx tsx index.ts${NC}"
else
  # timeout 2 termina el proceso normalmente, eso es esperado
  echo -e "${GREEN}  ✓  MCP Server iniciado sin errores de arranque${NC}"
fi

# ─── Resumen ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ MCP Server instalado en $MCP_DIR  ${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Próximo paso: configura Claude Code en tu laptop.${NC}"
echo -e "Lee el archivo: ${YELLOW}infra/mcp-server/claude-config.example.json${NC}"
echo ""
echo -e "${CYAN}Para invocar el servidor manualmente (debug):${NC}"
echo -e "  ${YELLOW}cd $MCP_DIR && npx tsx index.ts${NC}"
echo ""
echo -e "${CYAN}Comando SSH que debe ir en tu config de Claude Code:${NC}"
echo -e "  ${YELLOW}ssh -i ~/.ssh/id_rsa_artur TU_USUARIO@TU_IP_SERVIDOR \\${NC}"
echo -e "  ${YELLOW}  \"cd $MCP_DIR && npx tsx index.ts\"${NC}"
echo ""
