import type { HttpClient } from '../httpClient';
import type { CreatePaymentParams, ListPaymentsParams, ListResult, Payment, RefundPaymentParams, Refund } from '../types';

export class Payments {
  constructor(private readonly http: HttpClient) {}

  /**
   * Renvoyer un `external_id` déjà utilisé retourne le paiement existant au
   * lieu d'en créer un second (reference.html#creer-un-paiement).
   */
  async create(params: CreatePaymentParams): Promise<Payment> {
    const envelope = await this.http.request('POST', '/payments', { body: params });
    return envelope.data as Payment;
  }

  async list(params: ListPaymentsParams = {}): Promise<ListResult<Payment>> {
    const envelope = await this.http.request('GET', '/payments', { query: params as Record<string, string | number> });
    return { data: envelope.data as Payment[], meta: envelope.meta as ListResult<Payment>['meta'] };
  }

  /** `reference` accepte la référence AsukaPay ou votre external_id. */
  async get(reference: string): Promise<Payment> {
    const envelope = await this.http.request('GET', `/payments/${encodeURIComponent(reference)}`);
    return envelope.data as Payment;
  }

  /** Remboursement intégral uniquement — voir remboursements.html. */
  async refund(reference: string, params: RefundPaymentParams = {}): Promise<Refund> {
    const envelope = await this.http.request('POST', `/payments/${encodeURIComponent(reference)}/refund`, { body: params });
    return envelope.data as Refund;
  }
}
