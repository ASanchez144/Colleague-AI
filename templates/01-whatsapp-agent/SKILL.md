---
name: "whatsapp-agent"
description: "Despliega un bot de atención al cliente en WhatsApp usando EvolutionAPI (self-hosted, sin aprobación Meta). Responde mensajes, gestiona horarios y escala a humanos. Usar cuando el cliente pide WhatsApp, chat, mensajes automáticos o atención al cliente."
version: "1.0.0"
template_id: "01-whatsapp-agent"
category: "messaging"
triggers:
  - "whatsapp"
  - "chat"
  - "mensajes automáticos"
  - "atención al cliente"
  - "bot de whatsapp"
  - "responder mensajes"
  - "asistente de mensajería"
  - "chatbot"
  - "whatsapp business"
  - "automated messaging"
requires:
  - "docker >= 24"
  - "docker compose >= 2"
  - "node >= 18"
  - "ngrok (solo en desarrollo/local)"
env_vars:
  - name: "EVOLUTION_API_KEY"
    required: true
    description: "Clave secreta para autenticarse con EvolutionAPI. Debe coincidir exactamente con la variable AUTHENTICATION_API_KEY del docker-compose.yml."
    where: "server/.env"
  - name: "EVOLUTION_API_URL"
    required: true
    description: "URL base donde corre EvolutionAPI. En local: http://localhost:8080. En producción: http://localhost:8080 (nunca exponer públicamente)."
    where: "server/.env"
  - name: "EVOLUTION_INSTANCE_NAME"
    required: true
    description: "Nombre de la instancia de WhatsApp en Evolution. Slug sin espacios ni tildes. Ejemplo: 'tu-socia' o 'cliente-inmobiliaria'."
    where: "server/.env"
  - name: "WEBHOOK_CALLBACK_URL"
    required: true
    description: "URL pública donde EvolutionAPI enviará los mensajes entrantes. En dev: URL de ngrok. En prod: https://tusocia.es/webhook/whatsapp."
    where: "server/.env"
  - name: "WHATSAPP_PORT"
    required: false
    description: "Puerto del servidor webhook de WhatsApp. Default: 3002."
    where: "server/.env"
  - name: "COMPANY_NAME"
    required: true
    description: "Nombre de la empresa del cliente. Reemplaza {{company}} en los mensajes."
    where: "server/.env"
  - name: "WELCOME_MESSAGE"
    required: true
    description: "Mensaje enviado al primer contacto. Puede incluir {{company}} como placeholder."
    where: "server/.env"
  - name: "BUSINESS_HOURS_START"
    required: true
    description: "Hora de inicio de atención en formato HH:MM. Ejemplo: 09:00."
    where: "server/.env"
  - name: "BUSINESS_HOURS_END"
    required: true
    description: "Hora de cierre de atención en formato HH:MM. Ejemplo: 20:00."
    where: "server/.env"
  - name: "BUSINESS_HOURS_TIMEZONE"
    required: true
    description: "Zona horaria del cliente. Ejemplo: Europe/Madrid, America/Mexico_City."
    where: "server/.env"
  - name: "OUT_OF_HOURS_MESSAGE"
    required: true
    description: "Respuesta automática fuera del horario de atención."
    where: "server/.env"
ports:
  - port: 8080
    service: "EvolutionAPI"
    expose: false
    notes: "Solo accesible internamente. Nunca exponer al público."
  - port: 3002
    service: "Webhook server WhatsApp"
    expose: true
    notes: "Recibe callbacks de EvolutionAPI. Debe ser accesible desde internet (vía reverse proxy o ngrok)."
  - port: 5432
    service: "PostgreSQL (EvolutionAPI)"
    expose: false
    notes: "Solo red interna de Docker."
  - port: 6379
    service: "Redis (EvolutionAPI)"
    expose: false
    notes: "Solo red interna de Docker."
