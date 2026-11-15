import { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-40: the catalog's Sort control orders the whole catalog (with the active filters) across its pages, not just
// the nine cards on the current page. The WebApp passes `sort` in the URL and v2 GET /api/catalog/items sorts before
// paging. Scenario `bug-40` (.factory/stack/scenarios/bug-40): the 101 demo items of `default`; brand 2 "Gravitator"
// has 11 items, type 3 "Ski/boarding" has 18. Every UI test starts in a new browser context (empty localStorage).
// The API cases (TC-BUG-40-11 to -16) are xUnit functional tests in tests/Catalog.FunctionalTests/Bug40SortTests.cs.
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('bug-40');
});

const STORAGE_KEY = 'aw.catalog.sort.v1';
const NAME_ASC = 'Name: A to Z';
const NAME_DESC = 'Name: Z to A';
const PRICE_ASC = 'Price: Low to High';
const PRICE_DESC = 'Price: High to Low';

// ---------------------------------------------------------------- UI helpers

const cards = (page: Page) => page.locator('.catalog-items .catalog-item');
const cardNames = (page: Page) => page.locator('.catalog-items .catalog-item .catalog-product-content .name');
const cardPrices = (page: Page) => page.locator('.catalog-items .catalog-item .catalog-product-content .price');
const sortValue = (page: Page) => page.locator('.catalog-sort-value');
const sortOption = (page: Page, name: string) => page.getByRole('option', { name, exact: true, includeHidden: true });
const pageLink = (page: Page, number: string) => page.locator('.catalog-pagination').getByRole('link', { name: number, exact: true });
const nextPage = (page: Page) => page.getByRole('link', { name: 'Next page' });
// The visible current page number (.page-status, which reads "n / total", is shown only on narrow screens).
const activePage = (page: Page) => page.locator('.catalog-pagination .active-page');
const searchGroup = (page: Page, heading: string) =>
  page.locator('.catalog-search-group').filter({ has: page.getByRole('heading', { name: heading, exact: true }) });
// A filter tag reads "<label> <count>"; the label is its first span.
const filterTag = (page: Page, group: string, label: string) =>
  searchGroup(page, group).locator('.catalog-search-tag').filter({ has: page.locator('span:first-child', { hasText: new RegExp(`^${label.replace(/[/]/g, '\\/')}$`) }) });
const tagCount = (page: Page, group: string, label: string) => filterTag(page, group, label).locator('.catalog-search-tag-count');

const query = (page: Page) => new URL(page.url()).searchParams;
const search = (page: Page) => new URL(page.url()).search;
const priceOf = (text: string) => Number.parseFloat(text.replace(/[$,]/g, ''));

async function openCatalog(page: Page, queryString = '') {
  await page.goto(`${BASE_URL}/${queryString}`);
  await expect(cards(page)).toHaveCount(9);
}

async function chooseSort(page: Page, label: string) {
  await page.locator('#catalog-sort-trigger').click();
  await page.getByRole('option', { name: label, exact: true }).click();
}

async function expectCards(page: Page, expected: [string, string][]) {
  await expect(cardNames(page)).toHaveText(expected.map(([name]) => name));
  await expect(cardPrices(page)).toHaveText(expected.map(([, price]) => price));
}

// ---------------------------------------------------------------- e2e

