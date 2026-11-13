import { test, expect } from '../demo';
import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-16: POST /api/webhooks/ rejects event names outside WebhookType (including numeric strings), stores nothing,
// and keeps accepting defined names and numeric strings naming a defined member. Backend-only: API calls on the stack.
// Scenario `bug-16` (.factory/stack/scenarios/bug-16): the demo data with alice, who has no webhook subscriptions.
test.describe.configure({ mode: 'serial' });

const WEBHOOKS = () => url('webhooks');
// Identity issues tokens for the host name of the request. The Webhooks API trusts http://host.docker.internal:<port>,
// so sign in through localhost with that Host header (host.docker.internal may not resolve on the machine running the tests).
const IDENTITY_URL = () => url('identity');
const IDENTITY = () => IDENTITY_URL().replace('host.docker.internal', 'localhost');
const IDENTITY_HOST = () => new URL(IDENTITY_URL()).host;
// Identity's redirects name host.docker.internal; follow them through localhost.
const local = (target: string) => target.replace(IDENTITY_HOST(), new URL(IDENTITY()).host);
const SUBSCRIPTIONS = () => `${WEBHOOKS()}/api/webhooks/?api-version=1.0`;
// The receiver the Webhooks API calls from inside the stack to test the grant URL (the WebhooksClient service).
const RECEIVER = 'http://webhooksclient:8080';
const SWAGGER_REDIRECT = 'http://webhooks-api:8080/swagger/oauth2-redirect.html';

let aliceToken = '';
let anonymous: APIRequestContext;

test.beforeAll(async () => {
  loadScenario('bug-16');
  aliceToken = await signInAsAlice();
  anonymous = await playwrightRequest.newContext();
});

test.afterAll(async () => {
  await anonymous?.dispose();
});

/** Signs alice in on the Identity service with the Swagger UI implicit flow and returns the access token. */
async function signInAsAlice(): Promise<string> {
  const ctx = await playwrightRequest.newContext({ extraHTTPHeaders: { Host: IDENTITY_HOST() } });
  try {
    const authorize =
      `${IDENTITY()}/connect/authorize?response_type=token&client_id=webhooksswaggerui` +
      `&redirect_uri=${encodeURIComponent(SWAGGER_REDIRECT)}&scope=webhooks&state=bug-16`;
    const toLogin = await ctx.get(authorize, { maxRedirects: 0 });
    const loginUrl = toLogin.headers()['location'];
    const html = await (await ctx.get(local(loginUrl))).text();
    const antiforgery = /name="__RequestVerificationToken"[^>]*value="([^"]+)"/.exec(html)![1];
    const returnUrl = /name="ReturnUrl"[^>]*value="([^"]+)"/.exec(html)![1].replace(/&amp;/g, '&');
    const login = await ctx.post(`${IDENTITY()}/Account/Login`, {
      form: { Username: 'alice', Password: 'Pass123$', ReturnUrl: returnUrl, __RequestVerificationToken: antiforgery, button: 'login' },
      maxRedirects: 0,
    });
    expect(login.status()).toBe(302);
    const callback = await ctx.get(local(new URL(login.headers()['location'], IDENTITY()).toString()), { maxRedirects: 0 });
    const redirect = callback.headers()['location'];
    const token = new URLSearchParams(redirect.split('#')[1]).get('access_token');
    expect(token, `access_token in ${redirect}`).toBeTruthy();
    return token!;
  } finally {
    await ctx.dispose();
  }
}

const authed = () => ({ Authorization: `Bearer ${aliceToken}` });

async function listSubscriptions(request: APIRequestContext): Promise<{ id: number; type: number; userId: string }[]> {
  const response = await request.get(SUBSCRIPTIONS(), { headers: authed() });
  expect(response.status()).toBe(200);
  return response.json();
}

async function post(request: APIRequestContext, event: string) {
  return request.post(SUBSCRIPTIONS(), {
    headers: authed(),
    data: { url: `${RECEIVER}/webhook`, grantUrl: `${RECEIVER}/check`, token: '', event },
  });
}

async function deleteAll(request: APIRequestContext) {
  for (const subscription of await listSubscriptions(request)) {
    await request.delete(`${WEBHOOKS()}/api/webhooks/${subscription.id}?api-version=1.0`, { headers: authed() });
  }
}

test.beforeEach(async ({ request }) => {
  await deleteAll(request);
});

async function expectRejected(request: APIRequestContext, event: string) {
  const response = await test.step(`POST /api/webhooks with event "${event}"`, () => post(request, event));
  await test.step('400 validation problem naming the event, no Location header', async () => {
    expect(response.status()).toBe(400);
    expect(response.headers()['location']).toBeUndefined();
    const body = await response.json();
    expect(body.errors.Event).toEqual([`${event} is invalid event name`]);
    expect(Object.keys(body.errors)).toEqual(['Event']);
    expect(body.errors.Url).toBeUndefined();
    expect(body.errors.GrantUrl).toBeUndefined();
  });
  await test.step('GET /api/webhooks returns an empty list', async () => {
    expect(await listSubscriptions(request)).toEqual([]);
  });
}

test('TC-BUG-16-01 numeric event name 99 outside WebhookType is rejected with 400', async ({ request }) => {
  await expectRejected(request, '99');
});

test('TC-BUG-16-02 rejected numeric event does not store a subscription', async ({ request }) => {
  await expectRejected(request, '99');
});

test('TC-BUG-16-03 event "0" is rejected', async ({ request }) => {
  await expectRejected(request, '0');
});

test('TC-BUG-16-04 event "4" is rejected', async ({ request }) => {
  await expectRejected(request, '4');
});

test('TC-BUG-16-05 negative numeric event "-1" is rejected', async ({ request }) => {
  await expectRejected(request, '-1');
});

test('TC-BUG-16-06 event larger than Int32 is rejected', async ({ request }) => {
  await expectRejected(request, '99999999999');
});

test('TC-BUG-16-07 non-numeric unknown event name is still rejected', async ({ request }) => {
  await expectRejected(request, 'NotAnEvent');
});

test('TC-BUG-16-08 numeric string naming a defined member ("1") is still accepted', async ({ request }) => {
  const response = await test.step('POST with event "1"', () => post(request, '1'));
  expect(response.status()).toBe(201);
  const location = response.headers()['location'];
  expect(location).toMatch(/^\/api\/webhooks\/\d+$/);
  await test.step('GET the created subscription: type CatalogItemPriceChange (1)', async () => {
    const created = await request.get(`${WEBHOOKS()}${location}?api-version=1.0`, { headers: authed() });
    expect(created.status()).toBe(200);
    expect((await created.json()).type).toBe(1);
  });
});

test('TC-BUG-16-09 valid event name in different casing is accepted', async ({ request }) => {
  const response = await test.step('POST with event "orderpaid"', () => post(request, 'orderpaid'));
  expect(response.status()).toBe(201);
  const created = await request.get(`${WEBHOOKS()}${response.headers()['location']}?api-version=1.0`, { headers: authed() });
  expect(created.status()).toBe(200);
  expect((await created.json()).type).toBe(3);
});

test('TC-BUG-16-10 empty event name is rejected', async ({ request }) => {
  const response = await test.step('POST with event ""', () => post(request, ''));
  expect(response.status()).toBe(400);
  expect((await response.json()).errors.Event).toContain(' is invalid event name');
  expect(await listSubscriptions(request)).toEqual([]);
});
