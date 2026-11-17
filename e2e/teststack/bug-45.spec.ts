import type { Page } from '@playwright/test';
import { test, expect } from '../demo';
import type { Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-45: a catalog link whose `brand` or `type` value is not a number (text or empty) opens the catalog with that
// value ignored; the remaining numeric values still filter, and purely numeric links work as before.
// Scenario `bug-45` (.factory/stack/scenarios/bug-45) = `default`: 101 products, brand 1 "Daybird" has 10, type 7
// "Navigation" has 11. Every case opens one link as an anonymous visitor.
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('bug-45');
});

const HEADING = 'Ready for a new adventure?';

type Selection = { brand: string; type: string };

const group = (page: Page, title: 'Brand' | 'Type') =>
  page.locator('.catalog-search-group').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

const tag = (page: Page, title: 'Brand' | 'Type', name: string) =>
  group(page, title).locator('.catalog-search-tag').filter({ has: page.getByText(name, { exact: true }) });

async function open(page: Page, demo: Demo, path: string) {
  const requested = `${BASE_URL}${path}`;
  await demo.caption(`Open ${path}`);
  const response = await test.step(`navigate to ${path}`, () => page.goto(requested));
  await test.step('the response is HTTP 200 with a page body', async () => {
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
    expect((await response!.text()).trim().length).toBeGreaterThan(0);
  });
  await demo.caption(`Opened ${page.url()} -> HTTP ${response!.status()}`);
}

async function expectCatalogPage(page: Page, demo: Demo) {
  await test.step('the store header, hero heading and both filter groups are shown, not an error page', async () => {
    await expect(page.locator('.eshop-topbar')).toBeVisible();
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(HEADING);
    await expect(group(page, 'Brand')).toBeVisible();
    await expect(group(page, 'Type')).toBeVisible();
    // Blazor keeps its error banner in the DOM, hidden; it must not be shown.
    await expect(page.getByText(/unhandled error|An error has occurred/i).filter({ visible: true })).toHaveCount(0);
    await demo.highlight(heading, 'catalog page, not an error page');
  });
}

async function expectCount(page: Page, demo: Demo, text: string) {
  await test.step(`the count line reads "${text}" and product cards are listed`, async () => {
    const count = page.locator('.catalog-count');
    await expect(count).toHaveText(text);
    expect(await page.locator('.catalog-product').count()).toBeGreaterThan(0);
    await demo.highlight(count, text);
  });
}

async function expectSelected(page: Page, demo: Demo, title: 'Brand' | 'Type', name: string) {
  await test.step(`in the ${title} filter only "${name}" is selected`, async () => {
    const active = group(page, title).locator('.catalog-search-tag.active');
    await expect(active).toHaveCount(1);
    await expect(active.locator('span').first()).toHaveText(name);
    await expect(tag(page, title, name)).toHaveClass(/\bactive\b/);
    if (name !== 'All') await expect(tag(page, title, 'All')).not.toHaveClass(/\bactive\b/);
    await demo.highlight(tag(page, title, name), `${title}: ${name} selected`);
  });
}

async function expectSelection(page: Page, demo: Demo, selection: Selection) {
  await expectSelected(page, demo, 'Brand', selection.brand);
  await expectSelected(page, demo, 'Type', selection.type);
}

test('TC-BUG-45-01 /?brand=abc shows the whole catalog with brand "All" selected', async ({ page, demo }) => {
  await open(page, demo, '/?brand=abc');
  await expectCatalogPage(page, demo);
  await expectCount(page, demo, '101 products');
  await expectSelection(page, demo, { brand: 'All', type: 'All' });
});

test('TC-BUG-45-02 /?type=abc shows the whole catalog with type "All" selected', async ({ page, demo }) => {
  await open(page, demo, '/?type=abc');
  await expectCatalogPage(page, demo);
  await expectCount(page, demo, '101 products');
  await expectSelection(page, demo, { brand: 'All', type: 'All' });
});

test('TC-BUG-45-03 /?brand=1&brand=abc ignores "abc" and shows Daybird\'s 10 products', async ({ page, demo }) => {
  await open(page, demo, '/?brand=1&brand=abc');
  await expectCatalogPage(page, demo);
  await expectCount(page, demo, '10 products');
  await expectSelection(page, demo, { brand: 'Daybird', type: 'All' });
});

test('TC-BUG-45-04 /?type=7&type=x ignores "x" and shows the 11 Navigation products', async ({ page, demo }) => {
  await open(page, demo, '/?type=7&type=x');
  await expectCatalogPage(page, demo);
  await expectCount(page, demo, '11 products');
  await expectSelection(page, demo, { brand: 'All', type: 'Navigation' });
});

test('TC-BUG-45-05 /?brand= (empty value) shows the whole catalog with brand "All" selected', async ({ page, demo }) => {
  await open(page, demo, '/?brand=');
  await expectCatalogPage(page, demo);
  await expectCount(page, demo, '101 products');
  await expectSelection(page, demo, { brand: 'All', type: 'All' });
});

test('TC-BUG-45-06 /?brand=1 still shows Daybird\'s 10 products', async ({ page, demo }) => {
  await open(page, demo, '/?brand=1');
  await expectCount(page, demo, '10 products');
  await expectSelection(page, demo, { brand: 'Daybird', type: 'All' });
});

test('TC-BUG-45-07 /?type=7 still shows the 11 Navigation products', async ({ page, demo }) => {
  await open(page, demo, '/?type=7');
  await expectCount(page, demo, '11 products');
  await expectSelection(page, demo, { brand: 'All', type: 'Navigation' });
});

test('TC-BUG-45-08 /?type= (empty value) shows the whole catalog with type "All" selected', async ({ page, demo }) => {
  await open(page, demo, '/?type=');
  await expectCatalogPage(page, demo);
  await expectCount(page, demo, '101 products');
  await expectSelection(page, demo, { brand: 'All', type: 'All' });
});
