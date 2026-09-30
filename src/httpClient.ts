import { AsukaPayApiError } from './errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT';

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

export interface AsukaPayClientOptions {
  /** Clé secrète, sk_… en production ou sk_test_… en bac à sable — voir authentification.html. */
  secretKey: string;
  /** Défaut : https://api.asukapay.com/api/v1. */
  baseUrl?: string;
  /**
   * `GET /payments/{reference}` peut redemander l'état à l'opérateur avant de
   * répondre : la doc recommande un délai d'au moins 30 s (reference.html).
   */
  timeoutMs?: number;
  /** Injectable pour les tests ; défaut `globalThis.fetch` (Node 18+). */
  fetch?: typeof fetch;
}

/** Enveloppe brute renvoyée par l'API — voir reference.html et erreurs.html. */
interface ApiEnvelope {
  success: boolean;
  data?: unknown;
  meta?: unknown;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export class HttpClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AsukaPayClientOptions) {
    if (!options.secretKey) {
      throw new Error('AsukaPay: secretKey est requis.');
    }

    this.secretKey = options.secretKey;
    this.baseUrl = (options.baseUrl ?? 'https://api.asukapay.com/api/v1').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.fetchImpl = options.fetch ?? globalThis.fetch;

    if (!this.fetchImpl) {
      throw new Error('AsukaPay: aucun `fetch` disponible — Node 18+ requis, ou fournissez options.fetch.');
    }
  }

  async request(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<ApiEnvelope> {
    const url = new URL(this.baseUrl + path);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;

    try {
      response = await this.fetchImpl(url, {
        method,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          Accept: 'application/json',
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
    } catch (cause) {
      if (controller.signal.aborted) {
        throw new AsukaPayApiError('server_error', `AsukaPay ne répond pas après ${this.timeoutMs}ms.`, 0);
      }
      throw new AsukaPayApiError('server_error', 'AsukaPay est injoignable.', 0, undefined, undefined);
    } finally {
      clearTimeout(timeout);
    }

    let envelope: ApiEnvelope | undefined;

    try {
      envelope = (await response.json()) as ApiEnvelope;
    } catch {
      // Réponse non-JSON (proxy, page d'erreur générique...) : traitée ci-dessous.
    }

    if (response.ok && envelope?.success) {
      return envelope;
    }

    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;

    if (envelope?.error) {
      throw new AsukaPayApiError(
        envelope.error.code,
        envelope.error.message,
        response.status,
        envelope.error.details,
        Number.isFinite(retryAfter) ? retryAfter : undefined
      );
    }

    throw new AsukaPayApiError(
      'server_error',
      `AsukaPay a répondu ${response.status} sans enveloppe d'erreur exploitable.`,
      response.status,
      undefined,
      Number.isFinite(retryAfter) ? retryAfter : undefined
    );
  }
}