estimated_setup_time: "20 minutos"
difficulty: "intermedia"
author: "Tu Socia! — Agencia de IA"
last_updated: "2026-04-17"
---

# whatsapp-agent — Manual de Replicación de Bot de WhatsApp

## 1. Objetivos del Skill

Este skill permite a un agente de IA (presente o futuro) desplegar un bot de WhatsApp completamente funcional para un nuevo cliente de Tu Socia!, sin intervención humana.

Al completar este skill, el agente habrá:

- Levantado el stack de infraestructura (EvolutionAPI + PostgreSQL + Redis) con Docker.
- Creado y vinculado una instancia de WhatsApp escaneando un QR.
- Personalizado los mensajes, horarios y base de conocimiento para el cliente específico.
- Activado el servidor webhook que recibe y procesa mensajes en tiempo real.
- Validado el ciclo completo: mensaje entrante → respuesta automática → log guardado.

**Para quién es este bot:** Cualquier empresa B2B o B2C que quiera automatizar la atención al cliente en WhatsApp sin pagar la API oficial de Meta y sin esperar aprobación de cuenta Business verificada.

**Qué problema resuelve:** Elimina el tiempo muerto entre que un cliente escribe y recibe respuesta, filtra consultas frecuentes antes de llegar a un humano, y mantiene un historial de conversaciones organizado.

---

## 2. Arquitectura del Bot

```
[Teléfono del cliente]
        │
        │  (mensaje WhatsApp)
        ▼
[Servidores de WhatsApp / Meta]
        │
        │  (sincronización vía protocolo Baileys/WebSocket)
        ▼
[EvolutionAPI — Docker :8080]
        │
        │  POST webhook con payload JSON del mensaje
        ▼
[Servidor Express — :3002 → /webhook/whatsapp]
        │
        ├─► [Filtro fromMe] — ignora mensajes enviados por el bot
        ├─► [Verificación horario] — si fuera de horario, respuesta automática
        ├─► [Knowledge Base] — busca respuesta en preguntas frecuentes
        └─► [IA generativa] — genera respuesta contextual si no hay match en KB
        │
        │  POST /message/sendText/{instance}
        ▼
[EvolutionAPI — Docker :8080]
        │
        │  (envío vía Baileys)
        ▼
[Teléfono del cliente recibe la respuesta]
```

---

## 3. Archivos Clave

| Archivo | Propósito | ¿El agente puede editarlo? |
|---------|-----------|---------------------------|
| `config/template.json` | Configuración del bot: mensajes, horarios, campos adaptables | ✅ Sí — es el archivo principal de personalización |
| `src/agent.ts` | Lógica del bot: gestión de conversaciones, KB, horarios | ⚠️ Con cuidado — solo añadir, no eliminar funciones existentes |
| `src/evolutionAdapter.ts` | Cliente REST que habla con EvolutionAPI | ❌ No tocar — es infraestructura estable |
| `src/webhookServer.ts` | Servidor Express que recibe callbacks de EvolutionAPI | ⚠️ Solo modificar el procesamiento del mensaje, no la estructura |
| `docker-compose.yml` | Stack Docker: EvolutionAPI + Postgres + Redis | ⚠️ Solo cambiar variables de entorno y nombres de container |
| `knowledge/base-knowledge.json` | Preguntas frecuentes del cliente (se crea nuevo por cliente) | ✅ Sí — se genera desde cero para cada cliente |

---

## 4. Pasos de Adaptación para un Nuevo Cliente

### Paso 0 — Pre-requisitos del sistema

Antes de empezar, verificar que el sistema tiene:

```bash
docker --version        # >= 24.0
docker compose version  # >= 2.0
node --version          # >= 18.0
ngrok --version         # Solo si es entorno de desarrollo/local
```

**Criterio de éxito:** Los cuatro comandos devuelven versión sin error.

**Notas de ejecución:**
- Si Docker no está instalado: `curl -fsSL https://get.docker.com | sh` (Linux) o descargar Docker Desktop (Mac/Windows).
- Si ngrok no está: `brew install ngrok` (Mac) o seguir https://ngrok.com/download.
- En producción, ngrok NO es necesario; se usa el dominio real del servidor.

