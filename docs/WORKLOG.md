# Tu Socia! — Worklog compartido

Registro de trabajo entre agentes humanos y agentes IA.

La idea no es escribir una novela. La idea es no perder contexto ni repetir trabajo.

---

## 2026-04-25 12:00 — ChatGPT — chore/agent-docker-coordination

### Objetivo

Inspeccionar el repositorio sin romper nada y dejar una base mínima para coordinación entre ChatGPT, Codex y Claude Code.

### Archivos tocados

- `docs/AGENT_HANDOFF.md`
- `docs/WORKLOG.md`
- `docs/DOCKER.md`
- `scripts/agent-log.sh`

### Decisiones tomadas

- Trabajar en una rama separada, no en `main`.
- Priorizar documentación operativa antes de meter más código.
- Mantener PM2 para procesos Node y Docker Compose para Evolution API, PostgreSQL y Redis.
- Añadir un protocolo explícito para que Claude Code registre cada actuación.

### Comandos ejecutados

No se han ejecutado comandos en producción. Solo inspección vía GitHub y creación de archivos en rama.

### Resultado

Base de coordinación creada para evitar pérdida de contexto entre agentes.

### Pendiente / riesgos

- Revisar exposición de secretos en historial Git.
- Completar Dockerización del frontend/backend si se decide abandonar PM2.
- Implementar el `TODO` real de creación de agente desde `server/index.ts`.
