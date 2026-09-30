/**
 * Formes exactes de docs.asukapay.com/reference.html. `data` d'un webhook a
 * la même forme que la ressource correspondante (voir webhooks.html).
 */

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type RefundStatus = 'pending' | 'succeeded' | 'failed';
export type PaymentModeType = 'mobile_money' | 'card' | 'bank_transfer' | 'e_wallet' | 'other';
export type PaymentLinkType = 'permanent' | 'limité';
export type WalletStatus = 'Actif' | 'Gelé' | 'Fermé';

/** Codes stables (erreurs.html#codes-d-erreur). `string & {}` garde l'auto-complétion
 *  tout en acceptant un futur code inconnu — un ajout n'est jamais une rupture. */
export type AsukaPayErrorCode =
  | 'unauthorized'
  | 'key_expired'
  | 'merchant_inactive'
  | 'invalid_request'
  | 'payment_failed'
  | 'insufficient_funds'
  | 'payout_failed'
  | 'payout_limit_exceeded'
  | 'not_found'
  | 'conflict'
  | 'method_not_allowed'
  | 'rate_limited'
  | 'server_error'
  | (string & {});

export type WebhookEventName =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'refund.succeeded'
  | 'refund.failed'
  | 'webhook.test'
  | (string & {});

export interface PaymentModeSummary {
  id: number;
  name: string;
  type: PaymentModeType;
  operator: string;
  country: string | null;
  country_code: string | null;
  fee_percent: number;
  fee_fixed: number;
  requires_otp: boolean;
  logo: string | null;
}

export interface PaymentCustomer {
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  phone_number: string | null;
}

export interface Payment {
  reference: string;
  identifier: string;
  external_id: string | null;
  status: PaymentStatus;
  amount: number;
  fee_amount: number;
  total_amount: number;
  currency: string;
  description: string;
  payment_mode: PaymentModeSummary | null;
  customer: PaymentCustomer;
  payment_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  reference: string;
  payment_reference: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason: string;
  processed_at: string | null;
  created_at: string;
}

export interface PaymentLink {
  id: number;
  url: string;
  type: PaymentLinkType;
  amount: number;
  description: string;
  max_uses: number | null;
  uses_count: number;
  uses_left: number | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface FeeQuote {
  payment_mode_id: number;
  operator: string;
  amount: number;
  fee_amount: number;
  total_amount: number;
  fee_percent: number;
  fee_fixed: number;
}

export interface Balance {
  currency: string;
  balance: number;
  balance_minor: number;
  status: WalletStatus;
  updated_at: string;
}

export interface WebhookEndpointConfig {
  url: string | null;
  secret: string | null;
  events?: WebhookEventName[];
  livemode: boolean;
}

export interface WebhookTestResult {
  sent: boolean;
  delivery_id?: string;
  url?: string;
  message?: string;
}

export interface WebhookDeliveryLogEntry {
  id: string;
  event: WebhookEventName;
  url: string;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  response_code: number | null;
  created_at: string;
  delivered_at: string | null;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ListResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Le corps exact reçu sur votre endpoint (webhooks.html#corps-de-la-notification). */
export interface WebhookEvent<T = Payment | Refund> {
  id: string;
  event: WebhookEventName;
  livemode: boolean;
  created_at: string;
  data: T;
}

// ---- Paramètres de requête ----

export interface CreatePaymentParams {
  amount: number;
  currency?: 'XOF' | 'XAF' | 'EUR' | 'USD';
  /** Requis sans payment_mode_id. */
  operator?: string;
  /** Requis sans operator. */
  payment_mode_id?: number;
  /** Obligatoire en Mobile Money. */
  phone_number?: string;
  /** Obligatoire pour les opérateurs à OTP (operateurs.html#operateurs-a-code-otp). */
  otp?: string;
  description?: string;
  /** Unique par marchand : rend l'appel idempotent. */
  external_id?: string;
  return_url?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  customer?: {
    firstname?: string;
    lastname?: string;
    email?: string;
    address?: string;
    country?: string;
  };
}

export interface ListPaymentsParams {
  status?: PaymentStatus;
  external_id?: string;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

export interface RefundPaymentParams {
  reason?: string;
}

export interface PageParams {
  per_page?: number;
  page?: number;
}

export interface CreatePaymentLinkParams {
  amount: number;
  description: string;
  type?: PaymentLinkType;
  max_uses?: number;
  starts_at?: string;
  expires_at?: string;
}

export interface ListPaymentModesParams {
  country?: string;
  type?: PaymentModeType;
}

export interface FeeQuoteParams {
  amount: number;
  operator?: string;
  payment_mode_id?: number;
}

export interface BalanceParams {
  currency?: string;
}

export interface SetWebhookEndpointParams {
  /** `null` désactive les webhooks. Le champ doit être présent même à null. */
  url: string | null;
  rotate_secret?: boolean;
}
