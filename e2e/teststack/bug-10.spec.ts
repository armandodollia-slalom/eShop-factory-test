import { execFileSync } from 'child_process';
import { test, expect } from '../demo';
import { STACK, url } from './ports';
import { DOCKER, loadScenario } from './scenario';

// BUG-10: PUT /api/orders/cancel and /api/orders/ship on Ordering.API, called over HTTP on the test stack (no UI).
// Orders in each status come from the `bug-10` scenario (.factory/stack/scenarios/bug-10): 5 Shipped, 6 Paid,
// 7 Cancelled, 8 Submitted, 9 Submitted, 10 Paid. Every case that changes an order uses its own order.
test.describe.configure({ mode: 'serial' });

const ORDERING = url('ordering');
const IDENTITY = url('identity');
// The identity-api registers the swagger client's redirect URI from its OrderingApiClient setting (compose file).
const SWAGGER_REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

let token = '';

/** Runs a SQL query on the stack's ordering database and returns the single value it selects. */
function sql(query: string): string {
  return execFileSync(
    DOCKER,
    ['compose', '-p', STACK.project, 'exec', '-T', '-e', 'PGPASSWORD=teststack-postgres', 'postgres', 'psql', '-U', 'postgres', '-d', 'orderingdb', '-At', '-c', query],
    { encoding: 'utf8' },
  ).trim();
}

const orderStatus = (id: number) => sql(`SELECT "OrderStatus" FROM ordering.orders WHERE "Id" = ${id}`);

