/**
 * Knowledge Base — Tu Socia!
 *
 * Fichero de configuración central del agente.
 * Para adaptar a otro cliente: editar SOLO este fichero.
 *
 * Estructura:
 *   - faqs: preguntas frecuentes con keywords para matching
 *   - services: catálogo de servicios
 *   - company: info corporativa
 *   - qualification: preguntas BANT-lite del flujo de cualificación
 *   - handoffTriggers: palabras/frases que activan escalada a humano
 */

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  tags: string[];
  confidence: number;   // 0-1 — cuánto confiar en este match
}

export interface ServiceEntry {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  idealFor: string[];
  priceRange: string;
  keywords: string[];
}

export interface CompanyConfig {
  name: string;
  tagline: string;
  website: string;
  email: string;
  phone?: string;
  calendlyUrl?: string;   // link de booking, vacío = escalar a humano
  language: string;
  timezone: string;
  businessHours: { start: string; end: string };
  outOfHoursMessage: string;
}

export interface QualificationStep {
  id: string;
  question: string;
  followUp?: string;
  field: string;   // qué campo del lead rellena
}

// ──────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE LA EMPRESA
// ──────────────────────────────────────────────────────────────────────────────

export const COMPANY: CompanyConfig = {
  name:           process.env.COMPANY_NAME    || 'Tu Socia!',
  tagline:        'Tu agencia de automatización con IA para empresas',
  website:        process.env.COMPANY_WEBSITE || 'https://tusocia.es',
  email:          process.env.COMPANY_EMAIL   || 'hola@tusocia.es',
  phone:          process.env.COMPANY_PHONE,
  calendlyUrl:    process.env.CALENDLY_URL,      // si vacío → escalar
  language:       'es',
  timezone:       'Europe/Madrid',
  businessHours:  {
    start: process.env.BUSINESS_HOURS_START || '09:00',
    end:   process.env.BUSINESS_HOURS_END   || '20:00',
  },
  outOfHoursMessage: `Gracias por escribir a *Tu Socia!* 🤖\n\nAhora mismo estamos fuera de horario (${process.env.BUSINESS_HOURS_START || '9:00'}–${process.env.BUSINESS_HOURS_END || '20:00'} hora Madrid).\n\nTe responderemos en cuanto abramos. Si es urgente, escríbenos a *hola@tusocia.es* 💜`,
};

// ──────────────────────────────────────────────────────────────────────────────
//  FLUJO DE CUALIFICACIÓN (BANT-lite, máx 4 preguntas)
// ──────────────────────────────────────────────────────────────────────────────

export const QUALIFICATION_STEPS: QualificationStep[] = [
  {
    id:       'company',
    question: '¿A qué se dedica tu empresa y cuántas personas tenéis en el equipo? 😊',
    field:    'company',
  },
  {
    id:       'painpoint',
    question: '¿Cuál es el mayor dolor en vuestra atención al cliente ahora mismo? Por ejemplo: demasiadas consultas repetitivas, respuestas lentas, no hay cobertura 24/7...',
    field:    'painpoint',
  },
  {
    id:       'timeline',
    question: '¿Con qué urgencia necesitáis una solución? ¿Estáis evaluando opciones ahora o es para los próximos meses?',
    field:    'timeline',
  },
  {
    id:       'contact',
    question: '¡Perfecto! Para poderos enviar información personalizada o preparar una demo, ¿me das tu email o un número de teléfono de contacto? 📩',
    field:    'contact',
  },
];

// ──────────────────────────────────────────────────────────────────────────────
//  TRIGGERS DE ESCALADA A HUMANO
// ──────────────────────────────────────────────────────────────────────────────

export const HANDOFF_TRIGGERS: string[] = [
  'hablar con alguien', 'hablar con una persona', 'hablar con arturo',
  'hablar con un humano', 'agente humano', 'persona real',
  'quiero hablar', 'llamada', 'demo', 'reunión', 'videollamada',
  'speak to', 'talk to', 'human', 'agent',
  'precio exacto', 'presupuesto', 'cuánto cuesta exactamente',
  'contrato', 'factura', 'condiciones', 'negociar',
];

