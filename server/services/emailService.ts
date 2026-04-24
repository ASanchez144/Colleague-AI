/**
 * Servicio de Email — Gmail SMTP (principal) + Resend (fallback)
 *
 * Gmail SMTP no requiere dominio verificado. Funciona con cualquier
 * cuenta de Google usando una App Password (contraseña de aplicación).
 *
 * Variables de entorno necesarias:
 *   GMAIL_USER        → tu cuenta Gmail (ej: eldeteruel2@gmail.com)
 *   GMAIL_APP_PASS    → contraseña de aplicación de Google (16 chars)
 *   ADMIN_EMAIL       → dónde llegan las notificaciones de leads
 *   RESEND_API_KEY    → se usa como fallback si Gmail falla
 */

import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { config } from 'dotenv';
import { logger } from './logger.js';
import { getWelcomeEmailHtml } from '../emails/welcomeTemplate.js';

config();

// ─── Transportes ──────────────────────────────────────────────────────────────

function createGmailTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });
}

const resend = new Resend(process.env.RESEND_API_KEY);

const senderName  = process.env.COMPANY_NAME || 'Tu Socia!';
const gmailUser   = process.env.GMAIL_USER;
const adminEmail  = process.env.ADMIN_EMAIL  || 'eldeteruel2@gmail.com';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface WelcomeEmailParams {
  to: string;
  clientName: string;
  company: string;
  leadId: string;
}

// ─── Helper: enviar via Gmail ─────────────────────────────────────────────────

async function sendViaGmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
    throw new Error('Gmail no configurado (GMAIL_USER / GMAIL_APP_PASS ausentes)');
  }
  const transport = createGmailTransport();
  await transport.sendMail({
    from: `${senderName} <${process.env.GMAIL_USER}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

// ─── Helper: enviar via Resend ────────────────────────────────────────────────

async function sendViaResend(opts: {
  to: string;
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
}): Promise<void> {
  const { data, error } = await resend.emails.send({
    from: `${senderName} <onboarding@resend.dev>`,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
    tags: opts.tags,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  logger.info('Email enviado vía Resend', { id: data?.id });
}

// ─── Enviar con fallback automático ──────────────────────────────────────────

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
}): Promise<void> {
  // Intenta Gmail primero
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    try {
      await sendViaGmail(opts);
      logger.info(`📧 Email enviado vía Gmail → ${opts.to}`);
      return;
    } catch (err: any) {
      logger.warn(`Gmail falló, intentando Resend: ${err.message}`);
    }
  }
  // Fallback: Resend
  await sendViaResend(opts);
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Email de bienvenida al cliente que rellena el formulario.
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const { to, clientName, company, leadId } = params;

  logger.info(`📧 Enviando email de bienvenida a ${to}`, { leadId });

  await sendEmail({
    to,
    subject: `${clientName}, tu agente de IA está en camino 🤖`,
    html: getWelcomeEmailHtml({ clientName, company, leadId }),
    tags: [
      { name: 'type',   value: 'welcome' },
      { name: 'leadId', value: leadId   },
    ],
  });
}

/**
 * Notificación interna al admin cuando llega un nuevo lead.
 */
export async function notifyAdmin(leadSummary: {
  leadId: string;
  name: string;
  company: string;
  email: string;
  templateAssigned: string;
}): Promise<void> {
  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:500px;padding:24px;">
      <h2 style="color:#0f172a;">🔔 Nuevo Lead en el Pipeline</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#64748b;">ID</td>      <td style="padding:8px 0;font-weight:600;">${leadSummary.leadId}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Nombre</td>  <td style="padding:8px 0;font-weight:600;">${leadSummary.name}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Empresa</td> <td style="padding:8px 0;font-weight:600;">${leadSummary.company}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Email</td>   <td style="padding:8px 0;">${leadSummary.email}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Template</td><td style="padding:8px 0;font-weight:600;color:#2563eb;">${leadSummary.templateAssigned}</td></tr>
      </table>
    </div>`;

  try {
    await sendEmail({
      to: adminEmail,
      subject: `🔔 Nuevo lead: ${leadSummary.company} → ${leadSummary.templateAssigned}`,
      html,
      tags: [{ name: 'type', value: 'admin-notification' }],
    });
    logger.info(`📧 Notificación admin enviada → ${adminEmail}`);
  } catch (err) {
    logger.error('Error notificando al admin:', err);
  }
}
