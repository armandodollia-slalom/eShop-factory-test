import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { test, expect, createDemo, type Demo } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// INSTK-1: "In stock only" on the catalog and `inStock` on GET /api/catalog/items (version 2.0).
// Scenario `instk-1` (.factory/stack/scenarios/instk-1): the demo catalog (101 items) with items 53, 92, 13, 5, 32,
// 26, 4, 8, 9, 10, 19 at AvailableStock 0, item 71 at 1 and every other item at 100: 90 in stock.
// Scenario `instk-1-brand-paging` (TC-INSTK-1-18 only) also sets item 70 GripTrek Hiking Poles to 0.
// The UI cases hold each highlighted state on video for two seconds, so they need more than the default 30 s.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const CATALOG = () => url('catalog');
const items = (query: string) => `${CATALOG()}/api/catalog/items?${query}`;

type Item = { id: number; name: string; availableStock: number; catalogBrandId: number; catalogTypeId: number };
type Page_ = { pageIndex: number; pageSize: number; count: number; data: Item[] };

const OUT_OF_STOCK_IDS = [53, 92, 13, 5, 32, 26, 4, 8, 9, 10, 19];
const OUT_OF_STOCK_NAMES = [
  'Raven Swift Snowboard',
  'Blizzard Snowboard',
  'Trailblaze hiking backpack',
  'Blizzard Rider Snowboard',
  'Cosmic Purple Snowboard',
  'Gravity Beam Climbing Rope',
  'Expedition Backpack',
  'Frostbite Insulated Jacket',
  'VenturePro GPS Watch',
  'Trailblazer Bike Helmet',
  'EcoTrail Running Shoes',
];

async function getPage(request: APIRequestContext, query: string): Promise<Page_> {
  const response = await test.step(`GET /api/catalog/items?${query}`, () => request.get(items(query)));
  expect(response.status()).toBe(200);
  return response.json();
}

// ---------------------------------------------------------------- Catalog API (functional cases, run on the stack)

