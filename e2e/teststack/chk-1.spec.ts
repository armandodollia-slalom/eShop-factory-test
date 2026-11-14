import { randomUUID } from 'crypto';
import { APIRequestContext, APIResponse, Browser, Page } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// CHK-1: optional delivery note on POST /api/orders, GET /api/orders/{orderId} and the checkout form.
// Scenario `chk-1` (.factory/stack/scenarios/chk-1): alice (Pass123$) has item 99 "Adventurer GPS Watch" x1 in her basket
// and no orders; order 9001 (no note stored) belongs to bob and is read by TC-CHK-1-09.
// The cases run one after the other and each starts from a freshly loaded scenario, so "no orders" and "a single entry" hold.
test.describe.configure({ mode: 'serial' });

test.beforeEach(() => {
  loadScenario('chk-1');
});

const ORDERING = () => url('ordering');
const API = (path: string) => `${ORDERING()}/api/orders${path}${path.includes('?') ? '&' : '?'}api-version=1.0`;
// The only redirect URI identity registers for the "orderingswaggerui" client on the stack; it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

const ALICE_ID = '50ddac7e-9b69-4d68-a91b-25100ef2e403';
const NOTE_LIMIT = 200;
const BACK_DOOR = 'Leave at the back door';
const ADDRESS = { street: '1 Main St', city: 'Seattle', state: 'WA', country: 'USA', zipCode: '98101' };

// Body B of the plan (_index.md); every case adds its own deliveryNote.
const bodyB = {
  userId: ALICE_ID,
  userName: 'alice',
  city: ADDRESS.city,
  street: ADDRESS.street,
  state: ADDRESS.state,
  country: ADDRESS.country,
  zipCode: ADDRESS.zipCode,
  cardNumber: '4012888888881881',
  cardHolderName: 'Alice Smith',
  cardExpiration: '2030-12-01T00:00:00Z',
  cardSecurityNumber: '123',
  cardTypeId: 1,
  buyer: 'alice',
  items: [{ productId: 99, productName: 'Adventurer GPS Watch', unitPrice: 10.0, oldUnitPrice: 0, quantity: 1, pictureUrl: '' }],
};

type Json = Record<string, unknown>;

/** Signs in as the given user (password Pass123$) on the identity server with the implicit flow of the ordering swagger client and returns the access token. */
async function userToken(browser: Browser, userName: string): Promise<string> {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const authorize = new URL(`${url('identity')}/connect/authorize`);
    authorize.search = new URLSearchParams({
      client_id: 'orderingswaggerui',
      response_type: 'token',
      scope: 'orders',
      redirect_uri: REDIRECT,
      state: 'chk1',
    }).toString();
    await page.goto(authorize.toString());
    await page.getByPlaceholder('Username').fill(userName);
    await page.getByPlaceholder('Password').fill('Pass123$');
    // The 302 from /connect/authorize/callback carries the token in its Location fragment; the target host is unreachable, so read it from the response.
    const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
    await page.getByRole('button', { name: 'Login' }).click();
    const location = (await callback).headers()['location'] ?? '';
    const token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
    expect(token).not.toBe('');
    return token;
  } finally {
    await context.close();
  }
}

const aliceToken = (browser: Browser) => userToken(browser, 'alice');
const bobToken = (browser: Browser) => userToken(browser, 'bob');

type Api = { get: (path: string) => Promise<APIResponse>; post: (note: string | undefined | null, extra?: Json) => Promise<APIResponse> };

function apiAs(token: string, request: APIRequestContext): Api {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    get: (path) => request.get(API(path), { headers }),
    post: (note, extra = {}) => {
      const data: Json = { ...bodyB, ...extra };
      if (note !== undefined) data.deliveryNote = note;
      return request.post(API(''), { headers: { ...headers, 'x-requestid': randomUUID() }, data });
    },
  };
}

/** Lowercases the keys of a JSON object so the cases do not depend on the serializer's casing. */
const lower = (value: Json): Json => Object.fromEntries(Object.entries(value).map(([k, v]) => [k.toLowerCase(), v]));

