import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-43: the catalog name search matches item names from their start regardless of letter case.
// Scenario `bug-43` (.factory/stack/scenarios/bug-43): the default demo catalog, in which exactly four names start with "Explorer".
// TC-BUG-43-05 to -08 run in-process in tests/Catalog.FunctionalTests/Bug43Tests.cs.
test.describe.configure({ mode: 'serial' });

const EXPLORER_ITEMS = ['Explorer 45L Backpack', 'Explorer Biking Computer', 'Explorer Camping Tent', 'Explorer Frost Boots'];

type Item = { id: number; name: string };
type Page = { pageIndex: number; pageSize: number; count: number; data: Item[] };

let reference: Item[] = [];

test.beforeAll(() => {
  loadScenario('bug-43');
});

async function getPage(request: import('@playwright/test').APIRequestContext, path: string): Promise<Page> {
  const response = await request.get(`${url('catalog')}${path}`);
  expect(response.status()).toBe(200);
  return (await response.json()) as Page;
}

const idsAndNames = (items: Item[]) => items.map(({ id, name }) => ({ id, name }));

async function ensureReference(request: import('@playwright/test').APIRequestContext) {
  if (reference.length === 0) {
    reference = idsAndNames((await getPage(request, '/api/catalog/items?api-version=2.0&name=Explorer')).data);
  }
  return reference;
}

test('TC-BUG-43-01 v2 search with name=Explorer (matching case) returns the four Explorer items', async ({ request }) => {
  await test.step('GET /api/catalog/items?api-version=2.0&name=Explorer', async () => {
    const page = await getPage(request, '/api/catalog/items?api-version=2.0&name=Explorer');
    expect(page.count).toBe(4);
    expect(page.pageIndex).toBe(0);
    expect(page.pageSize).toBe(10);
    expect(page.data.map((i) => i.name)).toEqual(EXPLORER_ITEMS);
    reference = idsAndNames(page.data);
  });
});

test('TC-BUG-43-02 v2 search with name=explorer (all lower case) returns the same four Explorer items', async ({ request }) => {
  const expected = await ensureReference(request);
  await test.step('GET /api/catalog/items?api-version=2.0&name=explorer', async () => {
    const page = await getPage(request, '/api/catalog/items?api-version=2.0&name=explorer');
    expect(page.count).toBe(4);
    expect(page.data.map((i) => i.name)).toEqual(EXPLORER_ITEMS);
    expect(idsAndNames(page.data)).toEqual(expected);
  });
});

test('TC-BUG-43-03 v2 search with name=EXPLORER (all upper case) returns the same four Explorer items', async ({ request }) => {
  const expected = await ensureReference(request);
  await test.step('GET /api/catalog/items?api-version=2.0&name=EXPLORER', async () => {
    const page = await getPage(request, '/api/catalog/items?api-version=2.0&name=EXPLORER');
    expect(page.count).toBe(4);
    expect(page.data.map((i) => i.name)).toEqual(EXPLORER_ITEMS);
    expect(idsAndNames(page.data)).toEqual(expected);
  });
});

test('TC-BUG-43-04 v1 GET /items/by/explorer returns the same four Explorer items', async ({ request }) => {
  const expected = await ensureReference(request);
  await test.step('GET /api/catalog/items/by/explorer?api-version=1.0', async () => {
    const page = await getPage(request, '/api/catalog/items/by/explorer?api-version=1.0');
    expect(page.count).toBe(4);
    expect(page.data.map((i) => i.name)).toEqual(EXPLORER_ITEMS);
    expect(idsAndNames(page.data)).toEqual(expected);
  });
});
