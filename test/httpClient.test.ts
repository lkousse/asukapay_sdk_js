import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../src/httpClient';
import { AsukaPayApiError } from '../src/errors';

function fakeFetch(handler: (url: URL, init: RequestInit) => Response): typeof fetch {
  return (async (input: string | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? new URL(input) : (input as URL);
    return handler(url, init ?? {});
  }) as typeof fetch;
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

test('envoie le Bearer et sérialise le corps en JSON', async () => {
  let seenAuth: string | null = null;
  let seenBody: string | null = null;

  const client = new HttpClient({
    secretKey: 'sk_test_abc',
    fetch: fakeFetch((_url, init) => {
      seenAuth = (init.headers as Record<string, string>).Authorization;
      seenBody = init.body as string;
      return jsonResponse(201, { success: true, data: { reference: 'r1' } });
    }),
  });

  const envelope = await client.request('POST', '/payments', { body: { amount: 5000 } });

  assert.equal(seenAuth, 'Bearer sk_test_abc');
  assert.equal(seenBody, JSON.stringify({ amount: 5000 }));
  assert.deepEqual(envelope.data, { reference: 'r1' });
});

test('encode les paramètres de requête, en ignorant undefined/null', async () => {
  let seenQuery = '';

  const client = new HttpClient({
    secretKey: 'sk_test_abc',
    fetch: fakeFetch((url) => {
      seenQuery = url.search;
      return jsonResponse(200, { success: true, data: [] });
    }),
  });

  await client.request('GET', '/payments', { query: { status: 'succeeded', page: 2, external_id: undefined, to: null as unknown as undefined } });

  const params = new URLSearchParams(seenQuery);
  assert.equal(params.get('status'), 'succeeded');
  assert.equal(params.get('page'), '2');
  assert.equal(params.has('external_id'), false);
  assert.equal(params.has('to'), false);
});

test('lève AsukaPayApiError avec le code stable sur une erreur applicative', async () => {
  const client = new HttpClient({
    secretKey: 'sk_test_abc',
    fetch: fakeFetch(() =>
      jsonResponse(422, {
        success: false,
        error: { code: 'invalid_request', message: 'Les données envoyées sont invalides.', details: { amount: ['requis'] } },
      })
    ),
  });

  await assert.rejects(
    () => client.request('POST', '/payments', { body: {} }),
    (err: unknown) => {
      assert.ok(err instanceof AsukaPayApiError);
      assert.equal(err.code, 'invalid_request');
      assert.equal(err.httpStatus, 422);
      assert.deepEqual(err.details, { amount: ['requis'] });
      return true;
    }
  );
});

test('rapporte Retry-After sur rate_limited', async () => {
  const client = new HttpClient({
    secretKey: 'sk_test_abc',
    fetch: fakeFetch(() =>
      jsonResponse(429, { success: false, error: { code: 'rate_limited', message: 'Trop de requêtes.' } }, { 'Retry-After': '12' })
    ),
  });

  await assert.rejects(
    () => client.request('GET', '/payments'),
    (err: unknown) => {
      assert.ok(err instanceof AsukaPayApiError);
      assert.equal(err.code, 'rate_limited');
      assert.equal(err.retryAfter, 12);
      return true;
    }
  );
});

test('gère une réponse non-JSON sans planter', async () => {
  const client = new HttpClient({
    secretKey: 'sk_test_abc',
    fetch: fakeFetch(() => new Response('<html>502 Bad Gateway</html>', { status: 502 })),
  });

  await assert.rejects(
    () => client.request('GET', '/payments'),
    (err: unknown) => {
      assert.ok(err instanceof AsukaPayApiError);
      assert.equal(err.code, 'server_error');
      assert.equal(err.httpStatus, 502);
      return true;
    }
  );
});
