/**
 * Servicio de Email con Resend
 * Envía emails de bienvenida automatizados a los clientes
 */

import { Resend } from 'resend';
import { config } from 'dotenv';
import { logger } from './logger.js';
import { getWelcomeEmailHtml } from '../emails/welcomeTemplate.js';

config();

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailParams {
  to: string;
  clientName: string;
  company: string;
  leadId: string;
}

/**
 * Envía el email de bienvenida al cliente indicando que su agente
 * está en proceso de diseño.
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const { to, clientName, company, leadId } = params;

  const fromEmail = process.env.FROM_EMAIL || 'hola@tusocia.es';

  try {
    const { data, error } = await resend.emails.send({
      from: `Tu Socia! <${fromEmail}>`,
      to: [to],
      subject: `${clientName}, tu agente de IA está en camino 🤖`,
      html: getWelcomeEmailHtml({ clientName, company, leadId }),
      tags: [
        { name: 'type', value: 'welcome' },
        { name: 'leadId', value: leadId }
      ]
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    logger.info(`Email enviado exitosamente`, { emailId: data?.id, to, leadId });

  } catch (error) {
    logger.error(`Error enviando email de bienvenida`, { to, leadId, error });
    throw error;
  }
}

/**
 * Envía notificación al admin cuando llega un nuevo lead
 */
export async function notifyAdmin(leadSummary: {
  leadId: string;
  name: string;
  company: string;
  email: string;
  templateAssigned: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'arturoeldeteruel@gmail.com';
  const fromEmail = process.env.FROM_EMAIL || 'hola@tusocia.es';

  try {
    await resend.emails.send({
      from: `Tu Socia! Pipeline <${fromEmail}>`,
      to: [adminEmail],
      subject: `🔔 Nuevo lead: ${leadSummary.company} → ${leadSummary.templateAssigned}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; padding: 24px;">
          <h2 style="color: #0f172a;">Nuevo Lead en el Pipeline</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748b;">ID</td><td style="padding: 8px 0; font-weight: 600;">${leadSummary.leadId}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Nombre</td><td style="padding: 8px 0; font-weight: 600;">${leadSummary.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Empresa</td><td style="padding: 8px 0; font-weight: 600;">${leadSummary.company}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0;">${leadSummary.email}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Template</td><td style="padding: 8px 0; font-weight: 600; color: #2563eb;">${leadSummary.templateAssigned}</td></tr>
          </table>
        </div>
      `,
      tags: [{ name: 'type', value: 'admin-notification' }]
    });
  } catch (error) {
    logger.error('Error notificando al admin:', error);
  }
}