// ──────────────────────────────────────────────────────────────────────────────
//  CATÁLOGO DE SERVICIOS
// ──────────────────────────────────────────────────────────────────────────────

export const SERVICES: ServiceEntry[] = [
  {
    id:          '01-whatsapp-agent',
    name:        'Agente de WhatsApp IA',
    description: 'Un asistente 24/7 en WhatsApp que responde consultas, cualifica leads, agenda citas y escala a tu equipo solo cuando es necesario.',
    benefits:    [
      '✅ Respuesta instantánea 24/7, sin esperas',
      '✅ Cualifica leads automáticamente antes de que lleguen a tu equipo',
      '✅ Se integra con tu CRM o Google Sheets',
      '✅ Aprende de tu knowledge base — responde como tú lo harías',
    ],
    idealFor:    ['hostelería', 'clínicas', 'retail', 'inmobiliarias', 'academias', 'pymes con alto volumen de consultas'],
    priceRange:  'Desde 297€/mes',
    keywords:    ['whatsapp', 'chat', 'mensajes', 'atención', 'bot', 'chatbot', 'consultas', '24/7'],
  },
  {
    id:          '02-voice-agent',
    name:        'Agente de Llamadas IA',
    description: 'Tu asistente que llama y recibe llamadas de clientes, gestiona confirmaciones de cita y filtra leads antes de que lleguen a tu equipo.',
    benefits:    [
      '✅ Llama automáticamente a leads para confirmar interés',
      '✅ Recibe llamadas fuera de horario',
      '✅ Voz natural, no parece un robot',
      '✅ Integración con Twilio y Retell AI',
    ],
    idealFor:    ['centros médicos', 'talleres', 'inmobiliarias', 'empresas con alto volumen de llamadas'],
    priceRange:  'Desde 497€/mes',
    keywords:    ['llamadas', 'voz', 'teléfono', 'llamar', 'voice', 'phone'],
  },
  {
    id:          '03-email-agent',
    name:        'Agente de Email IA',
    description: 'Procesa tu bandeja de entrada, resume tickets de soporte, genera borradores de respuesta y clasifica emails automáticamente.',
    benefits:    [
      '✅ Elimina las horas perdidas gestionando email',
      '✅ Resume largas cadenas de emails en segundos',
      '✅ Responde FAQs sin intervención humana',
    ],
    idealFor:    ['equipos de soporte', 'abogados', 'consultoras', 'cualquier profesional con inbox lleno'],
    priceRange:  'Desde 197€/mes',
    keywords:    ['email', 'correo', 'bandeja', 'inbox', 'soporte', 'tickets'],
  },
  {
    id:          '04-calendar-agent',
    name:        'Agente de Reservas IA',
    description: 'Gestiona tu agenda automáticamente: reservas, recordatorios, reagendaciones y cobro del adelanto. Sin intervención manual.',
    benefits:    [
      '✅ Cero no-shows gracias a recordatorios automáticos',
      '✅ Acepta reservas 24/7 desde WhatsApp, web o Instagram',
      '✅ Se sincroniza con Google Calendar',
    ],
    idealFor:    ['clínicas', 'peluquerías', 'spas', 'consultores', 'formadores'],
    priceRange:  'Desde 297€/mes',
    keywords:    ['citas', 'reservas', 'agenda', 'calendario', 'booking', 'agendar'],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
//  PREGUNTAS FRECUENTES
// ──────────────────────────────────────────────────────────────────────────────

export const FAQS: FAQEntry[] = [
  {
    id:         'what-is',
    question:   '¿Qué es Tu Socia! y qué hacéis?',
    answer:     `*Tu Socia!* es una agencia especializada en automatización con IA para empresas. 🤖\n\nCreamos agentes inteligentes personalizados que trabajan por ti 24/7: atienden clientes en WhatsApp, gestionan llamadas, organizan agendas y procesan emails.\n\nNo vendemos software genérico — diseñamos, configuramos y mantenemos el agente específico para tu negocio. Tú te centras en crecer; nosotros automatizamos lo repetitivo.`,
    keywords:   ['qué es', 'quiénes sois', 'qué hacéis', 'tu socia', 'agencia', 'presentación', 'hola', 'buenas', 'información'],
    tags:       ['general'],
    confidence: 0.9,
  },
  {
    id:         'pricing',
    question:   '¿Cuánto cuesta?',
    answer:     `Nuestros planes empiezan en *197€/mes* y van según el agente que necesites:\n\n💬 *Agente WhatsApp* — desde 297€/mes\n📞 *Agente de llamadas* — desde 497€/mes\n📧 *Agente de email* — desde 197€/mes\n📅 *Agente de reservas* — desde 297€/mes\n\nEn todos los casos incluye: setup inicial, personalización, formación y soporte continuo. Sin sorpresas.\n\n¿Quieres que calculemos el ROI para tu negocio concreto?`,
    keywords:   ['precio', 'coste', 'cuánto', 'tarifa', 'pagar', 'inversión', 'plan', 'pricing', 'euros', '€'],
    tags:       ['pricing'],
    confidence: 0.95,
  },
  {
    id:         'how-long',
    question:   '¿Cuánto tarda en estar listo?',
    answer:     `El tiempo de puesta en marcha depende del agente:\n\n⚡ *Agente WhatsApp básico* — 3–5 días hábiles\n🛠️ *Agente con integraciones CRM* — 1–2 semanas\n🎯 *Setup completo multichannel* — 2–3 semanas\n\nEl proceso es: reunión inicial (30 min) → diseño → configuración → pruebas → lanzamiento. Te acompañamos en cada paso.`,
    keywords:   ['tiempo', 'cuánto tarda', 'plazo', 'rápido', 'cuándo', 'días', 'semanas', 'velocidad'],
    tags:       ['process'],
    confidence: 0.9,
  },
  {
    id:         'how-works',
    question:   '¿Cómo funciona el proceso?',
    answer:     `El proceso de trabajo con nosotros tiene 4 pasos:\n\n1️⃣ *Discovery (30 min)* — Entendemos tu negocio, clientes y dolores\n2️⃣ *Diseño* — Creamos el flujo de conversación y la knowledge base\n3️⃣ *Desarrollo y pruebas* — Configuramos el agente con tu voz y estilo\n4️⃣ *Lanzamiento y seguimiento* — Lo ponemos en producción y medimos resultados\n\nDespués del lanzamiento tienes soporte continuo incluido.`,
    keywords:   ['proceso', 'cómo funciona', 'pasos', 'metodología', 'cómo trabajáis', 'qué incluye'],
    tags:       ['process'],
    confidence: 0.9,
  },
  {
    id:         'contract',
    question:   '¿Hay permanencia o contrato?',
    answer:     `No hay permanencia obligatoria. Trabajamos mes a mes — si en algún momento el agente no te aporta valor, cancelas sin penalización.\n\nSí pedimos un *setup inicial único* (varía según complejidad) y luego la mensualidad de mantenimiento y operación.\n\nConfiamos en los resultados, no en los contratos. 💪`,
    keywords:   ['contrato', 'permanencia', 'compromiso', 'cancelar', 'baja', 'cuándo puedo salir'],
    tags:       ['pricing', 'contract'],
    confidence: 0.9,
  },
  {
    id:         'integrations',
    question:   '¿Con qué herramientas se integra?',
    answer:     `Nuestros agentes se integran con las herramientas que ya usas:\n\n🔗 *CRMs*: HubSpot, Salesforce, Pipedrive, Zoho\n📅 *Calendarios*: Google Calendar, Calendly, Cal.com\n📊 *Datos*: Google Sheets, Notion, Airtable\n💬 *Comunicación*: WhatsApp, Instagram DM, Email\n⚡ *Automatización*: Zapier, Make (n8n)\n\n¿Usas algo que no está en la lista? Seguramente podemos integrarlo igualmente.`,
    keywords:   ['integración', 'conectar', 'CRM', 'hubspot', 'salesforce', 'calendar', 'sheets', 'zapier', 'herramientas'],
    tags:       ['integrations'],
    confidence: 0.9,
  },
  {
    id:         'sectors',
    question:   '¿Para qué sectores trabajáis?',
    answer:     `Trabajamos con empresas de cualquier sector, especialmente donde hay alto volumen de consultas repetitivas:\n\n🏥 Clínicas y salud\n🏨 Hostelería y restauración\n🏠 Inmobiliarias y property management\n✂️ Peluquerías, spas y estética\n📚 Academias y formación\n⚖️ Despachos de abogados y asesorías\n🛒 E-commerce y retail\n\n¿Tu sector no está aquí? Dinos a qué te dedicas y te decimos cómo podemos ayudarte.`,
    keywords:   ['sector', 'industria', 'tipo de empresa', 'hostelería', 'clínica', 'inmobiliaria', 'retail', 'para quién'],
    tags:       ['sectors'],
    confidence: 0.85,
  },
  {
    id:         'demo',
    question:   '¿Puedo ver una demo?',
    answer:     `¡Por supuesto! De hecho, *estás hablando con un ejemplo* de lo que construimos para nuestros clientes 😄\n\nPara ver una demo personalizada para tu negocio, podemos hacer una videollamada de 30 minutos donde te mostramos exactamente cómo funcionaría para tu caso concreto.\n\n¿Te apunto para una demo? Dame un par de huecos que te vengan bien esta semana o la siguiente. 📅`,
    keywords:   ['demo', 'ver', 'ejemplo', 'prueba', 'muéstrame', 'cómo se ve', 'en acción'],
    tags:       ['demo', 'booking'],
    confidence: 0.95,
  },
  {
    id:         'whatsapp-specific',
    question:   '¿El agente de WhatsApp necesita un número nuevo?',
    answer:     `Tienes dos opciones:\n\n📱 *Número nuevo* (recomendado): Te damos o ayudamos a conseguir un número dedicado para el agente. Mantiene separado el canal de negocio del personal.\n\n♻️ *Tu número actual*: Si tienes WhatsApp Business, podemos migrar el agente a ese número. Requiere verificación con Meta.\n\nLo más habitual es un número nuevo — es más rápido y evita interrupciones.`,
    keywords:   ['número', 'sim', 'teléfono nuevo', 'mi número', 'business api', 'whatsapp business'],
    tags:       ['whatsapp', 'technical'],
    confidence: 0.9,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
//  FUNCIÓN DE BÚSQUEDA EN KB
// ──────────────────────────────────────────────────────────────────────────────

export function searchKB(query: string): FAQEntry | null {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let bestMatch: FAQEntry | null = null;
  let bestScore = 0;

  for (const faq of FAQS) {
    let score = 0;
    for (const kw of faq.keywords) {
      const normalizedKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (q.includes(normalizedKw)) {
        score += normalizedKw.length > 5 ? 2 : 1;  // keywords largas puntúan más
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  // Solo devolver si hay match mínimo razonable
  return bestScore >= 1 ? bestMatch : null;
}

export function detectHandoffTrigger(text: string): boolean {
  const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return HANDOFF_TRIGGERS.some(trigger => {
    const t = trigger.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return q.includes(t);
  });
}

export function detectBookingIntent(text: string): boolean {
  const bookingWords = ['demo', 'reunión', 'reunion', 'videollamada', 'llamada', 'agendar', 'cita', 'meeting', 'book'];
  const q = text.toLowerCase();
  return bookingWords.some(w => q.includes(w));
}
