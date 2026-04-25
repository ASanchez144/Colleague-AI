# Tu Socia! — Protocolo de coordinación entre agentes

Este documento existe para que ChatGPT, Codex, Claude Code y cualquier agente futuro trabajen sobre el mismo contexto sin pisarse el trabajo.

## Regla principal

Nada importante debe vivir solo en un chat. Cada cambio relevante debe dejar rastro en el repositorio mediante:

1. issue, pull request o commit descriptivo;
2. actualización de `docs/WORKLOG.md`;
3. actualización de este documento si cambia la forma de trabajar;
4. cambios pequeños y reversibles en ramas separadas.

## Roles recomendados

### ChatGPT / Arquitecto

Responsable de definir arquitectura, revisar riesgos, dividir el MVP en tareas y crear documentación operativa.

No debe tocar producción directamente. Debe proponer cambios vía rama y pull request.

### Codex / Implementador

Responsable de escribir código, tests y refactors controlados.

Debe trabajar siempre en una rama de feature y explicar qué archivos toca antes de abrir pull request.

### Claude Code / Operador del servidor

Responsable de ejecutar comandos en el servidor, revisar logs, levantar servicios y aplicar cambios operativos.

Debe registrar cada acción en `docs/WORKLOG.md` o en `runtime/agent-journal/` si está trabajando desde el servidor.

## Flujo seguro de trabajo

1. Crear rama desde `main`.
2. Leer `README.md`, `CLAUDE.md`, `docs/AGENT_HANDOFF.md` y `docs/WORKLOG.md`.
3. Escribir un mini plan antes de tocar código.
4. Modificar lo mínimo necesario.
5. Ejecutar verificación local: build, lint o health check.
6. Registrar lo hecho en `docs/WORKLOG.md`.
7. Abrir pull request con resumen, riesgos y pruebas.
8. No mezclar infraestructura, UI y lógica de negocio en el mismo PR salvo que sea imprescindible.

## Formato obligatorio para cada entrada de trabajo

Usa este bloque al final de `docs/WORKLOG.md`:

```md
## YYYY-MM-DD HH:mm — agente — rama

### Objetivo

### Archivos tocados

### Decisiones tomadas

### Comandos ejecutados

### Resultado

### Pendiente / riesgos
```

## Comunicación con Claude Code

Claude Code debe arrancar leyendo:

```bash
cd /root/tusocia
cat CLAUDE.md
cat docs/AGENT_HANDOFF.md
cat docs/WORKLOG.md
```

Cuando termine una tarea debe añadir una entrada al worklog:

```bash
./scripts/agent-log.sh "claude-code" "resumen corto de la tarea"
```

Si `scripts/agent-log.sh` no existe en el servidor, crear la entrada manualmente en `docs/WORKLOG.md`.

## Cosas prohibidas

- Subir `.env`, `secrets`, claves SSH, tokens, cookies, bases de datos o sesiones de WhatsApp.
- Hacer commits directos en `main`.
- Borrar archivos sin explicar por qué.
- Cambiar `CONFIG_SESSION_PHONE_VERSION` de Evolution API sin justificarlo.
- Cambiar puertos en producción sin actualizar `CLAUDE.md`, `docs/DOCKER.md` y PM2.

## Convención de ramas

- `feat/...` nueva funcionalidad.
- `fix/...` corrección de bug.
- `chore/...` infraestructura/documentación.
- `security/...` retirada de secretos o endurecimiento.

## Convención de commits

Usa Conventional Commits:

- `feat:`
- `fix:`
- `docs:`
- `chore:`
- `security:`
- `refactor:`
- `test:`

## Criterio de calidad mínimo

Un PR no está listo si no responde a estas preguntas:

1. ¿Qué problema resuelve?
2. ¿Qué archivos cambia?
3. ¿Cómo se prueba?
4. ¿Qué riesgo tiene?
5. ¿Qué queda pendiente?
