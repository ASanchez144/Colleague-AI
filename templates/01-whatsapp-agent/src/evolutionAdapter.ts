/**
 * Evolution API Adapter — Tu Socia!
 */

import { config } from 'dotenv';
config();

export interface EvolutionWebhookPayload {
  event: 'messages.upsert' | 'messages.update' | 'connection.update' | string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
      participant?: string;   // JID del participante en grupos (Evolution v2)
    };
    participant?: string;     // También puede estar aquí en algunos builds
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
      imageMessage?: { caption?: string };
      audioMessage?: {};
      documentMessage?: { fileName: string };
    };
    messageTimestamp?: number;
    messageType?: string;
  };
}

export interface EvolutionSendTextPayload {
  number: string;
  text: string;
  delay?: number;
  quoted?: {
    key: { id: string };
    message: { conversation: string };
  };
}

export class EvolutionAPIClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly instanceName: string;

  constructor() {
    this.baseUrl      = process.env.EVOLUTION_API_URL      || 'http://localhost:8080';
    this.apiKey       = process.env.EVOLUTION_API_KEY      || '';
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'tu-socia';

    if (!this.apiKey) {
      console.warn('⚠️  EVOLUTION_API_KEY no configurada en .env');
    }
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey
    };
  }

  async sendText(to: string, text: string, delay = 1200): Promise<boolean> {
    const phone = this.normalizePhone(to);
    const payload: EvolutionSendTextPayload = { number: phone, text, delay };

    try {
      const res = await fetch(
        `${this.baseUrl}/message/sendText/${this.instanceName}`,
        { method: 'POST', headers: this.headers, body: JSON.stringify(payload) }
      );
      if (!res.ok) {
        const err = await res.text();
        console.error(`[Evolution] Error enviando a ${phone}:`, err);
        return false;
      }
      console.log(`[Evolution] ✓ Mensaje enviado a ${phone}`);
      return true;
    } catch (e) {
      console.error(`[Evolution] Fallo de conexión:`, e);
      return false;
    }
  }

  async sendTypingAndText(to: string, text: string): Promise<boolean> {
    const phone = this.normalizePhone(to);
    try {
      await fetch(`${this.baseUrl}/chat/sendPresence/${this.instanceName}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ number: phone, presence: 'composing', delay: 1500 })
      });
    } catch { /* no crítico */ }

    const typingDelay = Math.min(Math.max(text.length * 20, 800), 3000);
    return this.sendText(to, text, typingDelay);
  }

  async createInstance(): Promise<{ qrcode?: string; status: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/instance/create`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          instanceName: this.instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      });
      return await res.json();
    } catch { return { status: 'error' }; }
  }

  async getQRCode(): Promise<string | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/instance/connect/${this.instanceName}`,
        { headers: this.headers }
      );
      const data = await res.json();
      if (data?.base64) return data.base64;
      if (data?.qrcode?.base64) return data.qrcode.base64;
      if (data?.code) {
        const QRCode = await import('qrcode');
        return await QRCode.default.toDataURL(data.code);
      }
      return null;
    } catch { return null; }
  }

  async getConnectionStatus(): Promise<'open' | 'close' | 'connecting' | 'unknown'> {
    try {
      const res = await fetch(
        `${this.baseUrl}/instance/connectionState/${this.instanceName}`,
        { headers: this.headers }
      );
      const data = await res.json();
      return data?.instance?.state || 'unknown';
    } catch { return 'unknown'; }
  }

  async configureWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/webhook/set/${this.instanceName}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
        })
      });
      return res.ok;
    } catch { return false; }
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\+\-\(\)]/g, '');
  }
}

export function parseEvolutionMessage(payload: EvolutionWebhookPayload): {
  from: string;
  participant: string;
  text: string;
  senderName: string;
  messageId: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'unknown';
} | null {

  if (payload.event !== 'messages.upsert') return null;

  const data = payload.data;
  if (data.key.fromMe) return null;

  const from = data.key.remoteJid;
  const messageId = data.key.id;
  const senderName = data.pushName || from;
  const timestamp = data.messageTimestamp
    ? new Date(data.messageTimestamp * 1000).toISOString()
    : new Date().toISOString();

  // Participant: quién envió dentro del grupo (o el mismo JID en chats directos)
  const participant = data.key.participant || data.participant || from;

  const msg = data.message;
  if (!msg) return null;

  let text = '';
  let type: 'text' | 'image' | 'audio' | 'document' | 'unknown' = 'unknown';

  if (msg.conversation) {
    text = msg.conversation; type = 'text';
  } else if (msg.extendedTextMessage?.text) {
    text = msg.extendedTextMessage.text; type = 'text';
  } else if (msg.imageMessage) {
    text = msg.imageMessage.caption || '[imagen]'; type = 'image';
  } else if (msg.audioMessage) {
    text = '[audio]'; type = 'audio';
  } else if (msg.documentMessage) {
    text = `[documento: ${msg.documentMessage.fileName}]`; type = 'document';
  }

  if (!text) return null;

  return { from, participant, text, senderName, messageId, timestamp, type };
}
