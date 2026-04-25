import type {
  SendTextInput,
  SendTextResult,
  WhatsAppClientConfig,
  WhatsAppConnectionStatus,
  WhatsAppProvider
} from './types.js';

function requireMetaConfig(config: WhatsAppClientConfig): void {
  const missing: string[] = [];
  if (!config.phoneNumberId) missing.push('phoneNumberId');
  if (!config.accessToken) missing.push('accessToken');

  if (missing.length > 0) {
    throw new Error(`Meta Cloud API config incompleta: ${missing.join(', ')}`);
  }
}

function getGraphVersion(config: WhatsAppClientConfig): string {
  return config.graphApiVersion || process.env.META_GRAPH_API_VERSION || 'v22.0';
}

export class MetaCloudProvider implements WhatsAppProvider {
  readonly kind = 'meta-cloud' as const;

  async getStatus(config: WhatsAppClientConfig): Promise<WhatsAppConnectionStatus> {
    if (!config.phoneNumberId || !config.accessToken) return 'not_configured';

    try {
      const version = getGraphVersion(config);
      const url = `https://graph.facebook.com/${version}/${config.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.accessToken}`
        }
      });

      if (!response.ok) return 'error';
      return 'connected';
    } catch {
      return 'error';
    }
  }

  async sendText(config: WhatsAppClientConfig, input: SendTextInput): Promise<SendTextResult> {
    requireMetaConfig(config);

    const version = getGraphVersion(config);
    const url = `https://graph.facebook.com/${version}/${config.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: input.to,
        type: 'text',
        text: {
          preview_url: input.previewUrl ?? false,
          body: input.text
        }
      })
    });

    const raw = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new Error(`Meta Cloud API sendText error ${response.status}: ${JSON.stringify(raw)}`);
    }

    const messageId = Array.isArray((raw as any)?.messages)
      ? (raw as any).messages[0]?.id
      : undefined;

    return {
      ok: true,
      provider: this.kind,
      messageId,
      raw
    };
  }
}
