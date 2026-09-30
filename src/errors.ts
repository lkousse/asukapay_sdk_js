import type { AsukaPayErrorCode } from './types';

/**
 * Une erreur de l'API (enveloppe { success: false, error: {...} }, voir
 * erreurs.html). Branchez toujours sur `.code`, jamais sur `.message`
 * (destiné à un humain, peut être reformulé sans préavis).
 */
export class AsukaPayApiError extends Error {
  readonly code: AsukaPayErrorCode;
  readonly httpStatus: number;
  readonly details?: Record<string, string[]>;
  /** Secondes indiquées par l'en-tête `Retry-After`, uniquement sur `rate_limited`. */
  readonly retryAfter?: number;

  constructor(
    code: AsukaPayErrorCode,
    message: string,
    httpStatus: number,
    details?: Record<string, string[]>,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'AsukaPayApiError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

/** La signature d'un webhook ne correspond pas, ou l'horodatage est trop vieux. */
export class AsukaPayWebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AsukaPayWebhookSignatureError';
  }
}
