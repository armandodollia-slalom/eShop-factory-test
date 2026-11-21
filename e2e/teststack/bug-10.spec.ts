import { test, expect } from '../fixtures';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-10: PUT /api/orders/cancel and /ship answer 409/400/404 for client errors instead of 500.
// Alice's orders come from .factory/stack/scenarios/bug-10: 5 Shipped, 6 Paid, 7 Submitted (read-only),
// 8 Submitted (TC-11), 9 Paid (TC-12), 10 Submitted (TC-13).
test.describe.configure({ mode: 'serial' });

const randomUUID = () => 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
const ordering = () => url('ordering');
const api = (path: string) => `${ordering()}/api/orders${path}?api-version=1.0`;
let token: string;

test.beforeAll(async ({ browser }) => {
  loadScenario('bug-10');

  // Ordering.API only accepts bearer tokens: take one for alice through the implicit flow of the Ordering swagger client.
  const context = await browser.newContext();
  const page = await context.newPage();
  const redirect = 'http://ordering-api:8080/swagger/oauth2-redirect.html';
  const authorize = `${url('identity')}/connect/authorize?client_id=orderingswaggerui&response_type=token&scope=orders&state=s&redirect_uri=${encodeURIComponent(redirect)}`;
  // The redirect target (ordering-api:8080) is a container name the browser cannot resolve; the access token is in
  // the fragment of the Location header of the authorize callback, so read it from that response.
  const callback = page.waitForResponse((response) => (response.headers()['location'] ?? '').startsWith(redirect));
  await page.goto(authorize);
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  await page.getByRole('button', { name: 'Login' }).click();
  const location = (await callback).headers()['location'];
  token = new URLSearchParams(location.slice(location.indexOf('#') + 1)).get('access_token')!;
  await context.close();
  expect(token).toBeTruthy();
});

type Api = import('@playwright/test').APIRequestContext;

async function put(request: Api, action: 'cancel' | 'ship', orderNumber: number, requestId: string = randomUUID()) {
  return request.put(api(`/${action}`), {
    headers: { Authorization: `Bearer ${token}`, 'x-requestid': requestId },
    data: { orderNumber },
  });
}

async function statusOf(request: Api, orderNumber: number) {
  const response = await request.get(api(`/${orderNumber}`), { headers: { Authorization: `Bearer ${token}` } });
  expect(response.status()).toBe(200);
  return (await response.json()).status as string;
}

async function expectProblem(response: Awaited<ReturnType<typeof put>>, status: number, detail: string | RegExp) {
  expect(response.status()).toBe(status);
  const body = await response.json();
  expect(body.status).toBe(status);
  if (typeof detail === 'string') expect(body.detail).toBe(detail);
  else expect(body.detail).toMatch(detail);
}

test('TC-BUG-10-01 cancelling a Shipped order returns 409 with the domain message', async ({ request }) => {
  await test.step('PUT cancel order 5', async () => {
    const response = await put(request, 'cancel', 5);
    await expectProblem(response, 409, 'Is not possible to change the order status from Shipped to Cancelled.');
  });
  await test.step('order 5 is still Shipped', async () => {
    expect(await statusOf(request, 5)).toBe('Shipped');
  });
});

test('TC-BUG-10-02 cancelling a Paid order returns 409', async ({ request }) => {
  const response = await put(request, 'cancel', 6);
  await expectProblem(response, 409, 'Is not possible to change the order status from Paid to Cancelled.');
  expect(await statusOf(request, 6)).toBe('Paid');
});

test('TC-BUG-10-03 shipping a Submitted order returns 409', async ({ request }) => {
  const response = await put(request, 'ship', 7);
  await expectProblem(response, 409, 'Is not possible to change the order status from Submitted to Shipped.');
  expect(await statusOf(request, 7)).toBe('Submitted');
});

