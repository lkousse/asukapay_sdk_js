import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyWebhookSignature } from '../src/webhookSignature';
import { AsukaPayWebhookSignatureError } from '../src/errors';

const secret = 'whsec_test_secret';

function sign(payload: string, timestamp: number, withSecret = secret): string {
  const hmac = createHmac('sha256', withSecret).update(`${timestamp}.${payload}`).digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

test('accepte une signature valide et renvoie l’événement parsé', () => {
  const payload = JSON.stringify({ id: 'evt_1', event: 'payment.succeeded', livemode: true, created_at: 'x', data: { reference: 'r1' } });
  const header = sign(payload, Math.floor(Date.now() / 1000));

  const event = verifyWebhookSignature({ payload, header, secret });

  assert.equal(event.id, 'evt_1');
  assert.equal(event.event, 'payment.succeeded');
});

test('rejette un corps modifié après signature', () => {
  const original = JSON.stringify({ id: 'evt_1', amount: 1000 });
  const header = sign(original, Math.floor(Date.now() / 1000));
  const tampered = JSON.stringify({ id: 'evt_1', amount: 999999 });

  assert.throws(() => verifyWebhookSignature({ payload: tampered, header, secret }), AsukaPayWebhookSignatureError);
});

test('rejette un mauvais secret', () => {
  const payload = JSON.stringify({ id: 'evt_1' });
  const header = sign(payload, Math.floor(Date.now() / 1000), 'whsec_wrong');

  assert.throws(() => verifyWebhookSignature({ payload, header, secret }), AsukaPayWebhookSignatureError);
});

test('rejette un horodatage trop ancien', () => {
  const payload = JSON.stringify({ id: 'evt_1' });
  const staleTimestamp = Math.floor(Date.now() / 1000) - 600;
  const header = sign(payload, staleTimestamp);

  assert.throws(() => verifyWebhookSignature({ payload, header, secret }), AsukaPayWebhookSignatureError);
});

test('rejette un en-tête mal formé', () => {
  assert.throws(
    () => verifyWebhookSignature({ payload: '{}', header: 'not-a-valid-header', secret }),
    AsukaPayWebhookSignatureError
  );
});

test('accepte une tolérance personnalisée', () => {
  const payload = JSON.stringify({ id: 'evt_1' });
  const timestamp = Math.floor(Date.now() / 1000) - 120;
  const header = sign(payload, timestamp);

  assert.throws(() => verifyWebhookSignature({ payload, header, secret, toleranceSeconds: 60 }));
  assert.doesNotThrow(() => verifyWebhookSignature({ payload, header, secret, toleranceSeconds: 300 }));
});
