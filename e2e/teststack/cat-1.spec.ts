import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// CAT-1: "More from this brand". The API cases call Catalog.API on the test stack over HTTP (no browser);
// the page cases drive the WebApp. All run on the `cat-1` scenario (.factory/stack/scenarios/cat-1).
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('cat-1');
});

type Item = { id: number; name: string; availableStock: number; catalogBrand: { brand: string } };
const api = (path: string) => `${url('catalog')}/api/catalog/items/${path}`;
const ALPHA_FIRST_FOUR = ['Bravo Pack', 'Charlie Pack', 'Delta Pack', 'Echo Pack'];

test('TC-CAT-1-01 default call returns the four first other items of the brand, ordered by name, without the item itself', async ({ request }) => {
  const response = await request.get(api('1001/brand-mates?api-version=1.0'));
  expect(response.status()).toBe(200);
  const items = await response.json();
  expect(items.map((i: Item) => i.name)).toEqual(ALPHA_FIRST_FOUR);
  expect(items.map((i: Item) => i.id)).not.toContain(1001);
  for (const item of items) expect(item.catalogBrand.brand).toBe('Brand Alpha');
  expect(items.map((i: Item) => i.id).filter((id: number) => id >= 1011 && id <= 1013)).toEqual([]);
});

test('TC-CAT-1-02 count=12 returns all six other items in ordinal name order', async ({ request }) => {
  const response = await request.get(api('1001/brand-mates?count=12&api-version=1.0'));
  expect(response.status()).toBe(200);
  const items = await response.json();
  expect(items.map((i: Item) => i.name)).toEqual([...ALPHA_FIRST_FOUR, 'Foxtrot Pack', 'alpha lowercase pack']);
  expect(items.map((i: Item) => i.id)).not.toContain(1001);
});

test('TC-CAT-1-03 count=1 returns only the first other item', async ({ request }) => {
  const response = await request.get(api('1001/brand-mates?count=1&api-version=1.0'));
  expect(response.status()).toBe(200);
  const items = await response.json();
  expect(items.map((i: Item) => i.name)).toEqual(['Bravo Pack']);
});

test('TC-CAT-1-04 the only item of its brand gets 200 with an empty array', async ({ request }) => {
  const response = await request.get(api('1020/brand-mates?api-version=1.0'));
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual([]);
});

test('TC-CAT-1-05 unknown item id returns 404', async ({ request }) => {
  const response = await request.get(api('999999/brand-mates?api-version=1.0'));
  expect(response.status()).toBe(404);
  const text = await response.text();
  let parsed: unknown = null;
  try { parsed = JSON.parse(text); } catch { /* not JSON: fine */ }
  expect(Array.isArray(parsed)).toBe(false);
});

async function expectCountRejected(request: APIRequestContext, count: number) {
  const response = await request.get(api(`1001/brand-mates?count=${count}&api-version=1.0`));
  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/problem+json');
  expect((await response.json()).status).toBe(400);
}

test('TC-CAT-1-06 count=0 returns 400 problem details', async ({ request }) => {
  await expectCountRejected(request, 0);
});

test('TC-CAT-1-07 count=13 returns 400 problem details', async ({ request }) => {
  await expectCountRejected(request, 13);
});

test('TC-CAT-1-08 the endpoint also answers on API version 2.0', async ({ request }) => {
  const response = await request.get(api('1001/brand-mates?api-version=2.0'));
  expect(response.status()).toBe(200);
  expect((await response.json()).map((i: Item) => i.name)).toEqual(ALPHA_FIRST_FOUR);
});

test('TC-CAT-1-09 out-of-stock brand-mates are included', async ({ request }) => {
  const response = await request.get(api('1001/brand-mates?api-version=1.0'));
  expect(response.status()).toBe(200);
  const items = await response.json();
  expect(items[1].id).toBe(1003);
  expect(items[1].name).toBe('Charlie Pack');
  expect(items[1].availableStock).toBe(0);
});

