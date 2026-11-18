import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// STOCK-1: the "In stock only" catalog filter, the "Out of stock" labels and the disabled "Add to shopping bag" button.
// Scenario `stock-1` (.factory/stack/scenarios/stock-1): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird,
// type 1 Footwear) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have AvailableStock 0; items 3 to 101 keep
// 100. The catalog shows 9 products per page, ordered by name. TC-20 and TC-21 share alice's basket, so the file
// runs serially and TC-20 (empty basket) runs before TC-21 (adds one item).
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('stock-1');
});

const OUT_OF_STOCK = 'Out of stock';
// Tall enough that the sticky filter panel (down to "In stock only"), all three rows of cards and the pager area
// below them fit in one frame, so the keyframes show the whole state a case proves.
const FULL_CATALOG_VIEWPORT = { width: 1280, height: 1800 };
const WANDERER = 'Wanderer Black Hiking Boots';
const SUMMIT = 'Summit Pro Harness';

const filters = (page: Page) => page.locator('aside.catalog-search');
const inStockOnly = (page: Page) => filters(page).getByRole('checkbox', { name: 'In stock only', exact: true });
const inStockOnlyLabel = (page: Page) => filters(page).locator('label.catalog-search-check');
const cards = (page: Page) => page.locator('.catalog-items .catalog-item');
const cardNames = (page: Page) => cards(page).locator('.catalog-product .name');
const pager = (page: Page) => page.locator('nav.catalog-pagination');
const highestPage = (page: Page) => pager(page).locator('.page-number').last();
const currentPage = (page: Page) => pager(page).locator('[aria-current="page"]');
const query = (page: Page) => new URL(page.url()).searchParams;
const filterTag = (page: Page, group: string, name: string) =>
  filters(page)
    .locator('.catalog-search-group', { has: page.getByRole('heading', { name: group, exact: true }) })
    .locator('a.catalog-search-tag', { has: page.locator('span', { hasText: new RegExp(`^${name}$`) }) });

async function openCatalog(page: Page, path: string, expectedCards?: number) {
  await page.goto(`${BASE_URL}${path}`);
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  await settled(page);
  if (expectedCards !== undefined) await expect(cards(page)).toHaveCount(expectedCards);
}

/** Ticks "In stock only"; the filter form submits itself and the page reloads with onlyAvailable=true. */
async function checkInStockOnly(page: Page) {
  await expect(inStockOnly(page)).not.toBeChecked();
  await inStockOnly(page).click();
  await page.waitForURL(/[?&]onlyAvailable=true/);
  await settled(page);
  await expect(inStockOnly(page)).toBeChecked();
}

/** Waits until the reloaded catalog has finished streaming its results, so later locators do not go stale. */
async function settled(page: Page) {
  await page.waitForLoadState('load');
  await expect(page.locator('.catalog-count')).toBeVisible();
}

async function signInAsAlice(page: Page, demo: { highlight: (l: Locator, label?: string) => Promise<void> }) {
  await page.goto(BASE_URL);
  await page.getByLabel('Sign in').click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await page.getByPlaceholder('Username').fill('alice');
  await page.getByPlaceholder('Password').fill('Pass123$');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  await demo.highlight(page.getByRole('button', { name: 'Account' }), 'Signed in as alice');
}

test('TC-STOCK-1-11 the "In stock only" checkbox is unchecked by default beside the filters', async ({ page, demo }) => {
  await test.step('open / as a visitor', async () => {
    await openCatalog(page, '/', 9);
  });
  await test.step('the filter area holds an unchecked "In stock only" checkbox', async () => {
    await expect(inStockOnly(page)).toHaveCount(1);
    await expect(inStockOnly(page)).not.toBeChecked();
    expect(query(page).has('onlyAvailable')).toBe(false);
    await demo.highlight(inStockOnlyLabel(page), '"In stock only" unchecked in the catalog filters');
  });
  await test.step('the pager runs to page 12 (101 products)', async () => {
    await expect(highestPage(page)).toHaveText('12');
    await demo.highlight(highestPage(page), 'highest page is 12');
  });
});

test('TC-STOCK-1-12 checking "In stock only" adds onlyAvailable=true and leaves 11 pages', async ({ page, demo }) => {
  await test.step('open /', async () => {
    await openCatalog(page, '/', 9);
    await expect(highestPage(page)).toHaveText('12');
  });
  await test.step('check "In stock only"', async () => {
    await checkInStockOnly(page);
  });
  await test.step('the URL carries onlyAvailable=true, the box is checked, the pager ends at 11', async () => {
    expect(query(page).get('onlyAvailable')).toBe('true');
    await expect(inStockOnly(page)).toBeChecked();
    await demo.highlight(inStockOnlyLabel(page), '"In stock only" checked after the reload');
    await expect(highestPage(page)).toHaveText('11');
    await demo.highlight(highestPage(page), 'highest page is 11 (99 in-stock products)');
  });
});

