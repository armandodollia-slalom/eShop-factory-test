import { test, expect } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// CAT-1: "More from this brand" on the product page and its Catalog.API endpoint, on scenario `cat-1`
// (brand 20 "Mates Co" with seven items, 21 "Solo Brand" with one, 22 "Duo Brand" with two).
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('cat-1');
});

const catalog = () => url('catalog');
const mates = (id: number | string, query = '', version = '1.0') =>
  `${catalog()}/api/catalog/items/${id}/brand-mates?${query ? `${query}&` : ''}api-version=${version}`;

type Item = { id: number; name: string; catalogBrandId: number } & Record<string, unknown>;

// ---------------------------------------------------------------- Catalog.API (HTTP, anonymous)

test('TC-CAT-1-01 default count returns the four first other items by name, excluding the item itself', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 203 without count', () => request.get(mates(203)));
  expect(response.status()).toBe(200);
  const items = (await response.json()) as Item[];
  expect(items).toHaveLength(4);
  expect(items.map(i => i.name)).toEqual(['Alpha Tent', 'Bravo Tent', 'Delta Tent', 'Echo Tent']);
  expect(items.map(i => i.id)).toEqual([201, 202, 204, 205]);
  expect(items.map(i => i.id)).not.toContain(203);
  for (const item of items) expect(item.catalogBrandId).toBe(20);
});

test('TC-CAT-1-02 count=12 returns all six other items in ordinal name order', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 203 with count=12', () => request.get(mates(203, 'count=12')));
  expect(response.status()).toBe(200);
  const items = (await response.json()) as Item[];
  expect(items.map(i => i.name)).toEqual(['Alpha Tent', 'Bravo Tent', 'Delta Tent', 'Echo Tent', 'Foxtrot Tent', 'zulu tent']);
  expect(items.map(i => i.id)).toEqual([201, 202, 204, 205, 206, 207]);
});

test('TC-CAT-1-03 count=1 returns only the first other item by name', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 203 with count=1', () => request.get(mates(203, 'count=1')));
  expect(response.status()).toBe(200);
  const items = (await response.json()) as Item[];
  expect(items).toHaveLength(1);
  expect(items[0].name).toBe('Alpha Tent');
  expect(items[0].id).toBe(201);
});

test('TC-CAT-1-04 only item of its brand returns 200 with an empty array', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 210', () => request.get(mates(210)));
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual([]);
});

test('TC-CAT-1-05 fewer mates than the default count returns all of them', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 220', () => request.get(mates(220)));
  expect(response.status()).toBe(200);
  const items = (await response.json()) as Item[];
  expect(items).toHaveLength(1);
  expect(items[0].name).toBe('Duo Two');
  expect(items[0].id).toBe(221);
});

test('TC-CAT-1-06 out-of-stock brand-mates are included', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 203 with count=2', () => request.get(mates(203, 'count=2')));
  expect(response.status()).toBe(200);
  const items = (await response.json()) as Item[];
  expect(items.map(i => i.name)).toEqual(['Alpha Tent', 'Bravo Tent']);
  expect(items.map(i => i.id)).toEqual([201, 202]);
  expect(items[1].availableStock).toBe(0);
});

test('TC-CAT-1-07 returned items have the same shape as the single-item endpoint', async ({ request }) => {
  const single = await test.step('GET item 201', () => request.get(`${catalog()}/api/catalog/items/201?api-version=1.0`));
  expect(single.status()).toBe(200);
  const expected = await single.json();
  const response = await test.step('GET brand-mates of item 203 with count=1', () => request.get(mates(203, 'count=1')));
  expect(response.status()).toBe(200);
  const items = await response.json();
  expect(items).toHaveLength(1);
  expect(Object.keys(items[0]).sort()).toEqual(Object.keys(expected).sort());
  expect(items[0]).toEqual(expected);
});

test('TC-CAT-1-08 the endpoint is available and equivalent in API version 2.0', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 203 with api-version 2.0', () => request.get(mates(203, '', '2.0')));
  expect(response.status()).toBe(200);
  const items = (await response.json()) as Item[];
  expect(items.map(i => i.id)).toEqual([201, 202, 204, 205]);
  expect(items.map(i => i.name)).toEqual(['Alpha Tent', 'Bravo Tent', 'Delta Tent', 'Echo Tent']);
});

test('TC-CAT-1-09 unknown item id returns 404', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 999999', () => request.get(mates(999999)));
  expect(response.status()).toBe(404);
});

test('TC-CAT-1-10 count=0 is rejected with 400 problem details', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 203 with count=0', () => request.get(mates(203, 'count=0')));
  expect(response.status()).toBe(400);
  const problem = await response.json();
  expect(problem.status).toBe(400);
  expect(typeof problem.title).toBe('string');
  expect(problem.title.length).toBeGreaterThan(0);
});