test.describe('Catalog API', () => {
  test.beforeAll(() => {
    loadScenario('instk-1');
  });

  test('TC-INSTK-1-01 v2 items list with inStock=true returns only in-stock items and counts only them', async ({ request }) => {
    const body = await getPage(request, 'api-version=2.0&inStock=true&PageSize=100&PageIndex=0');
    expect(body.count).toBe(90);
    expect(body.pageIndex).toBe(0);
    expect(body.pageSize).toBe(100);
    expect(body.data).toHaveLength(90);
    expect(body.data.filter((i) => i.availableStock === 0)).toEqual([]);
    expect(body.data.filter((i) => OUT_OF_STOCK_IDS.includes(i.id)).map((i) => i.id)).toEqual([]);
    expect(body.data.every((i) => i.availableStock > 0)).toBe(true);
  });

  test('TC-INSTK-1-02 stock boundary: 1 unit is listed, 0 units is not', async ({ request }) => {
    const body = await getPage(request, 'api-version=2.0&inStock=true&brand=1&PageSize=20&PageIndex=0');
    expect(body.count).toBe(7);
    expect(body.data.map((i) => i.id).sort((a, b) => a - b)).toEqual([1, 25, 39, 49, 62, 71, 85]);
    const boundary = body.data.find((i) => i.id === 71);
    expect(boundary?.availableStock).toBe(1);
    for (const id of [13, 53, 92]) expect(body.data.some((i) => i.id === id)).toBe(false);
  });

  test('TC-INSTK-1-03 inStock=true filters before paging (type filter, second page)', async ({ request }) => {
    const body = await getPage(request, 'api-version=2.0&inStock=true&type=3&PageSize=9&PageIndex=1');
    expect(body.count).toBe(14);
    expect(body.pageIndex).toBe(1);
    expect(body.pageSize).toBe(9);
    expect(body.data).toHaveLength(5);
    expect(body.data.map((i) => i.id).sort((a, b) => a - b)).toEqual([12, 22, 30, 60, 62]);
    expect(body.data.map((i) => i.name).sort()).toEqual([
      'Powder Pro Snowboard',
      'Shadow Black Snowboard',
      'SummitRider Snowboard Boots',
      'Venture 2022 Snowboard',
      'Zero Gravity Ski Goggles',
    ]);
    for (const id of [53, 92, 5, 32]) expect(body.data.some((i) => i.id === id)).toBe(false);
  });

  test('TC-INSTK-1-04 inStock=true combines with brand and type filters', async ({ request }) => {
    const body = await getPage(request, 'api-version=2.0&inStock=true&brand=1&type=3&PageSize=10&PageIndex=0');
    expect(body.count).toBe(2);
    expect(body.data.map((i) => i.id).sort((a, b) => a - b)).toEqual([39, 62]);
    expect(body.data.map((i) => i.name).sort()).toEqual(['Midnight Blue Goggles', 'Shadow Black Snowboard']);
    expect(body.data.every((i) => i.catalogBrandId === 1 && i.catalogTypeId === 3)).toBe(true);
  });

  test('TC-INSTK-1-05 v2 items list without inStock is unchanged', async ({ request }) => {
    const body = await getPage(request, 'api-version=2.0&PageSize=101&PageIndex=0');
    expect(body.count).toBe(101);
    expect(body.data).toHaveLength(101);
    for (const id of OUT_OF_STOCK_IDS) {
      expect(body.data.find((i) => i.id === id)?.availableStock, `item ${id}`).toBe(0);
    }
    // PostgreSQL orders "Trailblazer Trail..." before "Trailblaze Steel...": its collation ignores spaces.
    const byName = new Intl.Collator('en', { ignorePunctuation: true });
    const names = body.data.map((i) => i.name);
    expect(names).toEqual([...names].sort(byName.compare));
  });

  test('TC-INSTK-1-06 v2 items list with inStock=false lists every item', async ({ request }) => {
    const body = await getPage(request, 'api-version=2.0&inStock=false&PageSize=101&PageIndex=0');
    expect(body.count).toBe(101);
    expect(body.data).toHaveLength(101);
    for (const id of [...OUT_OF_STOCK_IDS, 71]) expect(body.data.some((i) => i.id === id), `item ${id}`).toBe(true);
  });

  test('TC-INSTK-1-07 v1 items list ignores inStock', async ({ request }) => {
    const body = await getPage(request, 'api-version=1.0&inStock=true&PageSize=101&PageIndex=0');
    expect(body.count).toBe(101);
    expect(body.data).toHaveLength(101);
    for (const id of OUT_OF_STOCK_IDS) expect(body.data.some((i) => i.id === id), `item ${id}`).toBe(true);
  });

  test('TC-INSTK-1-08 OpenAPI v2 document describes inStock; v1 document does not', async ({ request }) => {
    type Param = { name: string; in: string; required?: boolean; schema?: { type?: unknown } };
    const parameters = async (version: number): Promise<Param[]> => {
      const response = await test.step(`GET /openapi/v${version}.json`, () => request.get(`${CATALOG()}/openapi/v${version}.json`));
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      const document = await response.json();
      expect(typeof document.openapi).toBe('string');
      return document.paths['/api/catalog/items'].get.parameters;
    };

    const v2 = await parameters(2);
    const inStock = v2.filter((p) => p.name === 'inStock');
    expect(inStock).toHaveLength(1);
    expect(inStock[0].in).toBe('query');
    expect(inStock[0].required ?? false).toBe(false);
    expect(inStock[0].schema?.type).toBe('boolean');

    const v1 = await parameters(1);
    expect(v1.map((p) => p.name)).not.toContain('inStock');
  });
});

// ---------------------------------------------------------------- WebApp catalog (e2e cases)

const group = (page: Page, heading: string) =>
  page.locator('.catalog-search-group').filter({ has: page.getByRole('heading', { name: heading, exact: true }) });
const tag = (page: Page, heading: string, label: string) =>
  group(page, heading).locator('.catalog-search-tag').filter({ has: page.getByText(label, { exact: true }) });
const inStockTag = (page: Page) => tag(page, 'Availability', 'In stock only');
const count = (page: Page) => page.locator('.catalog-count');
const pager = (page: Page) => page.locator('nav.catalog-pagination');
const pageNumbers = (page: Page) => pager(page).locator('.page-number');
const cards = (page: Page) => page.locator('.catalog-items .catalog-item');
const cardNames = (page: Page) => cards(page).locator('.catalog-product-content .name');
const filterCount = (page: Page) => page.locator('.catalog-search-title-count');
const clearLink = (page: Page) => page.locator('a.catalog-search-clear');
const query = (page: Page) => new URL(page.url()).searchParams;

