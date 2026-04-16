/**
 * Template 1: Agente de WhatsApp
 *
 * Bot de atención al cliente vía WhatsApp Business API.
 * Gestiona conversaciones, responde consultas frecuentes,
 * y escala a humanos cuando es necesario.
 *
 * Integración: WhatsApp Cloud API + Spoky pattern
 */

import { config } from 'dotenv';
config();

// ─── Types ───────────────────────────────────────────

interface IncomingMessage {
  from: string;           // Phone number
  text: string;
  timestamp: string;
  messageId: string;
  type: 'text' | 'image' | 'audio' | 'document';
}

interface AgentConfig {
  companyName: string;
  welcomeMessage: string;
  outOfHoursMessage: string;
  knowledgeBase: KnowledgeEntry[];
  businessHours: { start: string; end: string; timezone: string };
  escalationThreshold: number;
}

interface KnowledgeEntry {
  question: string;
  answer: string;
  keywords: string[];
}

interface ConversationContext {
  phoneNumber: string;
  history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  startedAt: string;
  escalated: boolean;
}

// ─── Agent Core ──────────────────────────────────────

export class WhatsAppAgent {
  private config: AgentConfig;
  private conversations: Map<string, ConversationContext> = new Map();

  constructor(agentConfig: AgentConfig) {
    this.config = agentConfig;
  }

  /**
   * Procesa un mensaje entrante y genera una respuesta
   */
  async handleMessage(message: IncomingMessage): Promise<string> {
    // Obtener o crear contexto de conversación
    let context = this.conversations.get(message.from);
    if (!context) {
      context = {
        phoneNumber: message.from,
        history: [],
        startedAt: new Date().toISOString(),
        escalated: false
      };
      this.conversations.set(message.from, context);
    }

    // Registrar mensaje del usuario
    context.history.push({
      role: 'user',
      content: message.text,
      timestamp: message.timestamp
    });

    // Verificar horario de atención
    if (!this.isWithinBusinessHours()) {
      return this.config.outOfHoursMessage;
    }

    // Buscar en knowledge base
    const kbMatch = this.searchKnowledgeBase(message.text);
    if (kbMatch) {
      const response = kbMatch.answer;
      context.history.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });
      return response;
    }

    // Si no hay match, generar respuesta con IA
    // TODO: Integrar con Claude/GPT-4o para respuestas contextuales
    const aiResponse = await this.generateAIResponse(context);

    context.history.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    return aiResponse;
  }

  /**
   * Busca coincidencias en la base de conocimiento
   */
  private searchKnowledgeBase(query: string): KnowledgeEntry | null {
    const normalizedQuery = query.toLowerCase();

    for (const entry of this.config.knowledgeBase) {
      const keywordMatch = entry.keywords.some(kw =>
        normalizedQuery.includes(kw.toLowerCase())
      );
      if (keywordMatch) return entry;
    }

    return null;
  }

  /**
   * Genera respuesta con IA (placeholder para adaptación)
   */
  private async generateAIResponse(context: ConversationContext): Promise<string> {
    // TODO: Implementar llamada a Claude/GPT-4o con el contexto de conversación
    // Este método será adaptado por el subagente según el cliente
    return `Gracias por tu mensaje. Un miembro de nuestro equipo en ${this.config.companyName} te responderá pronto.`;
  }

  /**
   * Verifica si estamos dentro del horario de atención
   */
  private isWithinBusinessHours(): boolean {
    const now = new Date();
    const hours = now.getHours();
    const startHour = parseInt(this.config.businessHours.start.split(':')[0]);
    const endHour = parseInt(this.config.businessHours.end.split(':')[0]);
    return hours >= startHour && hours < endHour;
  }

  /**
   * Escala la conversación a un agente humano
   */
  async escalateToHuman(phoneNumber: string, reason: string): Promise<void> {
    const context = this.conversations.get(phoneNumber);
    if (context) {
      context.escalated = true;
      // TODO: Notificar al equipo vía Slack/email
      console.log(`⚠️ Conversación escalada: ${phoneNumber} - Razón: ${reason}`);
    }
  }
}

// ─── Webhook Handler (para conectar con WhatsApp Cloud API) ──

export async function handleWebhook(req: any, res: any): Promise<void> {
  // Verificación del webhook de Meta
  if (req.method === 'GET') {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (req.query['hub.verify_token'] === verifyToken) {
      res.send(req.query['hub.challenge']);
    } else {
      res.sendStatus(403);
    }
    return;
  }

  // Procesar mensaje entrante
  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
      // Extraer mensaje del payload de WhatsApp
      // TODO: Parsear según estructura de WhatsApp Cloud API
      res.sendStatus(200);
    }
  }
}
