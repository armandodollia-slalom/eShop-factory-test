import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-17: POST /api/catalog/items without a usable name must answer 400 with a validation problem, not 500.
// Scenario `bug-17` (.factory/stack/scenarios/bug-17): the default catalog (101 items, brand 1, type 1).
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('bug-17');
});

const CATALOG = () => url('catalog');
const items = (version: string, query = '') => `${CATALOG()}/api/catalog/items${query ? `?${query}&` : '?'}api-version=${version}`;

const baseBody = {
  description: 'No name',
  price: 9.99,
  catalogBrandId: 1,
  catalogTypeId: 1,
  availableStock: 5,
  restockThreshold: 1,
  maxStockThreshold: 10,
};

type Problem = { status: number; errors: Record<string, string[]> };

async function expectNameProblem(response: { status(): number; headers(): Record<string, string>; json(): Promise<unknown> }) {
  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/problem+json');
  const problem = (await response.json()) as Problem;
  expect(problem.status).toBe(400);
  const key = Object.keys(problem.errors).find((k) => k === 'Name');
  expect(key).toBe('Name');
  expect(problem.errors.Name.length).toBeGreaterThan(0);
  expect(problem.errors.Name.every((m) => m.length > 0)).toBe(true);
}

test('TC-BUG-17-01 body without a name property is rejected with 400 (api-version 2.0)', async ({ request }) => {
  const response = await test.step('POST without a name property, api-version 2.0', () =>
    request.post(items('2.0'), { data: baseBody }));
  await test.step('400 problem+json with an error for Name', () => expectNameProblem(response));
});

test('TC-BUG-17-02 body without a name is rejected with 400 under api-version 1.0', async ({ request }) => {
  const response = await test.step('POST without a name property, api-version 1.0', () =>
    request.post(items('1.0'), { data: baseBody }));
  await test.step('400 problem+json with an error for Name', () => expectNameProblem(response));
});

test('TC-BUG-17-03 explicit null name is rejected with 400', async ({ request }) => {
  const response = await test.step('POST with "name": null', () =>
    request.post(items('2.0'), { data: { ...baseBody, name: null } }));
  await test.step('400 problem+json with an error for Name', () => expectNameProblem(response));
});

test('TC-BUG-17-04 empty-string name is rejected with 400', async ({ request }) => {
  const response = await test.step('POST with "name": ""', () =>
    request.post(items('2.0'), { data: { ...baseBody, name: '' } }));
  await test.step('400 problem+json with an error for Name', () => expectNameProblem(response));
});

test('TC-BUG-17-05 whitespace-only name is rejected with 400', async ({ request }) => {
  const response = await test.step('POST with "name": "   "', () =>
    request.post(items('2.0'), { data: { ...baseBody, name: '   ' } }));
  await test.step('400 problem+json with an error for Name', () => expectNameProblem(response));
});

test('TC-BUG-17-06 a rejected nameless request leaves the catalog unchanged', async ({ request }) => {
  const marker = 'BUG17-NO-NAME-MARKER';
  const count = async () => {
    const r = await request.get(items('2.0', 'pageIndex=0&pageSize=1'));
    expect(r.status()).toBe(200);
    return (await r.json()).count as number;
  };
  let before = 0;
  await test.step('GET the item count', async () => {
    before = await count();
    expect(before).toBe(101);
  });
  await test.step('POST a nameless body with the marker description', async () => {
    const r = await request.post(items('2.0'), { data: { ...baseBody, description: marker } });
    expect(r.status()).toBe(400);
  });
  await test.step('the count is unchanged', async () => {
    expect(await count()).toBe(before);
  });
  await test.step('no item carries the marker description', async () => {
    const r = await request.get(items('2.0', 'pageIndex=0&pageSize=200'));
    expect(r.status()).toBe(200);
    const page = await r.json();
    expect(page.data.some((i: { description: string }) => i.description === marker)).toBe(false);
  });
});

test('TC-BUG-17-07 valid body still returns 201 with Location and persists the item', async ({ request }) => {
  const id = 9007;
  let location = '';
  await test.step('POST a valid body', async () => {
    const r = await request.post(items('2.0'), {
      data: { ...baseBody, id, name: 'BUG17 Valid Item', description: 'Valid', price: 12.5, availableStock: 3 },
    });
    expect(r.status()).toBe(201);
    location = r.headers()['location'];
    expect(new URL(location, CATALOG()).pathname).toBe(`/api/catalog/items/${id}`);
  });
  await test.step('GET the Location returns the item', async () => {
    const r = await request.get(`${CATALOG()}${new URL(location, CATALOG()).pathname}?api-version=2.0`);
    expect(r.status()).toBe(200);
    const item = await r.json();
    expect(item.name).toBe('BUG17 Valid Item');
    expect(item.price).toBe(12.5);
  });
});

test('TC-BUG-17-08 one-character name is accepted (just inside the boundary)', async ({ request }) => {
  const id = 9008;
  let location = '';
  await test.step('POST with "name": "A"', async () => {
    const r = await request.post(items('2.0'), {
      data: { ...baseBody, id, name: 'A', description: 'Valid', price: 12.5, availableStock: 3 },
    });
    expect(r.status()).toBe(201);
    location = r.headers()['location'];
    expect(new URL(location, CATALOG()).pathname).toBe(`/api/catalog/items/${id}`);
  });
  await test.step('GET the Location returns an item named A', async () => {
    const r = await request.get(`${CATALOG()}${new URL(location, CATALOG()).pathname}?api-version=2.0`);
    expect(r.status()).toBe(200);
    expect((await r.json()).name).toBe('A');
  });
});
