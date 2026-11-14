import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-15: POST /api/orders/draft answers 400 problem details for a missing body or no items, and still 200 for a valid draft.
// Scenario `bug-15` (.factory/stack/scenarios/bug-15): the demo users alice and bob (Pass123$), no orders.
test.describe.configure({ mode: 'serial' });

const DRAFT = () => `${url('ordering')}/api/orders/draft?api-version=1.0`;
const PROBLEM_JSON = 'application/problem+json';
const BUYER_ID = '9e3163b9-1ae6-4652-9dc6-7898ab7b7a00';
// The only redirect URI identity registers for this client on the stack (OrderingApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

let token = '';

test.beforeAll(() => {
  loadScenario('bug-15');
});

// The "orderingswaggerui" client uses the implicit flow: signing in as alice returns an access token in the redirect fragment.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({
    client_id: 'orderingswaggerui',
    response_type: 'token',
    scope: 'orders',
    redirect_uri: REDIRECT,
    state: 'bug15',
  }).toString();
  await page.goto(authorize.toString());
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
  await page.getByRole('button', { name: 'Login' }).click();
  const location = (await callback).headers()['location'] ?? '';
  token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
  await context.close();
  expect(token).not.toBe('');
});

const auth = () => ({ Authorization: `Bearer ${token}` });

test('TC-BUG-15-01 draft without a body is rejected with 400 problem details', async ({ request }) => {
  await test.step('POST /api/orders/draft with no body', async () => {
    const response = await request.post(DRAFT(), { headers: auth() });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(PROBLEM_JSON);
    expect((await response.json()).status).toBe(400);
  });
});

test('TC-BUG-15-03 draft with body {} is rejected with 400', async ({ request }) => {
  await test.step('POST /api/orders/draft with {}', async () => {
    const response = await request.post(DRAFT(), { headers: auth(), data: {} });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(PROBLEM_JSON);
  });
});

test('TC-BUG-15-04 draft with an empty items list is rejected with 400', async ({ request }) => {
  await test.step('POST /api/orders/draft with items []', async () => {
    const response = await request.post(DRAFT(), { headers: auth(), data: { buyerId: BUYER_ID, items: [] } });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(PROBLEM_JSON);
  });
});

test('TC-BUG-15-05 draft with null items is rejected with 400', async ({ request }) => {
  await test.step('POST /api/orders/draft with items null', async () => {
    const response = await request.post(DRAFT(), { headers: auth(), data: { buyerId: BUYER_ID, items: null } });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(PROBLEM_JSON);
  });
});

test('TC-BUG-15-06 a valid draft still returns 200 with the order draft', async ({ request }) => {
  await test.step('POST /api/orders/draft with one item', async () => {
    const item = { id: '1', productId: 1, productName: 'Test item', unitPrice: 10.5, oldUnitPrice: 0, quantity: 2, pictureUrl: '' };
    const response = await request.post(DRAFT(), { headers: auth(), data: { buyerId: BUYER_ID, items: [item] } });
    expect(response.status()).toBe(200);
    const draft = await response.json();
    expect(draft.orderItems).toHaveLength(1);
    expect(draft.orderItems[0].productId).toBe(1);
    expect(draft.orderItems[0].units).toBe(2);
    expect(draft.total).toBe(21.0);
  });
});
