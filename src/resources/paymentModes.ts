import type { HttpClient } from '../httpClient';
import type { FeeQuote, FeeQuoteParams, ListPaymentModesParams, PaymentModeSummary } from '../types';

export class PaymentModes {
  constructor(private readonly http: HttpClient) {}

  /** Non paginé : le catalogue complet des moyens actifs sur votre compte. */
  async list(params: ListPaymentModesParams = {}): Promise<PaymentModeSummary[]> {
    const envelope = await this.http.request('GET', '/payment-modes', { query: params as Record<string, string> });
    return envelope.data as PaymentModeSummary[];
  }

  /** Calcule commission et total sans rien créer — à appeler avant d'afficher un prix. */
  async fees(params: FeeQuoteParams): Promise<FeeQuote> {
    const envelope = await this.http.request('POST', '/payment-modes/fees', { body: params });
    return envelope.data as FeeQuote;
  }
}
