import { connect } from 'node:http2';
import { test, expect } from '../demo';
import { port, url } from './ports';
import { loadScenario } from './scenario';

// BUG-8: BasketApi.UpdateBasket must reject lines with quantity below 1 with INVALID_ARGUMENT and leave Redis unchanged.
// Scenario `bug-8` (.factory/stack/scenarios/bug-8): the demo users alice and bob (Pass123$), no baskets.
// The Basket API speaks gRPC over cleartext HTTP/2 on the stack's `basket` port; the wire format is hand-rolled below.
test.describe.configure({ mode: 'serial' });

// The only redirect URI identity registers for the basketswaggerui client on the stack.
const REDIRECT = 'http://basket-api:8080/swagger/oauth2-redirect.html';
const GRPC_UNAUTHENTICATED = 16;

let token = '';

test.beforeAll(() => {
  loadScenario('bug-8');
});

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({
    client_id: 'basketswaggerui',
    response_type: 'token',
    scope: 'basket',
    redirect_uri: REDIRECT,
    state: 'bug8',
  }).toString();
  await page.goto(authorize.toString());
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  // The redirect target is unreachable from the host, so read the token from the 302 Location fragment.
  const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
  await page.getByRole('button', { name: 'Login' }).click();
  const location = (await callback).headers()['location'] ?? '';
  token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
  await context.close();
  expect(token).not.toBe('');
});

type Item = { productId: number; quantity: number };
type GrpcResult = { status: number; message: string; items: Item[] };

function varint(value: number): number[] {
  // int32 negatives are sign-extended to 64 bits (10 bytes).
  let v = BigInt.asUintN(64, BigInt(value));
  const out: number[] = [];
  do {
    let byte = Number(v & 0x7fn);
    v >>= 7n;
    if (v > 0n) byte |= 0x80;
    out.push(byte);
  } while (v > 0n);
  return out;
}

function encodeUpdate(items: Item[]): Buffer {
  const bytes: number[] = [];
  for (const item of items) {
    const inner = [0x10, ...varint(item.productId), 0x30, ...varint(item.quantity)]; // product_id = 2, quantity = 6
    bytes.push(0x12, ...varint(inner.length), ...inner); // items = 2
  }
  return Buffer.from(bytes);
}

function readVarint(buf: Buffer, pos: number): [number, number] {
  let result = 0n;
  let shift = 0n;
  for (;;) {
    const byte = buf[pos++];
    result |= BigInt(byte & 0x7f) << shift;
    if (!(byte & 0x80)) break;
    shift += 7n;
  }
  return [Number(BigInt.asIntN(64, result)), pos];
}

function decodeBasket(buf: Buffer): Item[] {
  const items: Item[] = [];
  let pos = 0;
  while (pos < buf.length) {
    let tag: number;
    [tag, pos] = readVarint(buf, pos);
    let len: number;
    [len, pos] = readVarint(buf, pos);
    expect(tag).toBe(0x0a); // items = 1
    const end = pos + len;
    const item: Item = { productId: 0, quantity: 0 };
    while (pos < end) {
      let fieldTag: number;
      let value: number;
      [fieldTag, pos] = readVarint(buf, pos);
      [value, pos] = readVarint(buf, pos);
      if (fieldTag === 0x10) item.productId = value;
      if (fieldTag === 0x30) item.quantity = value;
    }
    items.push(item);
  }
  return items;
}

function call(method: string, message: Buffer, bearer: string | null): Promise<GrpcResult> {
  return new Promise((resolve, reject) => {
    const client = connect(`http://localhost:${port('basket')}`);
    client.on('error', reject);
    const headers: Record<string, string> = { ':method': 'POST', ':path': `/BasketApi.Basket/${method}`, 'content-type': 'application/grpc', te: 'trailers' };
    if (bearer) headers.authorization = `Bearer ${bearer}`;
    const stream = client.request(headers);
    const chunks: Buffer[] = [];
    let status = -1;
    let statusMessage = '';
    const readStatus = (h: Record<string, unknown>) => {
      if (h['grpc-status'] !== undefined) status = Number(h['grpc-status']);
      if (h['grpc-message'] !== undefined) statusMessage = decodeURIComponent(String(h['grpc-message']));
    };
    stream.on('response', readStatus);
    stream.on('trailers', readStatus);
    stream.on('data', (c: Buffer) => chunks.push(c));
    stream.on('error', reject);
    stream.on('end', () => {
      client.close();
      const body = Buffer.concat(chunks);
      const items = body.length >= 5 ? decodeBasket(body.subarray(5, 5 + body.readUInt32BE(1))) : [];
      resolve({ status, message: statusMessage, items });
    });
    const frame = Buffer.alloc(5 + message.length);
    frame.writeUInt32BE(message.length, 1);
    message.copy(frame, 5);
    stream.end(frame);
  });
}

const update = (items: Item[], bearer: string | null = token) => call('UpdateBasket', encodeUpdate(items), bearer);

test('TC-BUG-8-07 anonymous caller with an invalid quantity gets UNAUTHENTICATED', async () => {
  await test.step('UpdateBasket without a token with {7, -3}', async () => {
    const result = await update([{ productId: 7, quantity: -3 }], null);
    expect(result.status).toBe(GRPC_UNAUTHENTICATED);
  });
});

