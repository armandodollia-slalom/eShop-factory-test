import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-30: POST /api/orders answers 400 with a CardNumber validation problem for a missing or short card number and creates no order;
// a valid card number still creates an order.
// Scenario `bug-30` (.factory/stack/scenarios/bug-30): the demo users alice and bob (Pass123$), no orders.
test.describe.configure({ mode: 'serial' });

const ORDERS = () => `${url('ordering')}/api/orders?api-version=1.0`;
const PROBLEM_JSON = 'application/problem+json';
// bob's subject id on the stack (UsersSeed.cs); the order is created for the userId in the body, and GET /api/orders lists the token's user.
const BOB_ID = 'bc8b0071-21af-41ab-b1d2-15c4efc368df';
// The only redirect URI identity registers for this client on the stack (OrderingApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

let token = '';

test.beforeAll(() => {
  loadScenario('bug-30');
});

// The "orderingswaggerui" client uses the implicit flow: signing in as bob returns an access token with the orders scope in the redirect fragment.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({
    client_id: 'orderingswaggerui',
    response_type: 'token',
    scope: 'orders',
    redirect_uri: REDIRECT,
    state: 'bug30',
  }).toString();
  await page.goto(authorize.toString());
  await page.getByPlaceholder('Username').fill('bob');
  await page.getByPlaceholder('Password').fill('Pass123$');
  const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
  await page.getByRole('button', { name: 'Login' }).click();
  const location = (await callback).headers()['location'] ?? '';
  token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
  await context.close();
  expect(token).not.toBe('');
});

const auth = () => ({ Authorization: `Bearer ${token}` });

// The plan's order body; `undefined` leaves the cardNumber property out of the JSON.
const order = (cardNumber: string | undefined) => ({
  userId: BOB_ID,
  userName: 'bob',
  city: 'Redmond',
  street: '15703 NE 61st Ct',
  state: 'WA',
  country: 'U.S.',
  zipCode: '98052',
  ...(cardNumber === undefined ? {} : { cardNumber }),
  cardHolderName: 'Bob Smith',
  cardExpiration: '2030-12-31T00:00:00Z',
  cardSecurityNumber: '123',
  cardTypeId: 2,
  buyer: 'bob',
  items: [{ id: '1', productId: 99, productName: 'Adventurer GPS Watch', unitPrice: 10.0, oldUnitPrice: 10.0, quantity: 1, pictureUrl: null }],
});

type OrderSummary = { orderNumber: number; total: number };

type Request = Parameters<Parameters<typeof test>[2]>[0]['request'];

async function listOrders(request: Request): Promise<OrderSummary[]> {
  const response = await request.get(ORDERS(), { headers: auth() });
  expect(response.status()).toBe(200);
  return response.json();
}

async function expectRejected(request: Request, requestId: string, cardNumber: string | undefined) {
  const before = await test.step('GET /api/orders and record N', async () => (await listOrders(request)).length);
  await test.step(`POST /api/orders with cardNumber ${cardNumber === undefined ? 'missing' : JSON.stringify(cardNumber)}`, async () => {
    const response = await request.post(ORDERS(), { headers: { ...auth(), 'x-requestid': requestId }, data: order(cardNumber) });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(PROBLEM_JSON);
    const problem = await response.json();
    expect(Object.keys(problem.errors)).toContain('CardNumber');
    expect(Array.isArray(problem.errors.CardNumber)).toBe(true);
    expect(problem.errors.CardNumber.some((m: unknown) => typeof m === 'string' && m.trim() !== '')).toBe(true);
  });
  await test.step('GET /api/orders still lists N orders', async () => {
    expect(await listOrders(request)).toHaveLength(before);
  });
}

test('TC-BUG-30-01 order with card number "12" is rejected with a CardNumber validation problem', async ({ request }) => {
  await expectRejected(request, '0b6f6a52-3d0e-4c8e-9f41-5a2d7c1e8b30', '12');
});

test('TC-BUG-30-02 order with an empty card number is rejected with a CardNumber validation problem', async ({ request }) => {
  await expectRejected(request, '0b6f6a52-3d0e-4c8e-9f41-5a2d7c1e8b32', '');
});

test('TC-BUG-30-03 order without a cardNumber field is rejected with a CardNumber validation problem', async ({ request }) => {
  await expectRejected(request, '0b6f6a52-3d0e-4c8e-9f41-5a2d7c1e8b33', undefined);
});

test('TC-BUG-30-04 order with a three-digit card number "123" is rejected with a CardNumber validation problem', async ({ request }) => {
  await expectRejected(request, '0b6f6a52-3d0e-4c8e-9f41-5a2d7c1e8b34', '123');
});

test('TC-BUG-30-05 order with card number "4012888888881881" is accepted and creates an order', async ({ request }) => {
  const before = await test.step('GET /api/orders and record N', () => listOrders(request));
  await test.step('POST /api/orders with cardNumber "4012888888881881"', async () => {
    const response = await request.post(ORDERS(), {
      headers: { ...auth(), 'x-requestid': '7d2c9e41-6a8b-4f13-b5e0-2c94d1a7f683' },
      data: order('4012888888881881'),
    });
    expect(response.status()).toBe(200);
  });
  await test.step('GET /api/orders lists N + 1 orders, the new one with total 10', async () => {
    const after = await listOrders(request);
    expect(after).toHaveLength(before.length + 1);
    const known = new Set(before.map((o) => o.orderNumber));
    const created = after.filter((o) => !known.has(o.orderNumber));
    expect(created).toHaveLength(1);
    expect(created[0].total).toBe(10);
  });
});