test.describe(() => {
  test.use({ viewport: FULL_CATALOG_VIEWPORT });

  test('TC-STOCK-1-13 with brand Daybird, checking the filter hides product 1 and keeps the brand', async ({ page, demo }) => {
    await test.step('open /?brand=1', async () => {
      await openCatalog(page, '/?brand=1', 9);
    });
    await test.step('check "In stock only"', async () => {
      await checkInStockOnly(page);
    });
    await test.step('brand=1 and onlyAvailable=true, nine cards without Wanderer, no page 2', async () => {
      expect(query(page).getAll('brand')).toEqual(['1']);
      expect(query(page).get('onlyAvailable')).toBe('true');
      await expect(cards(page)).toHaveCount(9);
      await expect(cardNames(page).filter({ hasText: new RegExp(`^${WANDERER}$`) })).toHaveCount(0);
      await expect(pager(page)).toHaveCount(0);
      await expect(page.getByRole('link', { name: '2', exact: true })).toHaveCount(0);
      await demo.highlight(page.locator('.catalog-items'), 'nine in-stock Daybird cards, no Wanderer Black Hiking Boots');
      // The whole results column, down to where the pager would sit below the last row of cards.
      await demo.absent(page.locator('.catalog-results'), 'no pager with a page 2 link below the nine cards');
    });
  });
});

test('TC-STOCK-1-14 the filter hides product 2 among the Gravitator products', async ({ page, demo }) => {
  await test.step('open /?brand=2&onlyAvailable=true&page=2', async () => {
    await openCatalog(page, '/?brand=2&onlyAvailable=true&page=2', 1);
  });
  await test.step('one card, Zero Gravity Ski Goggles; no Summit Pro Harness; box checked', async () => {
    await expect(cardNames(page)).toHaveText(['Zero Gravity Ski Goggles']);
    await expect(cardNames(page).filter({ hasText: new RegExp(`^${SUMMIT}$`) })).toHaveCount(0);
    await expect(inStockOnly(page)).toBeChecked();
    await demo.highlight(cards(page).first(), 'only Zero Gravity Ski Goggles on Gravitator page 2');
    await demo.highlight(inStockOnlyLabel(page), '"In stock only" checked from the URL');
  });
});

test.describe(() => {
  test.use({ viewport: FULL_CATALOG_VIEWPORT });

  test('TC-STOCK-1-15 reloading keeps the filter checked', async ({ page, demo }) => {
    await test.step('open /?brand=1', async () => {
      await openCatalog(page, '/?brand=1', 9);
    });
    await test.step('check "In stock only"', async () => {
      await checkInStockOnly(page);
    });
    await test.step('reload the page', async () => {
      await page.reload();
      await settled(page);
      await expect(cards(page)).toHaveCount(9);
    });
    await test.step('brand=1 and onlyAvailable=true stay, the box is checked, nine cards without Wanderer', async () => {
      expect(query(page).getAll('brand')).toEqual(['1']);
      expect(query(page).get('onlyAvailable')).toBe('true');
      await expect(inStockOnly(page)).toBeChecked();
      await expect(cardNames(page).filter({ hasText: new RegExp(`^${WANDERER}$`) })).toHaveCount(0);
      await expect(inStockOnly(page)).toBeInViewport();
      await demo.highlight(inStockOnlyLabel(page), '"In stock only" still checked after reload');
      await demo.highlight(page.locator('.catalog-items'), 'nine in-stock Daybird cards after reload');
    });
  });
});

test('TC-STOCK-1-16 checking the box on page 12 returns to page 1', async ({ page, demo }) => {
  await test.step('open /?page=12', async () => {
    await openCatalog(page, '/?page=12', 2);
    await expect(currentPage(page)).toHaveText('12');
  });
  await test.step('check "In stock only"', async () => {
    await checkInStockOnly(page);
  });
  await test.step('no page parameter, page 1 is current, first card is Adventurer GPS Watch', async () => {
    expect(query(page).get('onlyAvailable')).toBe('true');
    expect(query(page).has('page')).toBe(false);
    await expect(currentPage(page)).toHaveText('1');
    await demo.highlight(currentPage(page), 'page 1 is the current page');
    await expect(cardNames(page).first()).toHaveText('Adventurer GPS Watch');
    await demo.highlight(cards(page).first(), 'first card: Adventurer GPS Watch');
  });
});

