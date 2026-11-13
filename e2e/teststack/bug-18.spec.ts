import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-18: POST /api/catalog/items with an id that already exists must answer 409 Conflict, not 500.
// Scenario `bug-18` (.factory/stack/scenarios/bug-18): the default catalog (101 items with ids 1 to 101).
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('bug-18');
});

const CATALOG = () => url('catalog');
const items = (version: string, query = '') => `${CATALOG()}/api/catalog/items${query ? `?${query}&` : '?'}api-version=${version}`;
const item = (id: number | string) => `${CATALOG()}/api/catalog/items/${id}?api-version=2.0`;

const baseBody = {
  name: 'Duplicate probe',
  description: 'Probe',
  price: 9.99,
  catalogBrandId: 1,
  catalogTypeId: 1,
  availableStock: 5,
  restockThreshold: 1,
  maxStockThreshold: 10,
};

const idFromLocation = (location: string) => {
  const match = /\/api\/catalog\/items\/(\d+)$/.exec(new URL(location, CATALOG()).pathname);
  expect(match).not.toBeNull();
  return Number(match![1]);
};

test('TC-BUG-18-01 existing id is rejected with 409 (api-version 2.0)', async ({ request }) => {
  const response = await test.step('POST with "id": 1, api-version 2.0', () =>
    request.post(items('2.0'), { data: { ...baseBody, id: 1 } }));
  await test.step('409 Conflict without a Location header', () => {
    expect(response.status()).toBe(409);
    expect(response.headers()['location']).toBeUndefined();
  });
});

test('TC-BUG-18-02 existing id is rejected with 409 (api-version 1.0)', async ({ request }) => {
  const response = await test.step('POST with "id": 1, api-version 1.0', () =>
    request.post(items('1.0'), { data: { ...baseBody, id: 1 } }));
  await test.step('409 Conflict', () => expect(response.status()).toBe(409));
});

test('TC-BUG-18-03 rejected duplicate leaves the existing item and the catalog unchanged', async ({ request }) => {
  type Snapshot = { name: string; price: number; description: string; count: number };
  const snapshot = async (): Promise<Snapshot> => {
    const one = await request.get(item(1));
    expect(one.status()).toBe(200);
    const body = await one.json();
    const page = await request.get(items('2.0', 'pageIndex=0&pageSize=1'));
    expect(page.status()).toBe(200);
    return { name: body.name, price: body.price, description: body.description, count: (await page.json()).count };
  };
  let before!: Snapshot;
  await test.step('GET item 1 and the catalog count', async () => {
    before = await snapshot();
    expect(before.count).toBe(101);
  });
  await test.step('POST an overwrite attempt with "id": 1', async () => {
    const r = await request.post(items('2.0'), {
      data: { ...baseBody, id: 1, name: 'Overwrite attempt', description: 'Overwrite', price: 1.23 },
    });
    expect(r.status()).toBe(409);
  });
  await test.step('item 1 and the count are unchanged', async () => {
    const after = await snapshot();
    expect(after).toEqual(before);
    expect(after.name).not.toBe('Overwrite attempt');
    expect(after.price).not.toBe(1.23);
  });
});

test('TC-BUG-18-04 highest seeded id (101) is rejected with 409', async ({ request }) => {
  const response = await test.step('POST with "id": 101', () =>
    request.post(items('2.0'), { data: { ...baseBody, id: 101 } }));
  await test.step('409 Conflict', () => expect(response.status()).toBe(409));
});

test('TC-BUG-18-05 second create with the same new id returns 201 then 409', async ({ request }) => {
  await test.step('first POST with "id": 6001 returns 201 with Location', async () => {
    const r = await request.post(items('2.0'), { data: { ...baseBody, id: 6001 } });
    expect(r.status()).toBe(201);
    expect(new URL(r.headers()['location'], CATALOG()).pathname).toMatch(/\/api\/catalog\/items\/6001$/);
  });
  await test.step('identical second POST returns 409', async () => {
    const r = await request.post(items('2.0'), { data: { ...baseBody, id: 6001 } });
    expect(r.status()).toBe(409);
  });
  await test.step('GET item 6001 returns the single created item', async () => {
    const r = await request.get(item(6001));
    expect(r.status()).toBe(200);
    expect((await r.json()).name).toBe('Duplicate probe');
  });
});

test('TC-BUG-18-06 body id 0 is accepted and the id is generated', async ({ request }) => {
  let generated = 0;
  await test.step('POST with "id": 0', async () => {
    const r = await request.post(items('2.0'), { data: { ...baseBody, id: 0 } });
    expect(r.status()).toBe(201);
    generated = idFromLocation(r.headers()['location']);
    expect(generated).toBeGreaterThan(0);
    expect(generated > 101 || generated < 1).toBe(true);
  });
  await test.step('GET the Location returns the item with the generated id', async () => {
    const r = await request.get(item(generated));
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.name).toBe('Duplicate probe');
    expect(body.id).toBe(generated);
  });
});

test('TC-BUG-18-07 new non-zero id that does not exist yet is accepted', async ({ request }) => {
  await test.step('POST with "id": 6002 returns 201 with Location', async () => {
    const r = await request.post(items('2.0'), { data: { ...baseBody, id: 6002 } });
    expect(r.status()).toBe(201);
    expect(new URL(r.headers()['location'], CATALOG()).pathname).toMatch(/\/api\/catalog\/items\/6002$/);
  });
  await test.step('GET item 6002 returns it', async () => {
    const r = await request.get(item(6002));
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body.id).toBe(6002);
    expect(body.name).toBe('Duplicate probe');
  });
});

test('TC-BUG-18-08 body without an id property is created with a generated id', async ({ request }) => {
  const response = await test.step('POST without an id property', () =>
    request.post(items('2.0'), { data: baseBody }));
  await test.step('201 Created with a Location /api/catalog/items/<n>, n > 0', () => {
    expect(response.status()).toBe(201);
    expect(idFromLocation(response.headers()['location'])).toBeGreaterThan(0);
  });
});
