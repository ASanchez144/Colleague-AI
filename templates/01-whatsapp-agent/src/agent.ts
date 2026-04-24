/**
 * WhatsApp Agent v2 — Tu Socia! Template de Producción
 *
 * Arquitectura:
 *   - Owner (Arturo): agente IA completo con Ollama — sin restricciones
 *   - Cliente: FSM de cualificación → KB → Ollama → Escalada / Booking
 *
 * Flujo de cliente (FSM):
 *   GREETING → QUALIFYING (4 preguntas BANT-lite) → ANSWERING → BOOKING | ESCALATED
 *
 * Human Handoff:
 *   Triggers: palabras clave + baja confianza x2 + solicitud explícita
 *   Al escalar: notifica al owner con resumen completo y lead score
 *
 * Calendar:
 *   Si CALENDLY_URL configurado → link directo
 *   Si no → escalar a humano para agendar
 */

import { config } from 'dotenv';
config();

import {
  COMPANY, FAQS, SERVICES, QUALIFICATION_STEPS,
  searchKB, detectHandoffTrigger, detectBookingIntent,
  type FAQEntry
} from './knowledgeBase.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConversationStage =
  | 'GREETING'
  | 'QUALIFYING'
  | 'ANSWERING'
  | 'BOOKING'
  | 'ESCALATED'
  | 'CLOSED';

export interface LeadProfile {
  name?: string;
  company?: string;
  sector?: string;
  painpoint?: string;
  timeline?: string;
  contact?: string;
  score: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  qualificationComplete: boolean;
  answers: Record<string, string>;
}

export interface ConversationContext {
  participantJid: string;
  senderName: string;
  stage: ConversationStage;
  history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
  lead: LeadProfile;
  qualificationStep: number;
  lowConfidenceCount: number;
  startedAt: string;
  lastActiveAt: string;
  isOwner: boolean;
  notifiedOwner: boolean;   // si ya notificamos al owner de este lead
}

export interface IncomingMessage {
  from: string;
  participant: string;
  senderName: string;
  text: string;
  timestamp: string;
  messageId: string;
  type: 'text' | 'image' | 'audio' | 'document';
  isOwner: boolean;
}

// ─── Callbacks externos (inyectados por webhookServer) ───────────────────────

export interface AgentCallbacks {
  notifyOwner: (msg: string) => Promise<void>;
  sendMessage?: (to: string, msg: string) => Promise<void>;
}

// ─── Ollama ───────────────────────────────────────────────────────────────────

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';

async function callOllama(
  messages: Array<{ role: string; content: string }>,
  timeoutMs = 30000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json() as { message?: { content?: string } };
    return data.message?.content?.trim() || '⚠️ Respuesta vacía de Ollama.';
  } catch (e: any) {
    clearTimeout(timer);
    console.error('[Ollama] Error:', e.message || e);
    throw e;
  }
}

// ─── Lead Scoring ─────────────────────────────────────────────────────────────

