/**
 * Tu Socia! - Servidor Principal
 * Pipeline de automatización para creación de bots personalizados
 *
 * Endpoints:
 *   POST /api/webhook/lead     → Recibe formularios de la web
 *   GET  /api/leads             → Lista leads registrados (admin)
 *   GET  /api/leads/:id         → Detalle de un lead
 *   GET  /api/health            → Health check
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './services/logger.js';
import { sendWelcomeEmail, notifyAdmin } from './services/emailService.js';
import { routeToTemplate } from './services/routingEngine.js';
import { registerLead, getLeads, getLeadById, updateLeadStatus } from './services/leadRegistry.js';

config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ─── Health Check ────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'tu-socia-pipeline',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ─── WEBHOOK: Recibir nuevo lead del formulario ──────
app.post('/api/webhook/lead', async (req, res) => {
  // ╔══ DIAGNÓSTICO PASO 1: ENTRADA DEL WEBHOOK ══════════════════════╗
  console.log('\n\n============================================================');
  console.log('[DIAG] 📥 WEBHOOK RECIBIDO:', new Date().toISOString());
  console.log('[DIAG] Headers relevantes:', {
    'content-type': req.headers['content-type'],
    origin: req.headers['origin'],
    'x-forwarded-for': req.headers['x-forwarded-for']
  });
  console.log('[DIAG] Body completo:', JSON.stringify(req.body, null, 2));
  console.log('[DIAG] ENV críticas:', {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `✅ presente (${process.env.RESEND_API_KEY.slice(0,8)}...)` : '❌ AUSENTE',
    FROM_EMAIL: process.env.FROM_EMAIL || '⚠️  no definido (usará hola@tusocia.es)',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || '⚠️  no definido (usará arturoeldeteruel@gmail.com)',
    EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || '❌ AUSENTE — WhatsApp no configurado',
    WHATSAPP_GROUP_ID: process.env.WHATSAPP_GROUP_ID || '❌ AUSENTE — WhatsApp no configurado',
  });
  console.log('============================================================\n');
  // ╚════════════════════════════════════════════════════════════════╝

  try {
    const payload = req.body;

    // Validación mínima
    if (!payload.name || !payload.email) {
      console.log('[DIAG] ❌ Validación fallida — name o email ausentes');
      return res.status(400).json({
        error: 'Campos requeridos: name, email'
      });
    }

    const leadId = uuidv4();
    const timestamp = new Date().toISOString();

    logger.info(`📥 Nuevo lead recibido: ${payload.name} (${payload.email})`, { leadId });

    // ─── PASO 1: Registrar el lead ───────────────────
    console.log(`[DIAG] 💾 PASO 1 — Intentando registrar lead ${leadId}...`);
    const lead = await registerLead({
      id: leadId,
      ...payload,
      status: 'received',
      createdAt: timestamp,
      pipeline: {
        emailSent: false,
        templateAssigned: null,
        agentCreated: false
      }
    });
    console.log(`[DIAG] ✅ PASO 1 OK — Lead registrado:`, JSON.stringify(lead, null, 2));

    logger.info(`✅ Lead registrado: ${leadId}`);

    // ─── PASO 2: Enviar email de bienvenida ──────────
    console.log(`\n[DIAG] 📧 PASO 2 — Intentando enviar email de bienvenida a: ${payload.email}`);
    try {
      await sendWelcomeEmail({
        to: payload.email,
        clientName: payload.name,
        company: payload.company,
        leadId
      });
      await updateLeadStatus(leadId, {
        status: 'email_sent',
        'pipeline.emailSent': true
      });
      console.log(`[DIAG] ✅ PASO 2 OK — Email enviado a ${payload.email}`);
      logger.info(`📧 Email de bienvenida enviado a ${payload.email}`);
    } catch (emailError: any) {
      console.log(`[DIAG] ❌ PASO 2 FALLÓ — Error enviando email:`);
      console.log(`[DIAG]   Mensaje: ${emailError?.message}`);
      console.log(`[DIAG]   Stack:   ${emailError?.stack}`);
      console.log(`[DIAG]   Raw:     ${JSON.stringify(emailError)}`);
      logger.error(`❌ Error enviando email: ${emailError}`);
      // No bloqueamos el pipeline por un fallo de email
    }

    // ─── PASO 3: Análisis y enrutamiento a template ──
    console.log(`\n[DIAG] 🔀 PASO 3 — Ejecutando routeToTemplate...`);
    const routing = routeToTemplate(payload);
    console.log(`[DIAG] ✅ PASO 3 OK — Resultado routing:`, JSON.stringify(routing, null, 2));
    await updateLeadStatus(leadId, {
      status: 'routed',
      'pipeline.templateAssigned': routing.templateId,
      'pipeline.confidence': routing.confidence,
      'pipeline.reasoning': routing.reasoning
    });

    logger.info(`🔀 Lead enrutado → Template ${routing.templateId}: ${routing.templateName}`, {
      confidence: routing.confidence,
      reasoning: routing.reasoning
    });

    // ─── PASO 3b: Notificar al admin ─────────────────
    // ╔══ DIAGNÓSTICO PASO 3b: NOTIFICACIÓN ADMIN (EMAIL) ═══════════╗
    console.log(`\n[DIAG] 🔔 PASO 3b — Disparando notifyAdmin...`);
    console.log(`[DIAG] ⚠️  NOTA: notifyAdmin SOLO envía email — NO hay llamada a WhatsApp/EvolutionAPI en el código actual`);
    // ╚════════════════════════════════════════════════════════════════╝
    notifyAdmin({
      leadId,
      name: payload.name,
      company: payload.company || '—',
      email: payload.email,
      templateAssigned: routing.templateName
    }).then(() => {
      console.log(`[DIAG] ✅ PASO 3b OK — notifyAdmin completado`);
    }).catch(e => {
      console.log(`[DIAG] ❌ PASO 3b FALLÓ — notifyAdmin error:`, e?.message, JSON.stringify(e));
      logger.warn('Admin notify silenced:', e);
    });

    // ─── PASO 3c: Notificación WhatsApp (NO IMPLEMENTADO) ────────────
    // ╔══ DIAGNÓSTICO PASO 3c: WHATSAPP ════════════════════════════════╗
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;
    const groupId = process.env.WHATSAPP_GROUP_ID;
    if (!evolutionUrl || !groupId) {
      console.log(`\n[DIAG] ⚠️  PASO 3c — WhatsApp NO configurado:`);
      console.log(`[DIAG]   EVOLUTION_API_URL: ${evolutionUrl || 'NO DEFINIDA'}`);
      console.log(`[DIAG]   WHATSAPP_GROUP_ID: ${groupId || 'NO DEFINIDA'}`);
      console.log(`[DIAG]   → Esto explica por qué no llegan mensajes de WhatsApp`);
    } else {
      console.log(`\n[DIAG] 📱 PASO 3c — EvolutionAPI configurada, intentando envío WhatsApp...`);
      console.log(`[DIAG]   URL: ${evolutionUrl} | Group: ${groupId}`);
      // Intento real de envío para diagnóstico
      const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'tu-socia';
      fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey || '' },
        body: JSON.stringify({
          number: groupId,
          text: `🔔 *Nuevo lead:* ${payload.name} (${payload.company || '—'})\n📧 ${payload.email}\n🤖 Template: ${routing.templateName}`
        })
      })
        .then(r => r.json())
        .then(data => console.log(`[DIAG] ✅ PASO 3c OK — WhatsApp response:`, JSON.stringify(data)))
        .catch(err => console.log(`[DIAG] ❌ PASO 3c FALLÓ — WhatsApp error:`, err?.message));

    }
    // ╚════════════════════════════════════════════════════════════════╝

    // ─── PASO 4: Responder al frontend ───────────────
    console.log(`\n[DIAG] ✅ PASO 4 — Enviando respuesta 201 al frontend`);
    res.status(201).json({
      success: true,
      leadId,
      message: 'Solicitud recibida correctamente. Tu agente está en proceso de diseño.',
      routing: {
        template: routing.templateName,
        confidence: routing.confidence
      }
    });

    logger.info(`🚀 Iniciando pipeline de creación para lead ${leadId}...`);
    // TODO: dispatchAgentCreation(leadId, routing.templateId, payload);

  } catch (error: any) {
    console.log(`\n[DIAG] 💥 ERROR GLOBAL EN WEBHOOK:`);
    console.log(`[DIAG]   Mensaje: ${error?.message}`);
    console.log(`[DIAG]   Stack:   ${error?.stack}`);
    logger.error('❌ Error en webhook:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Tu solicitud ha sido registrada. Nos pondremos en contacto pronto.'
    });
  }
});

// ─── ADMIN: Listar leads ─────────────────────────────
app.get('/api/leads', async (_req, res) => {
  try {
    const leads = await getLeads();
    res.json({ leads, total: leads.length });
  } catch (error) {
    logger.error('Error listando leads:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── ADMIN: Detalle de un lead ───────────────────────
app.get('/api/leads/:id', async (req, res) => {
  try {
    const lead = await getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }
    res.json(lead);
  } catch (error) {
    logger.error('Error obteniendo lead:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── SUPABASE PROXY: WhatsApp notify ────────────────
// Llamado por la Edge Function de Supabase para enviar notificaciones WhatsApp
app.post('/api/notify-whatsapp', async (req, res) => {
  const { name, email, company, templateName, leadId } = req.body;
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const evolutionKey = process.env.EVOLUTION_API_KEY;
  const groupId = process.env.WHATSAPP_GROUP_ID;
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'tu-socia';

  if (!evolutionUrl || !groupId) {
    return res.status(500).json({ error: 'WhatsApp no configurado' });
  }

  try {
    const r = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey || '' },
      body: JSON.stringify({
        number: groupId,
        text: `🔔 *Nuevo lead:* ${name} (${company || '—'})\n📧 ${email}\n🤖 Template: ${templateName}\n🆔 ${leadId}`
      })
    });
    const data = await r.json();
    logger.info('📱 WhatsApp enviado desde proxy Supabase', { leadId });
    res.json({ ok: true, data });
  } catch (err: any) {
    logger.error('Error en proxy WhatsApp:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Iniciar servidor ────────────────────────────────
app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════╗
║   💜 Tu Socia! Pipeline Server                  ║
║   Puerto: ${String(PORT).padEnd(39)}║
║   Webhook: POST /api/webhook/lead                ║
║   Estado: ACTIVO                                 ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
