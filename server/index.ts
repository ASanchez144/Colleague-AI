/**
 * Tu Socia! - Servidor Principal
 * Pipeline de automatización para creación de bots personalizados
 *
 * Endpoints:
 *   POST /api/webhook/lead     → Recibe formularios de la web
 *   POST /api/notify-lead      → Proxy de notificaciones (llamado desde Supabase Edge Function)
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
  try {
    const payload = req.body;

    // Validación mínima
    if (!payload.name || !payload.email) {
      return res.status(400).json({
        error: 'Campos requeridos: name, email'
      });
    }

    const leadId = uuidv4();
    const timestamp = new Date().toISOString();

    logger.info(`📥 Nuevo lead recibido: ${payload.name} (${payload.email})`, { leadId });

    // ─── PASO 1: Registrar el lead ───────────────────
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

    logger.info(`✅ Lead registrado: ${leadId}`);

    // ─── PASO 2: Enviar email de bienvenida ──────────
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
      logger.info(`📧 Email de bienvenida enviado a ${payload.email}`);
    } catch (emailError: any) {
      logger.error(`❌ Error enviando email: ${emailError}`);
      // No bloqueamos el pipeline por un fallo de email
    }

    // ─── PASO 3: Análisis y enrutamiento a template ──
    const routing = routeToTemplate(payload);
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

    // ─── PASO 3b: Notificar al admin (email) ─────────
    notifyAdmin({
      leadId,
      name: payload.name,
      company: payload.company || '—',
      email: payload.email,
      templateAssigned: routing.templateName
    }).catch(e => logger.warn('Admin notify silenced:', e));

    // ─── PASO 3c: Notificación WhatsApp ──────────────
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;
    const groupId = process.env.WHATSAPP_GROUP_ID;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'tu-socia';

    if (evolutionUrl && groupId) {
      fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey || '' },
        body: JSON.stringify({
          number: groupId,
          text: `🔔 *Nuevo lead:* ${payload.name} (${payload.company || '—'})\n📧 ${payload.email}\n🤖 Template: ${routing.templateName}`
        })
      })
        .then(r => r.json())
        .then(data => logger.info(`📱 WhatsApp enviado`, { response: JSON.stringify(data) }))
        .catch(err => logger.error(`❌ WhatsApp error: ${err?.message}`));
    }

    // ─── PASO 4: Responder al frontend ───────────────
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

// ─── SUPABASE PROXY: Notificaciones completas (Email Gmail + WhatsApp) ──────
// La Edge Function llama aquí — este servidor tiene Gmail SMTP y Evolution API
app.post('/api/notify-lead', async (req, res) => {
  const { name, email, company, templateName, leadId } = req.body;
  const results: Record<string, any> = {};

  // ── Email de bienvenida al cliente ──────────────────────────────────────────
  try {
    await sendWelcomeEmail({ to: email, clientName: name, company, leadId });
    results.welcomeEmail = 'ok';
    logger.info(`📧 Email bienvenida → ${email}`, { leadId });
  } catch (err: any) {
    results.welcomeEmail = `error: ${err.message}`;
    logger.error(`Error email bienvenida: ${err.message}`);
  }

  // ── Email de notificación al admin ──────────────────────────────────────────
  try {
    await notifyAdmin({ leadId, name, company: company || '—', email, templateAssigned: templateName });
    results.adminEmail = 'ok';
    logger.info(`📧 Email admin enviado`, { leadId });
  } catch (err: any) {
    results.adminEmail = `error: ${err.message}`;
    logger.error(`Error email admin: ${err.message}`);
  }

  // ── WhatsApp via Evolution API ──────────────────────────────────────────────
  try {
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;
    const groupId = process.env.WHATSAPP_GROUP_ID;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'tu-socia';

    if (evolutionUrl && groupId) {
      const r = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey || '' },
        body: JSON.stringify({
          number: groupId,
          text: `🔔 *Nuevo lead:* ${name} (${company || '—'})\n📧 ${email}\n🤖 Template: ${templateName}\n🆔 ${leadId}`
        })
      });
      const data = await r.json();
      results.whatsapp = r.ok ? 'ok' : `error: ${JSON.stringify(data)}`;
      logger.info(`📱 WhatsApp enviado`, { leadId });
    } else {
      results.whatsapp = 'skipped: no configurado';
      logger.warn('WhatsApp no configurado (EVOLUTION_API_URL o WHATSAPP_GROUP_ID ausentes)');
    }
  } catch (err: any) {
    results.whatsapp = `error: ${err.message}`;
    logger.error(`Error WhatsApp: ${err.message}`);
  }

  logger.info('📬 Notificaciones completadas', { leadId, results });
  res.json({ ok: true, results });
});

// ─── Iniciar servidor ────────────────────────────────
app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════╗
║   💜 Tu Socia! Pipeline Server                  ║
║   Puerto: ${String(PORT).padEnd(39)}║
║   Webhook: POST /api/webhook/lead                ║
║   Notify:  POST /api/notify-lead                 ║
║   Estado: ACTIVO                                 ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
