# PLAN_TU_SOCIA.md — Manual de Arquitectura e Instrucciones de Despliegue

**Proyecto:** Tu Socia! — Agencia de IA B2B  
**Autor:** Arturo (Arquitecto Principal) + Claude Opus (Co-Arquitecto)  
**Fecha:** 16 de abril de 2026  
**Destinatario:** Agente Sonnet (programador/desplegador autónomo)  
**Repositorio base:** `ASanchez144/Colleague-AI`

---

## ÍNDICE

1. [Fase 1 — Frontend: Rebranding a "Tu Socia!" + Despliegue en Vercel](#fase-1)
2. [Fase 2 — Backend Local + Túnel Ngrok](#fase-2)
3. [Fase 3 — WhatsApp con EvolutionAPI](#fase-3)
4. [Fase 4 — Sistema de Skills (estructura SKILL.md)](#fase-4)
5. [Fase 5 — Sincronización al Servidor Remoto vía MCP](#fase-5)
6. [Anexo A — Variables de Entorno Consolidadas](#anexo-a)
7. [Anexo B — Diagrama de Arquitectura Final](#anexo-b)
8. [Anexo C — Checklist de Validación Post-Despliegue](#anexo-c)

---

<a id="fase-1"></a>
## FASE 1 — Frontend: Rebranding a "Tu Socia!" + Despliegue en Vercel

### 1.1 Objetivo

Transformar toda la identidad visual y textual de "Colleague AI" a "Tu Socia!" en el código fuente del frontend React, y generar la configuración necesaria para desplegar a Vercel directamente desde la terminal local.

### 1.2 Inventario de Archivos a Modificar

A continuación, la lista **exhaustiva** de archivos donde aparece la marca "Colleague AI" o "ColleagueAI" y que requieren cambio:

| # | Archivo | Qué cambiar | Nuevo valor |
|---|---------|-------------|-------------|
| 1 | `src/pages/Landing.tsx` (línea ~154) | Logo en navbar: `ColleagueAI` | `Tu Socia!` |
| 2 | `src/pages/Landing.tsx` (línea ~724) | Footer copyright: `ColleagueAI © 2026` | `Tu Socia! © 2026` |
| 3 | `src/i18n/translations.ts` | Todas las referencias a "Colleague AI" en las 95+ claves de traducción (ES y EN) | `Tu Socia!` (ES) / `Tu Socia!` (EN — mantener marca en español) |
| 4 | `src/pages/Dashboard.tsx` | Título del panel admin, mensajes de bienvenida | `Tu Socia! — Panel de Control` |
| 5 | `server/emails/welcomeTemplate.ts` | Header del email, texto del cuerpo, firma | `Tu Socia!` en toda la plantilla |
| 6 | `server/index.ts` (línea ~46) | Health check: `service: 'colleague-ai-pipeline'` | `service: 'tu-socia-pipeline'` |
| 7 | `server/.env.example` | `FROM_EMAIL=hola@colleague.ai` | `FROM_EMAIL=hola@tusocia.es` |
| 8 | `server/.env.production` | `COMPANY_NAME=Colleague AI`, `FROM_EMAIL`, mensajes default | Todos a `Tu Socia!` |
| 9 | `ecosystem.config.cjs` (líneas 2-3, nombres de proceso) | Comentarios y nombres: `colleague-server`, `colleague-frontend` | `tusocia-server`, `tusocia-frontend` |
| 10 | `templates/01-whatsapp-agent/docker-compose.yml` | Container names: `colleague-evolution`, `colleague-postgres`, `colleague-redis` | `tusocia-evolution`, `tusocia-postgres`, `tusocia-redis` |
| 11 | `templates/01-whatsapp-agent/config/template.json` | `welcomeMessage` con placeholder `{{company}}` | Verificar que el default diga "Tu Socia!" |
| 12 | `index.html` | `<title>` y meta tags | `Tu Socia! — Tu nueva socia de IA` |
| 13 | `README.md` | Nombre del proyecto y descripciones | `Tu Socia!` |
| 14 | `DEPLOYMENT.md` | Todas las referencias a `Colleague AI`, `colleague-*` | `Tu Socia!`, `tusocia-*` |
| 15 | `package.json` | `"name": "react-example"` | `"name": "tu-socia"` |
| 16 | `scripts/setup-server.sh` | Referencias a `colleague-ai` en la sesión tmux | `tu-socia` |
| 17 | `scripts/start-dev.sh` | Nombre de sesión tmux: `colleague-ai` | `tu-socia` |

### 1.3 Instrucciones de Ejecución para Sonnet

**Paso 1 — Búsqueda global y reemplazo:**

```bash
# Desde la raíz del proyecto
grep -rn "Colleague AI\|ColleagueAI\|colleague-ai\|colleague_ai\|COLLEAGUE" \
  --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" \
  --include="*.html" --include="*.yml" --include="*.cjs" --include="*.sh" .
```

Usa los resultados para confirmar que la tabla de arriba está completa. Después, aplica los reemplazos con la herramienta `Edit` archivo por archivo, nunca con `sed -i` global (demasiado riesgo de romper imports o rutas internas).

**Paso 2 — Reglas de rebranding:**

- Marca completa: `Tu Socia!` (con signo de exclamación, siempre)
- Slug/ID técnico: `tu-socia` (minúsculas, guion, sin exclamación)
- Dominio: `tusocia.es` (pendiente de registro; usar como placeholder)
- Email: `hola@tusocia.es`
- Tagline: `Tu nueva socia de IA para tu negocio`

**Paso 3 — Paleta de colores (actualizar en Tailwind):**

La paleta actual usa tonos oscuros/azules de Colleague AI. La nueva paleta de "Tu Socia!" debe ser:

```
Primario:      #7C3AED (violeta vibrante)
Secundario:    #EC4899 (rosa cálido)  
Acento:        #F59E0B (ámbar/dorado)
Fondo oscuro:  #0F0B1A (negro-violeta profundo)
Fondo claro:   #FAF5FF (lavanda suave)
Texto:         #1E1B2E (casi negro con tinte violeta)
```

Buscar las clases de color en `Landing.tsx` y `translations.ts` (los gradientes en el hero, botones CTA, etc.) y reemplazar. Los gradientes deben ir de violeta a rosa: `from-violet-600 to-pink-500`.

**Paso 4 — Generar `vercel.json`:**

Crear el archivo `vercel.json` en la raíz del proyecto con esta configuración exacta:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

Explicación:
- `framework: "vite"` — Vercel detecta automáticamente la build de Vite.
- `rewrites` — Redirige todas las rutas (excepto `/api/`) a `index.html` para que React Router funcione con client-side routing.
- No incluimos rutas `/api` en Vercel porque el backend correrá en el servidor remoto, no como serverless functions.
- `headers` — Cache inmutable para assets estáticos hasheados por Vite.

**Paso 5 — Desplegar a Vercel desde terminal:**

```bash
# 1. Instalar Vercel CLI si no está
npm i -g vercel

# 2. Login (abre navegador para auth)
vercel login

# 3. Primer despliegue (vincula el proyecto)
vercel --yes

# 4. Despliegue a producción
vercel --prod

# 5. (Opcional) Configurar dominio personalizado
vercel domains add tusocia.es
```

**Paso 6 — Variables de entorno en Vercel:**

En el dashboard de Vercel o por CLI, configurar:

```bash
vercel env add VITE_API_URL        # Valor: https://api.tusocia.es (o la IP del servidor remoto)
vercel env add VITE_FIREBASE_CONFIG # Valor: JSON stringified de la config Firebase
```

### 1.4 Criterios de Validación

- [ ] `grep -rn "Colleague\|colleague" --include="*.ts" --include="*.tsx" .` devuelve 0 resultados.
- [ ] `npm run build` completa sin errores.
- [ ] La landing page muestra "Tu Socia!" en navbar, hero, footer, formulario.
- [ ] `vercel --prod` despliega correctamente y la URL funciona.
- [ ] Las rutas del SPA (`/dashboardroot`, etc.) funcionan con el rewrite.

---

<a id="fase-2"></a>
## FASE 2 — Backend Local + Túnel Ngrok

### 2.1 Objetivo

Montar un servidor Express funcional en local que reciba webhooks del formulario de la landing y de EvolutionAPI, con un túnel ngrok para que servicios externos puedan alcanzar el servidor durante desarrollo y pruebas.

### 2.2 Estructura del Servidor (ya existente en `server/`)

```
server/
├── index.ts                    # Punto de entrada Express (puerto 3001)
├── .env                        # Variables locales (NO commitear)
├── .env.example                # Plantilla de referencia
├── .env.production             # Plantilla para producción
├── services/
│   ├── routingEngine.ts        # Scoring de leads → template assignment
│   ├── emailService.ts         # Envío de emails vía Resend API
│   ├── leadRegistry.ts         # Persistencia de leads en JSON
│   └── logger.ts               # Winston logger
└── emails/
    └── welcomeTemplate.ts      # HTML del email de bienvenida
```

### 2.3 Rutas del API

| Método | Ruta | Propósito | Auth |
|--------|------|-----------|------|
| `POST` | `/api/webhook/lead` | Recibe formulario de landing | `WEBHOOK_SECRET` en header `x-webhook-secret` |
| `GET` | `/api/health` | Health check | Ninguna |
| `GET` | `/api/leads` | Lista todos los leads (admin) | Ninguna (proteger en producción) |
| `GET` | `/api/leads/:id` | Detalle de un lead | Ninguna (proteger en producción) |

### 2.4 Flujo del Webhook `/api/webhook/lead`

```
1. Recibe POST con JSON del formulario
2. Valida campos obligatorios (company, email, sector)
3. Genera ID único para el lead
4. Guarda en /clients/leads-registry.json (leadRegistry)
5. Ejecuta routingEngine.route(leadData)
   → Devuelve: { templateId, confidence, reasoning }
6. Lanza emailService.sendWelcome(lead) en paralelo (async, no bloquea respuesta)
7. Lanza emailService.notifyAdmin(lead, routingResult) en paralelo
8. Inicia pipeline/orchestrator.ts con (lead, templateId) en background
9. Responde 200 { success: true, leadId, templateAssigned }
```

### 2.5 Instrucciones para Levantar el Backend Local

```bash
# 1. Copiar variables de entorno
cp server/.env.example server/.env

# 2. Editar con tus valores reales
nano server/.env
# Mínimo necesario para pruebas locales:
#   PORT=3001
#   RESEND_API_KEY=re_xxxxx
#   FROM_EMAIL=hola@tusocia.es
#   ADMIN_EMAIL=arturoeldeteruel@gmail.com
#   FRONTEND_URL=http://localhost:3000
#   WEBHOOK_SECRET=test-secret-local
#   TEMPLATES_DIR=../templates
#   CLIENTS_DIR=../clients
#   LOG_LEVEL=debug

# 3. Instalar dependencias
npm install

# 4. Lanzar en modo desarrollo (con hot-reload vía tsx)
npx tsx --watch server/index.ts

# 5. Verificar que funciona
curl http://localhost:3001/api/health
# Respuesta esperada: { "status": "ok", "service": "tu-socia-pipeline", "timestamp": "..." }
```

### 2.6 Configuración de Ngrok

Ngrok crea un túnel HTTPS público que redirige al puerto local. Esto es necesario para:
- Que el formulario desplegado en Vercel envíe webhooks a tu máquina local durante desarrollo.
- Que EvolutionAPI (Docker) pueda enviar callbacks de WhatsApp a tu servidor.

```bash
# 1. Instalar ngrok
# macOS:
brew install ngrok
# Linux:
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok-v3-stable-linux-amd64.tgz | \
  sudo tar xz -C /usr/local/bin

# 2. Autenticarte (gratis, crea cuenta en https://ngrok.com)
ngrok config add-authtoken <TU_TOKEN>

# 3. Levantar túnel al puerto del backend
ngrok http 3001

# Resultado: algo como
#   Forwarding  https://a1b2c3d4.ngrok-free.app → http://localhost:3001
```

**Importante — Uso del túnel:**

Una vez que ngrok esté corriendo, toma la URL pública (ej: `https://a1b2c3d4.ngrok-free.app`) y úsala para:

1. **Variable de entorno en Vercel** (temporalmente durante desarrollo):
   ```bash
   vercel env add VITE_API_URL  # Valor: https://a1b2c3d4.ngrok-free.app
   ```

2. **Callback URL de EvolutionAPI** (en `server/.env`):
   ```
   WEBHOOK_CALLBACK_URL=https://a1b2c3d4.ngrok-free.app/webhook/whatsapp
   ```

3. **Prueba end-to-end:**
   ```bash
   curl -X POST https://a1b2c3d4.ngrok-free.app/api/webhook/lead \
     -H "Content-Type: application/json" \
     -H "x-webhook-secret: test-secret-local" \
     -d '{
       "company": "Inmobiliaria Test",
       "sector": "inmobiliaria",
       "team_size": "2-10",
       "email": "test@test.com",
       "name": "Test User",
       "tools": ["WhatsApp"],
       "urgency": "esta_semana",
       "source": "landing_form"
     }'
   ```

### 2.7 Script de Desarrollo Completo (tmux)

El script `scripts/start-dev.sh` ya existe pero debe actualizarse con el nombre `tu-socia`:

```bash
#!/bin/bash
SESSION="tu-socia"

tmux new-session -d -s $SESSION

# Panel 0: Backend Express
tmux send-keys -t $SESSION "npx tsx --watch server/index.ts" C-m

# Panel 1: Frontend Vite
tmux split-window -h -t $SESSION
tmux send-keys -t $SESSION "npm run dev" C-m

# Panel 2: Ngrok (túnel)
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "ngrok http 3001" C-m

# Panel 3: Logs
tmux split-window -v -t $SESSION:0
tmux send-keys -t $SESSION "tail -f logs/*.log 2>/dev/null || echo 'Esperando logs...'" C-m

tmux attach -t $SESSION
```

### 2.8 Criterios de Validación

- [ ] `curl localhost:3001/api/health` devuelve `200 OK`.
- [ ] Un POST a `/api/webhook/lead` crea un archivo en `clients/`.
- [ ] El email de bienvenida llega al correo del lead.
- [ ] El email de notificación admin llega a `arturoeldeteruel@gmail.com`.
- [ ] La URL de ngrok responde igual que localhost.

---

<a id="fase-3"></a>
## FASE 3 — WhatsApp con EvolutionAPI

### 3.1 Objetivo

Conectar el servidor Express con EvolutionAPI (self-hosted, open source) para recibir y enviar mensajes de WhatsApp sin necesidad de la API oficial de Meta (sin proceso de verificación de negocio).

### 3.2 Qué es EvolutionAPI

EvolutionAPI es un wrapper open-source sobre la librería Baileys que expone WhatsApp Web como una API REST. Ventajas:
- **Sin aprobación de Meta** — funciona escaneando un QR como WhatsApp Web.
- **Self-hosted** — corre en Docker, tú controlas los datos.
- **API REST completa** — enviar/recibir textos, imágenes, audio, documentos.
- **Webhooks** — envía eventos (mensaje recibido, estado de conexión, etc.) a tu servidor.

### 3.3 Arquitectura de la Conexión

```
[WhatsApp del cliente]
        │
        ▼ (mensaje)
[Servidores WhatsApp]
        │
        ▼ (sincronizado vía Baileys/WebSocket)
[EvolutionAPI Docker :8080]
        │
        ▼ (POST webhook con payload del mensaje)
[Tu servidor Express :3001 → /webhook/whatsapp]
        │
        ▼ (procesa, genera respuesta con IA)
[Tu servidor Express]
        │
        ▼ (POST a EvolutionAPI REST API)
[EvolutionAPI Docker :8080]
        │
        ▼ (envía vía Baileys)
[WhatsApp del cliente recibe respuesta]
```

### 3.4 Docker Compose (ya existe en `templates/01-whatsapp-agent/`)

El archivo `docker-compose.yml` levanta 3 servicios:

```yaml
# templates/01-whatsapp-agent/docker-compose.yml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:v2.2.3
    container_name: tusocia-evolution
    ports:
      - "8080:8080"
    environment:
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evolution:evolution@postgres:5432/evolution
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - WEBHOOK_GLOBAL_URL=${WEBHOOK_CALLBACK_URL}
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_EVENTS_MESSAGES_UPSERT=true
      - WEBHOOK_EVENTS_CONNECTION_UPDATE=true
      - WEBHOOK_EVENTS_QRCODE_UPDATED=true
    volumes:
      - evolution_data:/evolution/instances
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:16
    container_name: tusocia-postgres
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: evolution
      POSTGRES_DB: evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7
    container_name: tusocia-redis
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  evolution_data:
  postgres_data:
  redis_data:
```

### 3.5 Variables de Entorno Necesarias para WhatsApp

Estas van en `server/.env`:

```bash
# === EVOLUTION API (WhatsApp) ===
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=tu-clave-secreta-aqui       # Misma que en docker-compose
EVOLUTION_INSTANCE_NAME=tu-socia              # Nombre de la instancia WhatsApp
WEBHOOK_CALLBACK_URL=https://TU_DOMINIO/webhook/whatsapp  # URL pública

# === BOT WHATSAPP ===
WHATSAPP_PORT=3002                            # Puerto del webhook server de WhatsApp
COMPANY_NAME=Tu Socia!
WELCOME_MESSAGE=¡Hola! Soy la asistente virtual de {{company}}. ¿En qué puedo ayudarte hoy?
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=20:00
BUSINESS_HOURS_TIMEZONE=Europe/Madrid
OUT_OF_HOURS_MESSAGE=Gracias por escribirnos. Nuestro horario de atención es de 9:00 a 20:00. Te responderemos a primera hora.
```

### 3.6 Flujo de Configuración Paso a Paso

**Paso 1 — Levantar EvolutionAPI:**

```bash
cd templates/01-whatsapp-agent

# Asegurarse de que EVOLUTION_API_KEY está en el entorno
export EVOLUTION_API_KEY=tu-clave-secreta-aqui
export WEBHOOK_CALLBACK_URL=https://a1b2c3d4.ngrok-free.app/webhook/whatsapp

docker compose up -d

# Verificar que los 3 contenedores están running
docker compose ps
# Deberías ver: tusocia-evolution, tusocia-postgres, tusocia-redis

# Ver logs para confirmar arranque limpio
docker compose logs -f evolution-api
# Buscar: "Server is running on port 8080"
```

**Paso 2 — Crear una instancia de WhatsApp:**

```bash
# Crear instancia (esto es como "crear un dispositivo vinculado")
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: tu-clave-secreta-aqui" \
  -d '{
    "instanceName": "tu-socia",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true,
    "webhook": {
      "url": "'"${WEBHOOK_CALLBACK_URL}"'",
      "events": [
        "MESSAGES_UPSERT",
        "CONNECTION_UPDATE",
        "QRCODE_UPDATED"
      ],
      "webhookByEvents": true
    }
  }'
```

**Paso 3 — Escanear QR para vincular WhatsApp:**

```bash
# Obtener QR code
curl http://localhost:8080/instance/connect/tu-socia \
  -H "apikey: tu-clave-secreta-aqui"

# Respuesta: { "qrcode": { "base64": "data:image/png;base64,..." } }
# Copiar el base64, pegarlo en el navegador, o...

# Alternativa: abrir directamente en navegador
# http://localhost:8080/instance/connect/tu-socia (con header apikey)
```

Escanea el QR con WhatsApp → Configuración → Dispositivos vinculados → Vincular dispositivo.

**Paso 4 — Verificar conexión:**

```bash
curl http://localhost:8080/instance/connectionState/tu-socia \
  -H "apikey: tu-clave-secreta-aqui"

# Respuesta esperada: { "instance": { "state": "open" } }
```

**Paso 5 — Enviar un mensaje de prueba:**

```bash
curl -X POST http://localhost:8080/message/sendText/tu-socia \
  -H "Content-Type: application/json" \
  -H "apikey: tu-clave-secreta-aqui" \
  -d '{
    "number": "34XXXXXXXXX",
    "text": "¡Hola! Este es un mensaje de prueba de Tu Socia!"
  }'
```

### 3.7 Lógica del Webhook Server (en `templates/01-whatsapp-agent/src/webhookServer.ts`)

El archivo `webhookServer.ts` ya implementa la lógica. Sonnet debe verificar que incluye:

```typescript
// Estructura del payload que EvolutionAPI envía a nuestro webhook:
interface EvolutionWebhookPayload {
  event: 'messages.upsert' | 'connection.update' | 'qrcode.updated';
  instance: string;
  data: {
    key: {
      remoteJid: string;      // Número: "34XXXXXXXXX@s.whatsapp.net"
      fromMe: boolean;         // true = mensaje enviado por nosotros
      id: string;              // ID único del mensaje
    };
    message: {
      conversation?: string;   // Texto plano
      imageMessage?: object;   // Imagen
      audioMessage?: object;   // Audio/nota de voz
      documentMessage?: object; // Documento
    };
    messageTimestamp: number;
    pushName: string;           // Nombre del contacto
  };
}

// Flujo de procesamiento:
// 1. Recibir POST en /webhook/whatsapp
// 2. Ignorar si data.key.fromMe === true (evitar bucles)
// 3. Extraer número y texto del mensaje
// 4. Buscar contexto de conversación previo (deduplicación por messageId)
// 5. Verificar horario laboral
// 6. Si fuera de horario → enviar OUT_OF_HOURS_MESSAGE
// 7. Si en horario → generar respuesta con IA (Claude API / GPT-4o)
// 8. Enviar respuesta vía EvolutionAPI REST:
//    POST http://localhost:8080/message/sendText/{instance}
// 9. Guardar log de la conversación
```

### 3.8 Adapter de EvolutionAPI (`src/evolutionAdapter.ts`)

Este módulo encapsula todas las llamadas a la API REST de Evolution:

```typescript
// Métodos que debe implementar el adapter:
class EvolutionAdapter {
  constructor(baseUrl: string, apiKey: string, instanceName: string)

  // Conexión
  async createInstance(): Promise<void>
  async getQRCode(): Promise<string>          // Devuelve base64
  async getConnectionState(): Promise<'open' | 'close' | 'connecting'>

  // Mensajes
  async sendText(to: string, text: string): Promise<void>
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<void>
  async sendDocument(to: string, docUrl: string, filename: string): Promise<void>

  // Utilidades
  formatPhoneNumber(raw: string): string      // "34612345678" → "34612345678@s.whatsapp.net"
  isBusinessHours(): boolean
}
```

### 3.9 Criterios de Validación

- [ ] `docker compose ps` muestra 3 contenedores `running`.
- [ ] Se puede crear instancia y obtener QR sin errores.
- [ ] Al escanear QR, `connectionState` devuelve `"open"`.
- [ ] Enviar un mensaje de prueba a tu propio número funciona.
- [ ] Al recibir un mensaje, el webhook en `:3001/webhook/whatsapp` lo recibe (ver logs).
- [ ] El bot responde automáticamente con el mensaje de bienvenida.

---

<a id="fase-4"></a>
## FASE 4 — Sistema de Skills (Estructura SKILL.md)

### 4.1 Objetivo

Definir la estructura estándar que debe tener cada archivo `SKILL.md` dentro del sistema, para que futuros agentes de IA (Claude, GPT-4o, etc.) puedan leer el skill, entender qué hace, y replicar/adaptar bots automáticamente sin intervención humana.

### 4.2 Contexto: ¿Qué es un Skill en este Sistema?

Un "Skill" es un documento Markdown con frontmatter YAML que funciona como un contrato de interfaz entre un agente de IA y un template de bot. Cuando el pipeline orchestrator asigna un template a un nuevo cliente, el agente programador lee el SKILL.md del template correspondiente para saber exactamente:

- Qué archivos tocar y dónde están.
- Qué variables reemplazar.
- Qué dependencias instalar.
- Cómo validar que el bot funciona.
- Qué errores comunes evitar.

### 4.3 Estructura Estándar del SKILL.md

Cada template en `templates/0X-nombre-template/` debe contener un `SKILL.md` con esta estructura exacta:

```markdown
---
name: "nombre-del-skill"
description: "Descripción en una línea de lo que hace este skill — usada para matching automático"
version: "1.0.0"
template_id: "01-whatsapp-agent"
category: "messaging | voice | text | calendar | analytics"
triggers:
  - "palabras clave que activan este skill"
  - "por ejemplo: whatsapp, chat, mensajes, atención al cliente"
requires:
  - "docker"           # Dependencias del sistema
  - "node >= 18"
  - "ngrok (dev only)"
env_vars:
  - name: "EVOLUTION_API_KEY"
    required: true
    description: "API key para autenticarse con EvolutionAPI"
    where: "server/.env"
  - name: "EVOLUTION_API_URL"
    required: true
    description: "URL base de EvolutionAPI (default: http://localhost:8080)"
    where: "server/.env"
ports:
  - 8080    # EvolutionAPI
  - 3002    # Webhook server del bot
estimated_setup_time: "15 minutos"
difficulty: "intermedia"
author: "Tu Socia! — Agencia de IA"
last_updated: "2026-04-16"
---

# {{name}} — Skill de Configuración

## Propósito
Descripción expandida de 2-3 oraciones explicando qué hace este bot, para quién es,
y qué problema resuelve para el cliente.

## Arquitectura del Bot

```
[Diagrama ASCII del flujo de datos específico de este bot]
```

## Archivos Clave

| Archivo | Propósito | Editable por agente |
|---------|-----------|---------------------|
| `config/template.json` | Configuración del bot (mensajes, horarios, etc.) | ✅ Sí |
| `src/agent.ts` | Lógica principal del bot | ⚠️ Con cuidado |
| `src/evolutionAdapter.ts` | Cliente REST para EvolutionAPI | ❌ No tocar |
| `docker-compose.yml` | Stack de infraestructura | ⚠️ Solo variables |

## Pasos de Adaptación para un Nuevo Cliente

### Paso 1 — Clonar template base
```bash
cp -r templates/{{template_id}} clients/{{lead_id}}/agent/
```

### Paso 2 — Personalizar configuración
Abrir `config/template.json` y reemplazar:
- `{{company}}` → Nombre de la empresa del cliente
- `{{sector}}` → Sector del cliente
- `{{welcomeMessage}}` → Mensaje personalizado según sector
- `{{businessHours}}` → Horario del cliente

### Paso 3 — Generar Knowledge Base
Crear `knowledge/base-knowledge.json` con la información del formulario:
```json
{
  "company": "...",
  "sector": "...",
  "painPoints": { ... },
  "tools": [ ... ],
  "customInstructions": "..."
}
```

### Paso 4 — Validación
Ejecutar estas comprobaciones antes de marcar como "listo":
- [ ] `config/template.json` existe y es JSON válido
- [ ] Todos los `{{placeholders}}` han sido reemplazados
- [ ] `knowledge/base-knowledge.json` existe
- [ ] (Si WhatsApp) Docker containers arrancan sin errores
- [ ] Mensaje de prueba enviado y recibido correctamente

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `ECONNREFUSED :8080` | EvolutionAPI no está corriendo | `docker compose up -d` |
| `401 Unauthorized` | API key incorrecta | Verificar EVOLUTION_API_KEY en .env y docker-compose |
| Mensajes duplicados | Falta filtro `fromMe` | Verificar que `webhookServer.ts` ignora `fromMe: true` |
| QR no aparece | Instancia ya conectada | `DELETE /instance/logout/{instance}` y reconectar |

## Prompts de Referencia para el Agente IA

Si el agente necesita generar respuestas para este bot, debe usar este system prompt:

```
Eres el asistente virtual de {{company}}, una empresa del sector {{sector}}.
Tu objetivo es ayudar a los clientes respondiendo preguntas, agendando citas,
y derivando a un humano cuando no puedas resolver algo.
Responde siempre en español, de forma profesional pero cercana.
No inventes información que no esté en tu base de conocimiento.
```
```

### 4.4 Skills a Crear (uno por template)

| Template | Archivo Skill | Estado |
|----------|--------------|--------|
| `01-whatsapp-agent` | `templates/01-whatsapp-agent/SKILL.md` | **Crear** — Skill más crítico, prioridad 1 |
| `02-voice-agent` | `templates/02-voice-agent/SKILL.md` | **Crear** — Integración Retell + Twilio |
| `03-text-processor` | `templates/03-text-processor/SKILL.md` | **Crear** — Gmail/Outlook APIs |
| `04-calendar-manager` | `templates/04-calendar-manager/SKILL.md` | **Crear** — Google Calendar/Cal.com |
| `05-data-analytics` | `templates/05-data-analytics/SKILL.md` | **Crear** — Sheets/Supabase/HubSpot |

Sonnet debe crear los 5 SKILL.md siguiendo la estructura de la sección 4.3, adaptando el contenido del frontmatter y los pasos de adaptación a las particularidades de cada template (ver archivos `config/template.json` de cada uno).

### 4.5 Integración con el Pipeline Orchestrator

El `pipeline/orchestrator.ts` debe leer el SKILL.md del template asignado para saber qué pasos ejecutar. Añadir esta lógica al paso de adaptación:

```typescript
// En pipeline/orchestrator.ts, dentro del paso "adaptConfiguration":
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml'; // npm install yaml

function loadSkillConfig(templateId: string): SkillFrontmatter {
  const skillPath = `templates/${templateId}/SKILL.md`;
  const content = readFileSync(skillPath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) throw new Error(`No frontmatter in ${skillPath}`);
  return parseYaml(frontmatterMatch[1]);
}

// Uso:
const skill = loadSkillConfig('01-whatsapp-agent');
console.log(skill.env_vars);     // Saber qué variables configurar
console.log(skill.requires);     // Saber qué instalar
console.log(skill.ports);        // Saber qué puertos abrir
```

### 4.6 Criterios de Validación

- [ ] Los 5 archivos SKILL.md existen y tienen frontmatter YAML válido.
- [ ] Cada SKILL.md tiene las secciones: Propósito, Arquitectura, Archivos Clave, Pasos de Adaptación, Validación, Errores Comunes.
- [ ] `parseYaml(frontmatter)` no lanza error para ningún SKILL.md.
- [ ] El orchestrator puede cargar y leer el frontmatter correctamente.

---

<a id="fase-5"></a>
## FASE 5 — Sincronización al Servidor Remoto vía MCP

### 5.1 Objetivo

Transferir todo el código backend desde la máquina local al servidor de producción remoto, usando el Model Context Protocol (MCP) como puente. La idea es que hay una instancia de Claude Code corriendo en el servidor remoto, y el agente local se comunica con ella a través de un servidor MCP para ejecutar comandos, transferir archivos y levantar servicios.

### 5.2 ¿Qué es MCP en este Contexto?

El Model Context Protocol permite que un agente de IA (Claude Code local) se conecte a "servidores MCP" que exponen herramientas (tools) ejecutables. En nuestro caso:

- **Cliente MCP:** Claude Code en tu laptop local.
- **Servidor MCP:** Un proceso corriendo en tu servidor remoto que expone herramientas como `run_command`, `write_file`, `read_file`.
- **Transporte:** SSH tunnel o conexión directa HTTP/SSE al servidor.

Esto permite que el agente local "controle" el servidor remoto sin que tú tengas que copiar archivos manualmente por SCP.

### 5.3 Opción A — MCP Server Remoto vía SSH (Recomendada)

Esta es la forma más sencilla y segura. Claude Code puede conectarse a un servidor MCP que corre comandos a través de SSH.

**Paso 1 — Configurar acceso SSH sin contraseña al servidor:**

```bash
# En tu laptop local
ssh-keygen -t ed25519 -C "tusocia-deploy" -f ~/.ssh/tusocia_deploy
ssh-copy-id -i ~/.ssh/tusocia_deploy.pub usuario@IP_SERVIDOR

# Verificar que funciona sin pedir contraseña
ssh -i ~/.ssh/tusocia_deploy usuario@IP_SERVIDOR "echo ok"
```

**Paso 2 — Instalar Claude Code en el servidor remoto:**

```bash
# Conectar al servidor
ssh -i ~/.ssh/tusocia_deploy usuario@IP_SERVIDOR

# Instalar Node.js 22 (si no está)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22

# Instalar Claude Code globalmente
npm install -g @anthropic-ai/claude-code

# Verificar
claude --version
```

**Paso 3 — Crear un servidor MCP custom en el servidor remoto:**

Crear el archivo `/opt/tusocia/mcp-server/index.ts` en el servidor:

```typescript
// /opt/tusocia/mcp-server/index.ts
// Servidor MCP que expone herramientas de deployment para el agente local

import { McpServer } from '@anthropic-ai/mcp';
import { execSync, exec } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const PROJECT_ROOT = '/opt/tusocia/app';

const server = new McpServer({
  name: 'tusocia-deploy-server',
  version: '1.0.0',
});

// Tool 1: Ejecutar comando en el servidor
server.tool('run_command', {
  description: 'Ejecuta un comando shell en el servidor de producción',
  parameters: {
    command: { type: 'string', description: 'Comando a ejecutar' },
    cwd: { type: 'string', description: 'Directorio de trabajo (default: /opt/tusocia/app)', optional: true },
  },
  handler: async ({ command, cwd }) => {
    const workDir = cwd || PROJECT_ROOT;
    try {
      const output = execSync(command, {
        cwd: workDir,
        timeout: 60000,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });
      return { success: true, output };
    } catch (error: any) {
      return { success: false, error: error.message, stderr: error.stderr };
    }
  },
});

// Tool 2: Escribir archivo en el servidor
server.tool('write_file', {
  description: 'Escribe un archivo en el servidor de producción',
  parameters: {
    path: { type: 'string', description: 'Ruta relativa al proyecto (ej: server/index.ts)' },
    content: { type: 'string', description: 'Contenido del archivo' },
  },
  handler: async ({ path: filePath, content }) => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const dir = path.dirname(fullPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content, 'utf-8');
    return { success: true, path: fullPath, bytes: content.length };
  },
});

// Tool 3: Leer archivo del servidor
server.tool('read_file', {
  description: 'Lee un archivo del servidor de producción',
  parameters: {
    path: { type: 'string', description: 'Ruta relativa al proyecto' },
  },
  handler: async ({ path: filePath }) => {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const content = readFileSync(fullPath, 'utf-8');
    return { success: true, content };
  },
});

// Tool 4: Status de PM2
server.tool('pm2_status', {
  description: 'Obtiene el estado de todos los procesos PM2',
  parameters: {},
  handler: async () => {
    const output = execSync('pm2 jlist', { encoding: 'utf-8' });
    return { success: true, processes: JSON.parse(output) };
  },
});

// Tool 5: Deploy completo
server.tool('full_deploy', {
  description: 'Ejecuta el script de deployment completo: git pull, install, build, restart',
  parameters: {
    branch: { type: 'string', description: 'Rama a desplegar (default: main)', optional: true },
  },
  handler: async ({ branch }) => {
    const b = branch || 'main';
    const steps = [
      `git fetch origin && git checkout ${b} && git pull origin ${b}`,
      'npm install',
      'cd server && npm install',
      'npm run build',
      'pm2 restart ecosystem.config.cjs --update-env',
      'pm2 save',
    ];
    const results = [];
    for (const step of steps) {
      try {
        const output = execSync(step, { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 120000 });
        results.push({ step, success: true, output: output.substring(0, 500) });
      } catch (error: any) {
        results.push({ step, success: false, error: error.message });
        break; // Parar si un paso falla
      }
    }
    return { results };
  },
});

// Iniciar servidor MCP en modo stdio (para SSH) o SSE (para HTTP)
server.start({ transport: 'stdio' });
```

**Paso 4 — Configurar el servidor MCP para que corra como servicio:**

```bash
# En el servidor remoto
cd /opt/tusocia/mcp-server
npm init -y
npm install @anthropic-ai/mcp typescript tsx

# Probar que funciona
npx tsx index.ts
# (debería quedarse escuchando en stdio)
```

**Paso 5 — Configurar Claude Code LOCAL para conectarse al MCP remoto:**

En tu laptop, editar la configuración de Claude Code para añadir el servidor MCP remoto. Crear/editar `~/.claude/claude_desktop_config.json` (o el archivo de config de Claude Code):

```json
{
  "mcpServers": {
    "tusocia-production": {
      "command": "ssh",
      "args": [
        "-i", "~/.ssh/tusocia_deploy",
        "usuario@IP_SERVIDOR",
        "cd /opt/tusocia/mcp-server && npx tsx index.ts"
      ],
      "description": "Servidor de producción Tu Socia! — ejecuta comandos y transfiere archivos"
    }
  }
}
```

Así, cuando Claude Code local quiera usar las tools `run_command`, `write_file`, etc., las ejecutará en el servidor remoto a través de SSH.

### 5.4 Opción B — Transferencia Directa por Git + Deploy Hook (Alternativa Simple)

Si MCP resulta complejo de configurar inicialmente, esta alternativa funciona igual de bien:

```bash
# 1. En el servidor remoto, clonar el repo
ssh usuario@IP_SERVIDOR
cd /opt/tusocia
git clone https://github.com/ASanchez144/Colleague-AI.git app
cd app

# 2. Configurar .env de producción
cp server/.env.production server/.env
nano server/.env   # Rellenar todas las variables

# 3. Ejecutar setup
bash scripts/setup-server.sh

# 4. Configurar Git hook para auto-deploy
cat > .git/hooks/post-merge << 'EOF'
#!/bin/bash
echo "🔄 Deploying Tu Socia!..."
npm install
cd server && npm install && cd ..
npm run build
pm2 restart ecosystem.config.cjs --update-env
pm2 save
echo "✅ Deploy completo"
EOF
chmod +x .git/hooks/post-merge

# 5. Para deployar desde local, solo hacer push:
#    git push origin main
#    ssh usuario@IP "cd /opt/tusocia/app && git pull"
```

### 5.5 Procedimiento Completo de Primer Despliegue

Este es el paso a paso que Sonnet debe ejecutar **en orden**:

```
SERVIDOR REMOTO (vía SSH o MCP tools):

1.  mkdir -p /opt/tusocia/app
2.  cd /opt/tusocia/app
3.  git clone https://github.com/ASanchez144/Colleague-AI.git .
4.  cp server/.env.production server/.env
5.  Editar server/.env con valores reales (Resend API key, etc.)
6.  bash scripts/setup-server.sh
    → Instala PM2, tsx, dependencias, build frontend, lanza procesos
7.  cd templates/01-whatsapp-agent
8.  docker compose up -d
    → Levanta EvolutionAPI + Postgres + Redis
9.  cd /opt/tusocia/app
10. Configurar reverse proxy (Nginx o Caddy):

    # /etc/caddy/Caddyfile (opción más simple)
    tusocia.es {
        handle /api/* {
            reverse_proxy localhost:3001
        }
        handle /webhook/* {
            reverse_proxy localhost:3002
        }
        handle {
            reverse_proxy localhost:3000
        }
    }
    
    # Reiniciar Caddy
    sudo systemctl restart caddy

11. Verificar endpoints:
    curl https://tusocia.es/api/health
    curl https://tusocia.es/webhook/whatsapp/health
    
12. pm2 startup && pm2 save
    → Persistir procesos tras reinicio
```

### 5.6 Configuración de Red y Puertos

| Puerto | Servicio | Expuesto público | Notas |
|--------|----------|-------------------|-------|
| 3000 | Frontend (Vite preview) | Sí (vía reverse proxy) | Solo si no usas Vercel |
| 3001 | Backend Express | Sí (vía reverse proxy en `/api`) | Webhook del formulario |
| 3002 | WhatsApp webhook server | Sí (vía reverse proxy en `/webhook`) | Callbacks de EvolutionAPI |
| 8080 | EvolutionAPI | **NO** — solo local | Docker internal |
| 5432 | PostgreSQL | **NO** — solo Docker network | Para EvolutionAPI |
| 6379 | Redis | **NO** — solo Docker network | Para EvolutionAPI |

Firewall recomendado:

```bash
sudo ufw allow 22/tcp       # SSH
sudo ufw allow 80/tcp       # HTTP (redirect a HTTPS)
sudo ufw allow 443/tcp      # HTTPS
sudo ufw enable
```

### 5.7 Criterios de Validación

- [ ] SSH sin contraseña funciona desde laptop al servidor.
- [ ] El servidor MCP arranca y responde a tool calls (o alternativamente, git pull + deploy hook funciona).
- [ ] `pm2 status` en el servidor muestra `tusocia-server` y `tusocia-frontend` en estado `online`.
- [ ] `docker compose ps` muestra los 3 contenedores de WhatsApp `running`.
- [ ] `curl https://tusocia.es/api/health` devuelve `200 OK`.
- [ ] El reverse proxy (Caddy/Nginx) enruta correctamente `/api`, `/webhook`, y `/`.
- [ ] Un lead enviado desde la landing de Vercel llega al backend del servidor.

---

<a id="anexo-a"></a>
## ANEXO A — Variables de Entorno Consolidadas

### Archivo: `server/.env` (completo)

```bash
# ============================================
# TU SOCIA! — Variables de Entorno
# ============================================

# --- Servidor Express ---
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# --- Email (Resend) ---
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=hola@tusocia.es
ADMIN_EMAIL=arturoeldeteruel@gmail.com

# --- Frontend / CORS ---
FRONTEND_URL=https://tusocia.es

# --- Seguridad ---
WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# --- Rutas de datos ---
TEMPLATES_DIR=../templates
CLIENTS_DIR=../clients

# --- EvolutionAPI (WhatsApp) ---
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EVOLUTION_INSTANCE_NAME=tu-socia
WEBHOOK_CALLBACK_URL=https://tusocia.es/webhook/whatsapp
WHATSAPP_PORT=3002

# --- Bot Defaults ---
COMPANY_NAME=Tu Socia!
WELCOME_MESSAGE=¡Hola! Soy la asistente virtual de {{company}}. ¿En qué puedo ayudarte hoy?
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=20:00
BUSINESS_HOURS_TIMEZONE=Europe/Madrid
OUT_OF_HOURS_MESSAGE=Gracias por escribirnos. Nuestro horario es de 9:00 a 20:00. Te responderemos a primera hora.

# --- Firebase (si se usa auth en backend) ---
# FIREBASE_PROJECT_ID=tu-proyecto
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### Archivo: `.env` (raíz, para Vite/frontend)

```bash
VITE_API_URL=https://tusocia.es
VITE_FIREBASE_API_KEY=AIzaXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
```

---

<a id="anexo-b"></a>
## ANEXO B — Diagrama de Arquitectura Final

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                 │
└──────────────┬──────────────────────┬───────────────────────────┘
               │                      │
               ▼                      ▼
    ┌──────────────────┐   ┌─────────────────────┐
    │  VERCEL (CDN)    │   │  SERVIDOR REMOTO     │
    │                  │   │  (VPS / Dedicado)    │
    │  Landing Page    │   │                      │
    │  React SPA       │   │  ┌────────────────┐  │
    │  "Tu Socia!"     │───┼─▶│ Caddy/Nginx    │  │
    │                  │   │  │ (Reverse Proxy) │  │
    └──────────────────┘   │  └───┬────┬────┬──┘  │
                           │      │    │    │      │
                           │      ▼    ▼    ▼      │
                           │  ┌──┐ ┌──┐ ┌──────┐  │
                           │  │FE│ │BE│ │WA WH │  │
                           │  │  │ │  │ │      │  │
                           │  │:3│ │:3│ │ :3   │  │
                           │  │00│ │00│ │ 002  │  │
                           │  │0 │ │1 │ │      │  │
                           │  └──┘ └┬─┘ └──┬───┘  │
                           │        │      │       │
                           │        ▼      ▼       │
                           │  ┌────────────────┐   │
                           │  │ EvolutionAPI   │   │
                           │  │ (Docker :8080) │   │
                           │  │ + Postgres     │   │
                           │  │ + Redis        │   │
                           │  └────────────────┘   │
                           │                       │
                           │  ┌────────────────┐   │
                           │  │ PM2 (gestor)   │   │
                           │  │ tusocia-server │   │
                           │  │ tusocia-front  │   │
                           │  └────────────────┘   │
                           │                       │
                           │  ┌────────────────┐   │
                           │  │ MCP Server     │   │
                           │  │ (deploy tools) │◀──┼─── Claude Code Local (SSH)
                           │  └────────────────┘   │
                           └───────────────────────┘

FLUJO DEL LEAD:
  1. Cliente llena formulario en Vercel (tusocia.es)
  2. POST → /api/webhook/lead → Express (:3001)
  3. routingEngine asigna template (1 de 5)
  4. emailService envía bienvenida (Resend)
  5. orchestrator clona template + adapta config
  6. Si WhatsApp → conecta con EvolutionAPI
  7. Bot activo y respondiendo mensajes
```

---

<a id="anexo-c"></a>
## ANEXO C — Checklist de Validación Post-Despliegue

### Frontend (Vercel)
- [ ] Landing page carga sin errores en consola
- [ ] Formulario envía POST al backend remoto correctamente
- [ ] Todas las referencias dicen "Tu Socia!" (no "Colleague AI")
- [ ] SEO meta tags actualizados
- [ ] Paleta de colores violeta/rosa aplicada
- [ ] React Router funciona (rutas como `/dashboardroot` no dan 404)

### Backend (Servidor Remoto)
- [ ] `curl https://tusocia.es/api/health` → 200 OK
- [ ] Webhook procesa leads y los guarda en `clients/`
- [ ] Email de bienvenida se envía al lead
- [ ] Email de notificación llega al admin
- [ ] Routing engine asigna template correcto
- [ ] Logs se escriben en `logs/`

### WhatsApp (EvolutionAPI)
- [ ] 3 contenedores Docker corriendo
- [ ] Instancia creada y QR escaneado
- [ ] `connectionState` = `"open"`
- [ ] Mensajes entrantes llegan al webhook
- [ ] Bot responde automáticamente
- [ ] Mensajes fuera de horario muestran mensaje correcto

### Infraestructura
- [ ] PM2 procesos online y con auto-restart
- [ ] `pm2 startup` configurado (sobrevive reboot)
- [ ] Firewall activo (solo 22, 80, 443)
- [ ] SSL/TLS activo vía Caddy/Let's Encrypt
- [ ] Backups de `clients/` configurados

### MCP / Deploy
- [ ] SSH sin contraseña funcional
- [ ] MCP server accesible desde Claude Code local (o git deploy hook funcional)
- [ ] Un ciclo completo: push → deploy → verificar funciona

---

*Documento generado el 16 de abril de 2026. Este plan es el contrato de trabajo para el agente Sonnet. Cada fase debe completarse en orden y validarse con su checklist antes de pasar a la siguiente.*
