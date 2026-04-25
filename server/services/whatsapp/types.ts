export type WhatsAppProviderKind = 'meta-cloud' | 'evolution';

export type WhatsAppConnectionStatus =
  | 'not_configured'
  | 'configured'
  | 'connected'
  | 'error';

export interface WhatsAppClientConfig {
  provider: WhatsAppProviderKind;
  clientId: string;
  displayName?: string;

  // Meta Cloud API
  graphApiVersion?: string;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  verifyToken?: string;

  // Evolution API legacy/demo
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstanceName?: string;
}

export interface SendTextInput {
  to: string;
  text: string;
  previewUrl?: boolean;
}

export interface SendTextResult {
  ok: boolean;
  provider: WhatsAppProviderKind;
  messageId?: string;
  raw?: unknown;
}

export interface WhatsAppProvider {
  readonly kind: WhatsAppProviderKind;
  getStatus(config: WhatsAppClientConfig): Promise<WhatsAppConnectionStatus>;
  sendText(config: WhatsAppClientConfig, input: SendTextInput): Promise<SendTextResult>;
}

export interface IncomingWhatsAppMessage {
  provider: WhatsAppProviderKind;
  clientId?: string;
  phoneNumberId?: string;
  wabaId?: string;
  from: string;
  messageId: string;
  type: string;
  text?: string;
  timestamp?: string;
  raw: unknown;
}