---

### Paso 1 — Clonar el template para el nuevo cliente

Crear una copia del template en la carpeta del cliente, para no modificar el template original:

```bash
# Estructura destino: clients/{lead_id}/agent/
cp -r templates/01-whatsapp-agent clients/{LEAD_ID}/agent

# Ejemplo real:
cp -r templates/01-whatsapp-agent clients/a1b2c3d4-xxxx/agent
```

**Criterio de éxito:** La carpeta `clients/{LEAD_ID}/agent/` existe y contiene `src/`, `config/`, `docker-compose.yml`.

**Notas de ejecución:**
- `{LEAD_ID}` es el UUID generado por el pipeline al recibir el formulario (campo `id` en `leads-registry.json`).
- Nunca trabajes sobre `templates/01-whatsapp-agent/` directamente; siempre sobre la copia en `clients/`.

---

### Paso 2 — Personalizar `config/template.json`

Abrir `clients/{LEAD_ID}/agent/config/template.json` y reemplazar todos los valores con los datos del cliente obtenidos del lead:

```json
{
  "id": "01-whatsapp-agent",
  "name": "Agente WhatsApp — {NOMBRE_EMPRESA}",
  "defaultConfig": {
    "welcomeMessage": "¡Hola! Soy la asistente virtual de {NOMBRE_EMPRESA}. ¿En qué puedo ayudarte hoy?",
    "outOfHoursMessage": "Gracias por escribirnos. Nuestro horario es de {HORA_INICIO} a {HORA_FIN}. Te responderemos a primera hora.",
    "businessHours": {
      "start": "{HORA_INICIO}",
      "end": "{HORA_FIN}",
      "timezone": "{TIMEZONE}"
    }
  }
}
```

**Placeholders a reemplazar:**

| Placeholder | Fuente | Ejemplo |
|------------|--------|---------|
| `{NOMBRE_EMPRESA}` | Campo `company` del formulario | `Inmobiliaria García` |
| `{HORA_INICIO}` | Campo `businessHours.start` del formulario o default `09:00` | `09:00` |
| `{HORA_FIN}` | Campo `businessHours.end` del formulario o default `20:00` | `20:00` |
| `{TIMEZONE}` | País del cliente → `Europe/Madrid` (ES), `America/Mexico_City` (MX) | `Europe/Madrid` |

**Criterio de éxito:** `JSON.parse(fs.readFileSync('config/template.json', 'utf-8'))` no lanza error. Ningún campo contiene `{` o `}` sin reemplazar.

**Notas de ejecución:**
- Verificar con: `node -e "JSON.parse(require('fs').readFileSync('config/template.json','utf-8')); console.log('OK')"`
- Si el cliente no especificó horario, usar el default `09:00 – 20:00 Europe/Madrid`.

---

### Paso 3 — Crear la Base de Conocimiento del cliente

Crear el archivo `clients/{LEAD_ID}/agent/knowledge/base-knowledge.json` con las preguntas frecuentes del sector del cliente:

```json
{
  "company": "{NOMBRE_EMPRESA}",
  "sector": "{SECTOR}",
  "language": "es",
  "entries": [
    {
      "id": "kb-001",
      "question": "¿Cuál es el horario de atención?",
      "answer": "Nuestro horario es de {HORA_INICIO} a {HORA_FIN}, de lunes a viernes.",
      "keywords": ["horario", "hora", "abierto", "atención", "cuándo"]
    },
    {
      "id": "kb-002",
      "question": "¿Cómo puedo contactar con un agente humano?",
      "answer": "Puedo transferirte con uno de nuestros agentes. Escribe 'hablar con persona' y te atenderemos enseguida.",
      "keywords": ["persona", "humano", "agente", "hablar", "llamar"]
    },
    {
      "id": "kb-003",
      "question": "¿Cómo puedo obtener más información?",
      "answer": "Puedo ayudarte con información sobre {NOMBRE_EMPRESA}. ¿Qué necesitas saber?",
      "keywords": ["información", "info", "más", "saber", "qué"]
    }
  ],
  "escalationKeywords": ["urgente", "queja", "problema", "reclamación", "mal servicio"],
  "fallbackMessage": "No tengo información específica sobre eso. Voy a transferirte con un compañero de {NOMBRE_EMPRESA}."
}
```