test('TC-BUG-40-01 Price: Low to High puts the cheapest products on page 1 and continues on page 2', async ({ page, demo }) => {
  const PAGE_1: [string, string][] = [
    ['Guardian Blue Chalk Bag', '$21.99'],
    ['SummitStone Chalk Bag', '$29.99'],
    ['Gravity Waterproof Dry Bag', '$49.99'],
    ['LumenHead Headlamp', '$49.99'],
    ['Velocity Red Bike Helmet', '$54.99'],
    ['Compass Pro A-320 Professional Compass', '$59.99'],
    ['Nebula Pro Headlamp', '$59.99'],
    ['Stellar Duffle Bag', '$59.99'],
    ['Trailblazer Bike Helmet', '$59.99'],
  ];
  const PAGE_1_MAX = 59.99;

  await demo.chapter('Sort the catalog by price', 'Price: Low to High must order the whole catalog, not one page.');
  await test.step('open the catalog with no query string; 9 cards', () => openCatalog(page));
  await test.step('choose Sort: Price: Low to High', () => chooseSort(page, PRICE_ASC));
  await test.step('page 1 starts with the cheapest products of the whole catalog', async () => {
    await expect.poll(() => search(page)).toBe('?sort=price-asc');
    await expectCards(page, PAGE_1);
    const prices = (await cardPrices(page).allTextContents()).map(priceOf);
    expect(prices.every((p) => p < 79.99)).toBe(true);
    await expect(sortValue(page)).toHaveText(PRICE_ASC);
    await demo.highlight(sortValue(page), 'Price: Low to High');
    await demo.highlight(cards(page).first(), 'cheapest product: $21.99');
  });
  await test.step('click Next page; page 2 continues the price order', async () => {
    await nextPage(page).click();
    await expect.poll(() => query(page).get('page')).toBe('2');
    expect(query(page).get('sort')).toBe('price-asc');
    await expect(cardNames(page).first()).toHaveText('Excursion 20L Daypack');
    await expect(cards(page)).toHaveCount(9);
    await expect(cardPrices(page).first()).toHaveText('$64.99');
    const prices = (await cardPrices(page).allTextContents()).map(priceOf);
    expect(prices).toHaveLength(9);
    expect(prices.every((p) => p >= PAGE_1_MAX)).toBe(true);
    await expect(sortValue(page)).toHaveText(PRICE_ASC);
    await demo.highlight(cards(page).first(), 'page 2 starts at $64.99');
  });
});

test('TC-BUG-40-02 Price: High to Low orders the whole catalog from the most expensive product', async ({ page, demo }) => {
  const PAGE_1: [string, string][] = [
    ['Gravity 5000 All-Mountain Skis', '$699.00'],
    ['GravityZone All-Mountain Skis', '$699.00'],
    ['Venture 2022 Snowboard', '$499.00'],
    ['Blizzard Snowboard', '$449.99'],
    ['Cosmic Purple Snowboard', '$419.99'],
    ['Glacier Frost Snowboard', '$419.99'],
    ['Powder Pro Snowboard', '$399.00'],
    ['Blizzard Freestyle Snowboard', '$379.00'],
    ['Shadow Black Snowboard', '$379.00'],
  ];
  const PAGE_12: [string, string][] = [
    ['SummitStone Chalk Bag', '$29.99'],
    ['Guardian Blue Chalk Bag', '$21.99'],
  ];

  await demo.chapter('Sort by price, high to low');
  await test.step('open the catalog', () => openCatalog(page));
  await test.step('choose Sort: Price: High to Low', async () => {
    await chooseSort(page, PRICE_DESC);
    await expect.poll(() => search(page)).toBe('?sort=price-desc');
  });
  await test.step('page 1 shows the most expensive products', async () => {
    await expectCards(page, PAGE_1);
    await expect(sortValue(page)).toHaveText(PRICE_DESC);
    await demo.highlight(cards(page).first(), 'most expensive: $699.00');
  });
  await test.step('click Next page; first card is Raven Swift Snowboard', async () => {
    await nextPage(page).click();
    await expect.poll(() => query(page).get('page')).toBe('2');
    await expect(cardNames(page).first()).toHaveText('Raven Swift Snowboard');
    await expect(cardPrices(page).first()).toHaveText('$349.00');
    await expect(sortValue(page)).toHaveText(PRICE_DESC);
    await demo.highlight(cards(page).first(), 'page 2 starts at $349.00');
  });
  await test.step('open page 12; the two cheapest products end the catalog', async () => {
    await pageLink(page, '12').click();
    await expect.poll(() => query(page).get('page')).toBe('12');
    expect(query(page).get('sort')).toBe('price-desc');
    await expectCards(page, PAGE_12);
    await expect(sortValue(page)).toHaveText(PRICE_DESC);
    await demo.highlight(page.locator('.catalog-items'), 'page 12: $29.99, $21.99');
  });
});

