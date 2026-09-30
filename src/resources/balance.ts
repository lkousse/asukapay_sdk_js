import type { HttpClient } from '../httpClient';
import type { Balance as BalanceModel, BalanceParams } from '../types';

export class Balance {
  constructor(private readonly http: HttpClient) {}

  /**
   * Avec une clé sk_test_…, ceci renvoie la somme de vos encaissements de
   * test, jamais le solde réel (mode-test.html).
   */
  async get(params: BalanceParams = {}): Promise<BalanceModel> {
    const envelope = await this.http.request('GET', '/balance', { query: params as Record<string, string> });
    return envelope.data as BalanceModel;
  }
}