function scoreLead(lead: LeadProfile): LeadProfile['score'] {
  let points = 0;
  if (lead.company)   points += 2;
  if (lead.painpoint) points += 3;
  if (lead.timeline?.match(/ahora|urgente|pronto|este mes|este trimestre/i)) points += 3;
  if (lead.contact)   points += 2;
  return points >= 8 ? 'HIGH' : points >= 4 ? 'MEDIUM' : 'LOW';
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function buildOwnerNotification(ctx: ConversationContext): string {
  const score = scoreLead(ctx.lead);
  const scoreEmoji = score === 'HIGH' ? '🔥' : score === 'MEDIUM' ? '⚡' : '❄️';
  const lastMsgs = ctx.history.slice(-4)
    .map(h => `${h.role === 'user' ? '👤' : '🤖'} ${h.content.substring(0, 80)}`)
    .join('\n');

  return `🔔 *Nuevo Lead en WhatsApp*\n\n` +
    `👤 *Contacto:* ${ctx.senderName}\n` +
    `🏢 *Empresa:* ${ctx.lead.company || 'Sin dato'}\n` +
    `💬 *Dolor:* ${ctx.lead.painpoint || 'Sin dato'}\n` +
    `⏱️ *Timeline:* ${ctx.lead.timeline || 'Sin dato'}\n` +
    `📩 *Contacto:* ${ctx.lead.contact || 'Sin dato'}\n` +
    `${scoreEmoji} *Score:* ${score}\n\n` +
    `📋 *Últimos mensajes:*\n${lastMsgs}\n\n` +
    `💡 _Responde directamente en el chat de WhatsApp con este número._`;
}

function buildEscalationMessage(ctx: ConversationContext): string {
  if (COMPANY.calendlyUrl && detectBookingIntent(
    ctx.history[ctx.history.length - 1]?.content || ''
  )) {
    return `¡Perfecto! Para agendar una demo con nuestro equipo, aquí tienes el enlace de reserva 📅\n\n👉 ${COMPANY.calendlyUrl}\n\nElige el hueco que mejor te vaya y recibirás confirmación inmediata. ¡Nos vemos pronto!`;
  }

  return `Entiendo que esto requiere una conversación más personalizada. 🙌\n\nVoy a pasarte con *Arturo*, nuestro fundador, para que pueda atenderte directamente.\n\nEn breve te contacta. Mientras tanto, si tienes cualquier pregunta, soy todo tuyo. ¿Hay algo más que quieras saber antes? 😊`;
}

// ─── Agent Core ───────────────────────────────────────────────────────────────

export class WhatsAppAgent {
  private conversations = new Map<string, ConversationContext>();
  private callbacks: AgentCallbacks;

  constructor(callbacks: AgentCallbacks) {
    this.callbacks = callbacks;
  }

  // ── Punto de entrada principal ────────────────────────────────────────────

  async handleMessage(msg: IncomingMessage): Promise<string> {
    const key = msg.participant || msg.from;

    let ctx = this.conversations.get(key);
    if (!ctx) {
      ctx = this.createContext(msg);
      this.conversations.set(key, ctx);

      // Primera vez que escribe un cliente → notificar al owner
      if (!msg.isOwner) {
        setTimeout(async () => {
          if (ctx && !ctx.notifiedOwner) {
            await this.callbacks.notifyOwner(
              `👀 *Nuevo contacto en WhatsApp*\n\n` +
              `👤 ${msg.senderName} acaba de escribir por primera vez.\n` +
              `💬 "${msg.text.substring(0, 100)}"\n\n` +
              `_El bot está gestionando la conversación. Te avisaré cuando cualifique o pida hablar contigo._`
            );
            ctx.notifiedOwner = true;
          }
        }, 0);
      }
    }

    ctx.lastActiveAt = new Date().toISOString();

    ctx.history.push({ role: 'user', content: msg.text, timestamp: msg.timestamp });

    let response: string;

    if (msg.isOwner) {
      response = await this.handleOwner(ctx, msg.text);
    } else {
      response = await this.handleClient(ctx, msg);
    }

    ctx.history.push({ role: 'assistant', content: response, timestamp: new Date().toISOString() });
    return response;
  }

  // ── Owner Mode: agente completo ───────────────────────────────────────────

  private async handleOwner(ctx: ConversationContext, text: string): Promise<string> {
    const systemPrompt = `Eres el asistente personal de Arturo, fundador y dueño de ${COMPANY.name} (${COMPANY.tagline}).

Tienes acceso completo y actúas como agente autónomo sin restricciones. Ayudas con:
- Operaciones del servidor (PM2, Docker, systemd, SSH en 192.168.1.152)
- Código TypeScript/JavaScript/Python/Bash
- Análisis de negocio, textos de marketing, estrategia
- Gestión de clientes y leads del pipeline
- Cualquier tarea que Arturo necesite

Stack técnico: Evolution API + Baileys (WhatsApp), Ollama (${OLLAMA_MODEL}), PM2, Node.js/tsx, Docker.

Responde siempre en español. Sé directo, práctico y conciso.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...ctx.history.slice(-12).map(h => ({ role: h.role, content: h.content })),
    ];

    try {
      return await callOllama(messages);
    } catch (e: any) {
      return `⚠️ Error Ollama: ${e.message}. Verifica con: \`curl http://127.0.0.1:11434/api/tags\``;
    }
  }

  // ── Client Mode: FSM de cualificación + KB + escalada ────────────────────

  private async handleClient(ctx: ConversationContext, msg: IncomingMessage): Promise<string> {

    // ── Trigger de escalada explícita ──────────────────────────────────────
    if (detectHandoffTrigger(msg.text) && ctx.stage !== 'ESCALATED') {
      return await this.escalate(ctx, msg.text);
    }

    // ── Intención de booking (demo/reunión) ────────────────────────────────
    if (detectBookingIntent(msg.text) && ctx.stage !== 'ESCALATED') {
      const bookingResponse = buildEscalationMessage(ctx);
      if (ctx.stage !== 'BOOKING') {
        ctx.stage = 'BOOKING';
        await this.notifyOwnerWithLead(ctx, 'quiere agendar demo/reunión');
      }
      return bookingResponse;
    }

    switch (ctx.stage) {
      case 'GREETING':    return this.handleGreeting(ctx, msg.text);
      case 'QUALIFYING':  return this.handleQualifying(ctx, msg.text);
      case 'ANSWERING':   return this.handleAnswering(ctx, msg);
      case 'BOOKING':     return buildEscalationMessage(ctx);
      case 'ESCALATED':   return ''; // Silencio — el humano ha tomado el control
      default:            return this.handleAnswering(ctx, msg);
    }
  }

  // ── Stage: GREETING ───────────────────────────────────────────────────────

  private handleGreeting(ctx: ConversationContext, text: string): string {
    // Verificar primero si ya hace una pregunta concreta (ir directo a ANSWERING)
    const kbMatch = searchKB(text);
    if (kbMatch && kbMatch.confidence >= 0.9) {
      ctx.stage = 'ANSWERING';
      return kbMatch.answer + '\n\n' + this.getQualificationStarter();
    }

    ctx.stage = 'QUALIFYING';
    const greeting = `¡Hola${ctx.senderName ? ', ' + ctx.senderName.split(' ')[0] : ''}! 👋\n\n` +
      `Soy la asistente de *${COMPANY.name}* — ${COMPANY.tagline}.\n\n` +
      `Cuéntame, ¿en qué puedo ayudarte? 😊`;

    return greeting;
  }

  private getQualificationStarter(): string {
    return `\nPor cierto, para darte la información más relevante — ${QUALIFICATION_STEPS[0].question}`;
  }

  // ── Stage: QUALIFYING ─────────────────────────────────────────────────────

  private handleQualifying(ctx: ConversationContext, text: string): string {
    // Guardar respuesta del paso actual
    const currentStep = QUALIFICATION_STEPS[ctx.qualificationStep];
    if (currentStep) {
      ctx.lead.answers[currentStep.field] = text;
      (ctx.lead as any)[currentStep.field] = text;
      ctx.qualificationStep++;
    }

    // Si ya respondió todas las preguntas o hay match directo en KB
    const kbMatch = searchKB(text);
    if (kbMatch) {
      ctx.stage = 'ANSWERING';
      ctx.lead.score = scoreLead(ctx.lead);

      // Si ya tiene datos suficientes → notificar al owner
      if (ctx.lead.company || ctx.lead.painpoint) {
        setTimeout(() => this.notifyOwnerWithLead(ctx, 'cualificado'), 0);
      }

      return kbMatch.answer;
    }

    // Siguiente pregunta de cualificación
    if (ctx.qualificationStep < QUALIFICATION_STEPS.length) {
      const nextStep = QUALIFICATION_STEPS[ctx.qualificationStep];
      return nextStep.question;
    }

    // Cualificación completa
    ctx.stage = 'ANSWERING';
    ctx.lead.qualificationComplete = true;
    ctx.lead.score = scoreLead(ctx.lead);
    setTimeout(() => this.notifyOwnerWithLead(ctx, 'cualificación completa'), 0);

    return `¡Perfecto, gracias por la info! 🙌\n\nCon lo que me has contado, creo que podemos ayudarte muy bien.\n\n¿Tienes alguna pregunta concreta sobre cómo funciona ${COMPANY.name} o qué podemos hacer por vosotros?`;
  }

  // ── Stage: ANSWERING ──────────────────────────────────────────────────────

  private async handleAnswering(
    ctx: ConversationContext,
    msg: IncomingMessage
  ): Promise<string> {

    // 1. Buscar en KB primero (respuesta inmediata y determinista)
    const kbMatch = searchKB(msg.text);
    if (kbMatch && kbMatch.confidence >= 0.8) {
      ctx.lowConfidenceCount = 0;
      return kbMatch.answer;
    }

    // 2. Usar Ollama con contexto del negocio
    try {
      const systemPrompt = `Eres la asistente virtual de *${COMPANY.name}* (${COMPANY.tagline}).

Información sobre la empresa:
- Web: ${COMPANY.website}
- Email: ${COMPANY.email}
- Servicios: Agentes IA para WhatsApp, llamadas, email y reservas

Servicios disponibles:
${SERVICES.map(s => `• ${s.name} (${s.priceRange}): ${s.description}`).join('\n')}

Reglas:
- Responde SOLO sobre los servicios y temas de ${COMPANY.name}
- Si no sabes algo concreto, di que lo consultarás con el equipo
- Sé amable, profesional y conciso (máx 3 párrafos)
- Usa emojis con moderación
- Si preguntan por precios exactos o contratos: escala al humano
- NUNCA inventes precios ni promesas que no estén en tus instrucciones
- Responde en español

Contexto de esta conversación:
Empresa del cliente: ${ctx.lead.company || 'no especificada'}
Dolor mencionado: ${ctx.lead.painpoint || 'no especificado'}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...ctx.history.slice(-8).map(h => ({ role: h.role, content: h.content })),
      ];

      const aiResponse = await callOllama(messages, 25000);
      ctx.lowConfidenceCount = 0;
      return aiResponse;

    } catch (e) {
      ctx.lowConfidenceCount++;

      // Baja confianza x2 → escalar
      if (ctx.lowConfidenceCount >= 2) {
        return await this.escalate(ctx, msg.text);
      }

      return `Vaya, tengo un problema técnico puntual. Para darte la mejor respuesta, ¿te importa si te pongo en contacto directamente con nuestro equipo? Están disponibles en *${COMPANY.email}* 📩`;
    }
  }

  // ── Escalada a humano ─────────────────────────────────────────────────────

  private async escalate(ctx: ConversationContext, trigger: string): Promise<string> {
    ctx.stage = 'ESCALATED';
    await this.notifyOwnerWithLead(ctx, `escalada — trigger: "${trigger.substring(0, 50)}"`);

    if (COMPANY.calendlyUrl && detectBookingIntent(trigger)) {
      return `¡Encantada de conectarte con nuestro equipo! 🤝\n\nPuedes reservar una llamada o demo directamente aquí:\n\n👉 *${COMPANY.calendlyUrl}*\n\nElige el hueco que prefieras y recibirás confirmación inmediata con los detalles.`;
    }

    return `Perfecto, entiendo que esto necesita una atención más personalizada. 🙌\n\nVoy a avisar a *Arturo* ahora mismo para que te contacte directamente.\n\n_Tiempo de respuesta estimado: en las próximas horas en horario laboral._\n\nSi quieres también puedes escribirnos a *${COMPANY.email}* y te respondemos igual de rápido. ¡Hasta pronto! 👋`;
  }

  // ── Notificación al owner con lead ────────────────────────────────────────

  private async notifyOwnerWithLead(ctx: ConversationContext, reason: string): Promise<void> {
    ctx.lead.score = scoreLead(ctx.lead);
    const notification = buildOwnerNotification(ctx) + `\n\n📌 _Razón: ${reason}_`;
    try {
      await this.callbacks.notifyOwner(notification);
    } catch (e) {
      console.error('[Agent] Error notificando al owner:', e);
    }
  }

  // ── Context factory ───────────────────────────────────────────────────────

  private createContext(msg: IncomingMessage): ConversationContext {
    return {
      participantJid:  msg.participant || msg.from,
      senderName:      msg.senderName || 'Cliente',
      stage:           'GREETING',
      history:         [],
      lead:            { score: 'UNKNOWN', qualificationComplete: false, answers: {} },
      qualificationStep: 0,
      lowConfidenceCount: 0,
      startedAt:       new Date().toISOString(),
      lastActiveAt:    new Date().toISOString(),
      isOwner:         msg.isOwner,
      notifiedOwner:   false,
    };
  }

  // ── Human takeover ────────────────────────────────────────────────────────

  // Llamado desde fuera para marcar una conversación como "human took over"
  setHumanTakeover(participantJid: string): boolean {
    const ctx = this.conversations.get(participantJid);
    if (!ctx) return false;
    ctx.stage = 'ESCALATED';
    return true;
  }

  resumeBot(participantJid: string): boolean {
    const ctx = this.conversations.get(participantJid);
    if (!ctx) return false;
    ctx.stage = 'ANSWERING';
    return true;
  }

  getConversation(participantJid: string): ConversationContext | undefined {
    return this.conversations.get(participantJid);
  }

  // ── Mantenimiento ─────────────────────────────────────────────────────────

  purgeOldConversations(): void {
    const cutoff = Date.now() - 4 * 60 * 60 * 1000; // 4h inactividad
    for (const [key, ctx] of this.conversations) {
      if (new Date(ctx.lastActiveAt).getTime() < cutoff) {
        this.conversations.delete(key);
      }
    }
  }

  getStats(): object {
    const total  = this.conversations.size;
    const stages = Array.from(this.conversations.values()).reduce<Record<string, number>>((acc, c) => {
      acc[c.stage] = (acc[c.stage] || 0) + 1;
      return acc;
    }, {});
    return { total, stages };
  }
}
