import { test, expect } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// CAT-1: "More from {brand}" on the product page and GET /api/catalog/items/{id}/brand-mates.
// Scenario `cat-1` (.factory/stack/scenarios/cat-1): brand 14 "Peak Gear" has items 1001 to 1007, brand 15 the single
// item 1008, brand 16 items 1009 to 1011, brand 17 items 1012 to 1014 (1013 and 1014 are both "Twin Mug").
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('cat-1');
});

const CATALOG = () => url('catalog');
const brandMates = (id: number, query = 'api-version=1.0') => `${CATALOG()}/api/catalog/items/${id}/brand-mates?${query}`;

type Item = Record<string, unknown> & { id: number; name: string; catalogBrandId: number; availableStock: number };

// ---------------------------------------------------------------- API (functional cases, run on the stack)

test('TC-CAT-1-01 default count returns the first four other items by name, without the item itself', async ({ request }) => {
  let items: Item[] = [];
  await test.step('GET /items/1001/brand-mates with no Authorization header', async () => {
    const response = await request.get(brandMates(1001));
    expect(response.status()).toBe(200);
    items = await response.json();
  });
  await test.step('four items ordered by name, none is item 1001, all of Peak Gear', async () => {
    expect(items.map((i) => i.name)).toEqual(['Beta Stove', 'Delta Lamp', 'Echo Boots', 'Foxtrot Mat']);
    expect(items.map((i) => i.id)).toEqual([1002, 1003, 1004, 1005]);
    expect(items.some((i) => i.id === 1001)).toBe(false);
    expect(items.every((i) => i.catalogBrandId === 14)).toBe(true);
  });
});

test('TC-CAT-1-02 count=12 returns all six other items in ordinal name order', async ({ request }) => {
  const response = await test.step('GET with count=12', () => request.get(brandMates(1001, 'count=12&api-version=1.0')));
  expect(response.status()).toBe(200);
  const items: Item[] = await response.json();
  expect(items.map((i) => i.name)).toEqual(['Beta Stove', 'Delta Lamp', 'Echo Boots', 'Foxtrot Mat', 'Zulu Pack', 'alpha Tent']);
  expect(items.map((i) => i.id)).toEqual([1002, 1003, 1004, 1005, 1006, 1007]);
  expect(items.some((i) => i.id === 1001)).toBe(false);
});

test('TC-CAT-1-03 count=1 returns only the first other item by name', async ({ request }) => {
  const response = await test.step('GET with count=1', () => request.get(brandMates(1001, 'count=1&api-version=1.0')));
  expect(response.status()).toBe(200);
  const items: Item[] = await response.json();
  expect(items).toHaveLength(1);
  expect(items[0].name).toBe('Beta Stove');
  expect(items[0].id).toBe(1002);
});

test('TC-CAT-1-04 the only item of its brand gets 200 with an empty array', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 1008', () => request.get(brandMates(1008)));
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual([]);
});

test('TC-CAT-1-05 unknown item id returns 404', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 999999', () => request.get(brandMates(999999)));
  expect(response.status()).toBe(404);
  const body = await response.text();
  expect(() => {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) throw new Error('array body');
  }).not.toThrow();
});

async function expectCountRejected(request: import('@playwright/test').APIRequestContext, count: number) {
  const response = await test.step(`GET with count=${count}`, () => request.get(brandMates(1001, `count=${count}&api-version=1.0`)));
  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/problem+json');
  const body = await response.json();
  expect(Array.isArray(body)).toBe(false);
  expect(body.status).toBe(400);
}

test('TC-CAT-1-06 count=0 is rejected with 400 problem details', async ({ request }) => {
  await expectCountRejected(request, 0);
});

test('TC-CAT-1-07 count=13 is rejected with 400 problem details', async ({ request }) => {
  await expectCountRejected(request, 13);
});

