import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-18: POST /api/catalog/items with an id that already exists must answer 409 ProblemDetails, not 500.
// Scenario `bug-18` extends `default` (101 items; item 1, brands 1-2 and types 1-2 exist; 5000/5001 unused).
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('bug-18');
});

type Req = import('@playwright/test').APIRequestContext;
const CATALOG = () => url('catalog');
const ITEMS = (version = '2.0') => `${CATALOG()}/api/catalog/items?api-version=${version}`;
const item = (extra: Record<string, unknown>) => ({ price: 10.5, catalogBrandId: 1, catalogTypeId: 1, ...extra });

async function expectConflict(response: import('@playwright/test').APIResponse) {
  expect(response.status()).toBe(409);
  const body = await response.json();
  expect(typeof body.detail).toBe('string');
  expect(body.detail.length).toBeGreaterThan(0);
  expect(response.headers()['location']).toBeUndefined();
}

async function count(request: Req): Promise<number> {
  const response = await request.get(`${CATALOG()}/api/catalog/items?pageIndex=0&pageSize=1&api-version=2.0`);
  expect(response.status()).toBe(200);
  return (await response.json()).count;
}

test('TC-BUG-18-01 create item with an existing id returns 409, not 500', async ({ request }) => {
  const response = await test.step('POST with id 1', () => request.post(ITEMS(), { data: item({ id: 1, name: 'Duplicate item' }) }));
  await test.step('409 with ProblemDetails detail and no Location', () => expectConflict(response));
});

test('TC-BUG-18-02 rejected duplicate-id create does not modify the existing item or add rows', async ({ request }) => {
  const get = () => request.get(`${CATALOG()}/api/catalog/items/1?api-version=2.0`);
  const original = await test.step('record item 1 and the count', async () => {
    const r = await get();
    expect(r.status()).toBe(200);
    return r.json();
  });
  const before = await count(request);
  expect(before).toBe(101);
  const response = await test.step('POST id 1 with different data', () =>
    request.post(ITEMS(), { data: item({ id: 1, name: 'Duplicate item', price: 999, catalogBrandId: 2, catalogTypeId: 2 }) }));
  expect(response.status()).toBe(409);
  await test.step('item 1 unchanged', async () => {
    const r = await get();
    expect(r.status()).toBe(200);
    const after = await r.json();
    expect(after.name).toBe(original.name);
    expect(after.price).toBe(original.price);
    expect(after.catalogBrandId).toBe(original.catalogBrandId);
    expect(after.name).not.toBe('Duplicate item');
    expect(after.price).not.toBe(999);
  });
  expect(await test.step('count unchanged', () => count(request))).toBe(101);
});

test('TC-BUG-18-03 create with an existing id returns 409 under api-version 1.0 too', async ({ request }) => {
  const response = await test.step('POST v1.0 with id 1', () => request.post(ITEMS('1.0'), { data: item({ id: 1, name: 'Duplicate item' }) }));
  await test.step('409 with ProblemDetails detail', () => expectConflict(response));
});

test('TC-BUG-18-04 create with an unused explicit id returns 201 and keeps that id', async ({ request }) => {
  const response = await test.step('POST id 5000', () => request.post(ITEMS(), { data: item({ id: 5000, name: 'Explicit id item' }) }));
  expect(response.status()).toBe(201);
  expect(response.headers()['location']).toMatch(/\/api\/catalog\/items\/5000$/);
  const fetched = await test.step('GET item 5000', () => request.get(`${CATALOG()}/api/catalog/items/5000?api-version=2.0`));
  expect(fetched.status()).toBe(200);
  expect((await fetched.json()).name).toBe('Explicit id item');
});

test('TC-BUG-18-05 create with no id returns 201 with a generated id', async ({ request }) => {
  const response = await test.step('POST without id', () => request.post(ITEMS(), { data: item({ name: 'Generated id item' }) }));
  expect(response.status()).toBe(201);
  const location = response.headers()['location'];
  expect(location).toMatch(/\/api\/catalog\/items\/\d+$/);
  expect(Number(location.split('/').pop())).toBeGreaterThan(101);
  const fetched = await test.step('GET the Location URL', () => request.get(`${CATALOG()}${location}?api-version=2.0`));
  expect(fetched.status()).toBe(200);
  expect((await fetched.json()).name).toBe('Generated id item');
});

test('TC-BUG-18-06 creating the same new explicit id twice returns 201 then 409', async ({ request }) => {
  const first = await test.step('POST id 5001 "First"', () => request.post(ITEMS(), { data: item({ id: 5001, name: 'First' }) }));
  expect(first.status()).toBe(201);
  const second = await test.step('POST id 5001 "Second"', () => request.post(ITEMS(), { data: item({ id: 5001, name: 'Second' }) }));
  await expectConflict(second);
  const fetched = await test.step('GET item 5001', () => request.get(`${CATALOG()}/api/catalog/items/5001?api-version=2.0`));
  expect(fetched.status()).toBe(200);
  expect((await fetched.json()).name).toBe('First');
});
