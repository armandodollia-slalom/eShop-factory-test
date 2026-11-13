import { APIRequestContext, APIResponse, Browser } from '@playwright/test';
import { randomUUID } from 'crypto';
import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-10: Ordering.API maps invalid order status changes to 409/404 instead of 500.
// Orders 5-10 come from the `bug-10` scenario (.factory/stack/scenarios/bug-10); requests go to the Ordering
// API on the test stack with alice's bearer token, obtained through the identity implicit flow.
const ORDERING = url('ordering');
const IDENTITY = url('identity');
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

test.describe.configure({ mode: 'serial' });

let token = '';

async function signInAsAlice(browser: Browser): Promise<string> {
  const context = await browser.newContext();
  const page = await context.newPage();
  let location = '';
  page.on('response', (response) => {
    const header = response.headers()['location'];
    if (header?.includes('access_token=')) location = header;
  });
  const authorize = new URLSearchParams({
    client_id: 'orderingswaggerui',
    response_type: 'token',
    scope: 'orders',
    redirect_uri: 'http://ordering-api:8080/swagger/oauth2-redirect.html',
    state: 'bug-10',
  });
  await page.goto(`${IDENTITY}/connect/authorize?${authorize}`).catch(() => undefined);
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect.poll(() => location, { timeout: 30_000 }).not.toBe('');
  await context.close();
  return new URLSearchParams(location.split('#')[1]).get('access_token')!;
}

test.beforeAll(async ({ browser }) => {
  loadScenario('bug-10');
  token = await signInAsAlice(browser);
});

function put(request: APIRequestContext, action: 'cancel' | 'ship', orderNumber: number, requestId: string = randomUUID()): Promise<APIResponse> {
  return request.put(`${ORDERING}/api/orders/${action}?api-version=1.0`, {
    headers: { Authorization: `Bearer ${token}`, 'x-requestid': requestId },
    data: { orderNumber },
  });
}

async function getOrder(request: APIRequestContext, id: number) {
  const response = await request.get(`${ORDERING}/api/orders/${id}?api-version=1.0`, { headers: { Authorization: `Bearer ${token}` } });
  expect(response.status()).toBe(200);
  return response.json();
}

async function expectProblem(response: APIResponse, status: number, detail: string) {
  expect(response.status()).toBe(status);
  const body = await response.json();
  expect(body.detail).toBe(detail);
  return body;
}

test('TC-BUG-10-01 cancelling a Shipped order returns 409 Conflict with the domain message', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for Shipped order 5', () => put(request, 'cancel', 5));
  await test.step('409 with the domain message, not the old 500 text', async () => {
    await expectProblem(response, 409, 'Is not possible to change the order status from Shipped to Cancelled.');
    expect(await response.text()).not.toContain('Cancel order failed to process.');
  });
});

test('TC-BUG-10-02 cancelling a Paid order returns 409 Conflict', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for Paid order 6', () => put(request, 'cancel', 6));
  await test.step('409 with the domain message', () => expectProblem(response, 409, 'Is not possible to change the order status from Paid to Cancelled.'));
});

test('TC-BUG-10-03 shipping an order that is not Paid returns 409 Conflict', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship for Submitted order 7', () => put(request, 'ship', 7));
  await test.step('409 with the domain message', () => expectProblem(response, 409, 'Is not possible to change the order status from Submitted to Shipped.'));
});

test('TC-BUG-10-04 shipping an already Shipped order returns 409 Conflict', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship for Shipped order 8', () => put(request, 'ship', 8));
  await test.step('409 with the domain message', () => expectProblem(response, 409, 'Is not possible to change the order status from Shipped to Shipped.'));
});

test('TC-BUG-10-05 cancelling an order that does not exist returns 404', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for missing order 999999', () => put(request, 'cancel', 999999));
  await test.step('404 with the not found message', () => expectProblem(response, 404, 'Order 999999 was not found.'));
});

test('TC-BUG-10-06 shipping an order that does not exist returns 404', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship for missing order 999999', () => put(request, 'ship', 999999));
  await test.step('404 with the not found message', () => expectProblem(response, 404, 'Order 999999 was not found.'));
});

test('TC-BUG-10-07 a rejected cancel leaves the order status unchanged', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for Shipped order 5', () => put(request, 'cancel', 5));
  expect(response.status()).toBe(409);
  const order = await test.step('GET /api/orders/5', () => getOrder(request, 5));
  await test.step('the order is still shipped', () => expect(String(order.status).toLowerCase()).toBe('shipped'));
});

test('TC-BUG-10-08 retrying a rejected cancel with the same request id is processed again', async ({ request }) => {
  const requestId = randomUUID();
  const first = await test.step('first PUT /api/orders/cancel with request id G', () => put(request, 'cancel', 5, requestId));
  const second = await test.step('repeat with the same request id G', () => put(request, 'cancel', 5, requestId));
  await test.step('both are 409 with the same detail, neither 200', async () => {
    expect(first.status()).toBe(409);
    expect(second.status()).toBe(409);
    expect((await first.json()).detail).toBe((await second.json()).detail);
    expect(first.status()).not.toBe(200);
    expect(second.status()).not.toBe(200);
  });
});

test('TC-BUG-10-09 cancel with an empty request id still returns 400', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel with the empty GUID', () => put(request, 'cancel', 1, EMPTY_GUID));
  await test.step('400 with the empty GUID message', async () => {
    expect(response.status()).toBe(400);
    expect(await response.json()).toBe('Empty GUID is not valid for request ID');
  });
});

test('TC-BUG-10-10 ship with an empty request id still returns 400', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship with the empty GUID', () => put(request, 'ship', 1, EMPTY_GUID));
  await test.step('400 with the empty GUID message', async () => {
    expect(response.status()).toBe(400);
    expect(await response.json()).toBe('Empty GUID is not valid for request ID');
  });
});

test('TC-BUG-10-11 cancelling a cancellable order still returns 200 and sets Cancelled', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for AwaitingValidation order 9', () => put(request, 'cancel', 9));
  await test.step('200 with empty body', async () => {
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('');
  });
  const order = await test.step('GET /api/orders/9', () => getOrder(request, 9));
  await test.step('the order is cancelled', () => expect(String(order.status).toLowerCase()).toBe('cancelled'));
});

test('TC-BUG-10-12 shipping a Paid order still returns 200 and sets Shipped', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship for Paid order 10', () => put(request, 'ship', 10));
  await test.step('200 with empty body', async () => {
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('');
  });
  const order = await test.step('GET /api/orders/10', () => getOrder(request, 10));
  await test.step('the order is shipped', () => expect(String(order.status).toLowerCase()).toBe('shipped'));
});
