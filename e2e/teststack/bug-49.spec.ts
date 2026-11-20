import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-49: GET /api/catalog/items?name=... matches the search text anywhere in a product's name, still finds
// name prefixes, and stays case-sensitive. The cases run against the Catalog API on the test stack (real Postgres).
// Scenario `bug-49` (.factory/stack/scenarios/bug-49): the demo catalog of `default`, read anonymously.
test.describe.configure({ mode: 'serial' });

const EXPLORER = 'Explorer Frost Boots';
const SUMMITRIDER = 'SummitRider Snowboard Boots';
const WANDERER = 'Wanderer Black Hiking Boots';
const CRAMPONS = 'Alpine Tech Crampons';

type Item = { id: number; name: string };
type Page = { pageIndex: number; pageSize: number; count: number; data: Item[] };
type Request = Parameters<Parameters<typeof test>[2]>[0]['request'];

test.beforeAll(() => {
  loadScenario('bug-49');
});

/** Anonymous GET /api/catalog/items with the case's query string, written exactly as the case gives it. */
async function search(request: Request, query: string): Promise<Page> {
  return test.step(`anonymous GET /api/catalog/items?${query}`, async () => {
    const response = await request.get(`${url('catalog')}/api/catalog/items?${query}`);
    expect(response.status()).toBe(200);
    return (await response.json()) as Page;
  });
}

const names = (page: Page) => page.data.map((item) => item.name).sort();

test('TC-BUG-49-01 searching "Boots" lists all three boots with count 3', async ({ request }) => {
  const page = await search(request, 'name=Boots&api-version=2.0');
  await test.step('count is 3 and data holds exactly the three boots, each once', async () => {
    expect(page.count).toBe(3);
    expect(page.data).toHaveLength(3);
    expect(names(page)).toEqual([EXPLORER, SUMMITRIDER, WANDERER]);
  });
  await test.step('no item without "Boots" in its name is returned (not the Alpine Tech Crampons)', async () => {
    for (const name of names(page)) expect(name).toContain('Boots');
    expect(names(page)).not.toContain(CRAMPONS);
  });
});

test('TC-BUG-49-02 searching "Hiking Boots" lists Wanderer Black Hiking Boots', async ({ request }) => {
  const page = await search(request, 'name=Hiking%20Boots&api-version=2.0');
  await test.step(`count is 1 and data is exactly "${WANDERER}"`, async () => {
    expect(page.count).toBe(1);
    expect(names(page)).toEqual([WANDERER]);
  });
});

test('TC-BUG-49-03 searching the name prefix "Wanderer" still lists Wanderer Black Hiking Boots', async ({ request }) => {
  const page = await search(request, 'name=Wanderer&api-version=2.0');
  await test.step(`count is 1 and data is exactly "${WANDERER}"`, async () => {
    expect(page.count).toBe(1);
    expect(names(page)).toEqual([WANDERER]);
  });
});

test('TC-BUG-49-04 searching lowercase "boots" stays case-sensitive and finds nothing', async ({ request }) => {
  const page = await search(request, 'name=boots&api-version=2.0');
  await test.step('count is 0 and data is an empty array (none of the three boots)', async () => {
    expect(page.count).toBe(0);
    expect(page.data).toEqual([]);
    for (const name of [EXPLORER, SUMMITRIDER, WANDERER]) expect(names(page)).not.toContain(name);
  });
});
