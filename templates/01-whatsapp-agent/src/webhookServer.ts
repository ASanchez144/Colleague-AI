/**
 * Servidor webhook para recibir eventos de Evolution API
 * e integrarlos con el WhatsAppAgent
 *
 * Puerto: 3002 (separado del webhook principal en 3001)
 */

import express from 'express';
import { config } from 'dotenv';
import { EvolutionAPIClient, parseEvolutionMessage, type EvolutionWebhookPayload } from './evolutionAdapter.js';
import { WhatsAppAgent } from './agent.js';

config();

const app = express();
app.use(express.json({ limit: '5mb' }));

// ─── Instancias ───────────────────────────────────────────────────────────────

const evolutionClient = new EvolutionAPIClient();

// Configuración del agente — en producción esto viene del pipeline
// (adaptado por el orquestador según el JSON del cliente)
const agent = new WhatsAppAgent({
  companyName: process.env.COMPANY_NAME || 'Tu Socia!',
  welcomeMessage: process.env.WELCOME_MESSAGE || '¡Hola! Soy el asistente virtual de {{company}}. ¿En qué puedo ayudarte?',
  outOfHoursMessage: process.env.OUT_OF_HOURS_MESSAGE || 'Gracias por escribirnos. Te respondemos en horario laboral (9-20h).',
  knowledgeBase: [],   // Poblado por el pipeline al crear el agente del cliente
  businessHours: {
    start: process.env.BUSINESS_HOURS_START || '09:00',
    end:   process.env.BUSINESS_HOURS_END   || '20:00',
    timezone: 'Europe/Madrid'
  },
  escalationThreshold: 0.3
});

// ─── Deduplicación de mensajes ───────────────────────────────────────────────
// Evita procesar el mismo messageId dos veces si Evolution reintenta

const processedMessages = new Set<string>();
const MAX_CACHE = 1000;

function isDuplicate(messageId: string): boolean {
  if (processedMessages.has(messageId)) return true;
  processedMessages.add(messageId);
  // Limpiar caché si crece demasiado
  if (processedMessages.size > MAX_CACHE) {
    const first = processedMessages.values().next().value;
    if (first) processedMessages.delete(first);
  }
  return false;
}

// ─── Endpoint: Webhook de Evolution API ──────────────────────────────────────

app.post('/webhook/whatsapp', async (req, res) => {
  // Responder 200 INMEDIATAMENTE — Evolution API no espera procesamiento
  res.sendStatus(200);

  const payload = req.body as EvolutionWebhookPayload;

  // Solo procesar mensajes entrantes
  const parsed = parseEvolutionMessage(payload);
  if (!parsed) return;

  // Deduplicar
  if (isDuplicate(parsed.messageId)) return;

  console.log(`📱 [WA] ${parsed.senderName} (${parsed.from}): ${parsed.text}`);

  // No responder a audios/documentos directamente (mejorar en v2)
  if (parsed.type === 'audio') {
    await evolutionClient.sendTypingAndText(
      parsed.from,
      '🎤 He recibido tu audio. Por el momento solo proceso texto. ¿Puedes escribirme tu consulta?'
    );
    return;
  }

  try {
    const response = await agent.handleMessage({
      from: parsed.from,
      text: parsed.text,
      timestamp: parsed.timestamp,
      messageId: parsed.messageId,
      type: parsed.type === 'image' ? 'image' : 'text'
    });

    // Enviar respuesta con efecto typing
    await evolutionClient.sendTypingAndText(parsed.from, response);

  } catch (error) {
    console.error('[WA] Error procesando mensaje:', error);
    await evolutionClient.sendText(
      parsed.from,
      'Disculpa, hubo un problema técnico. Inténtalo de nuevo en un momento.'
    );
  }
});

// ─── Endpoint: Health check + estado de conexión WhatsApp ───────────────────

app.get('/webhook/whatsapp/health', async (_req, res) => {
  const status = await evolutionClient.getConnectionStatus();
  res.json({
    service: 'tu-socia-whatsapp',
    whatsapp: status,
    timestamp: new Date().toISOString()
  });
});

// ─── Endpoint: Obtener QR para conectar el número ───────────────────────────

app.get('/webhook/whatsapp/qr', async (_req, res) => {
  const qr = await evolutionClient.getQRCode();
  if (!qr) {
    return res.status(503).json({ error: 'QR no disponible. Verifica que Evolution API esté corriendo.' });
  }
  // Devolver el QR como imagen base64 embebida en HTML para fácil visualización
  res.send(`
    <html>
      <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;flex-direction:column;font-family:sans-serif;color:white;">
        <h2>Escanea con WhatsApp</h2>
        <img src="${qr}" style="width:300px;height:300px;border-radius:12px;border:4px solid white;" />
        <p style="margin-top:16px;opacity:0.6;">El QR expira en ~60 segundos. Recarga para obtener uno nuevo.</p>
      </body>
    </html>
  `);
});

// ─── Iniciar servidor ────────────────────────────────────────────────────────

const PORT = process.env.WHATSAPP_PORT || 3002;

app.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   📱 Tu Socia! — WhatsApp Bot Server             ║
║   Puerto: ${String(PORT).padEnd(39)}║
║   Webhook: POST /webhook/whatsapp                ║
║   QR Code: GET  /webhook/whatsapp/qr             ║
╚══════════════════════════════════════════════════╝
  `);

  // Verificar conexión con Evolution API al arrancar
  const status = await evolutionClient.getConnectionStatus();
  console.log(`📡 Estado WhatsApp: ${status}`);

  if (status === 'close' || status === 'unknown') {
    console.log(`🔗 Visita http://localhost:${PORT}/webhook/whatsapp/qr para conectar WhatsApp`);
  }
});

export default app;
