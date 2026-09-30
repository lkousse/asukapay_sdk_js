# asukapay

SDK Node.js officiel, sans dépendance, pour l'[API marchand AsukaPay v1](https://docs.asukapay.com/reference.html) — Mobile Money et carte bancaire en Afrique de l'Ouest et du Centre.

Requiert Node.js 18+ (utilise le `fetch` global). Aucune dépendance en production.

## Installation

```bash
npm install asukapay
```

## Utilisation

```ts
import { AsukaPay } from 'asukapay';

const client = new AsukaPay({ secretKey: process.env.ASUKAPAY_SECRET_KEY! });

const payment = await client.payments.create({
  amount: 5000,
  operator: 'mtn',
  phone_number: '22997000000',
  external_id: 'cmd_1042', // rend l'appel idempotent — voir reference.html
});
```

L'environnement (production ou [bac à sable](https://docs.asukapay.com/mode-test.html)) suit le préfixe de la clé (`sk_…` ou `sk_test_…`), jamais un paramètre séparé.

## Ressources disponibles

| Ressource | Méthodes |
|---|---|
| `client.payments` | `create`, `list`, `get`, `refund` |
| `client.refunds` | `list`, `get` |
| `client.paymentLinks` | `create`, `list`, `get` |
| `client.paymentModes` | `list`, `fees` |
| `client.balance` | `get` |
| `client.webhooks` | `getEndpoint`, `setEndpoint`, `test`, `deliveries` |

Chaque méthode est typée d'après [reference.html](https://docs.asukapay.com/reference.html) — les IDE avec support TypeScript proposent les champs directement.

## Gérer les erreurs

Toute erreur API lève `AsukaPayApiError`, avec un `code` stable ([liste complète](https://docs.asukapay.com/erreurs.html#codes-d-erreur)) — c'est lui qu'il faut tester, jamais `message` (texte humain, peut changer sans préavis).

```ts
import { AsukaPay, AsukaPayApiError } from 'asukapay';

try {
  await client.payments.create({ amount: 5000, operator: 'mtn', phone_number: '22997000000' });
} catch (err) {
  if (err instanceof AsukaPayApiError) {
    switch (err.code) {
      case 'invalid_request':
        console.error(err.details); // { champ: [messages] }
        break;
      case 'rate_limited':
        console.error('Réessayer dans', err.retryAfter, 's');
        break;
      default:
        // Traitez tout code inconnu comme un incident récupérable : un
        // nouveau code n'est jamais une rupture (erreurs.html).
        break;
    }
  }
}
```

Ne rejouez un `payments.create(...)` après un timeout que si vous aviez fourni `external_id` — sans lui, vous débitez le client deux fois.

## Vérifier un webhook

```ts
import { verifyWebhookSignature, AsukaPayWebhookSignatureError } from 'asukapay';

app.post('/webhooks/asukapay', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const event = verifyWebhookSignature({
      payload: req.body.toString(), // corps BRUT, avant tout parsing JSON
      header: req.get('X-AsukaPay-Signature') ?? '',
      secret: process.env.ASUKAPAY_WEBHOOK_SECRET!,
    });

    // … traitement idempotent sur event.id, puis :
    res.status(204).end();
  } catch (err) {
    if (err instanceof AsukaPayWebhookSignatureError) {
      return res.status(400).send(err.message);
    }
    throw err;
  }
});
```

Voir [webhooks.html](https://docs.asukapay.com/webhooks.html) pour le détail du calcul et des réessais.

## Développement

```bash
npm install
npm run build   # tsc -> dist/
npm test        # build puis node --test sur dist/test
```
