import type { HttpClient } from '../httpClient';
import type { CreatePaymentLinkParams, ListResult, PageParams, PaymentLink } from '../types';

export class PaymentLinks {
  constructor(private readonly http: HttpClient) {}

  async create(params: CreatePaymentLinkParams): Promise<PaymentLink> {
    const envelope = await this.http.request('POST', '/payment-links', { body: params });
    return envelope.data as PaymentLink;
  }

  async list(params: PageParams = {}): Promise<ListResult<PaymentLink>> {
    const envelope = await this.http.request('GET', '/payment-links', { query: params as Record<string, number> });
    return { data: envelope.data as PaymentLink[], meta: envelope.meta as ListResult<PaymentLink>['meta'] };
  }

  /** `id` est l'identifiant numérique de la création, pas le fragment de l'URL publique. */
  async get(id: number): Promise<PaymentLink> {
    const envelope = await this.http.request('GET', `/payment-links/${id}`);
    return envelope.data as PaymentLink;
  }
}