/** GET /api/orders as alice: the order numbers she has. */
async function orderNumbers(api: Api): Promise<number[]> {
  const response = await api.get('');
  expect(response.status()).toBe(200);
  return ((await response.json()) as Json[]).map((o) => lower(o).ordernumber as number);
}

/** Places an order with the given note (step 1), lists alice's orders (step 2) and reads the single order back (step 3). */
async function placeAndRead(api: Api, note: string | undefined | null): Promise<Json> {
  let orderId = 0;
  await test.step('POST /api/orders as alice', async () => {
    const response = await api.post(note);
    expect(response.status()).toBe(200);
  });
  await test.step('GET /api/orders lists exactly one entry', async () => {
    // The command is handled before the 200 is returned, so one poll is enough; expect.poll covers a slow commit.
    await expect.poll(async () => (await orderNumbers(api)).length).toBe(1);
    orderId = (await orderNumbers(api))[0];
  });
  return test.step('GET /api/orders/{orderId}', async () => {
    const response = await api.get(`/${orderId}`);
    expect(response.status()).toBe(200);
    return lower(await response.json());
  });
}

/** Renders an API result on a blank page and marks it, so the video and keyframes show the state the case asserts. */
async function showResult(page: Page, demo: Demo, label: string, value: unknown) {
  await page.setContent('<body style="font:16px monospace;padding:40px"><h3></h3><pre id="result" style="padding:12px;white-space:pre-wrap"></pre></body>');
  await page.locator('h3').evaluate((el, text) => { el.textContent = text; }, label);
  await page.locator('#result').evaluate((el, text) => { el.textContent = text; }, JSON.stringify(value, null, 2));
  await demo.highlight(page.locator('#result'), label);
}

// ---------------------------------------------------------------- API (functional cases, run on the stack)

test('TC-CHK-1-01 delivery note is stored and returned by GET /api/orders/{orderId}', async ({ browser, request, page, demo }) => {
  const api = apiAs(await aliceToken(browser), request);
  const order = await placeAndRead(api, BACK_DOOR);
  expect(order.deliverynote).toBe(BACK_DOOR);
  await showResult(page, demo, `GET order: deliveryNote = ${BACK_DOOR}`, { deliveryNote: order.deliverynote });
});

test('TC-CHK-1-02 order placed without deliveryNote has deliveryNote null', async ({ browser, request, page, demo }) => {
  const api = apiAs(await aliceToken(browser), request);
  const order = await placeAndRead(api, undefined);
  expect(order).toHaveProperty('deliverynote', null);
  await showResult(page, demo, 'GET order: deliveryNote is null', { deliveryNote: order.deliverynote });
});

test('TC-CHK-1-03 empty-string deliveryNote is stored as null', async ({ browser, request, page, demo }) => {
  const api = apiAs(await aliceToken(browser), request);
  const order = await placeAndRead(api, '');
  expect(order).toHaveProperty('deliverynote', null);
  await showResult(page, demo, 'GET order: deliveryNote is null', { deliveryNote: order.deliverynote });
});

test('TC-CHK-1-04 whitespace-only deliveryNote is stored as null', async ({ browser, request, page, demo }) => {
  const api = apiAs(await aliceToken(browser), request);
  const order = await placeAndRead(api, '     ');
  expect(order).toHaveProperty('deliverynote', null);
  await showResult(page, demo, 'GET order: deliveryNote is null', { deliveryNote: order.deliverynote });
});

test('TC-CHK-1-05 surrounding whitespace is trimmed from the stored note', async ({ browser, request, page, demo }) => {
  const api = apiAs(await aliceToken(browser), request);
  const order = await placeAndRead(api, '  Ring twice  ');
  expect(order.deliverynote).toBe('Ring twice');
  await showResult(page, demo, 'GET order: deliveryNote trimmed', { deliveryNote: order.deliverynote });
});

test('TC-CHK-1-06 a note of exactly 200 characters is accepted', async ({ browser, request, page, demo }) => {
  const api = apiAs(await aliceToken(browser), request);
  const note = 'a'.repeat(NOTE_LIMIT);
  const order = await placeAndRead(api, note);
  expect(order.deliverynote).toBe(note);
  expect((order.deliverynote as string).length).toBe(NOTE_LIMIT);
  await showResult(page, demo, 'GET order: 200-character deliveryNote', { length: (order.deliverynote as string).length, deliveryNote: order.deliverynote });
});

