import { randomUUID } from 'crypto';
import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-47: GET /api/orders/{orderId} returns an order only to the shopper who owns it; another shopper gets the same
// empty 404 as for an order that does not exist. The owner still gets 200 and GET /api/orders is unchanged.
// Scenario `bug-47` (.factory/stack/scenarios/bug-47): the seeded users alice and bob (Pass123$), no orders.
test.describe.configure({ mode: 'serial' });

const ORDERS = () => `${url('ordering')}/api/orders?api-version=1.0`;
const ORDER = (orderNumber: number) => `${url('ordering')}/api/orders/${orderNumber}?api-version=1.0`;
// The only redirect URI identity registers for this client on the stack (OrderingApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';
const STREET = '15703 NE 61st Ct';
const PRODUCT = 'Adventurer GPS Watch';
const MISSING_ORDER = 999999;

type Shopper = { name: 'alice' | 'bob'; holder: string; token: string; sub: string };
const alice: Shopper = { name: 'alice', holder: 'Alice Smith', token: '', sub: '' };
const bob: Shopper = { name: 'bob', holder: 'Bob Smith', token: '', sub: '' };
let orderA = 0;
let orderB = 0;

type Request = Parameters<Parameters<typeof test>[2]>[0]['request'];
type Browser = Parameters<Parameters<typeof test.beforeAll>[0]>[0]['browser'];

const auth = (shopper: Shopper) => ({ Authorization: `Bearer ${shopper.token}` });

// The "orderingswaggerui" client uses the implicit flow: signing in returns an access token with the orders scope in the redirect fragment.
async function signIn(browser: Browser, shopper: Shopper) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({
    client_id: 'orderingswaggerui',
    response_type: 'token',
    scope: 'orders',
    redirect_uri: REDIRECT,
    state: `bug47-${shopper.name}`,
  }).toString();
  await page.goto(authorize.toString());
  await page.getByPlaceholder('Username').fill(shopper.name);
  await page.getByPlaceholder('Password').fill('Pass123$');
  const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
  await page.getByRole('button', { name: 'Login' }).click();
  const location = (await callback).headers()['location'] ?? '';
  shopper.token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
  await context.close();
  expect(shopper.token).not.toBe('');
  shopper.sub = JSON.parse(Buffer.from(shopper.token.split('.')[1], 'base64url').toString('utf8')).sub;
  expect(shopper.sub).not.toBe('');
}

type OrderSummary = { orderNumber: number; total: number };

async function listOrders(request: Request, shopper: Shopper): Promise<OrderSummary[]> {
  const response = await request.get(ORDERS(), { headers: auth(shopper) });
  expect(response.status()).toBe(200);
  return response.json();
}

// Places the plan's order as the shopper and returns its number, read from the shopper's own list.
async function placeOrder(request: Request, shopper: Shopper): Promise<number> {
  const before = new Set((await listOrders(request, shopper)).map((o) => o.orderNumber));
  const response = await request.post(ORDERS(), {
    headers: { ...auth(shopper), 'x-requestid': randomUUID() },
    data: {
      userId: shopper.sub,
      userName: shopper.name,
      buyer: shopper.name,
      city: 'Redmond',
      street: STREET,
      state: 'WA',
      country: 'U.S.',
      zipCode: '98052',
      cardNumber: '4012888888881881',
      cardHolderName: shopper.holder,
      cardExpiration: '2030-12-31T00:00:00Z',
      cardSecurityNumber: '123',
      cardTypeId: 2,
      items: [{ id: '1', productId: 99, productName: PRODUCT, unitPrice: 10.0, oldUnitPrice: 10.0, quantity: 1, pictureUrl: null }],
    },
  });
  expect(response.status()).toBe(200);
  const created = (await listOrders(request, shopper)).filter((o) => !before.has(o.orderNumber));
  expect(created).toHaveLength(1);
  return created[0].orderNumber;
}

test.beforeAll(() => {
  loadScenario('bug-47');
});

test.beforeAll(async ({ browser, playwright }) => {
  await signIn(browser, alice);
  await signIn(browser, bob);
  const request = await playwright.request.newContext();
  orderA = await placeOrder(request, alice);
  orderB = await placeOrder(request, bob);
  await request.dispose();
  expect(orderA).not.toBe(orderB);
});

test('TC-BUG-47-01 bob requesting alice\'s order gets 404 with no order data', async ({ request }) => {
  await test.step(`As bob: GET /api/orders/${orderA} (alice's order) answers 404 with an empty body`, async () => {
    const response = await request.get(ORDER(orderA), { headers: auth(bob) });
    expect(response.status()).toBe(404);
    const body = (await response.body()).toString('utf8');
    expect(body).toHaveLength(0);
    expect(body).not.toContain(STREET);
    expect(body).not.toContain(PRODUCT);
    expect(body).not.toContain('orderNumber');
    expect(body).not.toContain('description');
  });
  await test.step(`As alice: GET /api/orders/${orderA} still answers 200 with orderNumber ${orderA}`, async () => {
    const response = await request.get(ORDER(orderA), { headers: auth(alice) });
    expect(response.status()).toBe(200);
    expect((await response.json()).orderNumber).toBe(orderA);
  });
});

test('TC-BUG-47-03 bob\'s answer for alice\'s order is identical to his answer for a missing order', async ({ request }) => {
  const others = await test.step(`As bob: GET /api/orders/${orderA} (alice's order)`, async () => {
    const response = await request.get(ORDER(orderA), { headers: auth(bob) });
    return { status: response.status(), contentType: response.headers()['content-type'], body: await response.body() };
  });
  const missing = await test.step(`As bob: GET /api/orders/${MISSING_ORDER} (no such order)`, async () => {
    const response = await request.get(ORDER(MISSING_ORDER), { headers: auth(bob) });
    return { status: response.status(), contentType: response.headers()['content-type'], body: await response.body() };
  });
  await test.step('Both answers are the same empty 404', async () => {
    expect(others.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(missing.body.length).toBe(0);
    expect(others.contentType).toBe(missing.contentType);
    expect(others.body.equals(missing.body)).toBe(true);
  });
});

test('TC-BUG-47-04 alice requesting her own order still gets 200 with the order', async ({ request }) => {
  await test.step(`As alice: GET /api/orders/${orderA} answers 200 with her order`, async () => {
    const response = await request.get(ORDER(orderA), { headers: auth(alice) });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const order = await response.json();
    expect(order.orderNumber).toBe(orderA);
    expect(order.street).toBe(STREET);
    expect(order.city).toBe('Redmond');
    expect(order.state).toBe('WA');
    expect(order.country).toBe('U.S.');
    expect(order.zipcode).toBe('98052');
    expect(order.orderItems).toHaveLength(1);
    expect(order.orderItems[0].productName).toBe(PRODUCT);
    expect(order.orderItems[0].units).toBe(1);
    expect(order.orderItems[0].unitPrice).toBe(10);
    expect(order.total).toBe(10);
  });
});

test('TC-BUG-47-07 alice\'s order list still lists only her orders, including A', async ({ request }) => {
  await test.step('As alice: GET /api/orders lists A (total 10) and not bob\'s order B', async () => {
    const response = await request.get(ORDERS(), { headers: auth(alice) });
    expect(response.status()).toBe(200);
    const orders: OrderSummary[] = await response.json();
    expect(Array.isArray(orders)).toBe(true);
    const a = orders.filter((o) => o.orderNumber === orderA);
    expect(a).toHaveLength(1);
    expect(a[0].total).toBe(10);
    expect(orders.some((o) => o.orderNumber === orderB)).toBe(false);
  });
});
