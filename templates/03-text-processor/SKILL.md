---
name: "text-processor-agent"
description: "Agente de procesamiento de textos, correos y documentos via Gmail, Outlook y APIs de LLM"
version: "1.0.0"
template_id: "03-text-processor"
category: "text"
triggers:
  - "email"
  - "correo"
  - "gmail"
  - "outlook"
  - "documentos"
  - "pdf"
  - "resumen"
requires:
  - "node >= 18"
  - "google-auth-library"
  - "microsoft-graph-client"
env_vars:
  - name: "GOOGLE_CREDENTIALS_JSON"
    required: true
    description: "JSON de credenciales de Google Cloud"
    where: ".env"
  - name: "MICROSOFT_CLIENT_ID"
    required: false
    description: "ID de cliente Azure para Outlook"
    where: ".env"
  - name: "ADMIN_EMAIL"
    required: true
    description: "Email de destino para reportes resumidos"
    where: ".env"
ports: []
estimated_setup_time: "25 minutos"
difficulty: "intermedia"
author: "Tu Socia! — Agencia de IA"
last_updated: "2026-04-20"
---

# text-processor-agent — Skill de Configuración

## Propósito
Este skill permite automatizar la gestión de bandejas de entrada, lectura de PDFs y generación de respuestas automáticas o borradores. Útil para secretaría virtual, filtrado de facturas y resumen de documentación legal.

## Arquitectura del Bot

```
[Email Entrante] ──▶ [Webhook / Poll] ──▶ [LLM Analysis]
                                             │
                                             ├─▶ [Auto-Reply / Draft]
                                             ├─▶ [Extract Data to JSON]
                                             └─▶ [Notify Admin in Slack/WP]
```

## Archivos Clave

| Archivo | Propósito | Editable por agente |
|---------|-----------|---------------------|
| `config/template.json` | Reglas de filtrado y prompts de respuesta | ✅ Sí |
| `src/emailProcessor.ts` | Conectores a Gmail/Outlook | ⚠️ Con cuidado |
| `src/documentParser.ts` | Lógica de extracción de datos (PDF/Word) | ✅ Sí |

## Pasos de Adaptación para un Nuevo Cliente

### Paso 1 — Clonar template base
```bash
cp -r templates/03-text-processor clients/{{lead_id}}/agent/
```

### Paso 2 — Configurar permisos de API
Es necesario descargar el `credentials.json` de Google Cloud o configurar el App Registration en Azure.

### Paso 3 — Personalizar reglas de negocio
Editar `config/template.json`:
- `autoReplyKeywords` → Palabras que activan respuesta automática
- `importantFolders` → Carpetas a monitorizar
- `summaryFormat` → Cómo quiere el cliente recibir los resúmenes

### Paso 4 — Validación
- [ ] Conexión OAuth2 activa y token refrescado
- [ ] Se leen correos de la bandeja de entrada
- [ ] El LLM categoriza correctamente (ej: "spam", "cliente", "factura")

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `Token expired` | No se configuró refresh token | Re-autenticar o revisar scopes |
| `Rate limit` | Demasiados correos en poco tiempo | Ajustar el polling interval o usar webhooks (Pub/Sub) |
| `Parse error` | PDF escaneado sin OCR | Usar un servicio de OCR (ej: AWS Textract) previo |

## Prompts de Referencia para el Agente IA

```
Lees correos para la empresa {{company}}. 
Tu objetivo es resumirlos en 3 puntos clave y sugerir una respuesta.
Si el correo es urgente (reclamación, pago fallido), márcalo con [ALERTA].
Si es publicidad, simplemente muévelo a la carpeta de 'Newsletter'.
```