test('TC-CHK-1-07 a 200-character note padded with whitespace is accepted and trimmed', async ({ browser, request, page, demo }) => {
  const api = apiAs(await aliceToken(browser), request);
  const note = 'a'.repeat(NOTE_LIMIT);
  const order = await placeAndRead(api, `   ${note}   `);
  expect(order.deliverynote).toBe(note);
  expect((order.deliverynote as string).length).toBe(NOTE_LIMIT);
  await showResult(page, demo, 'GET order: padded note trimmed to 200 characters', { length: (order.deliverynote as string).length, deliveryNote: order.deliverynote });
});

test('TC-CHK-1-08 a 201-character note is rejected with 400 and creates no order', async ({ browser, request, page, demo }) => {
  const api = apiAs(await aliceToken(browser), request);
  await test.step('POST /api/orders with a 201-character note', async () => {
    const response = await api.post('a'.repeat(NOTE_LIMIT + 1));
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/problem+json');
    const body = (await response.json()) as { errors?: Record<string, string[]> };
    const key = Object.keys(body.errors ?? {}).find((k) => k.toLowerCase() === 'deliverynote');
    expect(key).toBeDefined();
    expect(body.errors![key!].length).toBeGreaterThanOrEqual(1);
    await showResult(page, demo, '400 problem+json: deliveryNote error', { status: response.status(), errors: body.errors });
  });
  await test.step('GET /api/orders is empty: no order was created', async () => {
    const response = await api.get('');
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
    await showResult(page, demo, 'GET /api/orders: empty, no order created', await response.json());
  });
});

test('TC-CHK-1-09 an order stored before the change reads back with deliveryNote null and unchanged fields', async ({ browser, request, page, demo }) => {
  const LEGACY_ORDER_ID = 9001;
  const api = apiAs(await bobToken(browser), request);
  const response = await test.step('GET /api/orders/9001 as bob (the owner)', () => api.get(`/${LEGACY_ORDER_ID}`));
  expect(response.status()).toBe(200);
  const order = lower(await response.json());
  expect(order).toHaveProperty('deliverynote', null);
  expect(order.ordernumber).toBe(LEGACY_ORDER_ID);
  expect(new Date(order.date as string).toISOString()).toBe('2026-01-15T10:00:00.000Z');
  expect(order.status).toBe('Submitted');
  expect(order.description).toBe('Legacy order stored before the delivery note');
  expect(order.street).toBe(ADDRESS.street);
  expect(order.city).toBe(ADDRESS.city);
  expect(order.state).toBe(ADDRESS.state);
  expect(order.zipcode).toBe(ADDRESS.zipCode);
  expect(order.country).toBe(ADDRESS.country);
  expect(order.total).toBe(10);
  const items = (order.orderitems as Json[]).map(lower);
  expect(items).toHaveLength(1);
  expect(items[0].productname).toBe('Adventurer GPS Watch');
  expect(items[0].units).toBe(1);
  expect(items[0].unitprice).toBe(10);
  await showResult(page, demo, 'GET order 9001: deliveryNote is null, other fields unchanged', order);
});

// ---------------------------------------------------------------- UI (e2e cases)

async function signInAndOpenCheckout(page: Page) {
  await page.goto(BASE_URL!);
  await page.getByLabel('Sign in').click();
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  await page.goto(`${BASE_URL}/cart`);
  await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Check out' }).click();
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
}

async function fillAddress(page: Page) {
  await page.getByLabel('Address').fill(ADDRESS.street);
  await page.getByLabel('City').fill(ADDRESS.city);
  await page.getByLabel('State').fill(ADDRESS.state);
  await page.getByLabel('Country').fill(ADDRESS.country);
  await page.getByLabel('Zip code').fill(ADDRESS.zipCode);
}

const noteField = (page: Page) => page.getByLabel('Delivery note (optional)');

