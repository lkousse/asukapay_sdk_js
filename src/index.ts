import { HttpClient, type AsukaPayClientOptions } from './httpClient';
import { Payments } from './resources/payments';
import { Refunds } from './resources/refunds';
import { PaymentLinks } from './resources/paymentLinks';
import { PaymentModes } from './resources/paymentModes';
import { Balance } from './resources/balance';
import { Webhooks } from './resources/webhooks';

export type { AsukaPayClientOptions } from './httpClient';
export { AsukaPayApiError, AsukaPayWebhookSignatureError } from './errors';
export { verifyWebhookSignature, type VerifyWebhookSignatureOptions } from './webhookSignature';
export * from './types';

/**
 * Client pour l'API marchand AsukaPay v1 (docs.asukapay.com).
 *
 * @example
 * ```ts
 * const client = new AsukaPay({ secretKey: process.env.ASUKAPAY_SECRET_KEY! });
 * const payment = await client.payments.create({
 *   amount: 5000,
 *   operator: 'mtn',
 *   phone_number: '22997000000',
 *   external_id: 'cmd_1042',
 * });
 * ```
 */
export class AsukaPay {
  readonly payments: Payments;
  readonly refunds: Refunds;
  readonly paymentLinks: PaymentLinks;
  readonly paymentModes: PaymentModes;
  readonly balance: Balance;
  readonly webhooks: Webhooks;

  constructor(options: AsukaPayClientOptions) {
    const http = new HttpClient(options);

    this.payments = new Payments(http);
    this.refunds = new Refunds(http);
    this.paymentLinks = new PaymentLinks(http);
    this.paymentModes = new PaymentModes(http);
    this.balance = new Balance(http);
    this.webhooks = new Webhooks(http);
  }
}

export default AsukaPay;