test('TC-STOCK-1-17 the card of product 1 shows "Out of stock"', async ({ page, demo }) => {
  await test.step('open /?brand=1&page=2', async () => {
    await openCatalog(page, '/?brand=1&page=2', 1);
  });
  await test.step('box unchecked, one card Wanderer Black Hiking Boots labeled "Out of stock"', async () => {
    await expect(inStockOnly(page)).not.toBeChecked();
    await expect(cardNames(page)).toHaveText([WANDERER]);
    const label = cards(page).first().getByText(OUT_OF_STOCK, { exact: true });
    await expect(label).toBeVisible();
    await expect(label).toHaveText(OUT_OF_STOCK);
    await demo.highlight(label, '"Out of stock" on the Wanderer Black Hiking Boots card');
  });
});

test.describe(() => {
  test.use({ viewport: FULL_CATALOG_VIEWPORT });

  test('TC-STOCK-1-18 in-stock cards show no "Out of stock" label', async ({ page, demo }) => {
    await test.step('open /?brand=1', async () => {
      await openCatalog(page, '/?brand=1', 9);
    });
    await test.step('nine cards, none labeled "Out of stock"', async () => {
      await expect(cards(page)).toHaveCount(9);
      await expect(cards(page).filter({ hasText: OUT_OF_STOCK })).toHaveCount(0);
      await expect(page.locator('.catalog-items').getByText(OUT_OF_STOCK)).toHaveCount(0);
      // All nine cards, top row included, are in the frame.
      await expect(cards(page).first()).toBeInViewport();
      await expect(cards(page).last()).toBeInViewport();
      await demo.absent(page.locator('.catalog-items'), 'no "Out of stock" label on the nine in-stock Daybird cards');
    });
  });
});

test('TC-STOCK-1-19 the product page of product 1 shows "Out of stock"', async ({ page, demo }) => {
  await test.step('sign in as alice', async () => {
    await signInAsAlice(page, demo);
  });
  await test.step('open /item/1', async () => {
    await page.goto(`${BASE_URL}/item/1`);
  });
  await test.step('heading Wanderer Black Hiking Boots and a visible "Out of stock" label', async () => {
    const heading = page.getByRole('heading', { name: WANDERER, exact: true });
    await expect(heading).toBeVisible();
    const label = page.locator('.item-buy').getByText(OUT_OF_STOCK, { exact: true });
    await expect(label).toBeVisible();
    await expect(label).toHaveText(OUT_OF_STOCK);
    await demo.highlight(label, '"Out of stock" on the Wanderer Black Hiking Boots page');
  });
});

test('TC-STOCK-1-20 "Add to shopping bag" is disabled for product 1', async ({ page, demo }) => {
  await test.step('sign in as alice (empty basket)', async () => {
    await signInAsAlice(page, demo);
    await expect(page.locator('.cart-button-count')).toHaveCount(0);
  });
  const button = page.getByRole('button', { name: 'Add to shopping bag' });
  await test.step('open /item/1', async () => {
    await page.goto(`${BASE_URL}/item/1`);
    await expect(page.getByRole('heading', { name: WANDERER, exact: true })).toBeVisible();
  });
  await test.step('the button has the disabled attribute', async () => {
    await expect(button).toHaveAttribute('disabled', '');
    await expect(button).toBeDisabled();
    await demo.highlight(button, '"Add to shopping bag" disabled for an out-of-stock product');
  });
  await test.step('attempt to click it with force: true', async () => {
    await button.click({ force: true });
  });
  await test.step('the cart link shows no item count', async () => {
    await expect(page.locator('.cart-button-count')).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('heading', { name: WANDERER, exact: true })).toBeVisible();
    await expect(page.locator('.cart-button-count')).toHaveCount(0);
    await demo.absent(page.getByLabel('Shopping bag', { exact: true }), 'no item count on the header shopping bag link');
  });
});