test('TC-BUG-40-03 Name: Z to A orders the whole catalog, ending with Adventurer GPS Watch on the last page', async ({ page, demo }) => {
  const PAGE_1_FIRST_SEVEN = [
    'Zero Gravity Ski Goggles',
    'Zenith Cycling Jersey',
    'Wanderer Black Hiking Boots',
    'Vigor 2.0 Insulated Jacket',
    'Vertical Journey Climbing Shoes',
    'VenturePro GPS Watch',
    'Venture Grey Trail Shoes',
  ];
  // Their relative order depends on the database collation (see the plan's Open questions).
  const PAGE_1_LAST_TWO = ['Venture 2.0 40L Waterproof Duffel Bag', 'Venture 2022 Snowboard'];
  const PAGE_12 = ['AeroLite Cycling Helmet', 'Adventurer GPS Watch'];

  await demo.chapter('Sort by name, Z to A');
  await test.step('open the catalog', () => openCatalog(page));
  await test.step('choose Sort: Name: Z to A', async () => {
    await chooseSort(page, NAME_DESC);
    await expect.poll(() => search(page)).toBe('?sort=name-desc');
  });
  await test.step('page 1 starts with the Z names', async () => {
    await expect(cardNames(page).first()).toHaveText(PAGE_1_FIRST_SEVEN[0]);
    await expect(cards(page)).toHaveCount(9);
    const names = await cardNames(page).allTextContents();
    expect(names.slice(0, 7)).toEqual(PAGE_1_FIRST_SEVEN);
    expect([...names.slice(7)].sort()).toEqual([...PAGE_1_LAST_TWO].sort());
    await expect(sortValue(page)).toHaveText(NAME_DESC);
    await demo.highlight(cards(page).first(), 'Zero Gravity Ski Goggles first');
  });
  await test.step('open page 12; Adventurer GPS Watch ends the catalog', async () => {
    await pageLink(page, '12').click();
    await expect.poll(() => query(page).get('page')).toBe('12');
    expect(query(page).get('sort')).toBe('name-desc');
    await expect(cardNames(page)).toHaveText(PAGE_12);
    await expect(sortValue(page)).toHaveText(NAME_DESC);
    await demo.highlight(cards(page).last(), 'last: Adventurer GPS Watch');
  });
});

test('TC-BUG-40-04 Name: A to Z stays the default order with no sort in the URL', async ({ page, demo }) => {
  const DEFAULT_PAGE_1 = [
    'Adventurer GPS Watch',
    'AeroLite Cycling Helmet',
    'Alpine AlpinePack Backpack',
    'Alpine Fusion Goggles',
    'Alpine Peak Down Jacket',
    'Alpine Tech Crampons',
    'Apex Climbing Harness',
    'Apex Climbing Harness',
    'Arctic Shield Insulated Jacket',
  ];
  const HARNESS_PRICES = ['$89.99', '$99.99'];

  await demo.chapter('Back to the default order');
  await test.step('open the catalog; Name: A to Z and today\'s page 1', async () => {
    await openCatalog(page);
    await expect(sortValue(page)).toHaveText(NAME_ASC);
    await expect(cardNames(page)).toHaveText(DEFAULT_PAGE_1);
    expect([await cardPrices(page).nth(6).textContent(), await cardPrices(page).nth(7).textContent()]).toEqual(HARNESS_PRICES);
    await demo.highlight(sortValue(page), 'default: Name: A to Z');
  });
  await test.step('choose Sort: Price: Low to High', async () => {
    await chooseSort(page, PRICE_ASC);
    await expect.poll(() => search(page)).toBe('?sort=price-asc');
    await expect(cardNames(page).first()).toHaveText('Guardian Blue Chalk Bag');
  });
  await test.step('choose Sort: Name: A to Z', async () => {
    await chooseSort(page, NAME_ASC);
    await expect(page).toHaveURL(`${BASE_URL}/`);
    expect(query(page).has('sort')).toBe(false);
    expect(query(page).has('page')).toBe(false);
  });
  await test.step('the label, the selected option and page 1 are back to the default', async () => {
    await expect(sortValue(page)).toHaveText(NAME_ASC);
    await expect(sortOption(page, NAME_ASC)).toHaveAttribute('aria-selected', 'true');
    await expect(cardNames(page)).toHaveText(DEFAULT_PAGE_1);
    await demo.highlight(cards(page).first(), 'Adventurer GPS Watch first again');
  });
});

