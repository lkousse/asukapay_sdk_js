import { createHmac, timingSafeEqual } from 'node:crypto';
import { AsukaPayWebhookSignatureError } from './errors';
import type { WebhookEvent } from './types';

export interface VerifyWebhookSignatureOptions {
  /** Corps EXACTEMENT tel que reçu, avant tout parsing JSON (webhooks.html#verifier-la-signature). */
  payload: string;
  /** Valeur brute de l'en-tête `X-AsukaPay-Signature`, forme `t=…,v1=…`. */
  header: string;
  /** Le secret de webhook de l'environnement concerné (`whsec_…`). */
  secret: string;
  /** Rejette un horodatage plus vieux que ceci. Défaut 300 s, comme documenté. */
  toleranceSeconds?: number;
}

/**
 * Vérifie qu'une notification vient bien d'AsukaPay et n'est pas rejouée, puis
 * renvoie l'événement parsé. Lève `AsukaPayWebhookSignatureError` sinon —
 * ne traitez jamais un webhook dont la signature n'a pas été vérifiée.
 */
export function verifyWebhookSignature<T = unknown>(options: VerifyWebhookSignatureOptions): WebhookEvent<T> {
  const { payload, header, secret, toleranceSeconds = 300 } = options;

  const parts = Object.fromEntries(
    header
      .split(',')
      .map((pair) => pair.split('=') as [string, string])
      .filter(([key, value]) => key && value !== undefined)
  );

  const timestamp = parts.t;
  const received = parts.v1;

  if (!timestamp || !received) {
    throw new AsukaPayWebhookSignatureError("En-tête de signature absent ou mal formé (attendu 't=…,v1=…').");
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) {
    throw new AsukaPayWebhookSignatureError(`Horodatage trop ancien (${Math.round(age)}s, tolérance ${toleranceSeconds}s).`);
  }

  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  const receivedBuf = Buffer.from(received, 'hex');

  if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
    throw new AsukaPayWebhookSignatureError('Signature invalide.');
  }

  return JSON.parse(payload) as WebhookEvent<T>;
}
