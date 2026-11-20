import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BRAND-1: the "Brands" header link and the /brands page.
// Scenario `brand-1` (.factory/stack/scenarios/brand-1): the demo catalog plus brand 14 "Acme Empty" without products
// and brand 15 "Mono Gear" with the single item 1001 "Mono Compass" at 8.50. It extends `default`, so the demo
// catalog the header cases use is unchanged.
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('brand-1');
});

const nav = (page: Page) => page.getByRole('navigation', { name: 'Primary' });
const cards = (page: Page) => page.locator('article.brand-card');
const card = (page: Page, brand: string) =>
  cards(page).filter({ has: page.getByRole('heading', { name: brand, exact: true }) });
const pageHeading = (page: Page) => page.getByRole('heading', { name: 'Brands', level: 1, exact: true });

async function expectBrandsAdjacentToShopAll(page: Page, demo: { highlight: (l: Locator, label?: string) => Promise<void> }) {
  const links = nav(page).getByRole('link');
  const texts = (await links.allTextContents()).map((t) => t.trim());
  const shopAll = texts.indexOf('Shop all');
  const brands = texts.indexOf('Brands');
  expect(shopAll).toBeGreaterThanOrEqual(0);
  expect(brands).toBeGreaterThanOrEqual(0);
  expect(Math.abs(brands - shopAll)).toBe(1);
  await demo.highlight(nav(page), '"Shop all" and "Brands" side by side in the header');
}

async function clickBrandsAndExpectPage(page: Page, demo: { highlight: (l: Locator, label?: string) => Promise<void>; caption: (t: string) => Promise<void> }) {
  const link = nav(page).getByRole('link', { name: 'Brands', exact: true });
  await demo.highlight(link, 'Click "Brands"');
  await link.click();
  await expect(page).toHaveURL((u) => u.pathname === '/brands');
  await expect(pageHeading(page)).toBeVisible();
  await demo.caption(`Now at ${new URL(page.url()).pathname}`);
  await demo.highlight(pageHeading(page), `Brands page at ${new URL(page.url()).pathname}`);
}

test('TC-BRAND-1-04 header "Brands" link next to "Shop all" opens /brands', async ({ page, demo }) => {
  await test.step('open the home page /', async () => {
    await page.goto(BASE_URL!);
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    await demo.caption(`Opened ${new URL(page.url()).pathname}`);
    await expectBrandsAdjacentToShopAll(page, demo);
  });
  await test.step('click "Brands" in the header navigation', async () => {
    await clickBrandsAndExpectPage(page, demo);
  });
});

test('TC-BRAND-1-05 "Brands" link on an item page opens /brands', async ({ page, demo }) => {
  await test.step('open /item/99', async () => {
    await page.goto(`${BASE_URL}/item/99`);
    const title = page.getByRole('heading', { name: 'Adventurer GPS Watch' });
    await expect(title).toBeVisible();
    await demo.caption(`Opened ${new URL(page.url()).pathname}`);
    await demo.highlight(title, 'Item page: Adventurer GPS Watch');
    await expectBrandsAdjacentToShopAll(page, demo);
  });
  await test.step('click "Brands" in the header navigation', async () => {
    await clickBrandsAndExpectPage(page, demo);
  });
});

const EXPECTED_ORDER = [
  'Acme Empty', 'AirStrider', 'B&R', 'Daybird', 'Gravitator', 'Green Equipment', 'Grolltex', 'Legend',
  'Mono Gear', 'Quester', 'Raptor Elite', 'Solstix', 'WildRunner', 'XE', 'Zephyr',
];

test('TC-BRAND-1-06 Brands page has heading "Brands" and one card per brand in alphabetical order', async ({ page, demo }) => {
  await test.step('open /brands', async () => {
    await page.goto(`${BASE_URL}/brands`);
    await demo.caption(`Opened ${new URL(page.url()).pathname}`);
    await expect(pageHeading(page)).toBeVisible();
    await demo.highlight(pageHeading(page), 'Page heading "Brands"');
  });
  await test.step('15 cards, one per brand, in alphabetical order', async () => {
    await expect(cards(page)).toHaveCount(15);
    const headings = cards(page).locator('h2');
    await expect(headings).toHaveCount(15);
    await expect(headings).toHaveText(EXPECTED_ORDER);
    const names = (await headings.allTextContents()).map((t) => t.trim());
    expect(new Set(names).size).toBe(names.length);
    await demo.highlight(cards(page).first(), 'First card: Acme Empty');
    await demo.highlight(card(page, 'Mono Gear'), 'Mono Gear between Legend and Quester');
    await demo.highlight(cards(page).last(), 'Last card: Zephyr (15 cards)');
  });
});

test('TC-BRAND-1-07 card of a brand with several products shows "N products" and "from $X.XX"', async ({ page, demo }) => {
  await test.step('open /brands', async () => {
    await page.goto(`${BASE_URL}/brands`);
    await expect(pageHeading(page)).toBeVisible();
  });
  await test.step('read the Solstix card, then the Legend card', async () => {
    const solstix = card(page, 'Solstix');
    await expect(solstix).toHaveCount(1);
    await expect(solstix).toContainText('9 products');
    await expect(solstix).toContainText('from $89.00');
    await expect(solstix).not.toContainText('No products yet');
    await demo.highlight(solstix, 'Solstix: 9 products, from $89.00');

    const legend = card(page, 'Legend');
    await expect(legend).toHaveCount(1);
    await expect(legend).toContainText('8 products');
    await expect(legend).toContainText('from $21.99');
    await expect(legend).not.toContainText('No products yet');
    await demo.highlight(legend, 'Legend: 8 products, from $21.99');
  });
});

test('TC-BRAND-1-08 card of a brand with one product shows "1 product" and "from $8.50"', async ({ page, demo }) => {
  await test.step('open /brands', async () => {
    await page.goto(`${BASE_URL}/brands`);
    await expect(pageHeading(page)).toBeVisible();
  });
  await test.step('read the Mono Gear card', async () => {
    const mono = card(page, 'Mono Gear');
    await expect(mono).toHaveCount(1);
    await expect(mono).toContainText('1 product');
    await expect(mono).toContainText('from $8.50');
    await expect(mono).not.toContainText('1 products');
    await expect(mono).not.toContainText(/\$8\.5(?!0)/);
    await expect(mono).not.toContainText('No products yet');
    await demo.highlight(mono, 'Mono Gear: 1 product, from $8.50');
  });
});

test('TC-BRAND-1-09 card of a brand without products shows "No products yet" and no price', async ({ page, demo }) => {
  await test.step('open /brands', async () => {
    await page.goto(`${BASE_URL}/brands`);
    await expect(pageHeading(page)).toBeVisible();
  });
  await test.step('read the Acme Empty card', async () => {
    const empty = card(page, 'Acme Empty');
    await expect(empty).toHaveCount(1);
    await expect(empty.getByRole('heading', { name: 'Acme Empty', exact: true })).toBeVisible();
    await expect(empty).toContainText('No products yet');
    await expect(empty).not.toContainText('$');
    await expect(empty).not.toContainText(/from/i);
    await expect(empty).not.toContainText(/\d product/);
    await demo.highlight(empty, 'Acme Empty: No products yet');
    await demo.absent(empty.locator('p'), 'no count and no price on the Acme Empty card');
  });
});
