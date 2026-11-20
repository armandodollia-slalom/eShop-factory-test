import type { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// EPIC-359: the two journeys that cross BRAND-1, BRAND-2 and BRAND-3 in one browser session.
// Scenario `epic-359` (.factory/stack/scenarios/epic-359) is the demo catalog of `default`: 13 brands, 101 items,
// Daybird (id 1) 10 items from $49.99, Gravitator (id 2) 11 items from $59.99. Anonymous visitor.
// Each case holds many highlights on screen for the video, so it needs more than the default 30 s.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.beforeAll(() => {
  loadScenario('epic-359');
});

const NAME_ORDER = [
  'AirStrider', 'B&R', 'Daybird', 'Gravitator', 'Green Equipment', 'Grolltex', 'Legend',
  'Quester', 'Raptor Elite', 'Solstix', 'WildRunner', 'XE', 'Zephyr',
];

const COUNT_ORDER = [
  'Gravitator', 'Raptor Elite', 'WildRunner', 'B&R', 'Daybird', 'Solstix', 'Legend',
  'Green Equipment', 'AirStrider', 'Zephyr', 'Grolltex', 'Quester', 'XE',
];

const DAYBIRD_PRODUCTS = [
  'Wanderer Black Hiking Boots', 'Trailblaze hiking backpack', 'Stealth Lite Bike Helmet', 'Midnight Blue Goggles',
  'Arctic Shield Insulated Jacket', 'Raven Swift Snowboard', 'Shadow Black Snowboard', 'Explorer Frost Boots',
  'LumenHead Headlamp', 'Blizzard Snowboard',
];

const ACTIVE = /(^|\s)active(\s|$)/;
const CURRENT = /(^|\s)is-current(\s|$)/;

const topNav = (page: Page) => page.getByRole('navigation', { name: 'Primary' });
const navLink = (page: Page, name: 'Brands' | 'Shop all') => topNav(page).getByRole('link', { name, exact: true });
const pageHeading = (page: Page) => page.getByRole('heading', { name: 'Brands', level: 1, exact: true });
const brandCards = (page: Page) => page.locator('article.brand-card');
const cardHeadings = (page: Page) => brandCards(page).locator('h2');
const brandCard = (page: Page, name: string) =>
  brandCards(page).filter({ has: page.getByRole('heading', { name, exact: true }) });
const heroTitle = (page: Page) => page.locator('.eshop-hero-intro h1');
const heroSubtitle = (page: Page) => page.locator('.eshop-hero-intro p');
const toolbarCount = (page: Page) => page.locator('.catalog-toolbar .catalog-count');
const brandGroup = (page: Page) =>
  page.locator('.catalog-search-group', { has: page.getByRole('heading', { name: 'Brand', exact: true }) });
const brandTag = (page: Page, name: string) =>
  brandGroup(page).locator('a.catalog-search-tag').filter({ has: page.getByText(name, { exact: true }) });
const itemCards = (page: Page) => page.locator('.catalog-items .catalog-item');
const productNames = (page: Page) => page.locator('.catalog-items .catalog-item .name');
const nextPage = (page: Page) =>
  page.getByRole('navigation', { name: 'Catalog pages' }).getByRole('link', { name: 'Next page' });
const sortControl = (page: Page) => page.getByRole('navigation', { name: 'Sort brands' });
const sortOption = (page: Page, label: 'Name' | 'Most products') =>
  sortControl(page).getByRole('link', { name: label, exact: true });

const pathAndQuery = (page: Page) => {
  const u = new URL(page.url());
  return `${u.pathname}${u.search}`;
};

async function expectOnCatalogFilteredTo(page: Page, brandId: string) {
  await expect(page).toHaveURL((u) => u.pathname === '/' && u.searchParams.getAll('brand').join(',') === brandId);
  const u = new URL(page.url());
  expect(u.pathname).toBe('/');
  expect(u.searchParams.getAll('brand')).toEqual([brandId]);
}

