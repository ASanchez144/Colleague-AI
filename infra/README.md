# Tu Socia! — Infra persistente

Este directorio contiene **todo lo que el servidor necesita para sobrevivir a un reinicio**. El problema de "hago `reboot` y se va todo a la mierda" se soluciona aquí.

## Diagnóstico

Tras un `reboot`, `ls` en `/root` sigue mostrando `claude_proxy.py`, `clisbot.log` y `tusocia/` porque los **archivos** están en disco. Lo que se pierde son los **procesos**: Ollama, Claude Code, PM2 y el bot de WhatsApp no están registrados como servicios de `systemd`, así que el kernel no sabe que debe relanzarlos. Cuando los arrancas a mano desde tu sesión SSH (`ollama serve &`, `claude`, `npm run dev`), viven solo mientras tu shell viva.

La solución es convertir cada pieza en una **unidad de systemd** y encadenarlas con un `bootstrap.sh` idempotente.

## Arquitectura

```
┌────────────────────────────────────────────────────────────┐
│  systemd (PID 1)                                           │
│                                                            │
│  ├─ ollama.service  ← override con OLLAMA_HOST, KEEP_ALIVE │
│  │    └─ sirve modelos en http://127.0.0.1:11434           │
│  │                                                         │
│  ├─ tusocia-orchestrator.service                           │
│  │    └─ launch-orchestrator.sh                            │
│  │         └─ tmux session "tusocia"                       │
│  │              └─ claude --model $CLAUDE_MODEL            │
│  │                                                         │
│  ├─ tusocia-pm2.service  (pm2 resurrect al boot)           │
│  │    ├─ tusocia-server     (Express webhook,   :3001)     │
│  │    ├─ tusocia-whatsapp   (Evolution bot,     :3002)     │
│  │    └─ tusocia-frontend   (vite preview,      :3000)     │
│  │                                                         │
│  └─ tusocia-healthcheck.timer                              │
│       └─ ejecuta healthcheck.sh cada 60s                   │
│            └─ reinicia la unit que se caiga                │
└────────────────────────────────────────────────────────────┘
```

## Instalación en un servidor limpio

```bash
# 1. Clonar el repo (o `git pull` si ya lo tienes)
cd /root
git clone https://github.com/ASanchez144/Colleague-AI.git tusocia
cd tusocia

# 2. Un único comando — idempotente, puedes relanzarlo tantas veces como haga falta
sudo bash infra/setup/bootstrap.sh
```

El script instala Node 22, PM2, tsx, tmux, jq; instala/repara Ollama; despliega el `.env`; copia las unidades systemd; construye el frontend; arranca PM2; habilita el orquestador y el healthcheck. Al terminar, un `reboot` debería recuperar todo solo.

### Variables útiles para el bootstrap

```bash
TUSOCIA_HOME=/opt/tusocia \
CLAUDE_MODEL=kimi-k2.5:cloud \
PRELOAD_MODELS="qwen3.5 kimi-k2.5:cloud" \
sudo -E bash infra/setup/bootstrap.sh
```

## Verificación

```bash
# Estado de las cuatro patas
systemctl status ollama tusocia-orchestrator tusocia-pm2 tusocia-healthcheck.timer

# Healthcheck manual (mismo que corre el timer)
bash infra/health/healthcheck.sh

# Conectarse al Claude Code que está corriendo en tmux
tmux attach -t tusocia     # Ctrl+B, D para salir sin matarlo

# Logs en vivo
journalctl -u tusocia-orchestrator -f
journalctl -u ollama -f
pm2 logs
```

## Reinicio controlado del servidor

```bash
sudo reboot
# ~30s después, vuelve por SSH y:
bash infra/health/healthcheck.sh
# Debería devolver 0 y listar todo en verde.
```

## Si algo va mal

| Síntoma | Qué mirar |
|---|---|
| `systemctl status tusocia-orchestrator` dice `failed` | `journalctl -u tusocia-orchestrator -n 100` |
| Ollama no responde | `journalctl -u ollama -n 100`, `curl http://127.0.0.1:11434/api/tags` |
| PM2 no resucita | Revisa que `/root/.pm2/dump.pm2` existe y que el `PATH` en `tusocia-pm2.service` apunta al `node` correcto |
| El orquestador cicla (restart loop) | Comprueba que `claude` está en `$PATH` y que `CLAUDE_MODEL` existe en `ollama list` |

## Dónde toca cada archivo

| Archivo | Se instala en | Responsable |
|---|---|---|
| `ollama/ollama.service.override.conf` | `/etc/systemd/system/ollama.service.d/override.conf` | Ollama tuning (context, keep-alive) |
| `orchestrator/orchestrator.env` | `/etc/tusocia/orchestrator.env` | Env del bridge Claude↔Ollama |
| `orchestrator/launch-orchestrator.sh` | se ejecuta en sitio desde el repo | Arranca tmux+claude |
| `systemd/tusocia-orchestrator.service` | `/etc/systemd/system/` | Unit del orquestador |
| `systemd/tusocia-pm2.service` | `/etc/systemd/system/` | Unit de PM2 resurrect |
| `systemd/tusocia-healthcheck.{service,timer}` | `/etc/systemd/system/` | Watchdog |
| `health/healthcheck.sh` | se ejecuta en sitio desde el repo | Verificación + auto-remediación |
| `setup/bootstrap.sh` | se ejecuta una vez | Orquesta la instalación completa |

## Por qué no basta con `pm2 startup`

El clásico `pm2 startup systemd` genera una unidad con un `PATH` hardcodeado al `node` que había en tu shell en ese momento. Si cambias de versión de Node con `nvm`, o si el boot arranca antes de que `nvm` haya hecho `use`, PM2 no encuentra `node` y todo cae. `tusocia-pm2.service` es explícito: apunta al binario real de `node` detectado durante el bootstrap y se reescribe si cambias de versión relanzando el script.
