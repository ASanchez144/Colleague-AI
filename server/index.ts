/**
 * Tu Socia! - Servidor Principal
 * Pipeline de automatización para creación de bots personalizados
 *
 * Endpoints:
 *   POST /api/webhook/lead     -> Recibe formularios de la web
 *   POST /api/notify-lead      -> Proxy de notificaciones (Supabase Edge Function)
 *   GET  /api/leads             -> Lista leads registrados (admin) [X-Admin-Key]
 *   GET  /api/leads/:id         -> Detalle de un lead            [X-Admin-Key]
 *   GET  /api/jobs/:leadId      -> Estado del pipeline            [X-Admin-Key]
 *   GET  /api/health            -> Health check
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './services/logger.js';
import { sendWelcomeEmail, notifyAdmin } from './services/emailService.js';
import { routeToTemplate } from './services/routingEngine.js';
import { registerLead, getLeads, getLeadById, updateLeadStatus } from './services/leadRegistry.js';
import { PipelineOrchestrator } from '../pipeline/orchestrator.js';

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Orchestrator singleton
const orchestrator = new PipelineOrchestrator(
  process.env.TEMPLATES_DIR
    ? path.resolve(__dirname, '..', process.env.TEMPLATES_DIR)
    : path.resolve(__dirname, '..', 'templates'),
  process.env.CLIENTS_DIR
    ? path.resolve(__dirname, '..', process.env.CLIENTS_DIR)
    : path.resolve(__dirname, '..', 'clients')
);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Admin API Key middleware
function requireAdminKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    logger.error('ADMIN_API_KEY no configurada');
    return res.status(503).json({ error: 'Admin access not configured' });
  }
  const provided = req.headers['x-admin-key'] as string | undefined;
  if (!provided || provided !== adminKey) {
    logger.warn(`Acceso admin rechazado desde ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tu-socia-pipeline', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.post('/api/webhook/lead', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.name || !payload.email) {
      return res.status(400).json({ error: 'Campos requeridos: name, email' });
    }

    const leadId = uuidv4();
    const timestamp = new Date().toISOString();
    logger.info(`Nuevo lead: ${payload.name} (${payload.email})`, { leadId });

    await registerLead({
      id: leadId, ...payload,
      status: 'received',
      createdAt: timestamp,
      pipeline: { emailSent: false, templateAssigned: null, agentCreated: false }
    });

    try {
      await sendWelcomeEmail({ to: payload.email, clientName: payload.name, company: payload.company, leadId });
      await updateLeadStatus(leadId, { status: 'email_sent', 'pipeline.emailSent': true });
      logger.info(`Email bienvenida enviado a ${payload.email}`);
    } catch (emailError: any) {
      logger.error(`Error email: ${emailError}`);
    }

    const routing = routeToTemplate(payload);
    await updateLeadStatus(leadId, {
      status: 'routed',
      'pipeline.templateAssigned': routing.templateId,
      'pipeline.confidence': routing.confidence,
      'pipeline.reasoning': routing.reasoning
    });
    logger.info(`Lead enrutado a ${routing.templateId} (${routing.confidence}% confianza)`, { leadId });

    notifyAdmin({ leadId, name: payload.name, company: payload.company || '---', email: payload.email, templateAssigned: routing.templateName })
      .catch(e => logger.warn('Admin notify silenced:', e));

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const groupId = process.env.WHATSAPP_GROUP_ID;
    if (evolutionUrl && groupId) {
      const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'tu-socia';
      fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': process.env.EVOLUTION_API_KEY || '' },
        body: JSON.stringify({ number: groupId, text: `Nuevo lead: ${payload.name} (${payload.company || '---'}) | ${payload.email} | Template: ${routing.templateName}` })
      }).catch(err => logger.error(`WhatsApp error: ${err?.message}`));
    }

    res.status(201).json({
      success: true, leadId,
      message: 'Solicitud recibida correctamente. Tu agente esta en proceso de diseno.',
      routing: { template: routing.templateName, confidence: routing.confidence }
    });

    // Fire-and-forget pipeline
    const clientContext = {
      leadId,
      company: payload.company || payload.name,
      sector: payload.sector || 'general',
      tools: Array.isArray(payload.tools)
        ? payload.tools
        : (payload.tools || '').split(',').map((t: string) => t.trim()).filter(Boolean),
      painPoints: {
        repetitiveTasks: payload.repetitive_tasks || '',
        bottlenecks: payload.bottlenecks || '',
        magicWand: payload.magic_wand || ''
      },
      security: payload.security || ''
    };

    orchestrator.startPipeline(leadId, routing.templateId, clientContext)
      .then(job => {
        logger.info(`Pipeline iniciado: job=${job.id}`, { leadId });
        return updateLeadStatus(leadId, { 'pipeline.jobId': job.id, 'pipeline.agentCreated': false });
      })
      .catch(err => logger.error(`Error iniciando pipeline para ${leadId}:`, err));

  } catch (error: any) {
    logger.error('Error en webhook:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/leads', requireAdminKey, async (_req, res) => {
  try {
    const leads = await getLeads();
    res.json({ leads, total: leads.length });
  } catch (error) {
    logger.error('Error listando leads:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/leads/:id', requireAdminKey, async (req, res) => {
  try {
    const lead = await getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });
    res.json(lead);
  } catch (error) {
    logger.error('Error obteniendo lead:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/jobs/:leadId', requireAdminKey, async (req, res) => {
  try {
    const job = await orchestrator.getJobByLeadId(req.params.leadId);
    if (!job) return res.status(404).json({ error: 'Job no encontrado para ese leadId' });
    res.json(job);
  } catch (error) {
    logger.error('Error obteniendo job:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/notify-lead', async (req, res) => {
  const { name, email, company, templateName, leadId } = req.body;
  const results: Record<string, any> = {};

  try {
    await sendWelcomeEmail({ to: email, clientName: name, company, leadId });
    results.welcomeEmail = 'ok';
    logger.info(`Email bienvenida -> ${email}`, { leadId });
  } catch (err: any) {
    results.welcomeEmail = `error: ${err.message}`;
    logger.error(`Error email bienvenida: ${err.message}`);
  }

  try {
    await notifyAdmin({ leadId, name, company: company || '---', email, templateAssigned: templateName });
    results.adminEmail = 'ok';
    logger.info('Email admin enviado', { leadId });
  } catch (err: any) {
    results.adminEmail = `error: ${err.message}`;
    logger.error(`Error email admin: ${err.message}`);
  }

  try {
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const groupId = process.env.WHATSAPP_GROUP_ID;
    if (evolutionUrl && groupId) {
      const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'tu-socia';
      const r = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': process.env.EVOLUTION_API_KEY || '' },
        body: JSON.stringify({ number: groupId, text: `Nuevo lead: ${name} (${company || '---'}) | ${email} | Template: ${templateName} | ${leadId}` })
      });
      const data = await r.json();
      results.whatsapp = r.ok ? 'ok' : `error: ${JSON.stringify(data)}`;
      logger.info('WhatsApp enviado', { leadId });
    } else {
      results.whatsapp = 'skipped: no configurado';
    }
  } catch (err: any) {
    results.whatsapp = `error: ${err.message}`;
    logger.error(`Error WhatsApp: ${err.message}`);
  }

  logger.info('Notificaciones completadas', { leadId, results });
  res.json({ ok: true, results });
});

app.listen(PORT, () => {
  logger.info(`Tu Socia! Pipeline Server activo en puerto ${PORT}`);
});

export default app;
