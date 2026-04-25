#!/usr/bin/env bash
set -euo pipefail

AGENT_NAME="${1:-unknown-agent}"
SUMMARY="${2:-sin resumen}"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown-branch)"
NOW="$(date '+%Y-%m-%d %H:%M')"
WORKLOG="docs/WORKLOG.md"

mkdir -p docs runtime/agent-journal

ENTRY_FILE="runtime/agent-journal/$(date '+%Y%m%d-%H%M%S')-${AGENT_NAME}.md"

cat > "$ENTRY_FILE" <<EOF
## ${NOW} — ${AGENT_NAME} — ${BRANCH}

### Objetivo
${SUMMARY}

### Archivos tocados
Pendiente de completar por el agente.

### Decisiones tomadas
Pendiente de completar por el agente.

### Comandos ejecutados
Pendiente de completar por el agente.

### Resultado
Pendiente de completar por el agente.

### Pendiente / riesgos
Pendiente de completar por el agente.
EOF

if [ ! -f "$WORKLOG" ]; then
  cat > "$WORKLOG" <<'EOF'
# Tu Socia! — Worklog compartido

Registro de trabajo entre agentes humanos y agentes IA.

---
EOF
fi

{
  echo ""
  cat "$ENTRY_FILE"
} >> "$WORKLOG"

echo "✅ Entrada creada en $ENTRY_FILE y añadida a $WORKLOG"