test('TC-CAT-1-11 count=13 is rejected with 400 problem details', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 203 with count=13', () => request.get(mates(203, 'count=13')));
  expect(response.status()).toBe(400);
  const problem = await response.json();
  expect(problem.status).toBe(400);
  expect(typeof problem.title).toBe('string');
  expect(problem.title.length).toBeGreaterThan(0);
});

test('TC-CAT-1-12 negative count is rejected with 400', async ({ request }) => {
  const response = await test.step('GET brand-mates of item 203 with count=-1', () => request.get(mates(203, 'count=-1')));
  expect(response.status()).toBe(400);
});

// ---------------------------------------------------------------- WebApp product page

const section = (page: import('@playwright/test').Page, brand: string) =>
  page.locator('section.item-brand-mates').filter({ has: page.getByRole('heading', { name: `More from ${brand}`, exact: true }) });

test('TC-CAT-1-13 anonymous shopper sees "More from Mates Co" with four cards of other items', async ({ page, demo }) => {
  await test.step('Open /item/203', async () => {
    await demo.chapter('Brand-mates on the product page', 'An anonymous shopper opens Charlie Tent of Mates Co.');
    await page.goto(`${BASE_URL}/item/203`);
  });
  await test.step('Wait for the product details', async () => {
    await expect(page.getByRole('heading', { name: 'Charlie Tent' }).first()).toBeVisible();
  });
  const more = section(page, 'Mates Co');
  await expect(more.getByRole('heading', { level: 2 })).toHaveText('More from Mates Co');
  await demo.highlight(more, 'More from Mates Co');
  const cards = more.locator('.catalog-product');
  await expect(cards).toHaveCount(4);
  await expect(cards.locator('.name')).toHaveText(['Alpha Tent', 'Bravo Tent', 'Delta Tent', 'Echo Tent']);
  for (let i = 0; i < 4; i++) {
    await expect(cards.nth(i).locator('img')).toBeVisible();
    await expect(cards.nth(i).locator('.price')).toHaveText('$10.00');
  }
  await expect(more.getByText('Charlie Tent')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Charlie Tent' }).first()).toBeVisible();
});

test('TC-CAT-1-14 following a brand-mate card opens that item\'s product page', async ({ page }) => {
  await test.step('Open /item/203', async () => {
    await page.goto(`${BASE_URL}/item/203`);
    await expect(section(page, 'Mates Co')).toBeVisible();
  });
  await test.step('Click the "Bravo Tent" card', async () => {
    await section(page, 'Mates Co').getByRole('link', { name: /Bravo Tent/ }).click();
  });
  await expect(page).toHaveURL(/\/item\/202$/);
  await expect(page.getByRole('heading', { name: 'Bravo Tent' }).first()).toBeVisible();
  const more = section(page, 'Mates Co');
  await expect(more).toBeVisible();
  await expect(more.locator('.catalog-product .name').filter({ hasText: 'Charlie Tent' })).toHaveCount(1);
  await expect(more.locator('.catalog-product .name').filter({ hasText: 'Bravo Tent' })).toHaveCount(0);
});

test('TC-CAT-1-15 signed-in shopper sees the same section', async ({ page }) => {
  await test.step('Sign in as alice', async () => {
    await page.goto(BASE_URL!);
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  });
  await test.step('Open /item/203', () => page.goto(`${BASE_URL}/item/203`));
  const more = section(page, 'Mates Co');
  await expect(more).toBeVisible();
  await expect(more.locator('.catalog-product .name')).toHaveText(['Alpha Tent', 'Bravo Tent', 'Delta Tent', 'Echo Tent']);
});

test('TC-CAT-1-16 brand with fewer than four other items shows only those cards', async ({ page }) => {
  await test.step('Open /item/220', () => page.goto(`${BASE_URL}/item/220`));
  const more = section(page, 'Duo Brand');
  await expect(more.getByRole('heading', { level: 2 })).toHaveText('More from Duo Brand');
  await expect(more.locator('.catalog-product')).toHaveCount(1);
  await expect(more.locator('.catalog-product .name')).toHaveText(['Duo Two']);
});

test('TC-CAT-1-17 single-item brand shows no "More from" section and the rest of the page is intact', async ({ page }) => {
  await test.step('Open /item/210', () => page.goto(`${BASE_URL}/item/210`));
  await expect(page.getByRole('heading', { name: 'Lone Lantern' }).first()).toBeVisible();
  await expect(page.locator('.price')).toContainText('$10.00');
  await expect(page.getByText(/^More from/)).toHaveCount(0);
  await expect(page.locator('section.item-brand-mates')).toHaveCount(0);
  await expect(page.locator('.catalog-product')).toHaveCount(0);
});