test('TC-EPIC-359-01 header Brands link, Daybird card to its filtered catalog, then "All brands" back to /brands', async ({ page, demo }) => {
  await test.step('open the home page /', async () => {
    await page.goto(BASE_URL!);
    await expect(toolbarCount(page)).toHaveText('101 products');
    await demo.caption(`Opened ${pathAndQuery(page)}`);
  });

  await test.step('click the header navigation link "Brands"', async () => {
    await demo.highlight(navLink(page, 'Brands'), 'Click "Brands" in the header');
    await navLink(page, 'Brands').click();
    await expect(page).toHaveURL((u) => u.pathname === '/brands');
    expect(new URL(page.url()).pathname).toBe('/brands');
    await demo.caption(`Now at ${pathAndQuery(page)}`);
    await expect(pageHeading(page)).toBeVisible();
    await expect(heroTitle(page)).toHaveText('Brands');
    await expect(brandCards(page)).toHaveCount(13);
    await expect(cardHeadings(page)).toHaveText(NAME_ORDER);
    const summaries = (await brandCards(page).locator('p').allTextContents()).map((t) => t.trim());
    expect(summaries).toHaveLength(13);
    for (const s of summaries) {
      expect(s).toMatch(/^\d+ products? · from \$\d+\.\d{2}$/);
    }
    await demo.highlight(pageHeading(page), 'Heading "Brands"');
    await demo.highlight(brandCards(page).first(), `First card: ${NAME_ORDER[0]} (alphabetical)`);
    await demo.highlight(brandCards(page).nth(6), `7th card: ${NAME_ORDER[6]}`);
    await demo.highlight(brandCards(page).last(), `13th card: ${NAME_ORDER[12]}, each with count and "from $x.xx"`);
  });

  await test.step('read the Daybird card text and click the Daybird card', async () => {
    const card = brandCard(page, 'Daybird');
    await expect(card.locator('p')).toHaveText('10 products · from $49.99');
    await demo.highlight(card, 'Daybird: "10 products · from $49.99" - click');
    await card.click();
    await expectOnCatalogFilteredTo(page, '1');
    await demo.caption(`Now at ${pathAndQuery(page)}`);
    await expect(heroTitle(page)).toHaveText('Brand: Daybird');
    await expect(toolbarCount(page)).toHaveText('10 products');
    await expect(brandTag(page, 'Daybird')).toHaveClass(ACTIVE);
    const active = brandGroup(page).locator('a.catalog-search-tag.active');
    await expect(active).toHaveCount(1);
    await expect(active.getByText('Daybird', { exact: true })).toHaveCount(1);
    await demo.highlight(heroTitle(page), 'Header title: "Brand: Daybird"');
    await demo.highlight(toolbarCount(page), '10 products, the count on the card');
    await demo.highlight(brandTag(page, 'Daybird'), 'Brand filter: only "Daybird" active');
  });

  await test.step('read the product names on page 1, click "Next page" and read page 2', async () => {
    await expect(itemCards(page)).toHaveCount(9);
    const page1 = (await productNames(page).allTextContents()).map((n) => n.trim());
    expect(page1).toHaveLength(9);
    await demo.highlight(productNames(page).first(), `Page 1 (9 items): ${page1.slice(0, 3).join(', ')}`);
    await demo.highlight(productNames(page).nth(3), `Page 1: ${page1.slice(3, 6).join(', ')}`);
    await demo.highlight(productNames(page).nth(8), `Page 1: ${page1.slice(6, 9).join(', ')}`);

    await demo.highlight(nextPage(page), 'Click "Next page"');
    await nextPage(page).click();
    await expect(page).toHaveURL((u) => u.pathname === '/' && u.searchParams.get('page') === '2');
    await expect(itemCards(page)).toHaveCount(1);
    await demo.caption(`Now at ${pathAndQuery(page)}`);
    const page2 = (await productNames(page).allTextContents()).map((n) => n.trim());
    expect(page2).toHaveLength(1);
    await expect(heroTitle(page)).toHaveText('Brand: Daybird');

    const all = [...page1, ...page2];
    expect(new Set(all).size).toBe(10);
    expect([...all].sort()).toEqual([...DAYBIRD_PRODUCTS].sort());
    await demo.highlight(productNames(page).first(), `Page 2 (1 item): ${page2[0]} - 10 Daybird products in all`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await demo.highlight(heroTitle(page), 'Page 2 still "Brand: Daybird"');
  });

  await test.step('click "All brands" in the page header', async () => {
    const allBrands = heroSubtitle(page).getByRole('link', { name: 'All brands', exact: true });
    await demo.highlight(allBrands, 'Click "All brands"');
    await allBrands.click();
    await expect(page).toHaveURL((u) => u.pathname === '/brands');
    const u = new URL(page.url());
    expect(u.pathname).toBe('/brands');
    expect(u.search).toBe('');
    await demo.caption(`Now at ${pathAndQuery(page)} (no query)`);
    await expect(pageHeading(page)).toBeVisible();
    await expect(brandCards(page)).toHaveCount(13);
    await expect(navLink(page, 'Brands')).toHaveClass(CURRENT);
    await expect(navLink(page, 'Shop all')).not.toHaveClass(CURRENT);
    await demo.highlight(pageHeading(page), 'Back on the Brands page');
    await demo.highlight(navLink(page, 'Brands'), 'Nav: "Brands" is current, "Shop all" not');
    await demo.highlight(brandCards(page).last(), '13 brand cards');
  });
});

test('TC-EPIC-359-03 sort by "Most products", reload, then open the top brand\'s products', async ({ page, demo }) => {
  const expectCountOrderSelected = async (what: string) => {
    await expect(page).toHaveURL((u) => u.pathname === '/brands' && u.search === '?sort=count');
    expect(pathAndQuery(page)).toBe('/brands?sort=count');
    await expect(sortOption(page, 'Most products')).toHaveAttribute('aria-current', 'true');
    await expect(sortOption(page, 'Name')).not.toHaveAttribute('aria-current');
    await expect(brandCards(page)).toHaveCount(13);
    await expect(cardHeadings(page)).toHaveText(COUNT_ORDER);
    await demo.highlight(sortOption(page, 'Most products'), `${what}: "Most products" selected, "Name" not`);
    await demo.highlight(brandCards(page).first(), `First card: ${COUNT_ORDER[0]}`);
    await demo.highlight(brandCards(page).nth(6), `7th card: ${COUNT_ORDER[6]}`);
    await demo.highlight(brandCards(page).last(), `13th card: ${COUNT_ORDER[12]}`);
  };

  await test.step('open /brands', async () => {
    await page.goto(`${BASE_URL}/brands`);
    await expect(brandCards(page)).toHaveCount(13);
    await demo.caption(`Opened ${pathAndQuery(page)}`);
  });

  await test.step('click "Most products" in the Sort control', async () => {
    await demo.highlight(sortOption(page, 'Most products'), 'Click "Most products"');
    await sortOption(page, 'Most products').click();
    await expectCountOrderSelected('After the click');
    await demo.caption(`Now at ${pathAndQuery(page)}`);
  });

  await test.step('reload the page', async () => {
    await page.reload();
    // The browser restores the scroll position on reload; return to the top so the Sort control is on screen.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(sortControl(page)).toBeInViewport();
    await expectCountOrderSelected('After reload');
    await demo.caption(`Reloaded, still at ${pathAndQuery(page)}`);
    await expect(brandCards(page).first().locator('p')).toHaveText('11 products · from $59.99');
    await demo.highlight(brandCards(page).first(), 'Gravitator: "11 products · from $59.99"');
  });

  await test.step('click the first brand card', async () => {
    await brandCards(page).first().click();
    await expectOnCatalogFilteredTo(page, '2');
    await demo.caption(`Now at ${pathAndQuery(page)}`);
    await expect(heroTitle(page)).toHaveText('Brand: Gravitator');
    await expect(toolbarCount(page)).toHaveText('11 products');
    await demo.highlight(heroTitle(page), 'Header title: "Brand: Gravitator"');
    await demo.highlight(toolbarCount(page), '11 products');
  });
});
