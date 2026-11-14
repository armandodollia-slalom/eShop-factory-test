import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-18 main path on the running stack; the per-case tests live in tests/Catalog.FunctionalTests.
test.beforeAll(() => {
  loadScenario('bug-18');
});

const items = () => `${url('catalog')}/api/catalog/items?api-version=2.0`;
const item = (id: number) => `${url('catalog')}/api/catalog/items/${id}?api-version=2.0`;
const body = { id: 1, name: 'Duplicate of one', catalogBrandId: 1, catalogTypeId: 1, description: 'Plan case', price: 10.5, availableStock: 5, restockThreshold: 1, maxStockThreshold: 10 };

test('TC-BUG-18-01 stack: creating an item with an existing id is rejected with 409 ProblemDetails', async ({ request }) => {
  const response = await test.step('POST /api/catalog/items with id 1', () => request.post(items(), { data: body }));
  await test.step('409 with a ProblemDetails body and no Location', async () => {
    expect(response.status()).toBe(409);
    expect(typeof (await response.json()).detail).toBe('string');
    expect(response.headers()['location']).toBeUndefined();
  });
});

test('TC-BUG-18-02 stack: a rejected duplicate leaves item 1 unchanged', async ({ request }) => {
  await test.step('POST the duplicate', async () => {
    expect((await request.post(items(), { data: body })).status()).toBe(409);
  });
  await test.step('item 1 keeps its name', async () => {
    const get = await request.get(item(1));
    expect(get.status()).toBe(200);
    expect((await get.json()).name).toBe('Wanderer Black Hiking Boots');
  });
});