test('TC-CAT-1-08 each returned item has the same fields and values as GET items/{id}', async ({ request }) => {
  const single = await test.step('GET items/1003', () => request.get(`${CATALOG()}/api/catalog/items/1003?api-version=1.0`));
  expect(single.status()).toBe(200);
  const expected = await single.json();
  const list: Item[] = await (await test.step('GET brand-mates count=12', () => request.get(brandMates(1001, 'count=12&api-version=1.0')))).json();
  const mate = list.find((i) => i.id === 1003);
  expect(mate).toBeDefined();
  expect(Object.keys(mate!).sort()).toEqual(Object.keys(expected).sort());
  expect(mate).toEqual(expected);
  for (const field of ['id', 'name', 'description', 'price', 'pictureFileName', 'catalogTypeId', 'catalogBrandId', 'availableStock', 'restockThreshold', 'maxStockThreshold', 'onReorder']) {
    expect(Object.keys(mate!)).toContain(field);
  }
});

test('TC-CAT-1-09 the endpoint answers the same on API version 2.0 as on 1.0', async ({ request }) => {
  const v2 = await test.step('GET api-version=2.0', () => request.get(brandMates(1001, 'api-version=2.0')));
  const v1 = await test.step('GET api-version=1.0', () => request.get(brandMates(1001, 'api-version=1.0')));
  expect(v2.status()).toBe(200);
  expect(v1.status()).toBe(200);
  const body2: Item[] = await v2.json();
  const body1: Item[] = await v1.json();
  expect(body2.map((i) => i.name)).toEqual(['Beta Stove', 'Delta Lamp', 'Echo Boots', 'Foxtrot Mat']);
  expect(body2).toEqual(body1);
});

test('TC-CAT-1-10 an out-of-stock item of the same brand is returned', async ({ request }) => {
  const response = await test.step('GET with count=12', () => request.get(brandMates(1001, 'count=12&api-version=1.0')));
  expect(response.status()).toBe(200);
  const items: Item[] = await response.json();
  expect(items[2].id).toBe(1004);
  expect(items[2].name).toBe('Echo Boots');
  expect(items[2].availableStock).toBe(0);
});

test('TC-CAT-1-15 out-of-range count on an unknown id is 400, not 404', async ({ request }) => {
  const response = await test.step('GET unknown id with count=0', () => request.get(brandMates(999999, 'count=0&api-version=1.0')));
  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/problem+json');
  expect((await response.json()).status).toBe(400);
});

test('TC-CAT-1-17 items with identical names are ordered by id', async ({ request }) => {
  const all = await test.step('GET default count', () => request.get(brandMates(1012)));
  expect(all.status()).toBe(200);
  const allItems: Item[] = await all.json();
  expect(allItems.map((i) => i.id)).toEqual([1013, 1014]);
  expect(allItems.map((i) => i.name)).toEqual(['Twin Mug', 'Twin Mug']);

  const one = await test.step('GET count=1', () => request.get(brandMates(1012, 'count=1&api-version=1.0')));
  expect(one.status()).toBe(200);
  expect((await one.json() as Item[]).map((i) => i.id)).toEqual([1013]);
});

// ---------------------------------------------------------------- Browser (e2e cases)

const section = (page: import('@playwright/test').Page) => page.locator('section.item-brand-mates');

async function expectPeakGearCards(page: import('@playwright/test').Page, demo: { highlight: (l: import('@playwright/test').Locator, label?: string) => Promise<void> }) {
  const heading = page.getByRole('heading', { name: 'More from Peak Gear' });
  await expect(heading).toBeVisible();
  const cards = section(page).locator('.catalog-product');
  await expect(cards).toHaveCount(4);
  await expect(cards.locator('.name')).toHaveText(['Beta Stove', 'Delta Lamp', 'Echo Boots', 'Foxtrot Mat']);
  await expect(cards.locator('.price')).toHaveText(['$30.00', '$15.50', '$45.00', '$25.00']);
  for (let i = 0; i < 4; i++) await expect(cards.nth(i).locator('img')).toBeVisible();
  for (const name of ['Charlie Rope', 'Zulu Pack', 'alpha Tent']) {
    await expect(section(page).getByText(name, { exact: true })).toHaveCount(0);
  }
  await demo.highlight(section(page), 'More from Peak Gear with four cards');
}

