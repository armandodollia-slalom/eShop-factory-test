import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-17 main path on the running stack; the per-case tests live in tests/Catalog.FunctionalTests.
test.beforeAll(() => {
  loadScenario('bug-17');
});

const items = () => `${url('catalog')}/api/catalog/items?api-version=2.0`;
const rest = { catalogBrandId: 1, catalogTypeId: 1, price: 10.5, availableStock: 5, restockThreshold: 1, maxStockThreshold: 10 };

test('TC-BUG-17-01 stack: creating an item without a name is rejected with 400 ProblemDetails', async ({ request }) => {
  const response = await test.step('POST /api/catalog/items without a name', () =>
    request.post(items(), { data: { ...rest, description: 'No name' } }));
  await test.step('400 with a ProblemDetails body', async () => {
    expect(response.status()).toBe(400);
    expect(typeof (await response.json()).detail).toBe('string');
    expect(response.headers()['location']).toBeUndefined();
  });
});
