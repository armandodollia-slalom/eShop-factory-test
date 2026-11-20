import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BRAND-3: the Sort control of the /brands page ("Name" / "Most products").
// Scenario `brand-3` (.factory/stack/scenarios/brand-3): the unchanged demo catalog of `default`, 13 brands.
// Each case holds several highlights (2 s each) on screen for the video, so it needs more than the default 30 s.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

test.beforeAll(() => {
  loadScenario('brand-3');
});

const NAME_ORDER = [
  'AirStrider', 'B&R', 'Daybird', 'Gravitator', 'Green Equipment', 'Grolltex', 'Legend',
  'Quester', 'Raptor Elite', 'Solstix', 'WildRunner', 'XE', 'Zephyr',
];

const COUNT_ORDER = [
  'Gravitator', 'Raptor Elite', 'WildRunner', 'B&R', 'Daybird', 'Solstix', 'Legend',
  'Green Equipment', 'AirStrider', 'Zephyr', 'Grolltex', 'Quester', 'XE',
];

const sortControl = (page: Page) => page.getByRole('navigation', { name: 'Sort brands' });
const option = (page: Page, label: 'Name' | 'Most products') => sortControl(page).getByRole('link', { name: label, exact: true });
const cards = (page: Page) => page.locator('article.brand-card');
const pageHeading = (page: Page) => page.getByRole('heading', { name: 'Brands', level: 1, exact: true });

type DemoLike = { highlight: (l: Locator, label?: string) => Promise<void> };

const pathAndQuery = (page: Page) => {
  const u = new URL(page.url());
  return `${u.pathname}${u.search}`;
};

async function expectSelected(page: Page, demo: DemoLike, selected: 'Name' | 'Most products') {
  const other = selected === 'Name' ? 'Most products' : 'Name';
  await expect(option(page, selected)).toHaveAttribute('aria-current', 'true');
  await expect(option(page, other)).not.toHaveAttribute('aria-current');
  await demo.highlight(option(page, selected), `"${selected}" selected (aria-current), "${other}" not`);
}

async function expectCardOrder(page: Page, demo: DemoLike, order: string[], what: string) {
  await expect(cards(page)).toHaveCount(13);
  await expect(cards(page).locator('h2')).toHaveText(order);
  await demo.highlight(cards(page).first(), `First card: ${order[0]} (${what})`);
  await demo.highlight(cards(page).nth(6), `Middle card: ${order[6]} (7th of 13)`);
  await demo.highlight(cards(page).last(), `Last card: ${order[12]} (13 cards)`);
}

async function expectNoError(page: Page) {
  await expect(page.locator('#blazor-error-ui')).toBeHidden();
  await expect(page.locator('body')).not.toContainText(/error/i, { useInnerText: true });
}

test('TC-BRAND-3-07 Brands page shows a Sort control with Name selected and cards in alphabetical order', async ({ page, demo }) => {
  await test.step('open /brands (no query string)', async () => {
    await page.goto(`${BASE_URL}/brands`);
    await expect(pageHeading(page)).toBeVisible();
    await demo.caption(`Opened ${pathAndQuery(page)}`);
  });
  await test.step('a "Sort" control above the cards with exactly "Name" and "Most products"', async () => {
    await expect(sortControl(page)).toBeVisible();
    await expect(sortControl(page).locator('.brand-sort-label')).toHaveText('Sort');
    await expect(sortControl(page).getByRole('link')).toHaveText(['Name', 'Most products']);
    const controlBox = await sortControl(page).boundingBox();
    const firstCardBox = await cards(page).first().boundingBox();
    expect(controlBox).not.toBeNull();
    expect(firstCardBox).not.toBeNull();
    expect(controlBox!.y + controlBox!.height).toBeLessThanOrEqual(firstCardBox!.y);
    await demo.highlight(sortControl(page), 'Sort: "Name", "Most products" above the cards');
  });
  await test.step('"Name" is selected', async () => {
    await expectSelected(page, demo, 'Name');
  });
  await test.step('13 cards in alphabetical order', async () => {
    await expectCardOrder(page, demo, NAME_ORDER, 'alphabetical');
  });
});

test('TC-BRAND-3-08 choosing "Most products" reorders the cards by count and adds ?sort=count to the address', async ({ page, demo }) => {
  await test.step('open /brands', async () => {
    await page.goto(`${BASE_URL}/brands`);
    await expect(cards(page)).toHaveCount(13);
    await demo.caption(`Opened ${pathAndQuery(page)}`);
  });
  await test.step('click "Most products" in the Sort control', async () => {
    await demo.highlight(option(page, 'Most products'), 'Click "Most products"');
    await option(page, 'Most products').click();
    await expect(page).toHaveURL((u) => u.pathname === '/brands' && u.search === '?sort=count');
    await demo.caption(`Now at ${pathAndQuery(page)}`);
  });
  await test.step('"Most products" is selected', async () => {
    await expectSelected(page, demo, 'Most products');
  });
  await test.step('13 cards by number of products, largest first, ties alphabetical', async () => {
    await expectCardOrder(page, demo, COUNT_ORDER, 'most products');
    await expect(cards(page).first().locator('p')).toHaveText('11 products · from $59.99');
    await expect(cards(page).last().locator('p')).toHaveText('3 products · from $199.00');
    await demo.highlight(cards(page).first(), 'Gravitator: 11 products · from $59.99');
    await demo.highlight(cards(page).last(), 'XE: 3 products · from $199.00');
  });
});

