import http2 from 'http2';
import type { Browser } from '@playwright/test';
import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-6: Basket.API must refuse UpdateBasket for an Identity.API token that lacks the basket scope.
// Scenario `bug-6` (.factory/stack/scenarios/bug-6): the demo users alice and bob (Pass123$) with empty baskets.
test.describe.configure({ mode: 'serial' });

// gRPC status codes (https://grpc.github.io/grpc/core/md_doc_statuscodes.html).
const OK = 0;
const UNKNOWN = 2;
const PERMISSION_DENIED = 7;
const HTTP_TO_GRPC: Record<number, number> = { 400: 13, 401: 16, 403: PERMISSION_DENIED, 404: 12, 429: 14, 502: 14, 503: 14, 504: 14 };

const PRODUCT_ID = 99;
const QUANTITY = 2;

type BasketItem = { product_id: number; quantity: number };
type GrpcResult = { status: number; message: string; items: BasketItem[] | null };

// ---- protobuf (basket.proto): BasketItem { int32 product_id = 2; int32 quantity = 6; } ----

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

function readVarint(buffer: Buffer, offset: number): [number, number] {
  let result = 0;
  let shift = 0;
  let pos = offset;
  for (;;) {
    const byte = buffer[pos++];
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return [result >>> 0, pos];
    shift += 7;
  }
}

/** UpdateBasketRequest { repeated BasketItem items = 2; } */
function encodeUpdateBasketRequest(items: BasketItem[]): Buffer {
  const out: number[] = [];
  for (const item of items) {
    const body = [0x10, ...varint(item.product_id), 0x30, ...varint(item.quantity)];
    out.push(0x12, ...varint(body.length), ...body);
  }
  return Buffer.from(out);
}

/** CustomerBasketResponse { repeated BasketItem items = 1; } */
function decodeCustomerBasketResponse(buffer: Buffer): BasketItem[] {
  const items: BasketItem[] = [];
  let pos = 0;
  while (pos < buffer.length) {
    const [tag, afterTag] = readVarint(buffer, pos);
    const [length, start] = readVarint(buffer, afterTag);
    pos = start + length;
    if (tag !== 0x0a) continue;
    const item: BasketItem = { product_id: 0, quantity: 0 };
    let p = start;
    while (p < start + length) {
      const [itemTag, afterItemTag] = readVarint(buffer, p);
      const [value, next] = readVarint(buffer, afterItemTag);
      if (itemTag === 0x10) item.product_id = value;
      if (itemTag === 0x30) item.quantity = value;
      p = next;
    }
    items.push(item);
  }
  return items;
}

/** One unary call to BasketApi.Basket/<method> over h2c on the stack's Basket.API, with a bearer token. */
function basketCall(method: 'GetBasket' | 'UpdateBasket' | 'DeleteBasket', token: string, message: Buffer = Buffer.alloc(0)): Promise<GrpcResult> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(url('basket'));
    client.on('error', reject);
    const request = client.request({
      ':method': 'POST',
      ':path': `/BasketApi.Basket/${method}`,
      'content-type': 'application/grpc',
      te: 'trailers',
      authorization: `Bearer ${token}`,
    });
    const chunks: Buffer[] = [];
    let headers: http2.IncomingHttpHeaders = {};
    let trailers: http2.IncomingHttpHeaders = {};
    request.on('response', (h) => (headers = h));
    request.on('trailers', (t) => (trailers = t));
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('error', reject);
    request.on('end', () => {
      client.close();
      const grpcStatus = trailers['grpc-status'] ?? headers['grpc-status'];
      // Rejected by ASP.NET Core's authorization middleware before the gRPC handler, the call ends with a plain
      // HTTP status; gRPC clients map it to a status code as the spec says (doc/http-grpc-status-mapping.md).
      const status = grpcStatus !== undefined ? Number(grpcStatus) : HTTP_TO_GRPC[Number(headers[':status'])] ?? UNKNOWN;
      const message = decodeURIComponent(String(trailers['grpc-message'] ?? headers['grpc-message'] ?? ''));
      const body = Buffer.concat(chunks);
      // gRPC framing: 1 byte compressed flag, 4 bytes big-endian length, then the message.
      const items = body.length >= 5 ? decodeCustomerBasketResponse(body.subarray(5, 5 + body.readUInt32BE(1))) : null;
      resolve({ status, message, items });
    });
    const frame = Buffer.alloc(5 + message.length);
    frame.writeUInt32BE(message.length, 1);
    message.copy(frame, 5);
    request.end(frame);
  });
}

