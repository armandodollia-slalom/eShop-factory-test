import type { APIRequestContext, Browser } from '@playwright/test';
import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-31: Webhooks.API must accept only access tokens that carry the `webhooks` scope.
// Scenario `bug-31` (.factory/stack/scenarios/bug-31): the demo users alice and bob (Pass123$), no subscriptions.
test.describe.configure({ mode: 'serial' });

const API = (path = '') => `${url('webhooks')}/api/webhooks${path}?api-version=1.0`;

// Values from the plan's shared setup (_index.md).
const DEST_URL = 'http://webhooksclient:8080/webhook-received';
const GRANT_URL = 'http://webhooksclient:8080/check';
const SECRET = 'secret';
// The stack's own webhook client is the receiver: its /check endpoint echoes the grant token, so the grant check passes.
const SUBSCRIPTION = { url: DEST_URL, grantUrl: GRANT_URL, token: SECRET, event: 'OrderPaid' };
// The WebhookClient app's default registration token (TC-BUG-31-02).
const CLIENT_TOKEN = '6168DB8D-DC58-4094-AF24-483278923590';

let webhooksToken = '';
let basketToken = '';

/**
 * Signs in as alice through an implicit-flow Swagger client and returns the access token. The redirect URI is the one
 * Identity registers for the client; it resolves only inside the compose network, so the token is read from the
 * Location fragment of the 302 that /connect/authorize/callback returns.
 */
async function implicitToken(browser: Browser, clientId: string, scope: string, redirectUri: string): Promise<string> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({ client_id: clientId, response_type: 'token', scope, redirect_uri: redirectUri, state: 'bug31' }).toString();
  await page.goto(authorize.toString());
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
  await page.getByRole('button', { name: 'Login' }).click();
  const location = (await callback).headers()['location'] ?? '';
  await context.close();
  const token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
  expect(token).not.toBe('');
  return token;
}

