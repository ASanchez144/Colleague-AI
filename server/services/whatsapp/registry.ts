import { MetaCloudProvider } from './metaCloudProvider.js';
import type { WhatsAppProvider, WhatsAppProviderKind } from './types.js';

const providers: Record<WhatsAppProviderKind, WhatsAppProvider | undefined> = {
  'meta-cloud': new MetaCloudProvider(),
  evolution: undefined
};

export function getWhatsAppProvider(kind: WhatsAppProviderKind): WhatsAppProvider {
  const provider = providers[kind];

  if (!provider) {
    throw new Error(`WhatsApp provider no implementado todavía: ${kind}`);
  }

  return provider;
}

export function listAvailableWhatsAppProviders(): WhatsAppProviderKind[] {
  return Object.entries(providers)
    .filter(([, provider]) => Boolean(provider))
    .map(([kind]) => kind as WhatsAppProviderKind);
}