// Identity.API's swagger UI clients use the implicit flow: signing in as alice returns an access token in the
// fragment of the 302 from /connect/authorize/callback. Their redirect URIs (BasketApiClient, OrderingApiClient)
// are container names on the stack, so the token is read from that response instead of following it.
async function aliceToken(browser: Browser, clientId: string, scope: string, redirectUri: string): Promise<string> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({ client_id: clientId, response_type: 'token', scope, redirect_uri: redirectUri, state: 'bug6' }).toString();
  await page.goto(authorize.toString());
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
  await page.getByRole('button', { name: 'Login' }).click();
  const location = (await callback).headers()['location'] ?? '';
  await context.close();
  const fragment = new URLSearchParams(location.split('#')[1] ?? '');
  const token = fragment.get('access_token') ?? '';
  expect(token).not.toBe('');
  return token;
}

/** The `scope` claim of a JWT, as a list (Identity.API writes a JSON array; a single value is also allowed). */
function scopesOf(token: string): string[] {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  return Array.isArray(payload.scope) ? payload.scope : String(payload.scope ?? '').split(' ').filter(Boolean);
}

let ordersToken = ''; // token A: orderingswaggerui, scope orders only
let basketToken = ''; // token B: basketswaggerui, scope basket

test.beforeAll(() => {
  loadScenario('bug-6');
});

test.beforeAll(async ({ browser }) => {
  ordersToken = await aliceToken(browser, 'orderingswaggerui', 'orders', 'http://ordering-api:8080/swagger/oauth2-redirect.html');
  basketToken = await aliceToken(browser, 'basketswaggerui', 'basket', 'http://basket-api:8080/swagger/oauth2-redirect.html');
  expect(scopesOf(ordersToken)).toEqual(['orders']);
  expect(scopesOf(basketToken)).toEqual(['basket']);
});

test('TC-BUG-6-01 a real Identity token with only the orders scope cannot update alice\'s basket', async () => {
  await test.step('UpdateBasket with token A (scope orders) and item 99 x2 is denied', async () => {
    const result = await basketCall('UpdateBasket', ordersToken, encodeUpdateBasketRequest([{ product_id: PRODUCT_ID, quantity: QUANTITY }]));
    expect(result.status).toBe(PERMISSION_DENIED);
    expect(result.items).toBeNull();
  });
  await test.step('GetBasket with token B (scope basket) shows alice\'s basket is still empty', async () => {
    const result = await basketCall('GetBasket', basketToken);
    expect(result.status).toBe(OK);
    expect(result.items).toEqual([]);
  });
});

test('TC-BUG-6-02 a real Identity token with the basket scope updates alice\'s basket', async () => {
  try {
    await test.step('UpdateBasket with token B and item 99 x2 returns the item', async () => {
      const result = await basketCall('UpdateBasket', basketToken, encodeUpdateBasketRequest([{ product_id: PRODUCT_ID, quantity: QUANTITY }]));
      expect(result.status).toBe(OK);
      expect(result.items).toEqual([{ product_id: PRODUCT_ID, quantity: QUANTITY }]);
    });
    await test.step('GetBasket with token B returns item 99 x2', async () => {
      const result = await basketCall('GetBasket', basketToken);
      expect(result.status).toBe(OK);
      expect(result.items).toEqual([{ product_id: PRODUCT_ID, quantity: QUANTITY }]);
    });
  } finally {
    await test.step('cleanup: DeleteBasket with token B', async () => {
      const result = await basketCall('DeleteBasket', basketToken);
      expect(result.status).toBe(OK);
    });
  }
});