test('TC-CAT-1-11 a visitor sees "More from Peak Gear" with four product cards', async ({ page, demo }) => {
  await test.step('open /item/1001 as a visitor', async () => {
    await page.goto(`${BASE_URL}/item/1001`);
    await expect(page.getByRole('heading', { name: 'Charlie Rope' })).toBeVisible();
  });
  await test.step('the section lists four cards', async () => {
    await expectPeakGearCards(page, demo);
  });
});

test('TC-CAT-1-12 following a brand-mate card opens that item\'s product page', async ({ page, demo }) => {
  await test.step('open /item/1001', async () => {
    await page.goto(`${BASE_URL}/item/1001`);
    await demo.highlight(page.getByRole('heading', { name: 'More from Peak Gear' }), 'More from Peak Gear on item 1001');
  });
  await test.step('click the Delta Lamp card', async () => {
    await section(page).getByRole('link', { name: /Delta Lamp/ }).click();
    await expect(page).toHaveURL(/\/item\/1003$/);
    await expect(page.getByRole('heading', { name: 'Delta Lamp', level: 1 })).toBeVisible();
  });
  await test.step('the new page has its own section without Delta Lamp', async () => {
    const heading = page.getByRole('heading', { name: 'More from Peak Gear' });
    await expect(heading).toBeVisible();
    await expect(section(page).locator('.catalog-product')).not.toHaveCount(0);
    await expect(section(page).locator('.catalog-product .name').filter({ hasText: /^Delta Lamp$/ })).toHaveCount(0);
    await demo.highlight(section(page), 'More from Peak Gear on item 1003, without Delta Lamp');
  });
});

test('TC-CAT-1-13 a signed-in shopper sees the same section', async ({ page, demo }) => {
  await test.step('sign in as alice', async () => {
    await page.goto(BASE_URL);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  });
  await test.step('open /item/1001', async () => {
    await page.goto(`${BASE_URL}/item/1001`);
    await expect(page.getByRole('heading', { name: 'Charlie Rope' })).toBeVisible();
    await expectPeakGearCards(page, demo);
  });
});

test('TC-CAT-1-14 a single-item brand shows no "More from" section', async ({ page, demo }) => {
  await test.step('open /item/1008', async () => {
    await page.goto(`${BASE_URL}/item/1008`);
    const title = page.getByRole('heading', { name: 'Lone Compass' });
    await expect(title).toBeVisible();
    await expect(page.getByText('$12.00').first()).toBeVisible();
    await demo.absent(title, 'no "More from" section below Lone Compass');
  });
  await test.step('no section and no brand-mate card', async () => {
    await expect(page.getByText(/^More from/)).toHaveCount(0);
    await expect(section(page)).toHaveCount(0);
    await expect(page.locator('.catalog-product')).toHaveCount(0);
  });
});

test('TC-CAT-1-16 a brand with two other items shows the heading and exactly two cards', async ({ page, demo }) => {
  await page.goto(`${BASE_URL}/item/1009`);
  await expect(page.getByRole('heading', { name: 'Kilo Stick' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'More from Trail Co' })).toBeVisible();
  const cards = section(page).locator('.catalog-product');
  await expect(cards).toHaveCount(2);
  await expect(cards.locator('.name')).toHaveText(['India Rope', 'Juliet Cup']);
  await expect(cards.locator('.price')).toHaveText(['$22.00', '$9.50']);
  await expect(cards.nth(0).locator('img')).toBeVisible();
  await expect(cards.nth(1).locator('img')).toBeVisible();
  await expect(section(page).getByText('Kilo Stick', { exact: true })).toHaveCount(0);
  await demo.highlight(section(page), 'More from Trail Co with two cards');
});
