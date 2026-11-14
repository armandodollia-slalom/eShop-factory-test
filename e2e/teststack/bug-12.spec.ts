import { test, expect, type Demo } from '../demo';
import type { Page } from '@playwright/test';
import { loadScenario } from './scenario';

// BUG-12: the WebApp catalog treats a zero or negative ?page= as page 1.
// Scenario `bug-12` (.factory/stack/scenarios/bug-12): the demo catalog, 101 items, 9 per page, 12 pages.
const PAGE_SIZE = 9;
const LAST_PAGE_ITEMS = 2;

test.beforeAll(() => {
  loadScenario('bug-12');
});

const statusText = (n: number) => new RegExp(`^${n}\\s*/\\s*12$`);

async function productNames(page: Page): Promise<string[]> {
  const names = await page.locator('.catalog-product .name').allInnerTexts();
  expect(names.length).toBeGreaterThan(0);
  return names.map((n) => n.trim());
}

async function openPage(page: Page, query: string) {
  await page.goto(`/${query}`);
  await expect(page.locator('.catalog-product').first()).toBeVisible();
}

async function firstPageNames(page: Page): Promise<string[]> {
  await openPage(page, '?page=1');
  await expect(page.locator('.catalog-product')).toHaveCount(PAGE_SIZE);
  return productNames(page);
}