**Criterio de éxito:** El archivo existe, es JSON válido, tiene al menos 3 entradas en `entries`, y todos los placeholders están reemplazados.

**Notas de ejecución:**
- Para sectores específicos (inmobiliaria, clínica, restaurante), generar entradas KB relevantes al sector: horarios de visita, tipos de servicio, precios base, zonas de cobertura, etc.
- El campo `keywords` es crítico: son las palabras que activan esta entrada. Poner sinónimos y variaciones ortográficas.
- Guardar la KB también en las variables de entorno del bot si `agent.ts` la carga desde `.env`.

---

### Paso 4 — Configurar variables de entorno del bot

Crear `clients/{LEAD_ID}/agent/.env` copiando desde `server/.env.example` y rellenando:

```bash
# === EVOLUTION API ===
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY={CLAVE_SECRETA}          # Misma que en docker-compose.yml
EVOLUTION_INSTANCE_NAME={SLUG_CLIENTE}     # Ejemplo: inmobiliaria-garcia

# === WEBHOOK ===
WEBHOOK_CALLBACK_URL={URL_PUBLICA}/webhook/whatsapp
WHATSAPP_PORT=3002

# === BOT CONFIG ===
COMPANY_NAME={NOMBRE_EMPRESA}
WELCOME_MESSAGE=¡Hola! Soy la asistente virtual de {{company}}. ¿En qué puedo ayudarte hoy?
BUSINESS_HOURS_START={HORA_INICIO}
BUSINESS_HOURS_END={HORA_FIN}
BUSINESS_HOURS_TIMEZONE={TIMEZONE}
OUT_OF_HOURS_MESSAGE=Gracias por escribirnos. Nuestro horario es de {HORA_INICIO} a {HORA_FIN}. Te responderemos a primera hora.
```

**Criterio de éxito:** El archivo `.env` existe, no tiene ningún `{PLACEHOLDER}` sin reemplazar (excepto `{{company}}` con dobles llaves que es un placeholder en runtime, no de configuración), y el fichero NO está commiteado al repositorio git.

**Notas de ejecución:**
- `{SLUG_CLIENTE}`: slug sin espacios del nombre de empresa. `Inmobiliaria García` → `inmobiliaria-garcia`.
- `{URL_PUBLICA}`: en desarrollo, la URL de ngrok (ej: `https://a1b2-3c4d.ngrok-free.app`). En producción, `https://tusocia.es`.
- Añadir `.env` a `.gitignore` si no está ya. Nunca commitear credenciales.
- `EVOLUTION_API_KEY` debe ser la misma cadena en `.env` y en `docker-compose.yml → AUTHENTICATION_API_KEY`.

---

### Paso 5 — Levantar el stack Docker (EvolutionAPI)

Desde la carpeta del agente del cliente:

```bash
cd clients/{LEAD_ID}/agent

# Exportar variables necesarias para docker-compose
export EVOLUTION_API_KEY={CLAVE_SECRETA}
export WEBHOOK_CALLBACK_URL={URL_PUBLICA}/webhook/whatsapp

# Levantar los 3 servicios en background
docker compose up -d

# Verificar que los 3 contenedores están running
docker compose ps
# Esperado: tusocia-evolution (Up), tusocia-postgres (Up), tusocia-redis (Up)

# Ver logs de arranque de EvolutionAPI
docker compose logs evolution-api --tail=30
# Buscar la línea: "Server is running on port 8080"
```