test.beforeAll(async ({ browser }) => {
  loadScenario('bug-10');

  // Sign in as alice through the identity server and take an access token for the ordering API (implicit flow of
  // the "orderingswaggerui" client). The redirect target does not resolve on the host, so the token is read from the redirect's Location header.
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${IDENTITY}/connect/authorize`);
  authorize.search = new URLSearchParams({
    client_id: 'orderingswaggerui',
    response_type: 'token',
    scope: 'orders',
    redirect_uri: SWAGGER_REDIRECT,
    state: 'bug-10',
  }).toString();
  await page.goto(authorize.toString());
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  const redirect = page.waitForResponse((r) => (r.headers()['location'] ?? '').startsWith(SWAGGER_REDIRECT));
  await page.getByRole('button', { name: 'Login' }).click();
  const location = (await redirect).headers()['location'];
  token = new URLSearchParams(new URL(location).hash.slice(1)).get('access_token') ?? '';
  await context.close();
  expect(token).not.toBe('');
});

type Verb = 'cancel' | 'ship';

async function change(request: import('@playwright/test').APIRequestContext, verb: Verb, orderNumber: number, requestId = crypto.randomUUID()) {
  return request.put(`${ORDERING}/api/orders/${verb}?api-version=1.0`, {
    headers: { Authorization: `Bearer ${token}`, 'x-requestid': requestId, 'Content-Type': 'application/json' },
    data: { orderNumber },
  });
}

async function expectConflict(response: import('@playwright/test').APIResponse, detail: string) {
  expect(response.status()).toBe(409);
  const body = await response.json();
  expect(body.status).toBe(409);
  expect(body.title).toBe('Invalid order status change');
  expect(body.detail).toBe(detail);
}

test('TC-BUG-10-01 cancelling a Shipped order returns 409 with the domain message', async ({ request }) => {
  let response!: import('@playwright/test').APIResponse;
  await test.step('PUT /api/orders/cancel for Shipped order 5', async () => {
    response = await change(request, 'cancel', 5);
  });
  await test.step('the response is a 409 ProblemDetails with the domain message', async () => {
    await expectConflict(response, 'Is not possible to change the order status from Shipped to Cancelled.');
  });
  await test.step('order 5 is still Shipped', async () => {
    expect(orderStatus(5)).toBe('Shipped');
  });
});

test('TC-BUG-10-02 cancelling a Paid order returns 409', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for Paid order 6', () => change(request, 'cancel', 6));
  await test.step('the response is a 409 with the Paid to Cancelled message', async () => {
    await expectConflict(response, 'Is not possible to change the order status from Paid to Cancelled.');
  });
  await test.step('order 6 is still Paid', async () => {
    expect(orderStatus(6)).toBe('Paid');
  });
});

test('TC-BUG-10-03 shipping a Cancelled order returns 409', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship for Cancelled order 7', () => change(request, 'ship', 7));
  await test.step('the response is a 409 with the Cancelled to Shipped message', async () => {
    await expectConflict(response, 'Is not possible to change the order status from Cancelled to Shipped.');
  });
  await test.step('order 7 is still Cancelled', async () => {
    expect(orderStatus(7)).toBe('Cancelled');
  });
});

test('TC-BUG-10-04 shipping a Submitted order returns 409', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship for Submitted order 8', () => change(request, 'ship', 8));
  await test.step('the response is a 409 with the Submitted to Shipped message', async () => {
    await expectConflict(response, 'Is not possible to change the order status from Submitted to Shipped.');
  });
  await test.step('order 8 is still Submitted', async () => {
    expect(orderStatus(8)).toBe('Submitted');
  });
});

test('TC-BUG-10-07 cancel with order number 0 returns 400', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel with order number 0', () => change(request, 'cancel', 0));
  await test.step('the response is a 400 naming the missing order id', async () => {
    expect(response.status()).toBe(400);
    expect(await response.text()).toContain('No orderId found');
  });
});

test('TC-BUG-10-08 ship with order number 0 returns 400', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship with order number 0', () => change(request, 'ship', 0));
  await test.step('the response is a 400 naming the missing order id', async () => {
    expect(response.status()).toBe(400);
    expect(await response.text()).toContain('No orderId found');
  });
});

test('TC-BUG-10-09 an empty x-requestid still returns 400 on cancel and ship', async ({ request }) => {
  const empty = '00000000-0000-0000-0000-000000000000';
  for (const verb of ['cancel', 'ship'] as const) {
    await test.step(`PUT /api/orders/${verb} with an empty request id`, async () => {
      const response = await change(request, verb, 5, empty);
      expect(response.status()).toBe(400);
      expect(await response.text()).toContain('Empty GUID is not valid for request ID');
    });
  }
  await test.step('order 5 is unchanged', async () => {
    expect(orderStatus(5)).toBe('Shipped');
  });
});

test('TC-BUG-10-10 cancelling a Submitted order still returns 200', async ({ request }) => {
  const response = await test.step('PUT /api/orders/cancel for Submitted order 9', () => change(request, 'cancel', 9));
  await test.step('the response is 200 with an empty body', async () => {
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('');
  });
  await test.step('order 9 is Cancelled', async () => {
    expect(orderStatus(9)).toBe('Cancelled');
  });
});

test('TC-BUG-10-11 shipping a Paid order still returns 200', async ({ request }) => {
  const response = await test.step('PUT /api/orders/ship for Paid order 10', () => change(request, 'ship', 10));
  await test.step('the response is 200 with an empty body', async () => {
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('');
  });
  await test.step('order 10 is Shipped', async () => {
    expect(orderStatus(10)).toBe('Shipped');
  });
});

test('TC-BUG-10-12 retrying with the same x-requestid after a 409 is evaluated again', async ({ request }) => {
  const requestId = crypto.randomUUID();
  const detail = 'Is not possible to change the order status from Shipped to Cancelled.';
  await test.step('first cancel of Shipped order 5 returns 409', async () => {
    await expectConflict(await change(request, 'cancel', 5, requestId), detail);
  });
  await test.step('the identical retry returns 409 again, not a duplicate 200', async () => {
    await expectConflict(await change(request, 'cancel', 5, requestId), detail);
  });
  await test.step('no ClientRequest row was kept for the request id', async () => {
    expect(sql(`SELECT count(*) FROM ordering.requests WHERE "Id" = '${requestId}'`)).toBe('0');
  });
  await test.step('order 5 is still Shipped', async () => {
    expect(orderStatus(5)).toBe('Shipped');
  });
});