test('TC-BUG-40-05 Price sort applies to the filtered result across its pages', async ({ page, demo }) => {
  const PAGE_1: [string, string][] = [
    ['Nebula Pro Headlamp', '$59.99'],
    ['Stellar Duffle Bag', '$59.99'],
    ['Gravity Hiking Backpack', '$79.99'],
    ['Zero Gravity Ski Goggles', '$79.99'],
    ['Gravity Harness', '$89.99'],
    ['Summit Pro Harness', '$89.99'],
    ['Gravity Beam Climbing Rope', '$179.99'],
    ['Expedition 200 GPS Navigator', '$299.00'],
    ['Cosmic Purple Snowboard', '$419.99'],
  ];
  const PAGE_2: [string, string][] = [
    ['Gravity 5000 All-Mountain Skis', '$699.00'],
    ['GravityZone All-Mountain Skis', '$699.00'],
  ];
  const gravitator = () => filterTag(page, 'Brand', 'Gravitator');

  await demo.chapter('Sort a filtered catalog', 'Brand Gravitator, then Price: Low to High.');
  await test.step('open the catalog', () => openCatalog(page));
  await test.step('click the Gravitator brand filter', async () => {
    await gravitator().click();
    await expect.poll(() => query(page).getAll('brand')).toEqual(['2']);
  });
  await test.step('choose Sort: Price: Low to High', async () => {
    await chooseSort(page, PRICE_ASC);
    await expect.poll(() => query(page).get('sort')).toBe('price-asc');
    expect(query(page).getAll('brand')).toEqual(['2']);
    expect(query(page).has('page')).toBe(false);
  });
  await test.step('11 products on 2 pages; page 1 in price order', async () => {
    await expectCards(page, PAGE_1);
    await expect(page.locator('.catalog-count')).toHaveText('11 products');
    await expect(page.locator('.page-status')).toHaveText('1 / 2');
    await expect(gravitator()).toHaveClass(/\bactive\b/);
    await demo.highlight(gravitator(), 'Gravitator filter stays active');
    await demo.highlight(cards(page).first(), 'cheapest Gravitator item');
  });
  await test.step('click Next page; the two 699.00 skis end the filtered result', async () => {
    await nextPage(page).click();
    await expect.poll(() => query(page).get('page')).toBe('2');
    expect(query(page).getAll('brand')).toEqual(['2']);
    expect(query(page).get('sort')).toBe('price-asc');
    await expectCards(page, PAGE_2);
    await expect(gravitator()).toHaveClass(/\bactive\b/);
    await expect(sortValue(page)).toHaveText(PRICE_ASC);
    await demo.highlight(page.locator('.catalog-items'), 'page 2: the two $699.00 skis');
  });
});

