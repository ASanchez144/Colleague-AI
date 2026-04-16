/**
 * Motor de Enrutamiento de Templates
 *
 * Analiza los pain points, herramientas y necesidades del cliente
 * para determinar cuál de los 5 templates base es el más adecuado.
 *
 * Templates:
 *   1. WhatsApp Agent     → Atención al cliente por WhatsApp (Spoky)
 *   2. Voice Agent        → Llamadas automatizadas (Retell AI)
 *   3. Text Processor     → Resumen de emails, comentarios, bandejas
 *   4. Calendar Manager   → Gestión de calendarios y agendamiento
 *   5. Data Analytics     → Análisis de datos y reportes
 */

import { logger } from './logger.js';

export interface RoutingResult {
  templateId: string;
  templateName: string;
  confidence: number;    // 0-100
  reasoning: string;
  secondaryTemplates: string[];
}

interface LeadPayload {
  tools: string[];
  other_tools: string;
  lead_flow: string;
  repetitive_tasks: string;
  bottlenecks: string;
  magic_wand: string;
  sector: string;
  [key: string]: any;
}

// ─── Definición de Templates ─────────────────────────

const TEMPLATES = {
  '01-whatsapp-agent': {
    name: 'Agente de WhatsApp',
    keywords: [
      'whatsapp', 'chat', 'mensajes', 'atención al cliente', 'cliente',
      'responder', 'consultas', 'soporte', 'bot', 'chatbot',
      'comunicación', 'mensajería', 'spoky', 'conversación'
    ],
    toolSignals: ['WhatsApp', 'Slack / Teams'],
    sectorBoost: ['hosteleria', 'retail', 'peluqueria'],
    weight: 1.0
  },
  '02-voice-agent': {
    name: 'Agente de Voz',
    keywords: [
      'llamadas', 'teléfono', 'voz', 'llamar', 'centralita',
      'recepción', 'citas por teléfono', 'retell', 'ivr',
      'contestar', 'telefonía', 'call center'
    ],
    toolSignals: [],
    sectorBoost: ['inmobiliaria', 'peluqueria'],
    weight: 1.0
  },
  '03-text-processor': {
    name: 'Procesador de Textos',
    keywords: [
      'email', 'correo', 'resumen', 'bandeja', 'inbox', 'leer',
      'extraer', 'clasificar', 'filtrar', 'documentos', 'texto',
      'comentarios', 'reseñas', 'reviews', 'procesar'
    ],
    toolSignals: ['Gmail / Outlook', 'Portales web'],
    sectorBoost: [],
    weight: 0.9
  },
  '04-calendar-manager': {
    name: 'Gestor de Calendarios',
    keywords: [
      'calendario', 'agenda', 'cita', 'citas', 'reserva', 'reservas',
      'agendar', 'programar', 'horario', 'disponibilidad',
      'scheduling', 'booking', 'appointment', 'turno'
    ],
    toolSignals: [],
    sectorBoost: ['peluqueria', 'gimnasio'],
    weight: 1.0
  },
  '05-data-analytics': {
    name: 'Agente de Análisis de Datos',
    keywords: [
      'datos', 'análisis', 'reporte', 'informe', 'métricas', 'kpi',
      'dashboard', 'estadísticas', 'excel', 'sheets', 'números',
      'ventas', 'rendimiento', 'predicción', 'forecast'
    ],
    toolSignals: ['Excel / Sheets', 'CRM (HubSpot, Salesforce…)', 'ERP / Facturación'],
    sectorBoost: ['inmobiliaria'],
    weight: 0.9
  }
};

// ─── Lógica de Scoring ──────────────────────────────

function scoreTemplate(
  templateId: string,
  template: typeof TEMPLATES[keyof typeof TEMPLATES],
  payload: LeadPayload
): { score: number; matchedKeywords: string[] } {
  let score = 0;
  const matchedKeywords: string[] = [];

  // Concatenar todos los campos de texto para buscar keywords
  const textBlob = [
    payload.lead_flow,
    payload.repetitive_tasks,
    payload.bottlenecks,
    payload.magic_wand,
    payload.other_tools
  ].filter(Boolean).join(' ').toLowerCase();

  // ── Keyword matching (max 50 puntos) ──
  for (const keyword of template.keywords) {
    if (textBlob.includes(keyword.toLowerCase())) {
      score += 50 / template.keywords.length;
      matchedKeywords.push(keyword);
    }
  }

  // ── Tool signals (max 25 puntos) ──
  if (template.toolSignals.length > 0 && payload.tools) {
    const toolMatches = template.toolSignals.filter(t =>
      payload.tools.includes(t)
    );
    score += (toolMatches.length / template.toolSignals.length) * 25;
    matchedKeywords.push(...toolMatches.map(t => `[tool:${t}]`));
  }

  // ── Sector boost (max 15 puntos) ──
  if (template.sectorBoost.includes(payload.sector)) {
    score += 15;
    matchedKeywords.push(`[sector:${payload.sector}]`);
  }

  // ── Weight adjustment ──
  score *= template.weight;

  return { score, matchedKeywords };
}

// ─── Función Principal de Enrutamiento ───────────────

export function routeToTemplate(payload: LeadPayload): RoutingResult {
  const scores: Array<{
    templateId: string;
    name: string;
    score: number;
    keywords: string[];
  }> = [];

  // Calcular score para cada template
  for (const [id, template] of Object.entries(TEMPLATES)) {
    const { score, matchedKeywords } = scoreTemplate(id, template, payload);
    scores.push({
      templateId: id,
      name: template.name,
      score: Math.round(score * 100) / 100,
      keywords: matchedKeywords
    });
  }

  // Ordenar por score descendente
  scores.sort((a, b) => b.score - a.score);

  const winner = scores[0];
  const totalPossibleScore = 90; // max keyword(50) + tool(25) + sector(15)
  const confidence = Math.min(100, Math.round((winner.score / totalPossibleScore) * 100));

  // Si la confianza es muy baja, asignar WhatsApp como default
  // (es el template más versátil para atención al cliente general)
  if (confidence < 15) {
    logger.warn(`Confianza baja (${confidence}%). Asignando template default: WhatsApp Agent`);
    return {
      templateId: '01-whatsapp-agent',
      templateName: 'Agente de WhatsApp (default)',
      confidence: 10,
      reasoning: `No se encontraron señales claras en los pain points. Se asigna el template de WhatsApp como punto de partida más versátil. Scores: ${scores.map(s => `${s.name}:${s.score}`).join(', ')}`,
      secondaryTemplates: scores.slice(1, 3).map(s => s.templateId)
    };
  }

  const secondaryTemplates = scores
    .slice(1)
    .filter(s => s.score > 0)
    .slice(0, 2)
    .map(s => s.templateId);

  const reasoning = `Matched keywords: [${winner.keywords.join(', ')}]. ` +
    `Score: ${winner.score}/${totalPossibleScore}. ` +
    `Runner-up: ${scores[1]?.name} (${scores[1]?.score})`;

  logger.debug('Routing scores:', { scores });

  return {
    templateId: winner.templateId,
    templateName: winner.name,
    confidence,
    reasoning,
    secondaryTemplates
  };
}