async function open(page: Page, demo: Demo, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await expect(page.locator('.catalog-search')).toBeVisible();
  await demo.caption(`Opened ${page.url()}`);
}

async function expectActive(locator: Locator, active: boolean) {
  if (active) await expect(locator).toHaveClass(/(^|\s)active(\s|$)/);
  else await expect(locator).not.toHaveClass(/(^|\s)active(\s|$)/);
}

async function expectLastPage(page: Page, last: number) {
  await expect(pageNumbers(page).last()).toHaveText(String(last));
}

async function expectNoOutOfStockCard(page: Page) {
  await expect(cards(page).first()).toBeVisible();
  const names = await cardNames(page).allTextContents();
  expect(names.filter((n) => OUT_OF_STOCK_NAMES.includes(n.trim()))).toEqual([]);
}

test.describe('WebApp catalog', () => {
  test.beforeAll(() => {
    loadScenario('instk-1');
  });

  test('TC-INSTK-1-09 catalog shows an "In stock only" option, off by default', async ({ page, demo }) => {
    await test.step('Open / with no query string', () => open(page, demo, '/'));

    await test.step('Brand, Type and "In stock only" in the same filter panel', async () => {
      const body = page.locator('.catalog-search-body');
      await expect(body.getByRole('heading', { name: 'Brand', exact: true })).toBeVisible();
      await expect(body.getByRole('heading', { name: 'Type', exact: true })).toBeVisible();
      await expect(body.locator('.catalog-search-tag').filter({ hasText: 'In stock only' })).toHaveCount(1);
      await expect(inStockTag(page)).toBeVisible();
      await demo.highlight(inStockTag(page), '"In stock only" next to Brand and Type, off');
    });

    await test.step('"In stock only" is off and the address bar has no inStock', async () => {
      await expectActive(inStockTag(page), false);
      expect(query(page).has('inStock')).toBe(false);
    });

    await test.step('101 products on 12 pages', async () => {
      await expect(count(page)).toHaveText('101 products');
      await demo.highlight(count(page), '101 products');
      await expectLastPage(page, 12);
      await demo.highlight(pageNumbers(page).last(), 'last page 12');
    });

    await test.step('No active-filter count and no "Clear all filters"', async () => {
      await expect(filterCount(page)).toHaveCount(0);
      await expect(clearLink(page)).toHaveCount(0);
      await demo.absent(page.locator('.catalog-search-summary'), 'no filter count, no Clear all filters');
    });
  });

  test('TC-INSTK-1-10 turning "In stock only" on lists only in-stock products and recounts products and pages', async ({ page, demo }) => {
    // Ten pages, each checked and shown on video.
    test.setTimeout(120_000);
    await open(page, demo, '/');
    await expect(count(page)).toHaveText('101 products');

    await test.step('Click "In stock only"', async () => {
      await inStockTag(page).click();
      await expect(page).toHaveURL(/[?&]inStock=true(&|$)/);
      await demo.caption(`Now at ${page.url()}`);
    });

    await test.step('90 products on 10 pages', async () => {
      expect(query(page).get('inStock')).toBe('true');
      await expect(count(page)).toHaveText('90 products');
      await demo.highlight(count(page), '90 products');
      await expectLastPage(page, 10);
      await demo.highlight(pageNumbers(page).last(), 'last page 10');
    });

    await test.step('"In stock only" active and the filter count reads 1', async () => {
      await expectActive(inStockTag(page), true);
      await expect(filterCount(page)).toHaveText('1');
      await demo.highlight(inStockTag(page), '"In stock only" on');
      await demo.highlight(filterCount(page), 'active filters: 1');
    });

    for (let n = 1; n <= 10; n++) {
      await test.step(`Page ${n}: no out-of-stock product`, async () => {
        if (n > 1) {
          await pager(page).getByRole('link', { name: 'Next page' }).click();
          await expect(pager(page).locator('[aria-current="page"]')).toHaveText(String(n));
        }
        expect(query(page).get('inStock')).toBe('true');
        await expect(count(page)).toHaveText('90 products');
        await expectNoOutOfStockCard(page);
        await demo.caption(`Page ${n} of 10 at ${page.url()}`);
        await demo.highlight(page.locator('.catalog-items'), `page ${n}: no out-of-stock product`, 800);
      });
    }
  });

  test('TC-INSTK-1-11 a reload or a shared link with inStock=true shows the same filtered list', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const demo = createDemo(page);

    const expectFiltered = async (when: string) => {
      await expect(count(page)).toHaveText('90 products');
      expect(query(page).get('inStock')).toBe('true');
      await expectActive(inStockTag(page), true);
      await expectLastPage(page, 10);
      await demo.caption(`${when}: ${page.url()}`);
      await demo.highlight(inStockTag(page), `${when}: "In stock only" on`);
      await demo.highlight(count(page), `${when}: 90 products`);
      await demo.highlight(pageNumbers(page).last(), `${when}: last page 10`);
    };

    await test.step('In a new context, open /?inStock=true', async () => {
      expect(await context.cookies()).toEqual([]);
      await page.goto(`${BASE_URL}/?inStock=true`);
      await expectFiltered('Shared link');
    });

    await test.step('Reload the page', async () => {
      await page.reload();
      await expectFiltered('After reload');
      await expectNoOutOfStockCard(page);
      await demo.highlight(page.locator('.catalog-items'), 'after reload: no out-of-stock product');
    });

    await demo.dispose();
    await context.close();
  });

  test('TC-INSTK-1-12 "In stock only" with a brand and a type applies all three', async ({ page, demo }) => {
    await open(page, demo, '/');

    await test.step('Click the "Daybird" brand tag', async () => {
      await tag(page, 'Brand', 'Daybird').click();
      await expect(page).toHaveURL(/[?&]brand=1(&|$)/);
    });
    await test.step('Click the "Ski/boarding" type tag', async () => {
      await tag(page, 'Type', 'Ski/boarding').click();
      await expect(page).toHaveURL(/[?&]type=3(&|$)/);
    });
    await test.step('Click "In stock only"', async () => {
      await inStockTag(page).click();
      await expect(page).toHaveURL(/[?&]inStock=true(&|$)/);
      await demo.caption(`Now at ${page.url()}`);
    });

    await test.step('The address bar keeps brand, type and inStock', async () => {
      const q = query(page);
      expect(q.getAll('brand')).toEqual(['1']);
      expect(q.getAll('type')).toEqual(['3']);
      expect(q.get('inStock')).toBe('true');
    });

    await test.step('2 products, no pager, exactly the two in-stock cards', async () => {
      await expect(count(page)).toHaveText('2 products');
      await demo.highlight(count(page), '2 products');
      await expect(cardNames(page)).toHaveText(['Midnight Blue Goggles', 'Shadow Black Snowboard']);
      const names = await cardNames(page).allTextContents();
      expect(names).not.toContain('Raven Swift Snowboard');
      expect(names).not.toContain('Blizzard Snowboard');
      await demo.highlight(page.locator('.catalog-items'), 'Midnight Blue Goggles, Shadow Black Snowboard only');
      await expect(pager(page)).toHaveCount(0);
      await demo.absent(page.locator('.catalog-items'), 'no pager below the 2 cards');
    });

    await test.step('Daybird, Ski/boarding and "In stock only" active; filter count 3', async () => {
      await expectActive(tag(page, 'Brand', 'Daybird'), true);
      await expectActive(tag(page, 'Type', 'Ski/boarding'), true);
      await expectActive(inStockTag(page), true);
      await expect(filterCount(page)).toHaveText('3');
      await demo.highlight(tag(page, 'Brand', 'Daybird'), 'Daybird on');
      await demo.highlight(tag(page, 'Type', 'Ski/boarding'), 'Ski/boarding on');
      await demo.highlight(inStockTag(page), '"In stock only" on');
      await demo.highlight(filterCount(page), 'active filters: 3');
    });
  });

  test('TC-INSTK-1-13 paging keeps the type and "In stock only" filters', async ({ page, demo }) => {
    await open(page, demo, '/?type=3&inStock=true');
    await expect(count(page)).toHaveText('14 products');

    await test.step('Click page number 2 in the pager', async () => {
      await demo.highlight(pageNumbers(page).filter({ hasText: /^2$/ }), 'page 2');
      await pageNumbers(page).filter({ hasText: /^2$/ }).click();
      await expect(page).toHaveURL(/[?&]page=2(&|$)/);
      await demo.caption(`Now at ${page.url()}`);
    });

    await test.step('The address bar keeps type, inStock and page=2', async () => {
      const q = query(page);
      expect(q.getAll('type')).toEqual(['3']);
      expect(q.get('inStock')).toBe('true');
      expect(q.get('page')).toBe('2');
    });

    await test.step('14 products, 2 pages, page 2 current', async () => {
      await expect(count(page)).toHaveText('14 products');
      await expect(pageNumbers(page)).toHaveText(['1', '2']);
      await expect(pager(page).locator('[aria-current="page"]')).toHaveText('2');
      await demo.highlight(count(page), '14 products');
      await demo.highlight(pager(page), '2 pages, page 2 current');
    });

    await test.step('Exactly the 5 in-stock Ski/boarding products of page 2', async () => {
      await expect(cardNames(page)).toHaveText([
        'Powder Pro Snowboard',
        'Shadow Black Snowboard',
        'SummitRider Snowboard Boots',
        'Venture 2022 Snowboard',
        'Zero Gravity Ski Goggles',
      ]);
      const names = await cardNames(page).allTextContents();
      for (const gone of ['Raven Swift Snowboard', 'Blizzard Snowboard', 'Blizzard Rider Snowboard', 'Cosmic Purple Snowboard']) {
        expect(names).not.toContain(gone);
      }
      await demo.highlight(page.locator('.catalog-items'), '5 cards, no out-of-stock snowboard');
    });

    await test.step('Ski/boarding and "In stock only" still active', async () => {
      await expectActive(tag(page, 'Type', 'Ski/boarding'), true);
      await expectActive(inStockTag(page), true);
      await demo.highlight(tag(page, 'Type', 'Ski/boarding'), 'Ski/boarding on');
      await demo.highlight(inStockTag(page), '"In stock only" on');
    });
  });

  test('TC-INSTK-1-14 sort order applies together with "In stock only" and survives paging', async ({ page, demo }) => {
    await open(page, demo, '/?type=3&inStock=true');
    const sortValue = page.locator('[data-catalog-sort-value]');
    await expect(sortValue).toHaveText('Name: A to Z');

    await test.step('Choose "Price: High to Low" in the Sort control', async () => {
      await page.locator('[data-catalog-sort-trigger]').click();
      await page.getByRole('option', { name: 'Price: High to Low', exact: true }).click();
      await expect(sortValue).toHaveText('Price: High to Low');
    });

    await test.step('14 products; page 1 ordered by price, high to low', async () => {
      await expect(count(page)).toHaveText('14 products');
      await expect
        .poll(async () => (await cardNames(page).allTextContents()).slice(2))
        .toEqual([
          'Glacier Frost Snowboard',
          'Blizzard Freestyle Snowboard',
          'Omni-Snow Dual Snowboard',
          'Maverick Pro Ski Goggles',
          'Midnight Blue Goggles',
          'Expedition 2022 Goggles',
          'Alpine Fusion Goggles',
        ]);
      const names = await cardNames(page).allTextContents();
      expect(names).toHaveLength(9);
      expect(names.slice(0, 2).sort()).toEqual(['Gravity 5000 All-Mountain Skis', 'GravityZone All-Mountain Skis']);
      expect(names).not.toContain('Cosmic Purple Snowboard');
      await demo.highlight(sortValue, 'Price: High to Low');
      await demo.highlight(cards(page).first(), '699.00 first');
      await demo.highlight(cards(page).last(), 'Alpine Fusion Goggles 79.99 last');
    });

    await test.step('Click page number 2 in the pager', async () => {
      await pageNumbers(page).filter({ hasText: /^2$/ }).click();
      await expect(page).toHaveURL(/[?&]page=2(&|$)/);
      await demo.caption(`Now at ${page.url()}`);
    });

    await test.step('Page 2 keeps type, inStock and the sort, ordered by price', async () => {
      const q = query(page);
      expect(q.getAll('type')).toEqual(['3']);
      expect(q.get('inStock')).toBe('true');
      expect(q.get('page')).toBe('2');
      await expect(sortValue).toHaveText('Price: High to Low');
      await expect
        .poll(() => cardNames(page).allTextContents())
        .toEqual([
          'Venture 2022 Snowboard',
          'Powder Pro Snowboard',
          'Shadow Black Snowboard',
          'SummitRider Snowboard Boots',
          'Zero Gravity Ski Goggles',
        ]);
      await demo.highlight(sortValue, 'page 2: still Price: High to Low');
      await demo.highlight(page.locator('.catalog-items'), '499.00 down to 79.99');
    });
  });

  test('TC-INSTK-1-15 "Clear all filters" in the filter panel turns "In stock only" off', async ({ page, demo }) => {
    await open(page, demo, '/?brand=1&type=3&inStock=true');
    await expect(count(page)).toHaveText('2 products');

    await test.step('Click "Clear all filters" in the filter panel', async () => {
      await demo.highlight(clearLink(page), 'Clear all filters');
      await clearLink(page).click();
      await expect(page).not.toHaveURL(/inStock=/);
      await demo.caption(`Now at ${page.url()}`);
    });

    await test.step('No brand, type or inStock in the address bar', async () => {
      const q = query(page);
      expect(q.has('brand')).toBe(false);
      expect(q.has('type')).toBe(false);
      expect(q.has('inStock')).toBe(false);
    });

    await test.step('101 products on 12 pages', async () => {
      await expect(count(page)).toHaveText('101 products');
      await expectLastPage(page, 12);
      await demo.highlight(count(page), '101 products');
      await demo.highlight(pageNumbers(page).last(), 'last page 12');
    });

    await test.step('No filter active, no filter count, no "Clear all filters"', async () => {
      await expectActive(inStockTag(page), false);
      await expectActive(tag(page, 'Brand', 'Daybird'), false);
      await expectActive(tag(page, 'Type', 'Ski/boarding'), false);
      await expect(filterCount(page)).toHaveCount(0);
      await expect(clearLink(page)).toHaveCount(0);
      await demo.absent(page.locator('.catalog-search-summary'), 'no filter count, no Clear all filters');
      await demo.highlight(tag(page, 'Brand', 'Daybird'), 'Daybird off');
      await demo.highlight(tag(page, 'Type', 'Ski/boarding'), 'Ski/boarding off');
      await demo.highlight(inStockTag(page), '"In stock only" off');
    });
  });

  test('TC-INSTK-1-16 "Clear all filters" in the empty state turns "In stock only" off', async ({ page, demo }) => {
    await open(page, demo, '/?brand=1&type=4&inStock=true');
    const empty = page.locator('.catalog-empty');

    await test.step('The empty state "No products match these filters" is shown', async () => {
      await expect(empty.getByRole('heading', { name: 'No products match these filters' })).toBeVisible();
      await expect(cards(page)).toHaveCount(0);
      await expect(page.getByText('Trailblaze hiking backpack', { exact: true })).toHaveCount(0);
      await demo.highlight(empty, 'No products match these filters');
    });

    await test.step('Click "Clear all filters" in the empty state', async () => {
      await empty.getByRole('link', { name: 'Clear all filters' }).click();
      await expect(page).not.toHaveURL(/inStock=/);
      await demo.caption(`Now at ${page.url()}`);
    });

    await test.step('No brand, type or inStock; 101 products; "In stock only" off', async () => {
      const q = query(page);
      expect(q.has('brand')).toBe(false);
      expect(q.has('type')).toBe(false);
      expect(q.has('inStock')).toBe(false);
      await expect(count(page)).toHaveText('101 products');
      await expectActive(inStockTag(page), false);
      await demo.highlight(count(page), '101 products');
      await demo.highlight(inStockTag(page), '"In stock only" off');
    });
  });

  test('TC-INSTK-1-17 turning "In stock only" off again lists every product', async ({ page, demo }) => {
    await open(page, demo, '/?brand=1&inStock=true');
    await expect(count(page)).toHaveText('7 products');

    await test.step('Click "In stock only"', async () => {
      await inStockTag(page).click();
      await expect(page).not.toHaveURL(/inStock=/);
      await demo.caption(`Now at ${page.url()}`);
    });

    await test.step('No inStock, brand=1 kept', async () => {
      const q = query(page);
      expect(q.has('inStock')).toBe(false);
      expect(q.getAll('brand')).toEqual(['1']);
    });

    await test.step('"In stock only" off, Daybird on, filter count 1', async () => {
      await expectActive(inStockTag(page), false);
      await expectActive(tag(page, 'Brand', 'Daybird'), true);
      await expect(filterCount(page)).toHaveText('1');
      await demo.highlight(inStockTag(page), '"In stock only" off');
      await demo.highlight(tag(page, 'Brand', 'Daybird'), 'Daybird still on');
      await demo.highlight(filterCount(page), 'active filters: 1');
    });

    await test.step('10 products, out-of-stock Daybird products listed across the pages', async () => {
      await expect(count(page)).toHaveText('10 products');
      await demo.highlight(count(page), '10 products');
      const listed: string[] = [];
      const outOfStock = ['Trailblaze hiking backpack', 'Raven Swift Snowboard', 'Blizzard Snowboard'];
      for (let n = 1; n <= 2; n++) {
        if (n > 1) {
          await pageNumbers(page).filter({ hasText: /^2$/ }).click();
          await expect(pager(page).locator('[aria-current="page"]')).toHaveText('2');
          await demo.caption(`Page 2 at ${page.url()}`);
        }
        await expect(cards(page).first()).toBeVisible();
        listed.push(...(await cardNames(page).allTextContents()).map((s) => s.trim()));
        for (const name of outOfStock) {
          const card = cards(page).filter({ has: page.getByText(name, { exact: true }) });
          if (await card.count()) await demo.highlight(card, `${name} (out of stock) listed`);
        }
      }
      expect(listed).toHaveLength(10);
      for (const name of outOfStock) expect(listed).toContain(name);
    });
  });
});

