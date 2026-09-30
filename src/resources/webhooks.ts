import type { HttpClient } from '../httpClient';
import type { ListResult, PageParams, SetWebhookEndpointParams, WebhookDeliveryLogEntry, WebhookEndpointConfig, WebhookTestResult } from '../types';

export class Webhooks {
  constructor(private readonly http: HttpClient) {}

  /** Pour l'environnement (live/test) de la clé employée — les deux sont indépendantes. */
  async getEndpoint(): Promise<WebhookEndpointConfig> {
    const envelope = await this.http.request('GET', '/webhooks/endpoint');
    return envelope.data as WebhookEndpointConfig;
  }

  /**
   * `url: null` désactive les webhooks — le champ doit être présent même à
   * null, ce type l'impose.
   */
  async setEndpoint(params: SetWebhookEndpointParams): Promise<WebhookEndpointConfig> {
    const envelope = await this.http.request('PUT', '/webhooks/endpoint', { body: params });
    return envelope.data as WebhookEndpointConfig;
  }

  /** Envoie un `webhook.test`, signé comme un vrai événement. */
  async test(): Promise<WebhookTestResult> {
    const envelope = await this.http.request('POST', '/webhooks/test');
    return envelope.data as WebhookTestResult;
  }

  async deliveries(params: PageParams = {}): Promise<ListResult<WebhookDeliveryLogEntry>> {
    const envelope = await this.http.request('GET', '/webhooks/deliveries', { query: params as Record<string, number> });
    return { data: envelope.data as WebhookDeliveryLogEntry[], meta: envelope.meta as ListResult<WebhookDeliveryLogEntry>['meta'] };
  }
}
