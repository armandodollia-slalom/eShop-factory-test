import type { APIRequestContext } from '@playwright/test';
import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-57: POST /api/orders answers 400 with a CardTypeId validation problem for a card type the shop does not know,
// and places no order; orders with a known card type (1 Amex, 2 Visa, 3 MasterCard) are still placed with 200.
// Scenario `bug-57` (.factory/stack/scenarios/bug-57): the demo user alice (Pass123$) and the seeded card types.
// The unknown-card-type boundaries 4, 0 and -1 (TC-BUG-57-04..06) are in tests/Ordering.FunctionalTests/CreateOrderCardTypeTests.cs.
test.describe.configure({ mode: 'serial' });

const ORDERS = () => `${url('ordering')}/api/orders?api-version=1.0`;
const CARD_TYPES = () => `${url('ordering')}/api/orders/cardtypes?api-version=1.0`;
const PROBLEM_JSON = 'application/problem+json';
const KNOWN_CARD_TYPES = [
  { id: 1, name: 'Amex' },
  { id: 2, name: 'Visa' },
  { id: 3, name: 'MasterCard' },
];
// The only redirect URI identity registers for this client on the stack (OrderingApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

let token = '';
let aliceId = '';

test.beforeAll(() => {
  loadScenario('bug-57');
});

// Step 1 of the ticket: sign in as alice and get an access token for the Ordering API (scope `orders`).
// The "orderingswaggerui" client uses the implicit flow: signing in returns the access token in the redirect fragment.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({
    client_id: 'orderingswaggerui',
    response_type: 'token',
    scope: 'orders',
    redirect_uri: REDIRECT,
    state: 'bug57',
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
  // alice's id is generated when identity seeds her, so the body's userId and buyer come from the token's sub claim.
  aliceId = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).sub;
  expect(aliceId).not.toBe('');
});

const auth = () => ({ Authorization: `Bearer ${token}` });

// The order body of TC-BUG-57-01 step 1; only cardTypeId differs between the cases.
const order = (cardTypeId: number) => ({
  userId: aliceId,
  userName: 'alice',
  city: 'Redmond',
  street: '15703 NE 61st Ct',
  state: 'WA',
  country: 'U.S.',
  zipCode: '98052',
  cardNumber: '4111111111111111',
  cardHolderName: 'Alice Smith',
  cardExpiration: '2030-12-31T00:00:00Z',
  cardSecurityNumber: '123',
  cardTypeId,
  buyer: aliceId,
  items: [{ id: '1', productId: 99, productName: 'Adventurer GPS Watch', unitPrice: 199.99, oldUnitPrice: 199.99, quantity: 1, pictureUrl: '' }],
});

type OrderSummary = { orderNumber: number; total: number };

async function listOrders(request: APIRequestContext): Promise<OrderSummary[]> {
  const response = await request.get(ORDERS(), { headers: auth() });
  expect(response.status()).toBe(200);
  return response.json();
}

async function expectKnownCardTypes(request: APIRequestContext) {
  await test.step('GET /api/orders/cardtypes lists 1 Amex, 2 Visa, 3 MasterCard', async () => {
    const response = await request.get(CARD_TYPES(), { headers: auth() });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(KNOWN_CARD_TYPES);
  });
}

async function postOrder(request: APIRequestContext, cardTypeId: number) {
  return request.post(ORDERS(), {
    headers: { ...auth(), 'x-requestid': crypto.randomUUID(), 'Content-Type': 'application/json' },
    data: order(cardTypeId),
  });
}

// Steps 1 and 2 of TC-BUG-57-01, -07 and -08: the order is placed with 200 and alice's list grows by one order of 199.99.
async function placeKnownCardTypeOrder(request: APIRequestContext, cardTypeId: number, cardTypeName: string) {
  const before = await test.step("GET /api/orders and record alice's order count N", () => listOrders(request));
  await test.step(`POST /api/orders with cardTypeId ${cardTypeId} (${cardTypeName}) answers 200`, async () => {
    const response = await postOrder(request, cardTypeId);
    expect(response.status()).toBe(200);
  });
  await test.step("GET /api/orders lists N + 1 orders for alice, the new one with total 199.99", async () => {
    // Every sampled status is recorded and asserted after the poll, so a 500 between samples fails the case.
    const statuses: number[] = [];
    await expect
      .poll(
        async () => {
          const response = await request.get(ORDERS(), { headers: auth() });
          statuses.push(response.status());
          return response.status() === 200 ? ((await response.json()) as OrderSummary[]).length : -1;
        },
        { timeout: 30_000 },
      )
      .toBe(before.length + 1);
    expect(statuses.filter((s) => s !== 200)).toEqual([]);
    const after = await listOrders(request);
    const known = new Set(before.map((o) => o.orderNumber));
    const created = after.filter((o) => !known.has(o.orderNumber));
    expect(created).toHaveLength(1);
    expect(created[0].total).toBe(199.99);
  });
}

test('TC-BUG-57-02 repeating alice\'s order with card type 99 answers 400 under CardTypeId and places no order', async ({ request }) => {
  await expectKnownCardTypes(request);
  await placeKnownCardTypeOrder(request, 2, 'Visa');
  const m = await test.step("GET /api/orders and record alice's order count M after the Visa order", async () => (await listOrders(request)).length);

  await test.step('POST the same order with cardTypeId 99 answers 400 with a CardTypeId problem', async () => {
    const response = await postOrder(request, 99);
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']?.split(';')[0].trim()).toBe(PROBLEM_JSON);
    const text = await response.text();
    expect(text.trim()).not.toBe('');
    const problem = JSON.parse(text);
    expect(problem.status).toBe(400);
    expect(Object.keys(problem.errors)).toEqual(['CardTypeId']);
    expect(problem.errors.CardTypeId).toHaveLength(1);
    expect(problem.errors.CardTypeId[0]).toContain('not known');
  });

  await test.step('after 5 s, GET /api/orders still lists M orders for alice', async () => {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    expect(await listOrders(request)).toHaveLength(m);
  });
});

test('TC-BUG-57-07 an order with card type 1 (Amex), the lowest known card type, is placed with 200', async ({ request }) => {
  await placeKnownCardTypeOrder(request, 1, 'Amex');
});

test('TC-BUG-57-08 an order with card type 3 (MasterCard), the highest known card type, is placed with 200', async ({ request }) => {
  await placeKnownCardTypeOrder(request, 3, 'MasterCard');
});