test.describe('WebApp catalog, WildRunner paging', () => {
  test.beforeAll(() => {
    loadScenario('instk-1-brand-paging');
  });

  test('TC-INSTK-1-18 paging keeps the brand and "In stock only" filters', async ({ page, demo }) => {
    await open(page, demo, '/');

    await test.step('Click the "WildRunner" brand tag', async () => {
      await tag(page, 'Brand', 'WildRunner').click();
      await expect(page).toHaveURL(/[?&]brand=3(&|$)/);
      await expect(count(page)).toHaveText('11 products');
    });

    await test.step('Click "In stock only"', async () => {
      await inStockTag(page).click();
      await expect(page).toHaveURL(/[?&]inStock=true(&|$)/);
      await demo.caption(`Now at ${page.url()}`);
    });

    await test.step('10 products on 2 pages, GripTrek Hiking Poles not shown', async () => {
      await expect(count(page)).toHaveText('10 products');
      await expectLastPage(page, 2);
      await expect(cardNames(page)).toHaveCount(9);
      expect(await cardNames(page).allTextContents()).not.toContain('GripTrek Hiking Poles');
      await demo.highlight(count(page), '10 products');
      await demo.highlight(pageNumbers(page).last(), 'last page 2');
      await demo.absent(page.locator('.catalog-items'), 'no GripTrek Hiking Poles on page 1');
    });

    await test.step('Click page number 2 in the pager', async () => {
      await pageNumbers(page).filter({ hasText: /^2$/ }).click();
      await expect(page).toHaveURL(/[?&]page=2(&|$)/);
      await demo.caption(`Now at ${page.url()}`);
    });

    await test.step('The address bar keeps brand, inStock and page=2', async () => {
      const q = query(page);
      expect(q.getAll('brand')).toEqual(['3']);
      expect(q.get('inStock')).toBe('true');
      expect(q.get('page')).toBe('2');
    });

    await test.step('10 products, 2 pages, page 2 current', async () => {
      await expect(count(page)).toHaveText('10 products');
      await expect(pageNumbers(page)).toHaveText(['1', '2']);
      await expect(pager(page).locator('[aria-current="page"]')).toHaveText('2');
      await demo.highlight(pager(page), '2 pages, page 2 current');
    });

    await test.step('Exactly one card: Vertical Journey Climbing Shoes, a WildRunner product', async () => {
      await expect(cardNames(page)).toHaveText(['Vertical Journey Climbing Shoes']);
      await expect(cards(page).locator('.catalog-product-brand')).toHaveText(['WildRunner']);
      const names = await cardNames(page).allTextContents();
      expect(names).not.toContain('Venture Grey Trail Shoes');
      expect(names).not.toContain('GripTrek Hiking Poles');
      await demo.highlight(cards(page), 'only Vertical Journey Climbing Shoes (WildRunner)');
    });

    await test.step('WildRunner and "In stock only" still active; filter count 2', async () => {
      await expectActive(tag(page, 'Brand', 'WildRunner'), true);
      await expectActive(inStockTag(page), true);
      await expect(filterCount(page)).toHaveText('2');
      await demo.highlight(tag(page, 'Brand', 'WildRunner'), 'WildRunner on');
      await demo.highlight(inStockTag(page), '"In stock only" on');
      await demo.highlight(filterCount(page), 'active filters: 2');
    });
  });
});