test('TC-BUG-10-04 shipping an already Shipped order returns 409', async ({ request }) => {
  const response = await put(request, 'ship', 5);
  await expectProblem(response, 409, 'Is not possible to change the order status from Shipped to Shipped.');
  expect(await statusOf(request, 5)).toBe('Shipped');
});

test('TC-BUG-10-05 cancelling a nonexistent order returns 404', async ({ request }) => {
  const response = await put(request, 'cancel', 99999);
  expect(response.status()).toBe(404);
  const missing = await request.get(api('/99999'), { headers: { Authorization: `Bearer ${token}` } });
  expect(missing.status()).toBe(404);
});

test('TC-BUG-10-06 shipping a nonexistent order returns 404', async ({ request }) => {
  const response = await put(request, 'ship', 99999);
  expect(response.status()).toBe(404);
  const missing = await request.get(api('/99999'), { headers: { Authorization: `Bearer ${token}` } });
  expect(missing.status()).toBe(404);
});

test('TC-BUG-10-07 cancel with orderNumber 0 returns 400 with the validation message', async ({ request }) => {
  const response = await put(request, 'cancel', 0);
  await expectProblem(response, 400, /No orderId found/);
});

test('TC-BUG-10-08 ship with orderNumber 0 returns 400 with the validation message', async ({ request }) => {
  const response = await put(request, 'ship', 0);
  await expectProblem(response, 400, /No orderId found/);
  expect(await statusOf(request, 6)).toBe('Paid');
});

test('TC-BUG-10-09 cancel with an empty x-requestid still returns 400', async ({ request }) => {
  const response = await put(request, 'cancel', 5, '00000000-0000-0000-0000-000000000000');
  expect(response.status()).toBe(400);
  expect(await response.json()).toBe('Empty GUID is not valid for request ID');
});

test('TC-BUG-10-10 ship with an empty x-requestid still returns 400', async ({ request }) => {
  const response = await put(request, 'ship', 6, '00000000-0000-0000-0000-000000000000');
  expect(response.status()).toBe(400);
  expect(await response.json()).toBe('Empty GUID is not valid for request ID');
  expect(await statusOf(request, 6)).toBe('Paid');
});

test('TC-BUG-10-11 cancelling a Submitted order succeeds with 200', async ({ request }) => {
  const response = await put(request, 'cancel', 8);
  expect(response.status()).toBe(200);
  expect(await statusOf(request, 8)).toBe('Cancelled');
});

test('TC-BUG-10-12 shipping a Paid order succeeds with 200', async ({ request }) => {
  const response = await put(request, 'ship', 9);
  expect(response.status()).toBe(200);
  expect(await statusOf(request, 9)).toBe('Shipped');
});

test('TC-BUG-10-13 repeating a successful cancel with the same x-requestid returns 200 and changes nothing', async ({ request }) => {
  const requestId = randomUUID();
  const first = await put(request, 'cancel', 10, requestId);
  expect(first.status()).toBe(200);
  expect(await statusOf(request, 10)).toBe('Cancelled');

  const repeat = await put(request, 'cancel', 10, requestId);
  expect(repeat.status()).toBe(200);
  expect(await statusOf(request, 10)).toBe('Cancelled');
});

test('TC-BUG-10-14 retrying a rejected cancel with the same x-requestid returns 409 again', async ({ request }) => {
  const requestId = randomUUID();
  expect((await put(request, 'cancel', 5, requestId)).status()).toBe(409);
  expect((await put(request, 'cancel', 5, requestId)).status()).toBe(409);
  expect(await statusOf(request, 5)).toBe('Shipped');
});

test('TC-BUG-10-15 retrying a cancel for a nonexistent order with the same x-requestid returns 404 both times', async ({ request }) => {
  const requestId = randomUUID();
  expect((await put(request, 'cancel', 99999, requestId)).status()).toBe(404);
  expect((await put(request, 'cancel', 99999, requestId)).status()).toBe(404);
});
