import { randomUUID } from 'crypto';
import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-54: PUT /api/orders/cancel must refuse a shopper cancelling another shopper's order with the same empty 404 a
// missing order gets, leave the owner's order as it was, and keep the owner's cancel (200) and the anonymous 401.
// Scenario `bug-54` (.factory/stack/scenarios/bug-54): the seeded users alice and bob (Pass123$), no orders.
// Every case acts on a freshly created order within the order processor's one-minute grace period, so it is still Submitted.
test.describe.configure({ mode: 'serial', timeout: 60_000 });

const PASSWORD = 'Pass123$';
const ALICE = { name: 'alice', id: '50ddac7e-9b69-4d68-a91b-25100ef2e403', holder: 'Alice Smith' };
const BOB = { name: 'bob', id: 'bc8b0071-21af-41ab-b1d2-15c4efc368df', holder: 'Bob Smith' };
type User = typeof ALICE;

const MISSING_ORDER = 999999;
const FAILED_TEXT = 'Cancel order failed to process.';
const CANCELLED_DESCRIPTION = 'The order was cancelled.';

const ORDERS = () => `${url('ordering')}/api/orders?api-version=1.0`;
const ORDER = (orderNumber: number) => `${url('ordering')}/api/orders/${orderNumber}?api-version=1.0`;
const CANCEL = () => `${url('ordering')}/api/orders/cancel?api-version=1.0`;
// The only redirect URI identity registers for the orderingswaggerui client; it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

const tokens: Record<string, string> = {};

// Each case starts with no orders, so bob has no buyer record until a case places an order for him.
test.beforeEach(() => {
  loadScenario('bug-54');
});

// The "orderingswaggerui" client uses the implicit flow: signing in returns an access token with the orders scope in the redirect fragment.
test.beforeAll(async ({ browser }) => {
  for (const user of [ALICE, BOB]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authorize = new URL(`${url('identity')}/connect/authorize`);
    authorize.search = new URLSearchParams({
      client_id: 'orderingswaggerui',
      response_type: 'token',
      scope: 'orders',
      redirect_uri: REDIRECT,
      state: `bug54-${user.name}`,
    }).toString();
    await page.goto(authorize.toString());
    await page.getByPlaceholder('Username').fill(user.name);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
    await page.getByRole('button', { name: 'Login' }).click();
    const location = (await callback).headers()['location'] ?? '';
    tokens[user.name] = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
    await context.close();
    expect(tokens[user.name]).not.toBe('');
  }
});

const auth = (user: User) => ({ Authorization: `Bearer ${tokens[user.name]}` });

// One item of catalog item 99 "Adventurer GPS Watch" with a valid Visa card.
const orderBody = (user: User) => ({
  userId: user.id,
  userName: user.name,
  city: 'Redmond',
  street: '15703 NE 61st Ct',
  state: 'WA',
  country: 'U.S.',
  zipCode: '98052',
  cardNumber: '4012888888881881',
  cardHolderName: user.holder,
  cardExpiration: '2030-12-31T00:00:00Z',
  cardSecurityNumber: '123',
  cardTypeId: 2,
  buyer: user.name,
  items: [{ id: '1', productId: 99, productName: 'Adventurer GPS Watch', unitPrice: 10.0, oldUnitPrice: 10.0, quantity: 1, pictureUrl: null }],
});

type OrderSummary = { orderNumber: number; status: string };
type OrderDetail = { orderNumber: number; status: string; description: string | null };
type Request = Parameters<Parameters<typeof test>[2]>[0]['request'];

async function listOrders(request: Request, user: User): Promise<OrderSummary[]> {
  const response = await request.get(ORDERS(), { headers: auth(user) });
  expect(response.status()).toBe(200);
  return response.json();
}

/** Creates one order for the user with POST /api/orders and returns its number, read from the user's order list. */
async function placeOrder(request: Request, user: User): Promise<number> {
  return test.step(`as ${user.name}: POST /api/orders (one Adventurer GPS Watch, Visa card)`, async () => {
    const before = new Set((await listOrders(request, user)).map((o) => o.orderNumber));
    const response = await request.post(ORDERS(), { headers: { ...auth(user), 'x-requestid': randomUUID() }, data: orderBody(user) });
    expect(response.status()).toBe(200);
    const created = (await listOrders(request, user)).filter((o) => !before.has(o.orderNumber));
    expect(created).toHaveLength(1);
    expect(created[0].status).toBe('Submitted');
    return created[0].orderNumber;
  });
}

function cancel(request: Request, orderNumber: number, user: User | null, requestId: string = randomUUID()) {
  return request.put(CANCEL(), {
    headers: { ...(user ? auth(user) : {}), 'x-requestid': requestId },
    data: { orderNumber },
  });
}

async function getOrder(request: Request, user: User, orderNumber: number) {
  const response = await request.get(ORDER(orderNumber), { headers: auth(user) });
  expect(response.status()).toBe(200);
  return (await response.json()) as OrderDetail;
}

/** 404 Not Found with an empty body: no ProblemDetails and no "Cancel order failed to process." text. */
async function expectEmptyNotFound(response: Awaited<ReturnType<typeof cancel>>) {
  expect(response.status()).toBe(404);
  const body = await response.body();
  expect(body.length).toBe(0);
  const contentLength = response.headers()['content-length'];
  if (contentLength !== undefined) expect(contentLength).toBe('0');
  expect(response.headers()['content-type'] ?? '').not.toContain('application/problem+json');
  expect(body.toString('utf8')).not.toContain(FAILED_TEXT);
}

