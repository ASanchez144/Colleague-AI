/**
 * Tu Socia! — WhatsApp Webhook Server
 * Solo responde al grupo Claude Master. Todo lo demás: silencio total.
 */

import express from 'express';
import { config } from 'dotenv';
import {
  EvolutionAPIClient,
  parseEvolutionMessage,
  type EvolutionWebhookPayload
} from './evolutionAdapter.js';

config();

const app = express();
app.use(express.json({ limit: '5mb' }));

// ─── ÚNICO grupo permitido ────────────────────────────────────────────────────
const ALLOWED_JID = process.env.ALLOWED_GROUP_JID || '120363409595947447@g.us';
const PORT        = process.env.WHATSAPP_PORT || 3002;

const evolutionClient = new EvolutionAPIClient();

// ─── Deduplicación ───────────────────────────────────────────────────────────
const seen = new Set<string>();
function isDuplicate(id: string): boolean {
  if (seen.has(id)) return true;
  seen.add(id);
  if (seen.size > 1000) seen.delete(seen.values().next().value!);
  return false;
}

// ─── Webhook ─────────────────────────────────────────────────────────────────
app.post('/webhook/whatsapp', async (req, res) => {
  res.sendStatus(200);

  const payload = req.body as EvolutionWebhookPayload;

  // Ignorar eventos que no son mensajes entrantes
  if (payload.event !== 'messages.upsert') return;

  // FILTRO ESTRICTO: solo el grupo Claude Master, todo lo demás ignorado
  const remoteJid: string = payload?.data?.key?.remoteJid || '';
  const isOwnerGroup = remoteJid === ALLOWED_JID;
  if (!isOwnerGroup) return;

  const parsed = parseEvolutionMessage(payload);
  if (!parsed) return;
  if (isDuplicate(parsed.messageId)) return;

  console.log(`📱 [Claude Master] ${parsed.senderName}: ${parsed.text}`);

  if (parsed.type === 'audio') {
    await evolutionClient.sendTypingAndText(ALLOWED_JID, '🎤 Solo proceso texto — ¿puedes escribirlo?');
    return;
  }

  // Respuesta simple por ahora — conectar Ollama cuando quieras
  await evolutionClient.sendTypingAndText(ALLOWED_JID, `Recibido: "${parsed.text}"`);
});

// ─── QR ──────────────────────────────────────────────────────────────────────
app.get('/webhook/whatsapp/qr', async (_req, res) => {
  const qr = await evolutionClient.getQRCode();
  if (!qr) return res.send(`<html><body style="background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif"><h2>✅ WhatsApp ya conectado</h2></body></html>`);
  res.send(`<html><head><meta http-equiv="refresh" content="25"></head><body style="background:#0f172a;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif"><h2>Escanea con WhatsApp</h2><img src="${qr}" style="width:300px;border-radius:12px;border:4px solid #a78bfa"><p style="opacity:.6;margin-top:12px">Expira en ~60s — se recarga solo</p></body></html>`);
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/webhook/whatsapp/health', async (_req, res) => {
  const status = await evolutionClient.getConnectionStatus();
  res.json({ service: 'tu-socia-whatsapp', whatsapp: status, allowed_group: ALLOWED_JID, timestamp: new Date().toISOString() });
});

// ─── Arranque ─────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`✅ WhatsApp bot arrancado — solo escucha: ${ALLOWED_JID}`);
  const status = await evolutionClient.getConnectionStatus();
  console.log(`📡 Estado: ${status}`);
});

export default app;
