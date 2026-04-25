# Tu Socia! — Docker e infraestructura local

Este documento explica qué va en Docker y qué va fuera, para no convertir el MVP en un monstruo inmantenible.

## Estado actual detectado

El proyecto usa dos capas:

1. **Procesos Node gestionados por PM2**
   - `tusocia-frontend` en puerto `3000`
   - `tusocia-server` en puerto `3001`
   - `tusocia-whatsapp` en puerto `3002`

2. **Servicios de infraestructura en Docker Compose**
   - Evolution API en puerto `8080`
   - PostgreSQL en puerto `5432`
   - Redis en puerto `6379`

El Docker Compose principal actual está en:

```bash
templates/01-whatsapp-agent/docker-compose.yml
```

## Decisión recomendada para el MVP

Para el primer MVP, no hay que meter todo en Docker todavía.

La opción más segura ahora mismo es:

- Mantener PM2 para frontend, backend y bot WhatsApp.
- Mantener Docker Compose solo para Evolution API, PostgreSQL y Redis.
- Documentar bien `.env.example`, puertos y health checks.
- No cambiar los puertos mientras el sistema esté funcionando.

Dockerizar todo llegará después, cuando el flujo esté validado con clientes reales.

## Por qué no dockerizar todo ya

Dockerizar frontend/backend/bot ahora añade complejidad:

- más redes internas;
- más variables de entorno duplicadas;
- más problemas de volúmenes;
- más fricción para Claude Code y depuración;
- más riesgo de romper WhatsApp/Evolution API.

La cruda realidad: ahora mismo el cuello de botella no es Docker. El cuello de botella es cerrar un flujo vendible y estable.

## Comandos actuales útiles

Desde `/root/tusocia`:

```bash
# Ver procesos Node
pm2 list
pm2 logs tusocia-server --lines 80
pm2 logs tusocia-whatsapp --lines 80
pm2 logs tusocia-frontend --lines 80

# Reiniciar procesos concretos
pm2 restart tusocia-server
pm2 restart tusocia-whatsapp
pm2 restart tusocia-frontend
```

Desde `/root/tusocia/templates/01-whatsapp-agent`:

```bash
# Levantar infraestructura WhatsApp
docker compose up -d

# Ver estado
docker compose ps

# Ver logs de Evolution API
docker compose logs -f evolution-api

# Ver logs de PostgreSQL
docker compose logs -f postgres

# Ver logs de Redis
docker compose logs -f redis

# Parar sin borrar datos
docker compose stop

# Parar y borrar contenedores, manteniendo volúmenes
docker compose down
```

## Variables críticas

No hardcodear secretos reales en el repositorio.

Usar `.env.example` para nombres de variables y `.env` real solo en servidor.

Variables relevantes:

```bash
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=change-me
EVOLUTION_INSTANCE_NAME=tu-socia
WEBHOOK_CALLBACK_URL=http://host.docker.internal:3002/webhook/whatsapp
WHATSAPP_GROUP_ID=120363409595947447@g.us
ALLOWED_GROUP_JID=120363409595947447@g.us
WHATSAPP_PORT=3002
FRONTEND_URL=http://localhost:3000
PORT=3001
```

## Health checks mínimos

```bash
# Backend principal
curl http://localhost:3001/api/health

# Bot WhatsApp
curl http://localhost:3002/webhook/whatsapp/health

# Evolution API
curl -s http://localhost:8080/instance/fetchInstances -H "apikey: $EVOLUTION_API_KEY"
```

## Evolución futura: dockerización completa

Cuando el MVP esté validado, crear un `docker-compose.prod.yml` en raíz con:

- `frontend`
- `server`
- `whatsapp-bot`
- `evolution-api`
- `postgres`
- `redis`
- opcional: `nginx` o `caddy`

Pero no hacerlo hasta tener claro:

1. dominio final;
2. proveedor VPS;
3. forma de certificados HTTPS;
4. backup de PostgreSQL;
5. estrategia de logs;
6. estrategia de secretos.

## Backup mínimo antes de tocar Docker

Antes de tocar Evolution API en producción:

```bash
cd /root/tusocia/templates/01-whatsapp-agent
mkdir -p /root/tusocia/backups

docker compose ps > /root/tusocia/backups/docker-ps-$(date +%F-%H%M).txt
docker compose logs --tail=300 evolution-api > /root/tusocia/backups/evolution-logs-$(date +%F-%H%M).txt
```

Si PostgreSQL contiene sesiones críticas:

```bash
docker exec tusocia-postgres pg_dump -U tusocia evolution > /root/tusocia/backups/evolution-$(date +%F-%H%M).sql
```

## Norma de seguridad

Nunca subir al repositorio:

- `.env`
- `secrets`
- claves SSH
- tokens
- cookies
- carpetas de sesión de WhatsApp
- dumps SQL
- logs con datos personales
