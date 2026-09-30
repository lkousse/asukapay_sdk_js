import type { HttpClient } from '../httpClient';
import type { ListResult, PageParams, Refund } from '../types';

export class Refunds {
  constructor(private readonly http: HttpClient) {}

  async list(params: PageParams = {}): Promise<ListResult<Refund>> {
    const envelope = await this.http.request('GET', '/refunds', { query: params as Record<string, number> });
    return { data: envelope.data as Refund[], meta: envelope.meta as ListResult<Refund>['meta'] };
  }

  /** `reference` est celle du remboursement, pas celle du paiement d'origine. */
  async get(reference: string): Promise<Refund> {
    const envelope = await this.http.request('GET', `/refunds/${encodeURIComponent(reference)}`);
    return envelope.data as Refund;
  }
}