**Criterio de éxito:** `docker compose ps` muestra los 3 contenedores con estado `Up`. Los logs de `evolution-api` contienen `"Server is running on port 8080"` sin errores de conexión a base de datos.

**Notas de ejecución:**
- Si `tusocia-postgres` falla al arrancar por primera vez: esperar 10 segundos y hacer `docker compose restart evolution-api`. Postgres necesita inicializar su volumen antes de aceptar conexiones.
- Si el puerto 8080 ya está ocupado: cambiar `"8080:8080"` por `"8081:8080"` en `docker-compose.yml` y actualizar `EVOLUTION_API_URL=http://localhost:8081`.
- Para parar: `docker compose down`. Para parar y borrar datos: `docker compose down -v` (⚠️ elimina el historial de WhatsApp).

---

### Paso 6 — Crear la instancia de WhatsApp y vincular QR

```bash
# Paso 6a: Crear la instancia (equivale a "añadir dispositivo" en WhatsApp)
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: {CLAVE_SECRETA}" \
  -d '{
    "instanceName": "{SLUG_CLIENTE}",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true,
    "webhook": {
      "url": "{URL_PUBLICA}/webhook/whatsapp",
      "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
      "webhookByEvents": true
    }
  }'
# Respuesta esperada: { "instance": { "instanceName": "{SLUG_CLIENTE}", "status": "created" }, ... }

# Paso 6b: Obtener el QR para escanear
curl http://localhost:8080/instance/connect/{SLUG_CLIENTE} \
  -H "apikey: {CLAVE_SECRETA}"
# Respuesta: { "qrcode": { "base64": "data:image/png;base64,iVBOR..." } }
```

Para ver el QR visualmente, copiar el valor `base64` completo (incluido el prefijo `data:image/png;base64,`) y pegarlo en la barra de URL del navegador. Aparecerá la imagen del QR.

En el teléfono del cliente: WhatsApp → **⋮ Configuración → Dispositivos vinculados → Vincular dispositivo** → Escanear QR.

```bash
# Paso 6c: Verificar que la vinculación fue exitosa
curl http://localhost:8080/instance/connectionState/{SLUG_CLIENTE} \
  -H "apikey: {CLAVE_SECRETA}"
# Respuesta esperada: { "instance": { "state": "open" } }
```

**Criterio de éxito:** `connectionState` devuelve `"state": "open"`. El teléfono muestra el dispositivo vinculado en la lista de dispositivos de WhatsApp.

**Notas de ejecución:**
- El QR expira en ~20 segundos. Si expira, volver a llamar a `/instance/connect/{SLUG_CLIENTE}` para obtener un nuevo QR.
- Si `connectionState` devuelve `"close"` después de escanear: esperar 5 segundos y volver a consultar. La sincronización inicial puede tardar.
- Si la instancia ya existía de antes y da error `409 Conflict`: eliminarla con `DELETE /instance/delete/{SLUG_CLIENTE}` y volver a crear.
- El número de teléfono que escanea el QR se convierte en el número emisor del bot. Usar el número de WhatsApp Business del cliente.

---

### Paso 7 — Levantar el servidor webhook

```bash
cd clients/{LEAD_ID}/agent

# Instalar dependencias si es la primera vez
npm install

# Lanzar el webhook server (escucha en :3002)
npx tsx --watch src/webhookServer.ts

# O con pm2 para producción:
pm2 start "npx tsx src/webhookServer.ts" --name "bot-{SLUG_CLIENTE}" --cwd .
pm2 save
```

**Criterio de éxito:** El servidor arranca sin errores y queda escuchando. En los logs aparece algo como `"WhatsApp Webhook Server running on port 3002"` o similar.

**Notas de ejecución:**
- Si el puerto 3002 está ocupado: cambiar `WHATSAPP_PORT=3003` en `.env` y ajustar el reverse proxy.
- Para múltiples clientes simultáneos, cada bot necesita un puerto distinto: `3002`, `3003`, `3004`...
- En producción, usar pm2 con el nombre `"bot-{SLUG_CLIENTE}"` para poder gestionar cada bot independientemente.

