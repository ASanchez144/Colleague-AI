/**
 * Evolution API Adapter — Tu Socia!
 *
 * Conecta el WhatsAppAgent con Evolution API (open-source, auto-hosteable).
 * Evolution API es un wrapper REST sobre Baileys (WhatsApp Web protocol).
 *
 * Arquitectura:
 *   [WhatsApp] ←→ [Evolution API (Docker)] ←→ [Este adaptador] ←→ [WhatsAppAgent]
 *
 * Ventajas vs Meta API oficial:
 *   ✓ Gratis y open source
 *   ✓ Sin aprobación de Meta / sin Business Verification
 *   ✓ Se levanta en 5 min con Docker
 *   ✓ API REST estándar
 *   ✓ Soporta texto, audio, imágenes, documentos
 *
 * Docs: https://doc.evolution-api.com
 */

import { config } from 'dotenv';
config();

// ─── Types de Evolution API ───────────────────────────────────────────────────

export interface EvolutionWebhookPayload {
  event: 'messages.upsert' | 'messages.update' | 'connection.update' | string;
  instance: string;
  data: {
    key: {
      remoteJid: string;    // "5491122334455@s.whatsapp.net"
      fromMe: boolean;
      id: string;
    };
    pushName?: string;      // Nombre del contacto
    message?: {
      conversation?: string;               // Texto plano
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
  number: string;   // "5491122334455" — sin @s.whatsapp.net
  text: string;
  delay?: number;   // ms de delay antes de enviar (simula typing)
  quoted?: {
    key: { id: string };
    message: { conversation: string };
  };
}

// ─── Cliente HTTP para Evolution API ─────────────────────────────────────────

export class EvolutionAPIClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly instanceName: string;

  constructor() {
    this.baseUrl    = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    this.apiKey     = process.env.EVOLUTION_API_KEY || '';
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

  /**
   * Envía un mensaje de texto
   */
  async sendText(to: string, text: string, delay = 1200): Promise<boolean> {
    const phone = this.normalizePhone(to);
    const payload: EvolutionSendTextPayload = { number: phone, text, delay };

    try {
      const res = await fetch(
        `${this.baseUrl}/message/sendText/${this.instanceName}`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(payload)
        }
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

  /**
   * Envía un mensaje con retraso progresivo (simula typing humano)
   */
  async sendTypingAndText(to: string, text: string): Promise<boolean> {
    const phone = this.normalizePhone(to);

    // Primero enviar presencia "typing"
    try {
      await fetch(
        `${this.baseUrl}/chat/sendPresence/${this.instanceName}`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ number: phone, presence: 'composing', delay: 1500 })
        }
      );
    } catch {
      // No es crítico si falla
    }

    // Luego el mensaje con delay proporcional a la longitud del texto
    const typingDelay = Math.min(Math.max(text.length * 20, 800), 3000);
    return this.sendText(to, text, typingDelay);
  }

  /**
   * Crea o verifica la instancia de WhatsApp
   */
  async createInstance(): Promise<{ qrcode?: string; status: string }> {
    try {
      const res = await fetch(
        `${this.baseUrl}/instance/create`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            instanceName: this.instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS'
          })
        }
      );
      return await res.json();
    } catch (e) {
      return { status: 'error' };
    }
  }

  /**
   * Obtiene el QR code para conectar el número
   */
  async getQRCode(): Promise<string | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/instance/connect/${this.instanceName}`,
        { headers: this.headers }
      );
      const data = await res.json();
      return data?.base64 || data?.qrcode?.base64 || null;
    } catch {
      return null;
    }
  }

  /**
   * Estado de la conexión WhatsApp
   */
  async getConnectionStatus(): Promise<'open' | 'close' | 'connecting' | 'unknown'> {
    try {
      const res = await fetch(
        `${this.baseUrl}/instance/connectionState/${this.instanceName}`,
        { headers: this.headers }
      );
      const data = await res.json();
      return data?.instance?.state || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Configura el webhook de Evolution API hacia nuestro servidor
   */
  async configureWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.baseUrl}/webhook/set/${this.instanceName}`,
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: false,
            events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
          })
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Normaliza número de teléfono para Evolution API
   * Entrada: "+34 600 000 000" | "34600000000" | "600000000"
   * Salida:  "34600000000"
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\+\-\(\)]/g, '');
  }
}

// ─── Parser del payload entrante de Evolution API ────────────────────────────

export function parseEvolutionMessage(payload: EvolutionWebhookPayload): {
  from: string;
  text: string;
  senderName: string;
  messageId: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'unknown';
} | null {

  if (payload.event !== 'messages.upsert') return null;

  const data = payload.data;

  // Ignorar mensajes propios del bot
  if (data.key.fromMe) return null;

  const from = data.key.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
  const messageId = data.key.id;
  const senderName = data.pushName || from;
  const timestamp = data.messageTimestamp
    ? new Date(data.messageTimestamp * 1000).toISOString()
    : new Date().toISOString();

  // Extraer texto según tipo de mensaje
  const msg = data.message;
  if (!msg) return null;

  let text = '';
  let type: 'text' | 'image' | 'audio' | 'document' | 'unknown' = 'unknown';

  if (msg.conversation) {
    text = msg.conversation;
    type = 'text';
  } else if (msg.extendedTextMessage?.text) {
    text = msg.extendedTextMessage.text;
    type = 'text';
  } else if (msg.imageMessage) {
    text = msg.imageMessage.caption || '[imagen]';
    type = 'image';
  } else if (msg.audioMessage) {
    text = '[audio]';
    type = 'audio';
  } else if (msg.documentMessage) {
    text = `[documento: ${msg.documentMessage.fileName}]`;
    type = 'document';
  }

  if (!text) return null;

  return { from, text, senderName, messageId, timestamp, type };
}