test('TC-BRAND-3-09 reloading after choosing "Most products" keeps the count order', async ({ page, demo }) => {
  await test.step('open /brands', async () => {
    await page.goto(`${BASE_URL}/brands`);
    await expect(cards(page)).toHaveCount(13);
    await demo.caption(`Opened ${pathAndQuery(page)}`);
  });
  await test.step('click "Most products"', async () => {
    await demo.highlight(option(page, 'Most products'), 'Click "Most products"');
    await option(page, 'Most products').click();
    await expect(page).toHaveURL((u) => u.pathname === '/brands' && u.search === '?sort=count');
    await expect(cards(page).locator('h2')).toHaveText(COUNT_ORDER);
  });
  await test.step('reload the page', async () => {
    await page.reload();
    await expect(cards(page)).toHaveCount(13);
    await expect(page).toHaveURL((u) => u.pathname === '/brands' && u.search === '?sort=count');
    await demo.caption(`Reloaded, still at ${pathAndQuery(page)}`);
  });
  await test.step('"Most products" still selected and the count order kept', async () => {
    await expectSelected(page, demo, 'Most products');
    await expectCardOrder(page, demo, COUNT_ORDER, 'most products after reload');
  });
});

test('TC-BRAND-3-10 opening /brands?sort=count directly shows "Most products" selected and the count order', async ({ page, demo }) => {
  // Playwright gives every test its own browser context, so this is a first visit with no prior interaction.
  await test.step('open /brands?sort=count directly', async () => {
    await page.goto(`${BASE_URL}/brands?sort=count`);
    await expect(cards(page)).toHaveCount(13);
    await demo.caption(`Opened ${pathAndQuery(page)} directly`);
  });
  await test.step('"Most products" is selected', async () => {
    await expectSelected(page, demo, 'Most products');
  });
  await test.step('13 cards by number of products', async () => {
    await expectCardOrder(page, demo, COUNT_ORDER, 'most products');
  });
});

test('TC-BRAND-3-11 opening /brands with an unknown sort value shows the alphabetical order with "Name" selected', async ({ page, demo }) => {
  await test.step('open /brands?sort=price', async () => {
    await page.goto(`${BASE_URL}/brands?sort=price`);
    await expect(cards(page)).toHaveCount(13);
    await demo.caption(`Opened ${pathAndQuery(page)}`);
  });
  await test.step('no error message and the heading "Brands"', async () => {
    await expectNoError(page);
    await expect(pageHeading(page)).toBeVisible();
    await demo.highlight(pageHeading(page), 'Heading "Brands", no error for ?sort=price');
  });
  await test.step('"Name" is selected', async () => {
    await expectSelected(page, demo, 'Name');
  });
  await test.step('13 cards in alphabetical order', async () => {
    await expectCardOrder(page, demo, NAME_ORDER, 'alphabetical');
  });
});

test('TC-BRAND-3-12 opening /brands?sort=COUNT shows the alphabetical order with "Name" selected', async ({ page, demo }) => {
  await test.step('open /brands?sort=COUNT', async () => {
    await page.goto(`${BASE_URL}/brands?sort=COUNT`);
    await expect(cards(page)).toHaveCount(13);
    await demo.caption(`Opened ${pathAndQuery(page)}`);
  });
  await test.step('no error message', async () => {
    await expectNoError(page);
    await demo.highlight(pageHeading(page), 'No error for ?sort=COUNT');
  });
  await test.step('"Name" is selected', async () => {
    await expectSelected(page, demo, 'Name');
  });
  await test.step('13 cards in alphabetical order', async () => {
    await expectCardOrder(page, demo, NAME_ORDER, 'alphabetical');
  });
});

test('TC-BRAND-3-13 choosing "Name" after "Most products" restores the alphabetical order', async ({ page, demo }) => {
  await test.step('open /brands?sort=count', async () => {
    await page.goto(`${BASE_URL}/brands?sort=count`);
    await expect(cards(page).locator('h2')).toHaveText(COUNT_ORDER);
    await demo.caption(`Opened ${pathAndQuery(page)}`);
    await demo.highlight(cards(page).first(), 'Count order: Gravitator first');
  });
  await test.step('click "Name" in the Sort control', async () => {
    await demo.highlight(option(page, 'Name'), 'Click "Name"');
    await option(page, 'Name').click();
    await expect(page).toHaveURL((u) => u.pathname === '/brands' && !u.search.includes('sort=count'));
    await expect(cards(page).locator('h2')).toHaveText(NAME_ORDER);
    await demo.caption(`Now at ${pathAndQuery(page)}`);
  });
  await test.step('"Name" is selected', async () => {
    await expectSelected(page, demo, 'Name');
  });
  await test.step('13 cards in alphabetical order', async () => {
    await expectCardOrder(page, demo, NAME_ORDER, 'alphabetical');
  });
});
