/**
 * Template HTML del email de bienvenida
 * Se envía automáticamente al recibir un nuevo lead
 */

interface WelcomeTemplateParams {
  clientName: string;
  company: string;
  leadId: string;
}

export function getWelcomeEmailHtml(params: WelcomeTemplateParams): string {
  const { clientName, company, leadId } = params;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9;">
  <div style="max-width: 580px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        Tu <span style="color: #7C3AED;">Socia!</span>
      </span>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 40px 32px; border: 1px solid #e2e8f0;">

      <!-- Icon -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; background: #eff6ff; border-radius: 14px; line-height: 56px; font-size: 28px;">
          🤖
        </div>
      </div>

      <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; text-align: center; margin: 0 0 8px;">
        ¡Hola ${clientName}!
      </h1>

      <p style="font-size: 15px; color: #64748b; text-align: center; line-height: 1.6; margin: 0 0 28px;">
        Hemos recibido tu solicitud para <strong style="color: #0f172a;">${company}</strong>.
        Tu agente de IA personalizado ya está en proceso de diseño.
      </p>

      <!-- Steps -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
        <p style="font-size: 13px; font-weight: 600; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px;">
          Próximos pasos
        </p>

        <div style="display: flex; align-items: flex-start; margin-bottom: 14px;">
          <div style="min-width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 12px;">✓</div>
          <div>
            <p style="font-size: 14px; color: #0f172a; font-weight: 600; margin: 0;">Solicitud recibida</p>
            <p style="font-size: 13px; color: #64748b; margin: 2px 0 0;">Tus necesidades han sido registradas</p>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start; margin-bottom: 14px;">
          <div style="min-width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 12px;">2</div>
          <div>
            <p style="font-size: 14px; color: #0f172a; font-weight: 600; margin: 0;">Análisis en curso</p>
            <p style="font-size: 13px; color: #64748b; margin: 2px 0 0;">Estamos diseñando la solución óptima para tu negocio</p>
          </div>
        </div>

        <div style="display: flex; align-items: flex-start;">
          <div style="min-width: 24px; height: 24px; background: #e2e8f0; color: #64748b; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; margin-right: 12px;">3</div>
          <div>
            <p style="font-size: 14px; color: #0f172a; font-weight: 600; margin: 0;">Demo personalizada</p>
            <p style="font-size: 13px; color: #64748b; margin: 2px 0 0;">Te contactaremos en menos de 48h con tu propuesta</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center;">
        <p style="font-size: 14px; color: #64748b; margin: 0 0 16px;">
          ¿Tienes preguntas mientras tanto?
        </p>
        <a href="mailto:hola@tusocia.es" style="display: inline-block; background: #7C3AED; color: white; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px;">
          Escríbenos
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 24px;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        Tu Socia! · Madrid, España
      </p>
      <p style="font-size: 11px; color: #cbd5e1; margin: 4px 0 0;">
        Ref: ${leadId.slice(0, 8)}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