test('TC-CHK-1-10 checkout shows a multi-line field labeled Delivery note (optional) between the address fields and Place order', async ({ page, demo }) => {
  await test.step('open the checkout page from the cart', () => signInAndOpenCheckout(page));
  const note = noteField(page);
  await test.step('a textarea is labeled exactly "Delivery note (optional)" and is empty', async () => {
    await expect(note).toHaveJSProperty('tagName', 'TEXTAREA');
    await expect(note).toHaveValue('');
    await demo.highlight(note, 'Delivery note (optional) textarea');
  });
  await test.step('it follows the address fields and precedes Place order in document order', async () => {
    const after = async (earlier: ReturnType<Page['locator']>, later: ReturnType<Page['locator']>) =>
      earlier.evaluate((a, b) => !!(a.compareDocumentPosition(b as Node) & Node.DOCUMENT_POSITION_FOLLOWING), await later.elementHandle());
    for (const label of ['Address', 'City', 'State', 'Country', 'Zip code']) {
      expect(await after(page.getByLabel(label), note), `${label} comes before the note`).toBe(true);
    }
    expect(await after(note, page.getByRole('button', { name: 'Place order' })), 'the note comes before Place order').toBe(true);
    await demo.highlight(page.getByRole('button', { name: 'Place order' }), 'Place order below the delivery note');
  });
});

type UiFixtures = { page: Page; browser: Browser; request: APIRequestContext; demo: Demo };

/** Fills the checkout form (the note only when given), places the order through the UI and reads the single stored order back through the API. */
async function placeOrderThroughUi({ page, browser, request, demo }: UiFixtures, note: string | null): Promise<Json> {
  await test.step('open the checkout page', () => signInAndOpenCheckout(page));
  await test.step('fill the address fields', () => fillAddress(page));
  await test.step(note === null ? 'leave the delivery note empty' : 'type the delivery note', async () => {
    if (note !== null) await noteField(page).fill(note);
    await expect(noteField(page)).toHaveValue(note ?? '');
    await demo.highlight(noteField(page), note === null ? 'Delivery note left empty' : `Delivery note: ${note}`);
  });
  await test.step('press Place order', async () => {
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page).toHaveURL(/\/user\/orders$/);
    await demo.highlight(page.getByRole('heading', { name: 'Orders', exact: true }), 'Orders page after placing the order');
  });
  const api = apiAs(await aliceToken(browser), request);
  return test.step('read the stored order back', async () => {
    await expect.poll(async () => (await orderNumbers(api)).length).toBe(1);
    const [orderId] = await orderNumbers(api);
    const response = await api.get(`/${orderId}`);
    expect(response.status()).toBe(200);
    return lower(await response.json());
  });
}

test('TC-CHK-1-11 shopper places an order with a delivery note through the UI', async ({ page, browser, request, demo }) => {
  const order = await placeOrderThroughUi({ page, browser, request, demo }, BACK_DOOR);
  expect(order.deliverynote).toBe(BACK_DOOR);
});

test('TC-CHK-1-12 shopper places an order with the note left empty through the UI', async ({ page, browser, request, demo }) => {
  const order = await placeOrderThroughUi({ page, browser, request, demo }, null);
  expect(order).toHaveProperty('deliverynote', null);
});

test('TC-CHK-1-13 a 201-character note is blocked on the checkout page with the field error', async ({ page, browser, request, demo }) => {
  await test.step('open the checkout page', () => signInAndOpenCheckout(page));
  await test.step('fill the address fields', () => fillAddress(page));
  await test.step('enter 201 characters in the delivery note', async () => {
    await noteField(page).fill('a'.repeat(NOTE_LIMIT + 1));
    await expect(noteField(page)).toHaveValue('a'.repeat(NOTE_LIMIT + 1));
  });
  await test.step('press Place order', async () => {
    await page.getByRole('button', { name: 'Place order' }).click();
  });
  await test.step('the page stays on checkout and the field shows the error', async () => {
    const error = page.locator('label', { has: noteField(page) }).getByText('Delivery note must be 200 characters or fewer', { exact: true });
    await expect(error).toBeVisible();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    await demo.highlight(error, 'Delivery note must be 200 characters or fewer');
  });
  await test.step('no order was created', async () => {
    const api = apiAs(await aliceToken(browser), request);
    const response = await api.get('');
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});
