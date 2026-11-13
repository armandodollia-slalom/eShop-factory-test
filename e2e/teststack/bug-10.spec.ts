import { test, expect } from '../fixtures';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-10: PUT /api/orders/cancel and /ship answer 409 / 404 / 400 instead of 500. The `bug-10` scenario gives alice
// four orders: 5 Shipped, 6 Paid, 7 Submitted, 8 Submitted. Called through the Ordering API on the test stack.
const SHIPPED = 5;
const PAID = 6;
const SUBMITTED_FOR_SHIP = 7;
const SUBMITTED_FOR_CANCEL = 8;

let token: string;

/** A new random guid for an x-requestid header. */
function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

type Api = import('@playwright/test').APIRequestContext;

/**
 * Identity's URL on the stack (host.docker.internal) only resolves in the browser and the containers, so the test
 * connects to localhost and sends the stack's host name as the Host header: the token's issuer stays the one the
 * services expect. Redirects are followed by hand for the same reason.
 */
async function identityRequest(request: Api, method: 'GET' | 'POST', target: string, form?: Record<string, string>) {
  const wanted = new URL(target, url('identity'));
  const local = new URL(wanted.toString());
  local.hostname = 'localhost';
  // The cookies belong to the stack's host name, which the request's cookie jar does not match with localhost: keep them here.
  const headers: Record<string, string> = { Host: wanted.host };
  if (cookies.size) headers.Cookie = [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
  const response = await request.fetch(local.toString(), { method, form, maxRedirects: 0, headers });
  for (const header of response.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie')) {
    const [pair] = header.value.split(';');
    const at = pair.indexOf('=');
    cookies.set(pair.slice(0, at), pair.slice(at + 1));
  }
  return response;
}

const cookies = new Map<string, string>();

/** Signs alice in through Identity (authorization code flow of the `webapp` client) and returns an access token. */
async function signInAlice(request: Api): Promise<string> {
  const identity = url('identity');
  const redirectUri = `${url('webapp')}/signin-oidc`;
  let next = `${identity}/connect/authorize?${new URLSearchParams({
    client_id: 'webapp',
    response_type: 'code',
    scope: 'openid profile orders',
    redirect_uri: redirectUri,
  })}`;

  // Follow the redirects to the login page.
  let login = await identityRequest(request, 'GET', next);
  for (let hops = 0; login.status() === 302 && hops < 5; hops++) {
    next = new URL(login.headers()['location'], next).toString();
    login = await identityRequest(request, 'GET', next);
  }
  expect(login.status(), 'login page').toBe(200);
  const html = await login.text();
  const returnUrl = /name="ReturnUrl"[^>]*value="([^"]*)"/.exec(html)?.[1];
  const antiforgery = /name="__RequestVerificationToken"[^>]*value="([^"]*)"/.exec(html)?.[1];
  expect(returnUrl, 'login page return url').toBeTruthy();
  const form: Record<string, string> = {
    Username: 'alice',
    Password: 'Pass123$',
    ReturnUrl: returnUrl!.replace(/&amp;/g, '&'),
    RememberLogin: 'false',
    button: 'login',
  };
  if (antiforgery) form.__RequestVerificationToken = antiforgery;
  const posted = await identityRequest(request, 'POST', next, form);
  expect(posted.status(), 'login post').toBe(302);

  // The authorize endpoint hands the code to the webapp's redirect uri; stop at that redirect and read it.
  next = new URL(posted.headers()['location'], next).toString();
  for (let hops = 0; hops < 5 && !new URL(next).searchParams.has('code'); hops++) {
    const step = await identityRequest(request, 'GET', next);
    expect(step.status(), `redirect from ${next}`).toBe(302);
    next = new URL(step.headers()['location'], next).toString();
  }
  const code = new URL(next).searchParams.get('code');
  expect(code, 'authorization code').toBeTruthy();
  const tokenResponse = await identityRequest(request, 'POST', `${identity}/connect/token`, {
    grant_type: 'authorization_code', code: code!, redirect_uri: redirectUri, client_id: 'webapp', client_secret: 'secret',
  });
  expect(tokenResponse.status(), 'token endpoint').toBe(200);
  return (await tokenResponse.json()).access_token as string;
}

test.beforeAll(async ({ playwright }) => {
  loadScenario('bug-10');
  const request = await playwright.request.newContext();
  token = await signInAlice(request);
  await request.dispose();
});