test('TC-CAT-1-10 returned items have the same shape and values as GET /items/{id}', async ({ request }) => {
  const mates = await request.get(api('1001/brand-mates?count=1&api-version=1.0'));
  expect(mates.status()).toBe(200);
  const [mate] = await mates.json();
  const single = await request.get(api('1002?api-version=1.0'));
  expect(single.status()).toBe(200);
  const item = await single.json();
  expect(Object.keys(mate).sort()).toEqual(Object.keys(item).sort());
  expect(mate).toEqual(item);
  expect(item.id).toBe(1002);
  expect(item.name).toBe('Bravo Pack');
  expect(item.catalogBrand.brand).toBe('Brand Alpha');
});

test('TC-CAT-1-11 a visitor sees "More from Brand Alpha" with four product cards', async ({ page, demo }) => {
  await demo.chapter('Product page, not signed in', 'Item 1001 has six other items of its brand.');
  await page.goto(`/item/1001`);
  await expect(page.getByRole('heading', { name: 'Aardvark Target' })).toBeVisible();

  const section = page.locator('section.brand-mates');
  const heading = section.getByRole('heading', { name: 'More from Brand Alpha' });
  await expect(heading).toBeVisible();
  const cards = section.locator('.catalog-product');
  await expect(cards).toHaveCount(4);
  await expect(cards.locator('.name')).toHaveText(ALPHA_FIRST_FOUR);
  for (let i = 0; i < 4; i++) {
    await expect(cards.nth(i).locator('img')).toBeVisible();
    await expect(cards.nth(i).locator('.price')).toContainText('$');
  }
  await expect(section.getByText('Aardvark Target')).toHaveCount(0);
  await expect(section.getByText('Beta')).toHaveCount(0);
  await demo.highlight(section, 'More from Brand Alpha with four cards');
});

test('TC-CAT-1-12 a signed-in shopper sees the same section', async ({ page, demo }) => {
  await page.goto('/');
  await page.getByLabel('Sign in').click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();

  await page.goto('/item/1001');
  await expect(page.getByRole('heading', { name: 'Aardvark Target' })).toBeVisible();
  const section = page.locator('section.brand-mates');
  await expect(section.getByRole('heading', { name: 'More from Brand Alpha' })).toBeVisible();
  await expect(section.locator('.catalog-product .name')).toHaveText(ALPHA_FIRST_FOUR);
  await demo.highlight(section, 'signed-in shopper sees More from Brand Alpha');
});

test('TC-CAT-1-13 following a brand-mate card opens that item\'s product page', async ({ page, demo }) => {
  await page.goto('/item/1001');
  const section = page.locator('section.brand-mates');
  await expect(section.getByRole('heading', { name: 'More from Brand Alpha' })).toBeVisible();
  await demo.highlight(section.locator('.catalog-product', { hasText: 'Bravo Pack' }), 'card Bravo Pack');
  await section.locator('.catalog-product', { hasText: 'Bravo Pack' }).click();

  await expect(page).toHaveURL(/\/item\/1002$/);
  await expect(page.getByRole('heading', { name: 'Bravo Pack', level: 1 }).or(page.getByRole('heading', { name: 'Bravo Pack' }).first())).toBeVisible();
  const next = page.locator('section.brand-mates');
  await expect(next.getByRole('heading', { name: 'More from Brand Alpha' })).toBeVisible();
  await expect(next.locator('.catalog-product .name')).not.toContainText(['Bravo Pack']);
  await expect(next.locator('.catalog-product', { hasText: 'Aardvark Target' })).toHaveCount(1);
  await demo.highlight(next, 'section on the Bravo Pack page');
});

test('TC-CAT-1-14 the only item of its brand shows no section', async ({ page, demo }) => {
  await page.goto('/item/1020');
  const title = page.getByRole('heading', { name: 'Lonely Lantern' });
  await expect(title).toBeVisible();
  await expect(page.getByText('A lantern that is the only item of its brand.')).toBeVisible();
  await expect(page.locator('.price').first()).toContainText('$29.50');
  await expect(page.locator('.item-media-img')).toBeVisible();
  await expect(page.getByText('More from')).toHaveCount(0);
  await expect(page.locator('section.brand-mates')).toHaveCount(0);
  await expect(page.locator('.item-page .catalog-product')).toHaveCount(0);
  await demo.absent(page.locator('.item-details'), 'no "More from" section below the product details');
});
