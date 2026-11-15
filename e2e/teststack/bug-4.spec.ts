import { test, expect } from '../demo';
import { getAccessToken } from './identity-token';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-4: catalog create, update and delete answer 401 to callers without a valid bearer token and 403 to signed-in
// callers who are not catalog admins (admin role and catalog scope), and change nothing; the admin user's catalog
// token still creates, updates and deletes items, and reads stay anonymous.
// Scenario `bug-4` (.factory/stack/scenarios/bug-4): the seeded catalog (items 1-101), the demo user alice and the
// seeded catalog admin `admin` (both Pass123$).
test.describe.configure({ mode: 'serial' });

const ITEMS = () => `${url('catalog')}/api/catalog/items`;
// The only redirect URIs identity registers for these clients on the stack (CatalogApiClient, OrderingApiClient);
// they resolve only inside the compose network.
const CATALOG_CLIENT = {
  clientId: 'catalogswaggerui',
  scope: 'catalog',
  redirectUri: 'http://catalog-api:8080/swagger/oauth2-redirect.html',
  state: 'bug4',
};
const ORDERS_CLIENT = {
  clientId: 'orderingswaggerui',
  scope: 'orders',
  redirectUri: 'http://ordering-api:8080/swagger/oauth2-redirect.html',
  state: 'bug4',
};
const ADMIN = 'admin';
const CUSTOMER = 'alice';
const ITEM_1_NAME = 'Wanderer Black Hiking Boots';
const ITEM_1_PRICE = 109.99;

let adminToken = '';
let customerCatalogToken = '';
let adminOrdersToken = '';

test.beforeAll(() => {
  loadScenario('bug-4');
});

// The swagger UI clients use the implicit flow: signing in returns an access token in the redirect fragment.
test.beforeAll(async ({ browser }) => {
  adminToken = await getAccessToken(browser, CATALOG_CLIENT, ADMIN);
  customerCatalogToken = await getAccessToken(browser, CATALOG_CLIENT, CUSTOMER);
  adminOrdersToken = await getAccessToken(browser, ORDERS_CLIENT, ADMIN);
  expect(adminToken).not.toBe('');
  expect(customerCatalogToken).not.toBe('');
  expect(adminOrdersToken).not.toBe('');
});

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const auth = () => bearer(adminToken);

const item = (id: number, name: string, description: string, price: number, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  description,
  price,
  pictureFileName: null,
  catalogTypeId: 1,
  catalogBrandId: 1,
  availableStock: 5,
  restockThreshold: 1,
  maxStockThreshold: 10,
  onReorder: false,
  ...extra,
});

// Body the anonymous PUT cases send for item 1 (only description and price differ between v1 and v2).
const item1Change = (description: string, price: number) =>
  item(1, ITEM_1_NAME, description, price, { pictureFileName: '1.webp', availableStock: 100, restockThreshold: 10, maxStockThreshold: 200 });

test('TC-BUG-4-01 anonymous POST /api/catalog/items returns 401 and creates no item', async ({ request }) => {
  await test.step('POST item 10101 with no Authorization header', async () => {
    const response = await request.post(`${ITEMS()}?api-version=2.0`, {
      data: item(10101, 'BUG-4 Anonymous Item', 'Created without a token', 10.0),
    });
    expect(response.status()).toBe(401);
    expect(response.headers()['location']).toBeUndefined();
  });
  await test.step('GET item 10101 anonymously returns 404', async () => {
    const response = await request.get(`${ITEMS()}/10101?api-version=2.0`);
    expect(response.status()).toBe(404);
  });
});

test('TC-BUG-4-02 anonymous v2 PUT /api/catalog/items/1 returns 401 and leaves item 1 unchanged', async ({ request }) => {
  const description = 'Anonymous change';
  await test.step('PUT item 1 (v2) with price 1.00 and no Authorization header', async () => {
    const response = await request.put(`${ITEMS()}/1?api-version=2.0`, { data: item1Change(description, 1.0) });
    expect(response.status()).toBe(401);
  });
  await test.step('GET item 1 anonymously: price still 109.99', async () => {
    const response = await request.get(`${ITEMS()}/1?api-version=2.0`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.price).toBe(ITEM_1_PRICE);
    expect(body.description).not.toBe(description);
  });
});

test('TC-BUG-4-03 anonymous v1 PUT /api/catalog/items returns 401 and leaves item 1 unchanged', async ({ request }) => {
  const description = 'Anonymous change v1';
  await test.step('PUT item 1 (v1, id in the body) with price 2.00 and no Authorization header', async () => {
    const response = await request.put(`${ITEMS()}?api-version=1.0`, { data: item1Change(description, 2.0) });
    expect(response.status()).toBe(401);
  });
  await test.step('GET item 1 anonymously (v1): price still 109.99', async () => {
    const response = await request.get(`${ITEMS()}/1?api-version=1.0`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.price).toBe(ITEM_1_PRICE);
    expect(body.description).not.toBe(description);
  });
});