test('TC-BUG-40-06 Changing a filter keeps the chosen sort and sorts the new result', async ({ page, demo }) => {
  await demo.chapter('Change a filter after sorting', 'Price: High to Low, then type Ski/boarding.');
  await test.step('open the catalog', () => openCatalog(page));
  await test.step('choose Sort: Price: High to Low', async () => {
    await chooseSort(page, PRICE_DESC);
    await expect.poll(() => search(page)).toBe('?sort=price-desc');
    await expect(cardNames(page).first()).toHaveText('Gravity 5000 All-Mountain Skis');
  });
  await test.step('click the Ski/boarding type filter', async () => {
    await filterTag(page, 'Type', 'Ski/boarding').click();
    await expect.poll(() => query(page).getAll('type')).toEqual(['3']);
    expect(query(page).get('sort')).toBe('price-desc');
    expect(query(page).has('page')).toBe(false);
  });
  await test.step('18 products on 2 pages, still Price: High to Low', async () => {
    await expect(page.locator('.catalog-count')).toHaveText('18 products');
    await expect(page.locator('.page-status')).toHaveText('1 / 2');
    await expect(sortValue(page)).toHaveText(PRICE_DESC);
    await expect(cardNames(page).first()).toHaveText('Gravity 5000 All-Mountain Skis');
    await expect(cardPrices(page).first()).toHaveText('$699.00');
    await expect(cardNames(page).nth(8)).toHaveText('Shadow Black Snowboard');
    await expect(cardPrices(page).nth(8)).toHaveText('$379.00');
    await demo.highlight(sortValue(page), 'sort kept: Price: High to Low');
  });
  await test.step('click Next page; page 2 continues the price order', async () => {
    await nextPage(page).click();
    await expect.poll(() => query(page).get('page')).toBe('2');
    expect(query(page).getAll('type')).toEqual(['3']);
    expect(query(page).get('sort')).toBe('price-desc');
    // The case names Blizzard Rider Snowboard $299.99 as the first card, but the seeded data puts Raven Swift
    // Snowboard $349.00 (item 53) before it: page 1 ends at $379.00 and item 53 is the next Ski/boarding item, as
    // the plan's own TC-BUG-40-15 (type=3, page 1, price-desc: [53, 5, ...]) expects. Assert the real order.
    await expect(cardNames(page).first()).toHaveText('Raven Swift Snowboard');
    await expect(cards(page)).toHaveCount(9);
    await expect(cardPrices(page).first()).toHaveText('$349.00');
    await expect(cardNames(page).nth(1)).toHaveText('Blizzard Rider Snowboard');
    await expect(cardPrices(page).nth(1)).toHaveText('$299.99');
    await expect(cardNames(page).last()).toHaveText('Zero Gravity Ski Goggles');
    await expect(cardPrices(page).last()).toHaveText('$79.99');
    await demo.highlight(cards(page).last(), 'last: Zero Gravity Ski Goggles $79.99');
  });
});

test('TC-BUG-40-07 Sorting does not change the product count, filter counts, page count or cards per page', async ({ page, demo }) => {
  const EXPECTED = {
    count: '101 products',
    pageStatus: '1 / 12',
    cards: 9,
    brandAll: '101',
    gravitator: '11',
    typeAll: '101',
    skiBoarding: '18',
  };
  const readValues = async () => ({
    count: ((await page.locator('.catalog-count').textContent()) ?? '').trim(),
    pageStatus: ((await page.locator('.page-status').textContent()) ?? '').replace(/\s+/g, ' ').trim(),
    cards: await cards(page).count(),
    brandAll: ((await tagCount(page, 'Brand', 'All').textContent()) ?? '').trim(),
    gravitator: ((await tagCount(page, 'Brand', 'Gravitator').textContent()) ?? '').trim(),
    typeAll: ((await tagCount(page, 'Type', 'All').textContent()) ?? '').trim(),
    skiBoarding: ((await tagCount(page, 'Type', 'Ski/boarding').textContent()) ?? '').trim(),
  });

  await demo.chapter('Counts do not change with the sort');
  let before: typeof EXPECTED | undefined;
  await test.step('open the catalog and read count, pages, cards and filter counts', async () => {
    await openCatalog(page);
    await expect(page.locator('.catalog-count')).toHaveText(EXPECTED.count);
    before = await readValues();
    expect(before).toEqual(EXPECTED);
    await demo.highlight(page.locator('.catalog-count'), '101 products');
  });
  await test.step('choose Sort: Price: Low to High', async () => {
    await chooseSort(page, PRICE_ASC);
    await expect.poll(() => search(page)).toBe('?sort=price-asc');
    await expect(cardNames(page).first()).toHaveText('Guardian Blue Chalk Bag');
  });
  await test.step('read the same seven values again: identical', async () => {
    const after = await readValues();
    expect(after).toEqual(before);
    expect(after).toEqual(EXPECTED);
    await demo.highlight(page.locator('.catalog-count'), 'still 101 products');
    await expect(activePage(page)).toHaveText('1');
    await demo.highlight(activePage(page), 'still 1 / 12');
    await demo.highlight(filterTag(page, 'Brand', 'Gravitator'), 'Gravitator still 11');
  });
});

