import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-19: unknown brand or type ids on catalog item create or update answer 400 instead of 500.
// Scenario `bug-19` (.factory/stack/scenarios/bug-19): the default catalog, 101 items, brands 1-13, types 1-8.
test.describe.configure({ mode: 'serial' });

const API = (path: string, version = '2.0') => `${url('catalog')}/api/catalog/items${path}?api-version=${version}`;
const LIST = (version = '2.0') => `${url('catalog')}/api/catalog/items?api-version=${version}&pageIndex=0&pageSize=200`;
const PROBLEM_JSON = 'application/problem+json';

type CatalogItem = { name: string; price: number; catalogBrandId: number; catalogTypeId: number; [key: string]: unknown };

const newItem = (name: string, catalogTypeId: number, catalogBrandId: number) => ({
  name,
  description: 'd',
  price: 10.0,
  pictureFileName: '1.webp',
  catalogTypeId,
  catalogBrandId,
  availableStock: 5,
  restockThreshold: 1,
  maxStockThreshold: 10,
});

test.beforeAll(() => {
  loadScenario('bug-19');
});

test('TC-BUG-19-01 POST with unknown brand id 999 is rejected with 400 naming the id', async ({ request }) => {
  const name = 'Unknown Brand Item';
  await test.step('POST an item with brand id 999', async () => {
    const response = await request.post(API(''), { data: newItem(name, 1, 999) });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(PROBLEM_JSON);
    const problem = await response.json();
    expect(problem.status).toBe(400);
    expect(problem.detail).toBe('Catalog brand with id 999 does not exist.');
  });
  await test.step('the list has no such item and still 101 items', async () => {
    const list = await (await request.get(LIST())).json();
    expect(list.data.map((i: { name: string }) => i.name)).not.toContain(name);
    expect(list.count).toBe(101);
  });
});

test('TC-BUG-19-02 POST with unknown type id 999 is rejected with 400 naming the id', async ({ request }) => {
  const name = 'Unknown Type Item';
  await test.step('POST an item with type id 999', async () => {
    const response = await request.post(API(''), { data: newItem(name, 999, 1) });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(PROBLEM_JSON);
    expect((await response.json()).detail).toBe('Catalog type with id 999 does not exist.');
  });
  await test.step('the list has no such item and still 101 items', async () => {
    const list = await (await request.get(LIST())).json();
    expect(list.data.map((i: { name: string }) => i.name)).not.toContain(name);
    expect(list.count).toBe(101);
  });
});

test('TC-BUG-19-03 PUT v2 on item 1 with unknown type id 999 is rejected and changes nothing', async ({ request }) => {
  let original!: CatalogItem;
  await test.step('GET item 1 and record it', async () => {
    const response = await request.get(API('/1'));
    expect(response.status()).toBe(200);
    original = await response.json();
  });
  await test.step('PUT item 1 with a new name, price + 1 and type id 999', async () => {
    const response = await request.put(API('/1'), {
      data: { ...original, name: 'Changed Name', price: Number(original.price) + 1, catalogTypeId: 999 },
    });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(PROBLEM_JSON);
    expect((await response.json()).detail).toBe('Catalog type with id 999 does not exist.');
  });
  await test.step('GET item 1 again: unchanged', async () => {
    const after = await (await request.get(API('/1'))).json();
    expect(after.name).toBe(original.name);
    expect(after.price).toBe(original.price);
    expect(after.catalogBrandId).toBe(original.catalogBrandId);
    expect(after.catalogTypeId).toBe(original.catalogTypeId);
  });
});

test('TC-BUG-19-04 PUT v2 on item 1 with unknown brand id 999 is rejected and changes nothing', async ({ request }) => {
  let original!: CatalogItem;
  await test.step('GET item 1 and record it', async () => {
    original = await (await request.get(API('/1'))).json();
  });
  await test.step('PUT item 1 with brand id 999', async () => {
    const response = await request.put(API('/1'), { data: { ...original, catalogBrandId: 999 } });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(PROBLEM_JSON);
    expect((await response.json()).detail).toBe('Catalog brand with id 999 does not exist.');
  });
  await test.step('GET item 1 again: unchanged', async () => {
    const after = await (await request.get(API('/1'))).json();
    expect(after).toEqual(original);
  });
});

