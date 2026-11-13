import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-17: POST /api/catalog/items without a usable name must answer 400 ProblemDetails, not 500.
// Scenario `bug-17` extends `default` (101 items; item 1, brand 1 and type 1 exist).
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('bug-17');
});

const CATALOG = () => url('catalog');
const ITEMS = (version = '2.0') => `${CATALOG()}/api/catalog/items?api-version=${version}`;
const base = { description: 'Test item', price: 10.5, catalogBrandId: 1, catalogTypeId: 1 };

async function count(request: import('@playwright/test').APIRequestContext): Promise<number> {
  const response = await request.get(`${CATALOG()}/api/catalog/items?pageIndex=0&pageSize=1&api-version=2.0`);
  expect(response.status()).toBe(200);
  return (await response.json()).count;
}

async function expectRejected(response: import('@playwright/test').APIResponse) {
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(typeof body.detail).toBe('string');
  expect(body.detail.length).toBeGreaterThan(0);
  expect(response.headers()['location']).toBeUndefined();
}

async function createRejected(request: import('@playwright/test').APIRequestContext, data: Record<string, unknown>) {
  const response = await test.step('POST /api/catalog/items', () => request.post(ITEMS(), { data }));
  await test.step('400 with ProblemDetails detail and no Location header', () => expectRejected(response));
}

test('TC-BUG-17-01 create item with no name property returns 400, not 500', async ({ request }) => {
  await createRejected(request, { ...base });
});

test('TC-BUG-17-02 create item with name null returns 400', async ({ request }) => {
  await createRejected(request, { ...base, name: null });
});

test('TC-BUG-17-03 create item with empty name returns 400', async ({ request }) => {
  await createRejected(request, { ...base, name: '' });
});

test('TC-BUG-17-04 create item with whitespace-only name returns 400', async ({ request }) => {
  await createRejected(request, { ...base, name: '   ' });
});

test('TC-BUG-17-05 rejected create does not add a catalog row', async ({ request }) => {
  const before = await test.step('record the item count', () => count(request));
  await createRejected(request, { ...base });
  const after = await test.step('count again', () => count(request));
  expect(after).toBe(before);
});

test('TC-BUG-17-06 create item with a valid name still returns 201', async ({ request }) => {
  const response = await test.step('POST with a valid name', () => request.post(ITEMS(), { data: { ...base, name: 'BUG-17 Valid Item' } }));
  expect(response.status()).toBe(201);
  const location = response.headers()['location'];
  expect(location).toMatch(/\/api\/catalog\/items\/\d+$/);
  const fetched = await test.step('GET the Location URL', () => request.get(`${CATALOG()}${location}?api-version=2.0`));
  expect(fetched.status()).toBe(200);
  expect((await fetched.json()).name).toBe('BUG-17 Valid Item');
});

test('TC-BUG-17-07 PUT v2 update with blank name returns 400 and leaves the item unchanged', async ({ request }) => {
  const get = () => request.get(`${CATALOG()}/api/catalog/items/1?api-version=2.0`);
  const original = await test.step('GET item 1', async () => {
    const r = await get();
    expect(r.status()).toBe(200);
    return r.json();
  });
  const response = await test.step('PUT with name ""', () =>
    request.put(`${CATALOG()}/api/catalog/items/1?api-version=2.0`, { data: { ...original, name: '' } }));
  await expectRejected(response);
  const after = await test.step('GET item 1 again', get);
  expect(after.status()).toBe(200);
  expect((await after.json()).name).toBe(original.name);
});

test('TC-BUG-17-08 PUT v1 update with no name returns 400 and leaves the item unchanged', async ({ request }) => {
  const get = () => request.get(`${CATALOG()}/api/catalog/items/1?api-version=1.0`);
  const original = await test.step('GET item 1', async () => {
    const r = await get();
    expect(r.status()).toBe(200);
    return r.json();
  });
  const { name, ...withoutName } = original;
  const response = await test.step('PUT without name', () =>
    request.put(`${CATALOG()}/api/catalog/items?api-version=1.0`, { data: withoutName }));
  await expectRejected(response);
  const after = await test.step('GET item 1 again', get);
  expect(after.status()).toBe(200);
  expect((await after.json()).name).toBe(name);
});