test("TC-BUG-54-03 alice's order is still Submitted after bob's refused cancel", async ({ request }) => {
  const a = await placeOrder(request, ALICE);
  await test.step(`as alice: GET /api/orders/${a} reads Submitted before bob's attempt`, async () => {
    expect((await getOrder(request, ALICE, a)).status).toBe('Submitted');
  });
  await test.step(`as bob: PUT /api/orders/cancel { orderNumber: ${a} } answers 404`, async () => {
    const response = await cancel(request, a, BOB);
    expect(response.status()).toBe(404);
  });
  await test.step(`as alice: GET /api/orders/${a} still reads Submitted`, async () => {
    const order = await getOrder(request, ALICE, a);
    expect(order.status).toBe('Submitted');
    expect(order.description).not.toBe(CANCELLED_DESCRIPTION);
  });
  await test.step(`as alice: GET /api/orders lists order ${a} as Submitted`, async () => {
    const listed = (await listOrders(request, ALICE)).filter((o) => o.orderNumber === a);
    expect(listed).toHaveLength(1);
    expect(listed[0].status).toBe('Submitted');
  });
});

test("TC-BUG-54-04 bob, who has an order of his own, cancelling alice's order is refused with 404 and alice's order stays Submitted", async ({
  request,
}) => {
  const b = await placeOrder(request, BOB);
  const a = await placeOrder(request, ALICE);
  expect(a).not.toBe(b);
  await test.step(`as bob: PUT /api/orders/cancel { orderNumber: ${a} } answers 404 with an empty body`, async () => {
    await expectEmptyNotFound(await cancel(request, a, BOB));
  });
  await test.step(`as alice: GET /api/orders/${a} still reads Submitted`, async () => {
    expect((await getOrder(request, ALICE, a)).status).toBe('Submitted');
  });
});

test("TC-BUG-54-05 bob's refusal for alice's order matches his answer for a missing order, before and after bob has an order of his own", async ({
  request,
}) => {
  await test.step('as bob: GET /api/orders lists no orders', async () => {
    expect(await listOrders(request, BOB)).toEqual([]);
  });
  const a = await placeOrder(request, ALICE);
  await test.step(`as alice: GET /api/orders/${MISSING_ORDER} answers 404 (no such order)`, async () => {
    const response = await request.get(ORDER(MISSING_ORDER), { headers: auth(ALICE) });
    expect(response.status()).toBe(404);
  });
  await test.step(`1. as bob (no buyer record): PUT /api/orders/cancel { orderNumber: ${a} } answers an empty 404`, async () => {
    await expectEmptyNotFound(await cancel(request, a, BOB));
  });
  await test.step(`2. as bob (no buyer record): PUT /api/orders/cancel { orderNumber: ${MISSING_ORDER} } answers an empty 404`, async () => {
    await expectEmptyNotFound(await cancel(request, MISSING_ORDER, BOB));
  });
  await test.step('3. as bob: place an order, then GET /api/orders lists one order', async () => {
    await placeOrder(request, BOB);
    expect(await listOrders(request, BOB)).toHaveLength(1);
  });
  await test.step(`4. as bob (with a buyer record): PUT /api/orders/cancel { orderNumber: ${a} } answers an empty 404`, async () => {
    await expectEmptyNotFound(await cancel(request, a, BOB));
  });
  await test.step(`5. as bob (with a buyer record): PUT /api/orders/cancel { orderNumber: ${MISSING_ORDER} } answers an empty 404`, async () => {
    await expectEmptyNotFound(await cancel(request, MISSING_ORDER, BOB));
  });
});

test("TC-BUG-54-06 A cancel request without a token is refused with 401 and alice's order stays Submitted", async ({ request }) => {
  const a = await placeOrder(request, ALICE);
  await test.step(`no Authorization header: PUT /api/orders/cancel { orderNumber: ${a} } answers 401`, async () => {
    const response = await cancel(request, a, null);
    expect(response.status()).toBe(401);
  });
  await test.step(`as alice: GET /api/orders/${a} still reads Submitted`, async () => {
    expect((await getOrder(request, ALICE, a)).status).toBe('Submitted');
  });
});

test("TC-BUG-54-07 alice can still cancel her order after bob's refused attempt on it", async ({ request }) => {
  const a = await placeOrder(request, ALICE);
  const g1 = randomUUID();
  const g2 = randomUUID();
  expect(g2).not.toBe(g1);
  await test.step(`as bob (x-requestid g1): PUT /api/orders/cancel { orderNumber: ${a} } answers 404`, async () => {
    expect((await cancel(request, a, BOB, g1)).status()).toBe(404);
  });
  await test.step(`as alice (x-requestid g2): PUT /api/orders/cancel { orderNumber: ${a} } answers 200`, async () => {
    expect((await cancel(request, a, ALICE, g2)).status()).toBe(200);
  });
  await test.step(`as alice: GET /api/orders/${a} reads Cancelled`, async () => {
    expect((await getOrder(request, ALICE, a)).status).toBe('Cancelled');
  });
});