test('TC-BUG-40-08 The chosen sort stays selected on a later page and after a reload', async ({ page, demo }) => {
  await demo.chapter('The sort survives paging and reload');
  await test.step('open the catalog', () => openCatalog(page));
  await test.step('choose Sort: Price: High to Low', async () => {
    await chooseSort(page, PRICE_DESC);
    await expect.poll(() => search(page)).toBe('?sort=price-desc');
  });
  await test.step('click Next page; Price: High to Low is still selected', async () => {
    await nextPage(page).click();
    await expect.poll(() => query(page).get('page')).toBe('2');
    expect(query(page).get('sort')).toBe('price-desc');
    await expect(sortValue(page)).toHaveText(PRICE_DESC);
    await expect(sortOption(page, PRICE_DESC)).toHaveAttribute('aria-selected', 'true');
    await expect(cardNames(page).first()).toHaveText('Raven Swift Snowboard');
    await expect(cardPrices(page).first()).toHaveText('$349.00');
    await demo.highlight(sortValue(page), 'page 2: Price: High to Low');
  });
  await test.step('reload the page', () => page.reload());
  await test.step('after the reload: same URL, label, selection, page and first card', async () => {
    await expect(cardNames(page).first()).toHaveText('Raven Swift Snowboard');
    expect(query(page).get('sort')).toBe('price-desc');
    expect(query(page).get('page')).toBe('2');
    await expect(sortValue(page)).toHaveText(PRICE_DESC);
    await expect(sortOption(page, PRICE_DESC)).toHaveAttribute('aria-selected', 'true');
    await expect(sortOption(page, NAME_ASC)).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('.page-status')).toHaveText('2 / 12');
    await expect(cardPrices(page).first()).toHaveText('$349.00');
    await demo.highlight(sortValue(page), 'after reload: Price: High to Low');
    await demo.highlight(cards(page).first(), 'Raven Swift Snowboard $349.00');
  });
});

test('TC-BUG-40-09 Returning to the catalog without a sort restores the stored sort', async ({ page, demo }) => {
  await demo.chapter('A stored sort is restored on return');
  await test.step('open the catalog', () => openCatalog(page));
  await test.step('choose Sort: Price: Low to High', async () => {
    await chooseSort(page, PRICE_ASC);
    await expect.poll(() => search(page)).toBe('?sort=price-asc');
  });
  await test.step(`read localStorage ${STORAGE_KEY}`, async () => {
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe('price-asc');
  });
  await test.step('navigate to the plain catalog URL', () => page.goto(BASE_URL));
  await test.step('the URL, label and first card show the stored sort', async () => {
    await expect.poll(() => search(page)).toBe('?sort=price-asc');
    await expect(sortValue(page)).toHaveText(PRICE_ASC);
    await expect(cardNames(page).first()).toHaveText('Guardian Blue Chalk Bag');
    await expect(cardPrices(page).first()).toHaveText('$21.99');
    await demo.highlight(sortValue(page), 'restored: Price: Low to High');
    await demo.highlight(cards(page).first(), 'Guardian Blue Chalk Bag $21.99');
  });
});

test('TC-BUG-40-10 Choosing a sort on page 3 starts the sorted catalog at page 1', async ({ page, demo }) => {
  await demo.chapter('Sorting from a later page');
  await test.step('open the catalog on page 3', async () => {
    await openCatalog(page, '?page=3');
    await expect(page.locator('.page-status')).toHaveText('3 / 12');
    await expect(activePage(page)).toHaveText('3');
    await demo.highlight(activePage(page), 'page 3 of 12');
  });
  await test.step('choose Sort: Price: Low to High', () => chooseSort(page, PRICE_ASC));
  await test.step('back on page 1 with the cheapest product first', async () => {
    await expect.poll(() => search(page)).toBe('?sort=price-asc');
    await expect(page.locator('.page-status')).toHaveText('1 / 12');
    await expect(cardNames(page).first()).toHaveText('Guardian Blue Chalk Bag');
    await expect(cardPrices(page).first()).toHaveText('$21.99');
    await expect(activePage(page)).toHaveText('1');
    await demo.highlight(activePage(page), 'page 1 of 12');
    await demo.highlight(cards(page).first(), 'Guardian Blue Chalk Bag $21.99');
  });
});
