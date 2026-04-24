---
name: "voice-agent-retell"
description: "Agente de voz automatizado que gestiona llamadas telefónicas y citas mediante Retell AI y Twilio"
version: "1.0.0"
template_id: "02-voice-agent"
category: "voice"
triggers:
  - "llamadas"
  - "voz"
  - "teléfono"
  - "citas por teléfono"
  - "atención telefónica"
requires:
  - "node >= 18"
  - "retell-sdk"
  - "twilio-sdk"
env_vars:
  - name: "RETELL_API_KEY"
    required: true
    description: "API key de Retell AI"
    where: ".env"
  - name: "TWILIO_ACCOUNT_SID"
    required: true
    description: "SID de la cuenta de Twilio"
    where: ".env"
  - name: "TWILIO_AUTH_TOKEN"
    required: true
    description: "Token de autenticación de Twilio"
    where: ".env"
  - name: "TWILIO_PHONE_NUMBER"
    required: true
    description: "Número de teléfono de Twilio vinculado"
    where: ".env"
ports:
  - 3003    # Webhook server del bot de voz
estimated_setup_time: "20 minutos"
difficulty: "avanzada"
author: "Tu Socia! — Agencia de IA"
last_updated: "2026-04-20"
---

# voice-agent-retell — Skill de Configuración

## Propósito
Este skill permite desplegar un agente de voz inteligente capaz de mantener conversaciones telefónicas fluidas, agendar citas en tiempo real y transferir llamadas a humanos cuando sea necesario. Ideal para recepciones automatizadas y soporte primer nivel.

## Arquitectura del Bot

```
[Cliente llama] ──▶ [Twilio] ──▶ [Retell AI Engine]
                                      │
                                      ▼ (WebSocket)
[Transcribe/Procesa] ◀── [Tu Servidor / Webhook Server] ──▶ [Knowledge Base / CRM]
                                      │
                                      ▼ (Respuesta)
[Cliente escucha] ◀── [Twilio] ◀── [Retell AI Engine]
```

## Archivos Clave

| Archivo | Propósito | Editable por agente |
|---------|-----------|---------------------|
| `config/template.json` | Configuración de voces, scripts y horarios | ✅ Sí |
| `src/voiceHandler.ts` | Manejo de eventos de llamada y lógica de negocio | ⚠️ Con cuidado |
| `src/retellAdapter.ts` | Cliente para Retell AI | ❌ No tocar |
| `docs/setup.md` | Guía de configuración de Twilio/Retell | ❌ No tocar |

## Pasos de Adaptación para un Nuevo Cliente

### Paso 1 — Clonar template base
```bash
cp -r templates/02-voice-agent clients/{{lead_id}}/agent/
```

### Paso 2 — Personalizar configuración
Abrir `config/template.json` y reemplazar:
- `{{company}}` → Nombre de la empresa
- `greeting` → Mensaje de bienvenida telefónica
- `transferNumber` → Número real del cliente para desvíos
- `voiceId` → Seleccionar voz según preferencia (Neural2-A/B/C)

### Paso 3 — Configurar Knowledge Base (Base de Datos de Respuestas)
Asegurar que `knowledge/base-knowledge.json` contiene la información que el agente usará para responder dudas durante la llamada.

### Paso 4 — Validación
- [ ] `config/template.json` tiene los SIDs de Twilio correctos
- [ ] El `transferNumber` está en formato internacional (+34...)
- [ ] El script de la llamada (`callScript`) no tiene bucles lógicos
- [ ] Prueba de llamada entrante: el bot saluda correctamente

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `Invalid SID` | Twilio SID mal copiado | Revisar .env y consola de Twilio |
| Latencia alta | Servidor Retell/Twilio lejano | Verificar región del endpoint |
| No transfiere | `transferNumber` inválido | Debe ser un número E.164 verificado |
| Voz robótica | Modelo de voz estándar | Cambiar a Neural2 o modelos Premium en Retell |

## Prompts de Referencia para el Agente IA

```
Eres la operadora virtual de {{company}}. Tu tono debe ser servicial, paciente y profesional.
Saluda siempre con "Gracias por llamar a {{company}}, ¿en qué puedo ayudarle?".
Si detectas que el cliente quiere una cita, pregunta por el día y la hora.
Si el cliente pregunta algo técnico que no sabes, mantén la calma y ofrece transferirle a un especialista.
```
