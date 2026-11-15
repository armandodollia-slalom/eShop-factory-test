import http2 from 'node:http2';
import { test, expect } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// BUG-33: a Basket.UpdateBasket call that lists a product more than once is stored as one line holding the sum of
// its quantities, and the shopping bag shows that one line.
// Scenario `bug-33` (.factory/stack/scenarios/bug-33): the seeded user bob (Pass123$), product 1 at 109.99, no baskets.
// TC-BUG-33-01 to -06, -08 and -09 run in process in tests/Basket.FunctionalTests/BasketUpdateDuplicateProductTests.cs.
test.describe.configure({ mode: 'serial' });

const PRODUCT_ID = 1;
const PRODUCT_NAME = 'Wanderer Black Hiking Boots';
const MERGED_QUANTITY = 3;
const MERGED_TOTAL = '$329.97'; // 109.99 × 3
// The only redirect URI identity registers for this client on the stack (BasketApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://basket-api:8080/swagger/oauth2-redirect.html';

let token = '';

test.beforeAll(() => {
  loadScenario('bug-33');
});

// The "basketswaggerui" client uses the implicit flow: signing in as bob returns an access token with the basket scope in the redirect fragment.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({
    client_id: 'basketswaggerui',
    response_type: 'token',
    scope: 'basket',
    redirect_uri: REDIRECT,
    state: 'bug33',
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

// Basket.API speaks gRPC over cleartext HTTP/2 only, which Playwright's request API cannot do, so the spec encodes the
// few messages of basket.proto by hand: BasketItem { int32 product_id = 2; int32 quantity = 6; },
// UpdateBasketRequest { repeated BasketItem items = 2; }, CustomerBasketResponse { repeated BasketItem items = 1; }.
type Item = { productId: number; quantity: number };

function varint(value: number): number[] {
  const bytes: number[] = [];
  let v = value >>> 0;
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v);
  return bytes;
}

function encodeItems(items: Item[], field: number): Buffer {
  const out: number[] = [];
  for (const item of items) {
    const body = [0x10, ...varint(item.productId), 0x30, ...varint(item.quantity)];
    out.push((field << 3) | 2, ...varint(body.length), ...body);
  }
  return Buffer.from(out);
}

function readVarint(buf: Buffer, at: number): [number, number] {
  let result = 0;
  let shift = 0;
  let pos = at;
  for (;;) {
    const byte = buf[pos++];
    result |= (byte & 0x7f) << shift;
    if (!(byte & 0x80)) return [result, pos];
    shift += 7;
  }
}

function decodeItems(buf: Buffer): Item[] {
  const items: Item[] = [];
  let pos = 0;
  while (pos < buf.length) {
    const [tag, afterTag] = readVarint(buf, pos);
    const [length, start] = readVarint(buf, afterTag);
    pos = start + length;
    if (tag !== 0x0a) continue;
    const item: Item = { productId: 0, quantity: 0 };
    let p = start;
    while (p < pos) {
      const [fieldTag, afterFieldTag] = readVarint(buf, p);
      const [value, next] = readVarint(buf, afterFieldTag);
      if (fieldTag === 0x10) item.productId = value;
      if (fieldTag === 0x30) item.quantity = value;
      p = next;
    }
    items.push(item);
  }
  return items;
}

type GrpcResult = { status: number; message: string; items: Item[] };

function callBasket(method: 'GetBasket' | 'UpdateBasket' | 'DeleteBasket', message: Buffer): Promise<GrpcResult> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(url('basket'));
    client.on('error', reject);
    const frame = Buffer.alloc(5 + message.length);
    frame.writeUInt32BE(message.length, 1);
    message.copy(frame, 5);
    const stream = client.request({
      ':method': 'POST',
      ':path': `/BasketApi.Basket/${method}`,
      'content-type': 'application/grpc',
      te: 'trailers',
      authorization: `Bearer ${token}`,
    });
    const chunks: Buffer[] = [];
    let headers: http2.IncomingHttpHeaders = {};
    let trailers: http2.IncomingHttpHeaders = {};
    stream.on('response', (h) => (headers = h));
    stream.on('trailers', (t) => (trailers = t));
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => {
      client.close();
      const body = Buffer.concat(chunks);
      const status = Number(trailers['grpc-status'] ?? headers['grpc-status'] ?? -1);
      const message = decodeURIComponent(String(trailers['grpc-message'] ?? headers['grpc-message'] ?? ''));
      resolve({ status, message, items: body.length >= 5 ? decodeItems(body.subarray(5, 5 + body.readUInt32BE(1))) : [] });
    });
    stream.end(frame);
  });
}

const GRPC_OK = 0;

test('TC-BUG-33-07 shopping bag shows product 1 once with quantity 3 and total $329.97 after a duplicate-entry update as bob', async ({ page, demo }) => {
  await test.step('get an access token for bob with scope basket and clear his basket', async () => {
    expect(token).not.toBe('');
    const deleted = await callBasket('DeleteBasket', Buffer.alloc(0));
    expect(deleted.status, deleted.message).toBe(GRPC_OK);
  });

  await test.step('call Basket.UpdateBasket with product 1 quantity 1 and product 1 quantity 2', async () => {
    const updated = await callBasket('UpdateBasket', encodeItems([
      { productId: PRODUCT_ID, quantity: 1 },
      { productId: PRODUCT_ID, quantity: 2 },
    ], 2));
    expect(updated.status, updated.message).toBe(GRPC_OK);
  });

  await test.step('call Basket.GetBasket and read one line for product 1 with quantity 3', async () => {
    const basket = await callBasket('GetBasket', Buffer.alloc(0));
    expect(basket.status, basket.message).toBe(GRPC_OK);
    expect(basket.items).toEqual([{ productId: PRODUCT_ID, quantity: MERGED_QUANTITY }]);
  });

  await test.step('sign in to the WebApp as bob', async () => {
    await page.goto(BASE_URL);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill('bob');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  });

  await test.step('open /cart: product 1 is shown once with quantity 3 and total $329.97', async () => {
    await page.goto(`${BASE_URL}/cart`);
    const lines = page.locator('.cart-item');
    await expect(lines).toHaveCount(1);
    const line = lines.first();
    await expect(line.locator('.name')).toHaveText(PRODUCT_NAME);
    await expect(line.getByLabel(`Quantity of ${PRODUCT_NAME}`, { exact: true })).toHaveValue(String(MERGED_QUANTITY));
    await expect(line.locator('.catalog-item-total')).toHaveText(MERGED_TOTAL);
    await demo.highlight(line, `One line: ${PRODUCT_NAME}, quantity 3, ${MERGED_TOTAL}`);

    await expect(page.locator('.cart-summary-header .filter-badge')).toHaveText(String(MERGED_QUANTITY));
    await expect(page.locator('.cart-summary-total')).toContainText(MERGED_TOTAL);
    await demo.highlight(page.locator('.cart-summary-container'), `Bag badge 3, total ${MERGED_TOTAL}`);
  });
});
