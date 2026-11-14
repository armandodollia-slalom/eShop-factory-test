import { test, expect } from '../demo';
import { getAccessToken } from './identity-token';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-16: POST /api/webhooks must accept only the defined WebhookType names as `event`.
// Scenario `bug-16` (.factory/stack/scenarios/bug-16): the demo users alice and bob (Pass123$), no subscriptions.
test.describe.configure({ mode: 'serial' });

const WEBHOOKS = () => url('webhooks');
const API = (path = '') => `${WEBHOOKS()}/api/webhooks${path}?api-version=1.0`;

let token = '';
// The only redirect URI identity registers for this client on the stack (WebhooksApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://webhooks-api:8080/swagger/oauth2-redirect.html';

test.beforeAll(() => {
  loadScenario('bug-16');
});

// The "webhooksswaggerui" client uses the implicit flow: signing in as alice returns an access token in the redirect fragment.
test.beforeAll(async ({ browser }) => {
  token = await getAccessToken(browser, { clientId: 'webhooksswaggerui', scope: 'webhooks', redirectUri: REDIRECT, state: 'bug16' });
  expect(token).not.toBe('');
});

const auth = () => ({ Authorization: `Bearer ${token}` });
// The stack's own webhook client is the receiver: its /check endpoint echoes the grant token, so the grant check passes and only the event is judged.
const body = (event: string) => ({ url: 'http://webhooksclient:8080/webhook-received', grantUrl: 'http://webhooksclient:8080/check', token: 'secret', event });

test('TC-BUG-16-01 numeric event "99" is rejected with 400 and nothing is stored', async ({ request }) => {
  await test.step('POST /api/webhooks with event "99"', async () => {
    const response = await request.post(API(), { headers: auth(), data: body('99') });
    expect(response.status()).toBe(400);
    expect(await response.text()).toContain('99 is invalid event name');
  });
  await test.step('GET /api/webhooks lists no subscription', async () => {
    const response = await request.get(API(), { headers: auth() });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});