---

### Paso 8 — Enviar mensaje de prueba y verificar ciclo completo

```bash
# Paso 8a: Enviar mensaje de prueba DESDE el bot al teléfono del cliente
curl -X POST http://localhost:8080/message/sendText/{SLUG_CLIENTE} \
  -H "Content-Type: application/json" \
  -H "apikey: {CLAVE_SECRETA}" \
  -d '{
    "number": "34{NUMERO_SIN_PREFIJO}",
    "text": "✅ Bot activo. Soy la asistente virtual de {NOMBRE_EMPRESA}. Sistema configurado correctamente."
  }'
# Respuesta esperada: { "key": { "id": "..." }, "status": "PENDING" }

# Paso 8b: Enviar un mensaje al bot desde el teléfono del cliente
# (Hacerlo manualmente desde WhatsApp)
# El webhook en :3002/webhook/whatsapp debería recibir el payload y responder automáticamente
```

**Criterio de éxito:** El mensaje de prueba llega al teléfono. Al escribir al bot, el webhook recibe el payload (visible en logs del servidor), el bot responde automáticamente con el mensaje de bienvenida, y el log de conversación se guarda en `logs/`.

**Notas de ejecución:**
- El número debe incluir código de país sin el `+`: España `34612345678`, México `521XXXXXXXXXX`.
- Si el bot no responde: verificar que `WEBHOOK_CALLBACK_URL` en `.env` y en la instancia de EvolutionAPI apuntan a la URL correcta (ngrok o dominio real).
- El filtro `fromMe: true` debe estar activo en `webhookServer.ts` para evitar que el bot responda a sus propios mensajes (bucle infinito).
- Verificar en logs del servidor que el payload llega: si no llega, el problema es la URL del webhook o que EvolutionAPI no puede acceder a ella (firewall, ngrok caído, etc.).

---

## 5. Validación Final del Skill

Antes de marcar el despliegue como **completado**, verificar todos los puntos de esta lista:

### Infraestructura Docker
- [ ] `docker compose ps` muestra 3 contenedores con estado `Up` (no `Exited` ni `Restarting`)
- [ ] `docker compose logs evolution-api --tail=10` no muestra errores de base de datos

### Instancia WhatsApp
- [ ] La instancia `{SLUG_CLIENTE}` existe en EvolutionAPI
- [ ] `GET /instance/connectionState/{SLUG_CLIENTE}` devuelve `"state": "open"`
- [ ] El teléfono del cliente muestra el dispositivo vinculado en WhatsApp → Dispositivos vinculados

### Servidor Webhook
- [ ] El webhook server corre en el puerto configurado (`3002` por defecto)
- [ ] La URL `{URL_PUBLICA}/webhook/whatsapp` es accesible desde internet (o desde el entorno de EvolutionAPI)

### Personalización
- [ ] `config/template.json` es JSON válido y no contiene ningún placeholder `{SIN_REEMPLAZAR}`
- [ ] `knowledge/base-knowledge.json` existe y tiene al menos 3 entradas relevantes al sector del cliente
- [ ] `.env` tiene todas las variables requeridas rellenas

### Ciclo completo de mensajes
- [ ] El bot envía mensajes al número del cliente correctamente (prueba del Paso 8a)
- [ ] Al recibir un mensaje, el webhook lo procesa y responde automáticamente (prueba del Paso 8b)
- [ ] Los mensajes fuera del horario de atención devuelven `OUT_OF_HOURS_MESSAGE`
- [ ] El historial de conversación se guarda en `logs/`

---

## 6. Errores Comunes y Soluciones