test('TC-BUG-4-04 anonymous DELETE /api/catalog/items/1 returns 401 and item 1 still exists', async ({ request }) => {
  await test.step('DELETE item 1 with no Authorization header', async () => {
    const response = await request.delete(`${ITEMS()}/1?api-version=2.0`);
    expect(response.status()).toBe(401);
  });
  await test.step('GET item 1 anonymously still returns it', async () => {
    const response = await request.get(`${ITEMS()}/1?api-version=2.0`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(1);
    expect(body.name).toBe(ITEM_1_NAME);
  });
});

test('TC-BUG-4-05 POST with a malformed bearer token returns 401 and creates no item', async ({ request }) => {
  await test.step('POST item 10102 with Authorization: Bearer not-a-valid-token', async () => {
    const response = await request.post(`${ITEMS()}?api-version=2.0`, {
      headers: { Authorization: 'Bearer not-a-valid-token' },
      data: item(10102, 'BUG-4 Bad Token Item', 'Created with a malformed token', 10.0),
    });
    expect(response.status()).toBe(401);
  });
  await test.step('GET item 10102 anonymously returns 404', async () => {
    const response = await request.get(`${ITEMS()}/10102?api-version=2.0`);
    expect(response.status()).toBe(404);
  });
});

test('TC-BUG-4-12 anonymous DELETE of a missing item returns 401, not 404', async ({ request }) => {
  await test.step('DELETE item 999999 with no Authorization header', async () => {
    const response = await request.delete(`${ITEMS()}/999999?api-version=2.0`);
    expect(response.status()).toBe(401);
  });
});

test('TC-BUG-4-10 catalog reads stay anonymous after the fix', async ({ request }) => {
  await test.step('GET item 99 anonymously', async () => {
    const response = await request.get(`${ITEMS()}/99?api-version=2.0`);
    expect(response.status()).toBe(200);
    expect((await response.json()).name).toBe('Adventurer GPS Watch');
  });
  await test.step('GET the first page of 10 items anonymously', async () => {
    const response = await request.get(`${ITEMS()}?api-version=2.0&pageSize=10&pageIndex=0`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.pageSize).toBe(10);
    expect(body.data).toHaveLength(10);
  });
});

const FORBIDDEN_CALLERS = [
  { id: 'TC-BUG-4-13', who: 'a signed-in customer (alice: catalog scope, no admin role)', token: () => customerCatalogToken },
  { id: 'TC-BUG-4-14', who: 'the admin with a token for another API (orders scope only)', token: () => adminOrdersToken },
];

for (const caller of FORBIDDEN_CALLERS) {
  test(`${caller.id} writes by ${caller.who} return 403 and change nothing`, async ({ request }) => {
    const headers = bearer(caller.token());
    const description = `Forbidden change ${caller.id}`;
    await test.step('POST item 10104 returns 403 and creates no item', async () => {
      const response = await request.post(`${ITEMS()}?api-version=2.0`, {
        headers,
        data: item(10104, 'BUG-4 Forbidden Item', 'Created by a non-admin', 10.0),
      });
      expect(response.status()).toBe(403);
      expect((await request.get(`${ITEMS()}/10104?api-version=2.0`)).status()).toBe(404);
    });
    await test.step('PUT item 1 (v2, then v1) with price 3.00 returns 403', async () => {
      const v2 = await request.put(`${ITEMS()}/1?api-version=2.0`, { headers, data: item1Change(description, 3.0) });
      expect(v2.status()).toBe(403);
      const v1 = await request.put(`${ITEMS()}?api-version=1.0`, { headers, data: item1Change(description, 3.0) });
      expect(v1.status()).toBe(403);
    });
    await test.step('DELETE item 1 returns 403', async () => {
      expect((await request.delete(`${ITEMS()}/1?api-version=2.0`, { headers })).status()).toBe(403);
    });
    await test.step('GET item 1 anonymously: still there, price still 109.99', async () => {
      const response = await request.get(`${ITEMS()}/1?api-version=2.0`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.price).toBe(ITEM_1_PRICE);
      expect(body.description).not.toBe(description);
    });
  });
}

test('TC-BUG-4-07 authenticated POST creates an item (201 with Location)', async ({ request }) => {
  await test.step('POST item 10103 as the catalog admin', async () => {
    const response = await request.post(`${ITEMS()}?api-version=2.0`, {
      headers: auth(),
      data: item(10103, 'BUG-4 Admin Item', 'Created by an authenticated caller', 25.5),
    });
    expect(response.status()).toBe(201);
    expect(response.headers()['location']).toBe('/api/catalog/items/10103');
  });
  await test.step('GET item 10103 anonymously returns the new item', async () => {
    const response = await request.get(`${ITEMS()}/10103?api-version=2.0`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(10103);
    expect(body.name).toBe('BUG-4 Admin Item');
    expect(body.price).toBe(25.5);
  });
});

test('TC-BUG-4-08 authenticated v2 PUT changes the price of item 99 (201)', async ({ request }) => {
  const description = 'Updated by an authenticated caller';
  await test.step('PUT item 99 (v2) with price 189.99 as the catalog admin', async () => {
    const response = await request.put(`${ITEMS()}/99?api-version=2.0`, {
      headers: auth(),
      data: item(99, 'Adventurer GPS Watch', description, 189.99, {
        pictureFileName: '99.webp',
        catalogTypeId: 7,
        catalogBrandId: 7,
        availableStock: 100,
        restockThreshold: 10,
        maxStockThreshold: 200,
      }),
    });
    expect(response.status()).toBe(201);
    expect(response.headers()['location']).toBe('/api/catalog/items/99');
  });
  await test.step('GET item 99 anonymously shows the new price and description', async () => {
    const response = await request.get(`${ITEMS()}/99?api-version=2.0`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.price).toBe(189.99);
    expect(body.description).toBe(description);
  });
});

test('TC-BUG-4-09 authenticated DELETE removes item 101 (204, then 404)', async ({ request }) => {
  await test.step('DELETE item 101 as the catalog admin', async () => {
    const response = await request.delete(`${ITEMS()}/101?api-version=2.0`, { headers: auth() });
    expect(response.status()).toBe(204);
  });
  await test.step('GET item 101 anonymously returns 404', async () => {
    const response = await request.get(`${ITEMS()}/101?api-version=2.0`);
    expect(response.status()).toBe(404);
  });
});
