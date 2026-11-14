import { test, expect } from '../demo';
import type { Page } from '@playwright/test';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-12: a catalog `page` query value below 1 shows the first page (scenario bug-12 = default: 101 items, 12 pages of 9).
test.beforeAll(() => {
  loadScenario('bug-12');
});

const PAGE_SIZE = 9;
const TOTAL_PAGES = 12;
const ERROR_TEXT = 'An unhandled error has occurred.';

async function waitForCatalog(page: Page) {
  await expect(page.locator('.catalog-product')).toHaveCount(PAGE_SIZE);
  await expect(page.locator('[role="status"][aria-label="Loading products"]')).toHaveCount(0);
}

async function productNames(page: Page) {
  await waitForCatalog(page);
  return page.locator('.catalog-product .name').allTextContents();
}

async function expectNoError(page: Page) {
  await expect(page.locator('#blazor-error-ui')).toBeHidden();
  await expect(page.getByText(ERROR_TEXT)).toBeHidden();
}

async function expectPage(page: Page, current: number) {
  const nav = page.locator('nav[aria-label="Catalog pages"]');
  await expect(nav.locator('.page-number.active-page')).toHaveText(String(current));
  await expect(nav.locator('.page-status')).toHaveText(new RegExp(`^${current}\\s*/\\s*${TOTAL_PAGES}$`));
}

async function firstPageNames(page: Page) {
  await page.goto(BASE_URL);
  return productNames(page);
}

for (const [id, value] of [['TC-BUG-12-01', '0'], ['TC-BUG-12-02', '-1']] as const) {
  test(`${id} ?page=${value} shows the first catalog page`, async ({ page, demo }) => {
    const target = `${BASE_URL}/?page=${value}`;
    const baseline = await test.step('Record the first page without a page parameter', () => firstPageNames(page));

    await test.step(`Open ?page=${value} and wait for the catalog`, async () => {
      await page.goto(target);
      await waitForCatalog(page);
    });

    await test.step('The first page is shown without errors', async () => {
      await expectNoError(page);
      await expect(page.locator('.catalog-product')).toHaveCount(PAGE_SIZE);
      await expectPage(page, 1);
      const nav = page.locator('nav[aria-label="Catalog pages"]');
      await expect(nav.locator('span.page-nav.is-disabled').first()).toContainText('Prev');
      await expect(nav.locator('a.page-nav[rel="prev"]')).toHaveCount(0);
      expect(await productNames(page)).toEqual(baseline);
      expect(page.url()).toBe(target);
      await demo.highlight(nav.locator('.page-number.active-page'), `page 1 of ${TOTAL_PAGES} for ?page=${value}`);
    });
  });
}

test('TC-BUG-12-03 ?page=1 still shows the first catalog page', async ({ page, demo }) => {
  const baseline = await test.step('Record the first page without a page parameter', () => firstPageNames(page));

  await test.step('Open ?page=1 and wait for the catalog', async () => {
    await page.goto(`${BASE_URL}/?page=1`);
    await waitForCatalog(page);
  });

  await test.step('The first page is shown without errors', async () => {
    await expectNoError(page);
    await expectPage(page, 1);
    const nav = page.locator('nav[aria-label="Catalog pages"]');
    await expect(nav.locator('span.page-nav.is-disabled').first()).toContainText('Prev');
    await expect(nav.locator('a.page-nav[rel="prev"]')).toHaveCount(0);
    expect(await productNames(page)).toEqual(baseline);
    await demo.highlight(nav.locator('.page-number.active-page'), 'page 1 of 12 for ?page=1');
  });
});

test('TC-BUG-12-04 ?page=2 still shows the second catalog page', async ({ page, demo }) => {
  const baseline = await test.step('Record the first page names', () => firstPageNames(page));

  await test.step('Open ?page=2 and wait for the catalog', async () => {
    await page.goto(`${BASE_URL}/?page=2`);
    await waitForCatalog(page);
  });

  await test.step('The second page is shown with an enabled Prev link', async () => {
    await expectNoError(page);
    const names = await productNames(page);
    expect(names).toHaveLength(PAGE_SIZE);
    for (const name of names) expect(baseline).not.toContain(name);
    await expectPage(page, 2);
    const prev = page.locator('nav[aria-label="Catalog pages"] a.page-nav[rel="prev"]');
    await expect(prev).toBeVisible();
    expect(await prev.getAttribute('href')).not.toContain('page=');
    await demo.highlight(page.locator('nav[aria-label="Catalog pages"] .page-number.active-page'), 'page 2 of 12');
  });
});

test('TC-BUG-12-05 Next on the clamped first page leads to page 2', async ({ page, demo }) => {
  await test.step('Open ?page=0', async () => {
    await page.goto(`${BASE_URL}/?page=0`);
    await waitForCatalog(page);
  });

  await test.step('Click Next page', async () => {
    await page.locator('a.page-nav[rel="next"]').click();
    await expect(page).toHaveURL(/page=2/);
    await waitForCatalog(page);
  });

  await test.step('The second page is shown', async () => {
    expect(page.url()).toContain('page=2');
    await expectNoError(page);
    await expectPage(page, 2);
    await expect(page.locator('.catalog-product')).toHaveCount(PAGE_SIZE);
    await demo.highlight(page.locator('nav[aria-label="Catalog pages"] .page-number.active-page'), 'page 2 after Next');
  });
});