| Error | Causa más probable | Solución |
|-------|-------------------|----------|
| `ECONNREFUSED http://localhost:8080` | EvolutionAPI no está corriendo | `docker compose up -d && docker compose ps` |
| `401 Unauthorized` al llamar a EvolutionAPI | `EVOLUTION_API_KEY` no coincide | Verificar que el valor en `.env` es exactamente igual al de `AUTHENTICATION_API_KEY` en `docker-compose.yml` |
| QR no aparece o da error 404 | La instancia no existe o fue creada con error | `DELETE /instance/delete/{SLUG_CLIENTE}` y recrear desde el Paso 6a |
| `connectionState` devuelve `"close"` justo después de escanear | Sincronización aún en curso | Esperar 10 segundos y volver a consultar. Si sigue: desconectar y escanear de nuevo. |
| Bot responde sus propios mensajes (bucle infinito) | Falta el filtro `fromMe: true` en `webhookServer.ts` | Añadir `if (data.key.fromMe) return;` al inicio del handler del webhook |
| Mensajes duplicados que llegan dos veces | Sin deduplicación por `messageId` | Mantener un `Set<string>` de IDs procesados en `webhookServer.ts` |
| Webhook no recibe nada | URL de callback incorrecta o inaccesible | Verificar que `WEBHOOK_CALLBACK_URL` apunta a la URL correcta y que está accesible con `curl {URL_PUBLICA}/webhook/whatsapp/health` |
| `409 Conflict` al crear instancia | Ya existe una instancia con ese nombre | Reutilizarla (si sigue activa) o borrarla: `DELETE /instance/delete/{SLUG_CLIENTE}` |
| Docker: `port already in use` | Puerto 8080 ocupado por otro proceso | Cambiar el mapeo en `docker-compose.yml`: `"8081:8080"` y actualizar `EVOLUTION_API_URL` |

---

## 7. System Prompt para el Agente IA

Cuando el bot necesite generar respuestas contextuales (no cubiertas por la Knowledge Base), usar este system prompt en la llamada a la IA:

```
Eres la asistente virtual de {{company}}, una empresa del sector {{sector}}.
Tu misión es atender a los clientes de forma rápida, profesional y amable vía WhatsApp.

REGLAS:
1. Responde siempre en español, de forma natural y cercana (no robótica).
2. Sé breve: los mensajes de WhatsApp deben tener menos de 3 párrafos cortos.
3. No inventes información que no esté en tu base de conocimiento.
4. Si no sabes la respuesta, di honestamente que vas a consultar y que responderás pronto.
5. Si el cliente parece enfadado o tiene una queja seria, ofrece pasarle con un agente humano.
6. No uses asteriscos ni markdown — WhatsApp renderiza texto plano.
7. Nunca menciones que eres una IA a menos que te lo pregunten directamente.

CONTEXTO DE LA EMPRESA:
{{company_context}}

HISTORIAL DE LA CONVERSACIÓN:
{{conversation_history}}
```

---

## 8. Frases de Activación del Skill

Este skill debe activarse automáticamente cuando el routing engine o un agente detecte alguna de estas señales en el formulario del cliente o en las instrucciones recibidas:

**Frases de activación directas:**
- "quiero un bot de whatsapp"
- "atención al cliente por whatsapp"
- "responder mensajes automáticamente"
- "chatbot para whatsapp"
- "asistente de mensajería"
- "automatizar whatsapp"
- "bot para responder clientes"
- "whatsapp business automatizado"

**Sectores que por defecto sugieren este skill** (aunque no mencionen WhatsApp explícitamente):
- Inmobiliaria
- Clínica / centro médico / dentista
- Restaurante / hostelería
- Tienda online / e-commerce
- Academia / formación
- Agencia de servicios

**Señales en el formulario (`tools` o `sector`):**
- `tools` incluye `"WhatsApp"` o `"Chat"` → activar skill automáticamente
- `sector` es cualquiera de los listados arriba → sugerir este skill como primera opción
- `urgency` es `"esta_semana"` o `"hoy"` → priorizar este skill sobre otros de setup más complejo