/** The `scope` claim of a JWT access token, as a list (Identity issues it as an array). */
function scopes(token: string): string[] {
  const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  return ([] as string[]).concat(payload.scope ?? []);
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

test.beforeAll(() => {
  loadScenario('bug-31');
});

test.beforeAll(async ({ browser }) => {
  webhooksToken = await implicitToken(browser, 'webhooksswaggerui', 'webhooks', 'http://webhooks-api:8080/swagger/oauth2-redirect.html');
  basketToken = await implicitToken(browser, 'basketswaggerui', 'basket', 'http://basket-api:8080/swagger/oauth2-redirect.html');
  expect(scopes(webhooksToken)).toEqual(['webhooks']);
  expect(scopes(basketToken)).toEqual(['basket']);
});

// Every case starts from "alice has no webhook subscriptions": remove whatever an earlier case left behind.
test.beforeEach(async ({ request }) => {
  const list = await request.get(API(), { headers: bearer(webhooksToken) });
  expect(list.status()).toBe(200);
  for (const hook of (await list.json()) as { id: number }[]) {
    expect((await request.delete(API(`/${hook.id}`), { headers: bearer(webhooksToken) })).status()).toBe(202);
  }
});

/** Creates alice's subscription with the webhooks token and returns its id from the Location header. */
async function createSubscription(request: APIRequestContext): Promise<number> {
  const response = await request.post(API(), { headers: bearer(webhooksToken), data: SUBSCRIPTION });
  expect(response.status()).toBe(201);
  const location = response.headers()['location'] ?? '';
  const match = /\/api\/webhooks\/(\d+)$/.exec(new URL(location, url('webhooks')).pathname);
  expect(match, `Location "${location}" ends with /api/webhooks/<id>`).not.toBeNull();
  return Number(match![1]);
}

test('TC-BUG-31-01 a webhooks-scoped token can create, list, read and delete alice\'s subscription', async ({ request }) => {
  let id = 0;
  await test.step('POST /api/webhooks with the webhooks token returns 201 with Location /api/webhooks/<id>', async () => {
    id = await createSubscription(request);
  });
  await test.step('GET /api/webhooks lists exactly that subscription', async () => {
    const response = await request.get(API(), { headers: bearer(webhooksToken) });
    expect(response.status()).toBe(200);
    const hooks = await response.json();
    expect(hooks).toHaveLength(1);
    expect(hooks[0]).toMatchObject({ id, destUrl: DEST_URL, token: SECRET });
  });
  await test.step('GET /api/webhooks/<id> returns the subscription', async () => {
    const response = await request.get(API(`/${id}`), { headers: bearer(webhooksToken) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ id, destUrl: DEST_URL });
  });
  await test.step('DELETE /api/webhooks/<id> returns 202', async () => {
    const response = await request.delete(API(`/${id}`), { headers: bearer(webhooksToken) });
    expect(response.status()).toBe(202);
  });
  await test.step('GET /api/webhooks/<id> returns 404 after the delete', async () => {
    const response = await request.get(API(`/${id}`), { headers: bearer(webhooksToken) });
    expect(response.status()).toBe(404);
  });
});

test('TC-BUG-31-02 WebhookClient app registers a webhook and lists it after alice signs in', async ({ page, demo }) => {
  const home = `${url('webhooksclient')}/`;
  await test.step('Log in to the WebhookClient app as alice', async () => {
    await page.goto(home);
    await demo.chapter('BUG-31', 'The WebhookClient app\'s sign-in token still works on Webhooks.API');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL((u) => u.toString().startsWith(home));
    // The page re-renders once the Blazor circuit starts; wait for it to settle before marking the signed-in menu.
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await demo.highlight(page.locator('strong', { hasText: 'alice' }), 'signed in as alice');
  });
  await test.step('Open /add-webhook', async () => {
    await page.goto(`${url('webhooksclient')}/add-webhook`);
    await page.waitForLoadState('networkidle');
    const token = page.getByPlaceholder('Token');
    await expect(token).toHaveValue(CLIENT_TOKEN);
    await demo.highlight(token, 'default token kept');
  });
  await test.step('Click Register', async () => {
    await page.getByRole('button', { name: 'Register' }).click();
    await page.waitForURL(home);
    expect(page.url()).toBe(home);
    await expect(page.locator('.error-message')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Registered webhooks' })).toBeVisible();
    const grid = page.locator('table').first();
    const rows = grid.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    const headers = (await grid.locator('thead th').allInnerTexts()).map((h) => h.trim());
    const cells = rows.first().locator('td');
    await expect(cells.nth(headers.findIndex((h) => h.startsWith('Destination')))).toHaveText(DEST_URL);
    await expect(cells.nth(headers.findIndex((h) => h.startsWith('Token')))).toHaveText(CLIENT_TOKEN);
    await demo.highlight(rows.first(), 'one registered webhook');
  });
});

test('TC-BUG-31-03 basket-only token is refused on GET /api/webhooks and lists nothing', async ({ request }) => {
  await test.step('Alice owns one subscription (created with the webhooks token)', async () => {
    await createSubscription(request);
  });
  await test.step('GET /api/webhooks with the basket token', async () => {
    const response = await request.get(API(), { headers: bearer(basketToken) });
    expect(response.status()).toBe(403);
    const body = await response.text();
    expect(body).not.toContain(DEST_URL);
    expect(body).not.toContain(SECRET);
  });
});

test('TC-BUG-31-04 basket-only token is refused on GET /api/webhooks/{id}', async ({ request }) => {
  let id = 0;
  await test.step('Alice owns one subscription (created with the webhooks token)', async () => {
    id = await createSubscription(request);
  });
  await test.step('GET /api/webhooks/<id> with the basket token', async () => {
    const response = await request.get(API(`/${id}`), { headers: bearer(basketToken) });
    expect(response.status()).toBe(403);
    const body = await response.text();
    expect(body).not.toContain(DEST_URL);
    expect(body).not.toContain(SECRET);
  });
});

test('TC-BUG-31-05 basket-only token is refused on POST /api/webhooks and nothing is created', async ({ request }) => {
  await test.step('POST /api/webhooks with the basket token', async () => {
    const response = await request.post(API(), { headers: bearer(basketToken), data: SUBSCRIPTION });
    expect(response.status()).toBe(403);
    expect(response.headers()['location']).toBeUndefined();
  });
  await test.step('GET /api/webhooks with the webhooks token returns []', async () => {
    const response = await request.get(API(), { headers: bearer(webhooksToken) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});

test('TC-BUG-31-06 basket-only token is refused on DELETE /api/webhooks/{id} and the subscription survives', async ({ request }) => {
  let id = 0;
  await test.step('Alice owns one subscription (created with the webhooks token)', async () => {
    id = await createSubscription(request);
  });
  await test.step('DELETE /api/webhooks/<id> with the basket token', async () => {
    const response = await request.delete(API(`/${id}`), { headers: bearer(basketToken) });
    expect(response.status()).toBe(403);
  });
  await test.step('GET /api/webhooks/<id> with the webhooks token still returns the subscription', async () => {
    const response = await request.get(API(`/${id}`), { headers: bearer(webhooksToken) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ id, destUrl: DEST_URL });
  });
});

test('TC-BUG-31-07 request without a token is refused with 401', async ({ request }) => {
  await test.step('Alice owns one subscription (created with the webhooks token)', async () => {
    await createSubscription(request);
  });
  await test.step('GET /api/webhooks with no Authorization header', async () => {
    const response = await request.get(API());
    expect(response.status()).toBe(401);
    expect(await response.text()).not.toContain(DEST_URL);
  });
});
