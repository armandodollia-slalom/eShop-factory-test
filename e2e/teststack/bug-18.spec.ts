import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-18: POST /api/catalog/items with an id that already exists must answer 409 (not 500).
// Scenario `bug-18` extends `default`: 101 demo items, item 1 exists. Main path of the story on the stack's catalog service.
// (The case-id tagged tests live in tests/Catalog.FunctionalTests/Bug18Tests.cs.)
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('bug-18');
});

const CATALOG = () => url('catalog');
const items = (query: string) => `${CATALOG()}/api/catalog/items?${query}`;
const item = (id: number) => `${CATALOG()}/api/catalog/items/${id}?api-version=2.0`;
const body = (id: number, name: string, price = 10) => ({ id, name, catalogBrandId: 1, catalogTypeId: 1, price, availableStock: 1 });

type Request = import('@playwright/test').APIRequestContext;

async function totalCount(request: Request): Promise<number> {
  const response = await request.get(items('pageIndex=0&pageSize=1&api-version=2.0'));
  expect(response.status()).toBe(200);
  return (await response.json()).count;
}

for (const version of ['2.0', '1.0']) {
  test(`stack: POST with an existing id answers 409 and changes nothing (v${version})`, async ({ request }) => {
    const before = await (await request.get(item(1))).json();
    const count = await totalCount(request);

    const response = await test.step(`POST id 1 (api-version ${version})`, () =>
      request.post(items(`api-version=${version}`), { data: body(1, 'Overwrite attempt', 999) }));
    await test.step('409 ProblemDetails', async () => {
      expect(response.status()).toBe(409);
      expect((await response.json()).status).toBe(409);
    });
    await test.step('item 1 and the count are unchanged', async () => {
      const after = await (await request.get(item(1))).json();
      expect(after.name).toBe(before.name);
      expect(after.price).toBe(before.price);
      expect(await totalCount(request)).toBe(count);
    });
  });
}

test('stack: an unused explicit id is created, a repeat is 409', async ({ request }) => {
  const first = await request.post(items('api-version=2.0'), { data: body(5001, 'First') });
  expect(first.status()).toBe(201);
  expect(first.headers()['location']).toMatch(/\/api\/catalog\/items\/5001$/);
  const second = await request.post(items('api-version=2.0'), { data: body(5001, 'Second') });
  expect(second.status()).toBe(409);
  expect((await (await request.get(item(5001))).json()).name).toBe('First');
});

async function expectGeneratedId(request: Request, data: Record<string, unknown>, name: string) {
  const response = await test.step('POST without a usable id', () => request.post(items('api-version=2.0'), { data }));
  expect(response.status()).toBe(201);
  const location = response.headers()['location'];
  expect(location).toMatch(/\/api\/catalog\/items\/\d+$/);
  const id = Number(location.split('/').pop());
  expect(id).toBeGreaterThan(0);
  await test.step('GET the created item', async () => {
    const got = await request.get(`${CATALOG()}${location}?api-version=2.0`);
    expect(got.status()).toBe(200);
    const json = await got.json();
    expect(json.name).toBe(name);
    expect(json.id).toBe(id);
  });
  return id;
}

test('TC-BUG-18-04 stack: POST with id 0 creates the item with a generated id', async ({ request }) => {
  const id = await expectGeneratedId(request, body(0, 'Generated Id Item'), 'Generated Id Item');
  expect(id).not.toBe(1);
});

test('TC-BUG-18-05 stack: POST with the id omitted creates the item with a generated id', async ({ request }) => {
  const noId: Record<string, unknown> = body(0, 'No Id Item');
  delete noId.id;
  await expectGeneratedId(request, noId, 'No Id Item');
});
