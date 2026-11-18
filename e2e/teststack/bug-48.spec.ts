import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-48: GET /api/catalog/items/by answers every requested item with its catalogBrand, like
// GET /api/catalog/items/{id} and GET /api/catalog/items do. Anonymous HTTP reads against the Catalog API on the stack.
// Scenario `bug-48` (.factory/stack/scenarios/bug-48): the demo catalog of the default scenario, nothing written.
test.describe.configure({ mode: 'serial' });

type Brand = { id: number; brand: string };
type Item = { id: number; name: string; catalogBrandId: number; catalogBrand: Brand | null } & Record<string, unknown>;

const API_VERSION = 'api-version=1.0';
const ITEMS_BY_IDS_1_2 = () => `${url('catalog')}/api/catalog/items/by?ids=1&ids=2&${API_VERSION}`;
const ITEMS_BY_ID = (id: number) => `${url('catalog')}/api/catalog/items/by?ids=${id}&${API_VERSION}`;
const ITEM = (id: number) => `${url('catalog')}/api/catalog/items/${id}?${API_VERSION}`;
const FIRST_PAGE_OF_ONE = () => `${url('catalog')}/api/catalog/items?pageSize=1&pageIndex=0&${API_VERSION}`;

const ITEM_1 = { id: 1, name: 'Wanderer Black Hiking Boots', catalogBrandId: 1, catalogBrand: { id: 1, brand: 'Daybird' } };
const ITEM_2 = { id: 2, name: 'Summit Pro Harness', catalogBrandId: 2, catalogBrand: { id: 2, brand: 'Gravitator' } };

test.beforeAll(() => {
  loadScenario('bug-48');
});

test('TC-BUG-48-01 items 1 and 2 fetched by ids each carry their own brand', async ({ request }) => {
  let items: Item[] = [];
  await test.step('GET /api/catalog/items/by?ids=1&ids=2&api-version=1.0 anonymously', async () => {
    const response = await request.get(ITEMS_BY_IDS_1_2());
    expect(response.status()).toBe(200);
    items = await response.json();
  });
  await test.step('the answer holds exactly items 1 and 2, each with its own brand', async () => {
    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.id).sort((a, b) => a - b)).toEqual([1, 2]);

    for (const expected of [ITEM_1, ITEM_2]) {
      const item = items.find((i) => i.id === expected.id)!;
      expect(item.name).toBe(expected.name);
      expect(item.catalogBrandId).toBe(expected.catalogBrandId);
      expect(item.catalogBrand).toEqual(expected.catalogBrand);
    }
    for (const item of items) {
      expect(item).toHaveProperty('catalogBrand');
      expect(item.catalogBrand).not.toBeNull();
    }
  });
});

test('TC-BUG-48-02 each item fetched by ids is identical to the same item fetched on its own', async ({ request }) => {
  let batch: Item[] = [];
  const single: Record<number, Item> = {};
  await test.step('GET /api/catalog/items/by?ids=1&ids=2&api-version=1.0; keep items 1 and 2', async () => {
    const response = await request.get(ITEMS_BY_IDS_1_2());
    expect(response.status()).toBe(200);
    batch = await response.json();
  });
  for (const id of [1, 2]) {
    await test.step(`GET /api/catalog/items/${id}?api-version=1.0`, async () => {
      const response = await request.get(ITEM(id));
      expect(response.status()).toBe(200);
      single[id] = await response.json();
    });
  }
  for (const expected of [ITEM_1, ITEM_2]) {
    await test.step(`batch item ${expected.id} has the same properties and values as the single fetch`, async () => {
      const fromBatch = batch.find((i) => i.id === expected.id);
      expect(fromBatch).toBeDefined();
      expect(Object.keys(fromBatch!).sort()).toEqual(Object.keys(single[expected.id]).sort());
      expect(fromBatch).toEqual(single[expected.id]);
      expect(fromBatch!.catalogBrand).toEqual(expected.catalogBrand);
    });
  }
});

test('TC-BUG-48-03 an item fetched by ids carries the same brand as in the catalog list', async ({ request }) => {
  let listed: Item | undefined;
  let byIds: Item[] = [];
  await test.step('GET /api/catalog/items?pageSize=1&pageIndex=0&api-version=1.0; take its single item N', async () => {
    const response = await request.get(FIRST_PAGE_OF_ONE());
    expect(response.status()).toBe(200);
    const page: { data: Item[] } = await response.json();
    expect(page.data).toHaveLength(1);
    listed = page.data[0];
    expect(listed.catalogBrand).not.toBeNull();
  });
  await test.step('GET /api/catalog/items/by?ids=N&api-version=1.0', async () => {
    const response = await request.get(ITEMS_BY_ID(listed!.id));
    expect(response.status()).toBe(200);
    byIds = await response.json();
  });
  await test.step('the item by ids carries the brand of the listed item', async () => {
    expect(byIds).toHaveLength(1);
    const item = byIds[0];
    expect(item.id).toBe(listed!.id);
    expect(item.catalogBrand).not.toBeNull();
    expect(item.catalogBrand!.id).toBe(listed!.catalogBrand!.id);
    expect(item.catalogBrand!.brand).toBe(listed!.catalogBrand!.brand);
    expect(item.catalogBrandId).toBe(listed!.catalogBrandId);
  });
});