test('TC-BUG-19-05 PUT v1 with an unknown brand id is rejected with 400', async ({ request }) => {
  let original!: CatalogItem;
  await test.step('GET item 1 (v1) and record it', async () => {
    original = await (await request.get(API('/1', '1.0'))).json();
  });
  await test.step('PUT v1 with id 1 in the body and brand id 999', async () => {
    const response = await request.put(API('', '1.0'), { data: { ...original, id: 1, catalogBrandId: 999 } });
    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(PROBLEM_JSON);
    expect((await response.json()).detail).toBe('Catalog brand with id 999 does not exist.');
  });
  await test.step('GET item 1 (v1) again: unchanged', async () => {
    const after = await (await request.get(API('/1', '1.0'))).json();
    expect(after).toEqual(original);
  });
});

test('TC-BUG-19-06 POST with both brand and type unknown reports the brand only', async ({ request }) => {
  await test.step('POST with type 998 and brand 999', async () => {
    const response = await request.post(API(''), { data: newItem('Both Unknown', 998, 999) });
    expect(response.status()).toBe(400);
    const detail: string = (await response.json()).detail;
    expect(detail).toBe('Catalog brand with id 999 does not exist.');
    expect(detail).not.toContain('998');
  });
});

test('TC-BUG-19-07 PUT v2 on a missing item with an unknown brand id returns 404', async ({ request }) => {
  await test.step('PUT item 99999 with brand id 999', async () => {
    const response = await request.put(API('/99999'), { data: { id: 99999, ...newItem('Ghost', 1, 999) } });
    expect(response.status()).toBe(404);
    expect((await response.json()).detail).toBe('Item with id 99999 not found.');
  });
});

test('TC-BUG-19-08 POST with highest existing brand 13 and type 8 succeeds', async ({ request }) => {
  const name = 'Valid Refs Item';
  await test.step('POST with type 8 and brand 13', async () => {
    const response = await request.post(API(''), { data: newItem(name, 8, 13) });
    expect(response.status()).toBe(201);
    expect(response.headers()['location']).toMatch(/\/api\/catalog\/items\/\d+/);
  });
  await test.step('the list contains the item with brand 13, type 8 and 102 items', async () => {
    const list = await (await request.get(LIST())).json();
    const created = list.data.find((i: { name: string }) => i.name === name);
    expect(created).toBeDefined();
    expect(created.catalogBrandId).toBe(13);
    expect(created.catalogTypeId).toBe(8);
    expect(list.count).toBe(102);
  });
});

test('TC-BUG-19-09 POST with brand id 14 is rejected', async ({ request }) => {
  await test.step('POST with brand id 14', async () => {
    const response = await request.post(API(''), { data: newItem('Brand 14 Item', 1, 14) });
    expect(response.status()).toBe(400);
    expect((await response.json()).detail).toBe('Catalog brand with id 14 does not exist.');
  });
});

test('TC-BUG-19-10 PUT v2 with existing brand 2 and type 3 still updates', async ({ request }) => {
  let original!: CatalogItem;
  await test.step('GET item 1 and record it', async () => {
    original = await (await request.get(API('/1'))).json();
  });
  await test.step('PUT item 1 with name Valid Update, brand 2, type 3', async () => {
    const response = await request.put(API('/1'), { data: { ...original, name: 'Valid Update', catalogBrandId: 2, catalogTypeId: 3 } });
    expect(response.status()).toBe(201);
  });
  await test.step('GET item 1 again: updated', async () => {
    const after = await (await request.get(API('/1'))).json();
    expect(after.name).toBe('Valid Update');
    expect(after.catalogBrandId).toBe(2);
    expect(after.catalogTypeId).toBe(3);
  });
});
