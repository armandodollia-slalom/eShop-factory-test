import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-17: POST /api/catalog/items and PUT (v1, v2) must answer 400 when the name is missing, null, empty or blank.
// Scenario `bug-17` extends `default`: 101 demo items, item 1 exists. Calls go to the catalog service on the stack.
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('bug-17');
});

const CATALOG = () => url('catalog');
const items = (query: string) => `${CATALOG()}/api/catalog/items?${query}`;
const item = (id: number, version: string) => `${CATALOG()}/api/catalog/items/${id}?api-version=${version}`;

const REQUIRED = 'The Name field is required.';
const DETAIL = 'Item name must be provided in the request body.';
const rest = { price: 10.0, catalogBrandId: 1, catalogTypeId: 1, availableStock: 5 };

type Request = import('@playwright/test').APIRequestContext;

async function totalCount(request: Request): Promise<number> {
  const response = await request.get(items('pageIndex=0&pageSize=1&api-version=2.0'));
  expect(response.status()).toBe(200);
  return (await response.json()).count;
}

async function expectNameProblem(response: import('@playwright/test').APIResponse) {
  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(Array.isArray(body.errors?.Name)).toBe(true);
  expect(body.errors.Name.length).toBeGreaterThan(0);
  expect(body.errors.Name).toContain(REQUIRED);
  expect(body.detail).toBe(DETAIL);
}

async function expectCreateRejected(request: Request, version: string, data: Record<string, unknown>) {
  const before = await test.step('count items before', () => totalCount(request));
  expect(before).toBe(101);
  const response = await test.step(`POST /api/catalog/items?api-version=${version}`, () =>
    request.post(items(`api-version=${version}`), { data }));
  await test.step('400 with errors.Name and detail', () => expectNameProblem(response));
  await test.step('no row was added', async () => {
    expect(await totalCount(request)).toBe(101);
  });
}

test('TC-BUG-17-01 stack: POST without a name field is rejected with 400 (v2)', async ({ request }) => {
  await expectCreateRejected(request, '2.0', { description: 'No name', ...rest });
});

test('stack: POST without a name field is rejected with 400 (v1)', async ({ request }) => {
  await expectCreateRejected(request, '1.0', { description: 'No name', ...rest });
});

test('stack: POST with explicit null name is rejected with 400', async ({ request }) => {
  await expectCreateRejected(request, '2.0', { name: null, ...rest });
});

test('stack: POST with empty-string name is rejected with 400', async ({ request }) => {
  await expectCreateRejected(request, '2.0', { name: '', ...rest });
});

test('stack: POST with whitespace-only name is rejected with 400', async ({ request }) => {
  await expectCreateRejected(request, '2.0', { name: '   ', ...rest });
});

test('TC-BUG-17-06 stack: POST with a valid name still creates the item', async ({ request }) => {
  const name = 'BUG-17 Test Item';
  const created = await test.step('POST a valid item', () =>
    request.post(items('api-version=2.0'), { data: { name, description: 'Valid', ...rest } }));
  expect(created.status()).toBe(201);
  const location = created.headers()['location'];
  expect(location).toMatch(/\/api\/catalog\/items\/\d+$/);
  const id = Number(location.split('/').pop());

  try {
    await test.step('GET the item by name', async () => {
      const response = await request.get(items(`name=${encodeURIComponent(name)}&pageIndex=0&pageSize=5&api-version=2.0`));
      expect(response.status()).toBe(200);
      const body = await response.json();
      const matches = body.data.filter((i: { name: string }) => i.name === name);
      expect(matches).toHaveLength(1);
    });
  } finally {
    await test.step('cleanup: DELETE the created item', async () => {
      const response = await request.delete(item(id, '2.0'));
      expect(response.status()).toBe(204);
    });
  }
});

async function expectUpdateRejected(request: Request, version: string, putUrl: string) {
  const before = await test.step('GET item 1', async () => {
    const response = await request.get(item(1, version));
    expect(response.status()).toBe(200);
    return response.json();
  });
  const response = await test.step('PUT item 1 without a name', () =>
    request.put(putUrl, { data: { id: 1, price: 99.0, catalogBrandId: 1, catalogTypeId: 1, availableStock: 5 } }));
  await test.step('400 with errors.Name and detail', () => expectNameProblem(response));
  await test.step('item 1 is unchanged', async () => {
    const after = await (await request.get(item(1, version))).json();
    expect(after.name).toBe(before.name);
    expect(after.price).toBe(before.price);
  });
}

test('stack: PUT v2 without a name is rejected with 400 and the item is unchanged', async ({ request }) => {
  await expectUpdateRejected(request, '2.0', item(1, '2.0'));
});

test('stack: PUT v1 without a name is rejected with 400 and the item is unchanged', async ({ request }) => {
  await expectUpdateRejected(request, '1.0', items('api-version=1.0'));
});