function put(request: import('@playwright/test').APIRequestContext, action: 'cancel' | 'ship', orderNumber: number, requestId: string = randomUUID()) {
  return request.put(`${url('ordering')}/api/orders/${action}?api-version=1.0`, {
    headers: { Authorization: `Bearer ${token}`, 'x-requestid': requestId },
    data: { orderNumber },
  });
}

async function statusOf(request: import('@playwright/test').APIRequestContext, orderNumber: number): Promise<string> {
  const response = await request.get(`${url('ordering')}/api/orders/${orderNumber}?api-version=1.0`, { headers: { Authorization: `Bearer ${token}` } });
  expect(response.status()).toBe(200);
  return (await response.json()).status;
}

test.describe.configure({ mode: 'serial' });

test('TC-BUG-10-01 cancelling a Shipped order returns 409 with the domain message', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for the Shipped order', () => put(request, 'cancel', SHIPPED));
  await test.step('409 ProblemDetails with the domain message', async () => {
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.status).toBe(409);
    expect(body.detail).toBe('Is not possible to change the order status from Shipped to Cancelled.');
    expect(JSON.stringify(body)).not.toContain('Cancel order failed to process.');
  });
});

test('TC-BUG-10-03 shipping a Submitted order returns 409 with the domain message', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship for the Submitted order', () => put(request, 'ship', SUBMITTED_FOR_SHIP));
  await test.step('409 with the domain message', async () => {
    expect(response.status()).toBe(409);
    expect((await response.json()).detail).toBe('Is not possible to change the order status from Submitted to Shipped.');
  });
});

test('TC-BUG-10-05 cancelling a nonexistent order returns 404', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for order 999999', () => put(request, 'cancel', 999999));
  await test.step('404', async () => expect(response.status()).toBe(404));
});

test('TC-BUG-10-06 shipping a nonexistent order returns 404', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship for order 999999', () => put(request, 'ship', 999999));
  await test.step('404', async () => expect(response.status()).toBe(404));
});

test('TC-BUG-10-07 cancel with order number 0 returns 400 with the validation message', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel with order number 0', () => put(request, 'cancel', 0));
  await test.step('400 with a message', async () => {
    expect(response.status()).toBe(400);
    expect((await response.text()).length).toBeGreaterThan(0);
  });
});

test('TC-BUG-10-09 cancel with an empty request id still returns 400', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel with an empty request id', () => put(request, 'cancel', SHIPPED, '00000000-0000-0000-0000-000000000000'));
  await test.step('400 Empty GUID', async () => {
    expect(response.status()).toBe(400);
    expect(await response.text()).toContain('Empty GUID is not valid for request ID');
  });
});

test('TC-BUG-10-13 a rejected cancel leaves the Shipped order unchanged', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for the Shipped order', () => put(request, 'cancel', SHIPPED));
  await test.step('409 and the order is still shipped', async () => {
    expect(response.status()).toBe(409);
    expect((await statusOf(request, SHIPPED)).toLowerCase()).toBe('shipped');
  });
});

test('TC-BUG-10-14 retrying a rejected cancel with the same request id returns 409 again', async ({ request }) => {
  const requestId = randomUUID();
  const first = await test.step('first cancel with request id G', () => put(request, 'cancel', SHIPPED, requestId));
  const second = await test.step('the identical request again', () => put(request, 'cancel', SHIPPED, requestId));
  await test.step('both are 409 with the domain message', async () => {
    for (const response of [first, second]) {
      expect(response.status()).toBe(409);
      expect((await response.json()).detail).toBe('Is not possible to change the order status from Shipped to Cancelled.');
    }
  });
});

test('TC-BUG-10-11 cancelling a Submitted order still returns 200 and sets status Cancelled', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for the Submitted order', () => put(request, 'cancel', SUBMITTED_FOR_CANCEL));
  await test.step('200 and the order is cancelled', async () => {
    expect(response.status()).toBe(200);
    expect((await statusOf(request, SUBMITTED_FOR_CANCEL)).toLowerCase()).toBe('cancelled');
  });
});

test('TC-BUG-10-12 shipping a Paid order still returns 200 and sets status Shipped', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship for the Paid order', () => put(request, 'ship', PAID));
  await test.step('200 and the order is shipped', async () => {
    expect(response.status()).toBe(200);
    expect((await statusOf(request, PAID)).toLowerCase()).toBe('shipped');
  });
});
