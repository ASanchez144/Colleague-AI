# Tu Socia! — Guía de Despliegue Autónomo

Todos los comandos que necesitas ejecutar en el servidor, en orden.

---

## PASO 0 — Prerequisitos del servidor

```bash
# Instalar Node.js 22 con nvm (si no está instalado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22 && nvm use 22 && nvm alias default 22

# Instalar Docker (para Evolution API / WhatsApp)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # reinicia sesión SSH tras esto
```

---

## PASO 1 — Clonar y configurar variables

```bash
# Clonar el repositorio
git clone https://github.com/ASanchez144/Colleague-AI.git
cd tu-socia

# Copiar y editar el .env del servidor
cp server/.env.production server/.env
nano server/.env
```

**Variables críticas a rellenar en `server/.env`:**

| Variable | Dónde obtenerla |
|---|---|
| `RESEND_API_KEY` | https://resend.com/api-keys |
| `FROM_EMAIL` | Dominio verificado en https://resend.com/domains |
| `WEBHOOK_SECRET` | `openssl rand -hex 32` |
| `EVOLUTION_API_KEY` | Pon el mismo valor en docker-compose.yml |
| `WEBHOOK_CALLBACK_URL` | Tu dominio público + `/webhook/whatsapp` |

---

## PASO 2 — Levantar Evolution API (WhatsApp)

```bash
cd templates/01-whatsapp-agent
docker compose up -d

# Verificar que está corriendo
docker compose ps
docker compose logs -f evolution-api   # Ctrl+C para salir

# De vuelta a la raíz
cd ../..
```

---

## PASO 3 — Despliegue con PM2 (servidor 24/7)

```bash
# Ejecuta ESTE ÚNICO SCRIPT para instalarlo todo
bash scripts/setup-server.sh
```

Este script:
1. Instala PM2 y tsx globalmente
2. Instala dependencias del backend y frontend
3. Construye el frontend (`npm run build`)
4. Verifica que `server/.env` existe
5. Lanza `tusocia-server` (Express, puerto 3001) y `tusocia-frontend` (Vite preview, puerto 3000) con PM2
6. Guarda la lista de procesos con `pm2 save`

---

## PASO 4 — Hacer que PM2 sobreviva al reinicio del servidor

```bash
pm2 startup     # Lee el comando que te imprime y EJECÚTALO (empieza con "sudo env PATH=...")
pm2 save
```

---

## PASO 5 — Conectar tu número de WhatsApp

```bash
# Escanea el QR con tu app de WhatsApp → Dispositivos vinculados
curl http://localhost:3002/webhook/whatsapp/qr
# O abre en el navegador: http://TU_IP:3002/webhook/whatsapp/qr
```

---

## Comandos del día a día

```bash
# Estado de todos los procesos
pm2 status

# Logs en vivo del backend
pm2 logs tusocia-server

# Logs en vivo del bot de WhatsApp
pm2 logs tusocia-whatsapp   # si lo añades al ecosystem

# Reiniciar todo (tras cambios de código)
pm2 restart all

# Ver leads recibidos (API admin)
curl http://localhost:3001/api/leads | jq .

# Health check
curl http://localhost:3001/api/health
curl http://localhost:3002/webhook/whatsapp/health

# Estado de la conexión WhatsApp
curl http://localhost:3002/webhook/whatsapp/health | jq .whatsapp
```

---

## Añadir el bot de WhatsApp a PM2

Para que el servidor de WhatsApp también corra con PM2, añade esto al `ecosystem.config.cjs`:

```js
{
  name: 'tusocia-whatsapp',
  script: 'tsx',
  args: 'src/webhookServer.ts',
  cwd: './templates/01-whatsapp-agent',
  interpreter: 'none',
  watch: false,
  autorestart: true,
  env_file: './server/.env',
  log_file: './logs/pm2-whatsapp.log',
  error_file: './logs/pm2-whatsapp-error.log',
  merge_logs: true,
  time: true
}
```

Luego: `pm2 restart ecosystem.config.cjs --update-env`

---

## Arquitectura del sistema en producción

```
Internet
   │
   ▼
[Nginx / Caddy]  ←── TLS, proxy reverso
   │
   ├── /          → tusocia-frontend (puerto 3000)
   ├── /api       → tusocia-server   (puerto 3001)
   └── /webhook   → tusocia-whatsapp (puerto 3002)

[Evolution API]  (Docker, puerto 8080)
   │
   └── POST /webhook/whatsapp → tusocia-whatsapp

[PM2]  gestiona: tusocia-server, tusocia-frontend, tusocia-whatsapp
```

---

## Desarrollo local (sin PM2)

```bash
# Sesión tmux con paneles separados
bash scripts/start-dev.sh

# Reconectar si te desconectas
tmux attach -t tu-socia
```