async function expectClampedToFirstPage(page: Page, demo: Demo, query: string) {
  await test.step(`Open /${query} and wait for the product cards`, async () => {
    await openPage(page, query);
  });
  await test.step('Nine cards, no skeleton, no error bar, URL unchanged', async () => {
    await expect(page.locator('.catalog-product')).toHaveCount(PAGE_SIZE);
    await expect(page.locator('.catalog-card-skeleton')).toHaveCount(0);
    await expect(page.getByText('An unhandled error has occurred.')).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/\\${query}$`));
    await demo.highlight(page.locator('.catalog-product').first(), `first catalog page shown for ${query}`);
  });
  const names = await productNames(page);
  await test.step('Names equal those of ?page=1', async () => {
    expect(names).toEqual(await firstPageNames(page));
  });
}

async function expectFirstPagination(page: Page, demo: Demo, query: string) {
  await test.step(`Open /${query} and wait for the pagination bar`, async () => {
    await page.goto(`/${query}`);
    await expect(page.locator('nav.catalog-pagination')).toBeVisible();
  });
  await test.step('Page 1 of 12 active, Previous disabled, Next goes to page 2', async () => {
    await expect(page.locator('.page-status')).toHaveText(statusText(1));
    await expect(page.locator('.page-number.active-page')).toHaveCount(1);
    await expect(page.locator('.page-number.active-page')).toHaveText('1');
    await expect(page.locator('span.page-nav.is-disabled')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('a.page-nav[rel="prev"]')).toHaveCount(0);
    await expect(page.locator('a.page-nav[rel="next"]')).toHaveAttribute('href', /page=2/);
    await demo.highlight(page.locator('nav.catalog-pagination'), `pagination on page 1 for ${query}`);
  });
}

test('TC-BUG-12-01 ?page=0 shows the first catalog page', async ({ page, demo }) => {
  await expectClampedToFirstPage(page, demo, '?page=0');
});

test('TC-BUG-12-02 ?page=-1 shows the first catalog page', async ({ page, demo }) => {
  await expectClampedToFirstPage(page, demo, '?page=-1');
});

test('TC-BUG-12-03 ?page=-100 shows the first catalog page', async ({ page, demo }) => {
  await test.step('Open /?page=-100', async () => {
    await openPage(page, '?page=-100');
  });
  await test.step('Nine cards, no skeleton, no error bar', async () => {
    await expect(page.locator('.catalog-product')).toHaveCount(PAGE_SIZE);
    await expect(page.locator('.catalog-card-skeleton')).toHaveCount(0);
    await expect(page.getByText('An unhandled error has occurred.')).not.toBeVisible();
    await demo.highlight(page.locator('.catalog-product').first(), 'first catalog page shown for ?page=-100');
  });
  const names = await productNames(page);
  await test.step('Names equal those of ?page=1', async () => {
    expect(names).toEqual(await firstPageNames(page));
  });
});

test('TC-BUG-12-04 ?page=0 pagination bar shows page 1 active with Previous disabled', async ({ page, demo }) => {
  await expectFirstPagination(page, demo, '?page=0');
});

test('TC-BUG-12-05 ?page=-1 pagination bar shows page 1 active with Previous disabled', async ({ page, demo }) => {
  await expectFirstPagination(page, demo, '?page=-1');
});

test('TC-BUG-12-06 ?page=1 still shows the first page', async ({ page, demo }) => {
  await test.step('Open /?page=1', async () => {
    await openPage(page, '?page=1');
  });
  await test.step('Nine cards, no skeleton, no error bar, page 1 of 12, Previous disabled', async () => {
    await expect(page.locator('.catalog-product')).toHaveCount(PAGE_SIZE);
    await expect(page.locator('.catalog-card-skeleton')).toHaveCount(0);
    await expect(page.getByText('An unhandled error has occurred.')).not.toBeVisible();
    await expect(page.locator('.page-status')).toHaveText(statusText(1));
    await expect(page.locator('span.page-nav.is-disabled')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('a.page-nav[rel="prev"]')).toHaveCount(0);
    await demo.highlight(page.locator('nav.catalog-pagination'), 'page 1 of 12 with Previous disabled');
  });
});

test('TC-BUG-12-07 No page parameter shows the first page', async ({ page, demo }) => {
  await test.step('Open / without a page parameter', async () => {
    await openPage(page, '');
  });
  const names = await productNames(page);
  await test.step('Nine cards, no skeleton, no error bar, page 1 of 12', async () => {
    await expect(page.locator('.catalog-product')).toHaveCount(PAGE_SIZE);
    await expect(page.locator('.catalog-card-skeleton')).toHaveCount(0);
    await expect(page.getByText('An unhandled error has occurred.')).not.toBeVisible();
    await expect(page.locator('.page-status')).toHaveText(statusText(1));
    await demo.highlight(page.locator('.catalog-product').first(), 'first catalog page without a page parameter');
  });
  await test.step('Names equal those of ?page=1', async () => {
    expect(names).toEqual(await firstPageNames(page));
  });
});

test('TC-BUG-12-08 ?page=2 shows the second page, different from the first', async ({ page, demo }) => {
  const firstNames = await test.step('Open /?page=1 and read the names', () => firstPageNames(page));
  await test.step('Open /?page=2', async () => {
    await openPage(page, '?page=2');
  });
  await test.step('Nine different products, page 2 of 12 active, Previous links to page 1', async () => {
    await expect(page.locator('.catalog-product')).toHaveCount(PAGE_SIZE);
    await expect(page.getByText('An unhandled error has occurred.')).not.toBeVisible();
    const secondNames = await productNames(page);
    expect(secondNames).toHaveLength(PAGE_SIZE);
    for (const name of secondNames) expect(firstNames).not.toContain(name);
    await expect(page.locator('.page-status')).toHaveText(statusText(2));
    await expect(page.locator('.page-number.active-page')).toHaveText('2');
    const prev = await page.locator('a.page-nav[rel="prev"]').getAttribute('href');
    expect(prev).not.toContain('page=');
    await demo.highlight(page.locator('nav.catalog-pagination'), 'page 2 of 12 active');
  });
});

test('TC-BUG-12-09 ?page=12 shows the last page with 2 items', async ({ page, demo }) => {
  await test.step('Open /?page=12', async () => {
    await openPage(page, '?page=12');
  });
  await test.step('Two cards, no error bar, 12 of 12, no Next link', async () => {
    await expect(page.locator('.catalog-product')).toHaveCount(LAST_PAGE_ITEMS);
    await expect(page.getByText('An unhandled error has occurred.')).not.toBeVisible();
    await expect(page.locator('.page-status')).toHaveText(statusText(12));
    await expect(page.locator('a.page-nav[rel="next"]')).toHaveCount(0);
    await demo.highlight(page.locator('nav.catalog-pagination'), 'last page 12 of 12');
  });
});