test('TC-STOCK-1-21 an in-stock product page has no label and the button adds to the bag', async ({ page, demo }) => {
  await test.step('sign in as alice (empty basket)', async () => {
    await signInAsAlice(page, demo);
    await expect(page.locator('.cart-button-count')).toHaveCount(0);
  });
  const button = page.getByRole('button', { name: 'Add to shopping bag' });
  await test.step('open /item/3', async () => {
    await page.goto(`${BASE_URL}/item/3`);
    await expect(page.getByRole('heading', { name: 'Alpine Fusion Goggles', exact: true })).toBeVisible();
    await expect(page.getByText(OUT_OF_STOCK, { exact: true })).toHaveCount(0);
    await expect(button).not.toHaveAttribute('disabled');
    await expect(button).toBeEnabled();
    await demo.highlight(button, '"Add to shopping bag" enabled, no "Out of stock" label');
  });
  await test.step('click "Add to shopping bag"', async () => {
    await button.click();
  });
  await test.step('the cart link counts 1 item', async () => {
    const count = page.locator('.cart-button-count');
    await expect(count).toHaveText('1');
    await demo.highlight(count, 'shopping bag count is 1');
  });
});

test('TC-STOCK-1-22 pager link 2 keeps onlyAvailable=true and the box checked', async ({ page, demo }) => {
  await test.step('open /', async () => {
    await openCatalog(page, '/', 9);
  });
  await test.step('check "In stock only" and wait for onlyAvailable=true in the URL', async () => {
    await checkInStockOnly(page);
  });
  await test.step('click pager link 2', async () => {
    const link = pager(page).getByRole('link', { name: '2', exact: true });
    await demo.highlight(link, 'pager link 2');
    await link.click();
    await page.waitForURL(/[?&]page=2/);
    // Enhanced navigation changes the URL before it patches the page: wait for the new page's state.
    await expect(currentPage(page)).toHaveText('2');
  });
  await test.step('page 2 of 11 with the filter still on', async () => {
    expect(query(page).get('onlyAvailable')).toBe('true');
    expect(query(page).get('page')).toBe('2');
    await expect(inStockOnly(page)).toBeChecked();
    await expect(currentPage(page)).toHaveText('2');
    await expect(highestPage(page)).toHaveText('11');
    await expect(cards(page)).toHaveCount(9);
    await expect(cardNames(page).first()).toHaveText('Ascend XT Trail Running Shoes');
    await demo.highlight(pager(page), 'page 2 current, highest page 11');
    await demo.highlight(inStockOnlyLabel(page), '"In stock only" still checked on page 2');
    await demo.highlight(cards(page).first(), 'first card: Ascend XT Trail Running Shoes');
  });
});

test('TC-STOCK-1-23 type then brand links keep the filter and all three apply', async ({ page, demo }) => {
  await test.step('open /', async () => {
    await openCatalog(page, '/', 9);
  });
  await test.step('check "In stock only" and wait for onlyAvailable=true in the URL', async () => {
    await checkInStockOnly(page);
  });
  await test.step('click the Footwear tag in the Type group', async () => {
    const footwear = filterTag(page, 'Type', 'Footwear');
    await demo.highlight(footwear, 'Type: Footwear');
    await footwear.click();
    await page.waitForURL(/[?&]type=1(&|$)/);
    // Enhanced navigation changes the URL before it patches the page: wait for the new page's state.
    await expect(footwear).toHaveClass(/\bactive\b/);
    await expect(page.locator('.catalog-count')).toHaveText('12 products');
    expect(query(page).get('onlyAvailable')).toBe('true');
    expect(query(page).getAll('type')).toEqual(['1']);
    await expect(inStockOnly(page)).toBeChecked();
    await demo.highlight(inStockOnlyLabel(page), '"In stock only" still checked with type Footwear');
  });
  await test.step('click the Daybird tag in the Brand group', async () => {
    const daybird = filterTag(page, 'Brand', 'Daybird');
    await demo.highlight(daybird, 'Brand: Daybird');
    await daybird.click();
    await page.waitForURL(/[?&]brand=1(&|$)/);
    await expect(daybird).toHaveClass(/\bactive\b/);
    await expect(page.locator('.catalog-count')).toHaveText('1 product');
  });
  await test.step('onlyAvailable, type and brand all apply: only Explorer Frost Boots', async () => {
    expect(query(page).get('onlyAvailable')).toBe('true');
    expect(query(page).getAll('type')).toEqual(['1']);
    expect(query(page).getAll('brand')).toEqual(['1']);
    await expect(inStockOnly(page)).toBeChecked();
    await expect(cards(page)).toHaveCount(1);
    await expect(cardNames(page)).toHaveText(['Explorer Frost Boots']);
    await expect(cardNames(page).filter({ hasText: new RegExp(`^${WANDERER}$`) })).toHaveCount(0);
    await demo.highlight(cards(page).first(), 'only Explorer Frost Boots: in stock, Footwear, Daybird');
    await demo.highlight(inStockOnlyLabel(page), '"In stock only" checked with type and brand');
  });
});
