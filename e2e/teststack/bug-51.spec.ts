import type { Page } from '@playwright/test';
import { test, expect, type Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-51: a catalog page number past the last page of the current (filtered) result shows that result's last
// page, and the pager never reads a current page above the number of pages. Scenario `bug-51`
// (.factory/stack/scenarios/bug-51): the 101-product demo catalog of `default`, 9 per page, browsed anonymously.
test.describe.configure({ mode: 'serial' });
// Each case narrates several highlights (2 s each) across two page loads.
test.setTimeout(90_000);

test.beforeAll(() => {
  loadScenario('bug-51');
});

/** Opens the catalog at `/?<query>` and waits until the streamed result (products or the empty state) has rendered. */
async function openCatalog(page: Page, demo: Demo, query: string) {
  await test.step(`open /?${query}`, async () => {
    await page.goto(`${BASE_URL}/?${query}`);
    await expect(page.locator('.catalog-count, .catalog-empty').first()).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
  });
}

const count = (page: Page) => page.locator('.catalog-count');
const products = (page: Page) => page.locator('.catalog-items .catalog-item');
const productNames = (page: Page) => page.locator('.catalog-items .catalog-item .name');
const pager = (page: Page) => page.getByRole('navigation', { name: 'Catalog pages' });
const pageStatus = (page: Page) => pager(page).locator('.page-status');
const activePage = (page: Page) => pager(page).locator('[aria-current="page"]');
const nextLink = (page: Page) => pager(page).getByRole('link', { name: 'Next page' });
const prevLink = (page: Page) => pager(page).getByRole('link', { name: 'Previous page' });
const disabledNav = (page: Page, label: 'Prev' | 'Next') =>
  pager(page).locator('.page-nav.is-disabled', { hasText: label });

/**
 * The page's whole text, hidden elements included (the pager's "N / M" status shows only on narrow screens), with
 * every run of whitespace (its &nbsp; included) collapsed to one space.
 */
async function bodyText(page: Page) {
  return ((await page.locator('body').textContent()) ?? '').replace(/\s+/g, ' ');
}

/** Asserts the pager's "N / M" status text and narrates it, since the status is not displayed at desktop width. */
async function expectPageStatus(page: Page, demo: Demo, status: string) {
  await expect(pageStatus(page)).toHaveText(status);
  await demo.caption(`Pager status text: "${(await pageStatus(page).textContent())!.replace(/\s+/g, ' ')}"`);
}

/** Opens `/?<query>` and returns the product names it lists, in order (step 1 of the past-the-end cases). */
async function recordLastPage(page: Page, demo: Demo, query: string, expectedCount: number) {
  await openCatalog(page, demo, query);
  return test.step(`record the ${expectedCount} product names on /?${query}`, async () => {
    await expect(products(page)).toHaveCount(expectedCount);
    const names = await productNames(page).allTextContents();
    await demo.highlight(page.locator('.catalog-items'), `/?${query}: ${names.join(', ')}`);
    return names;
  });
}

/** Asserts the pager reads "<current> / <total>", marks <current> active and has no Next link. */
async function expectPagerAtLastPage(page: Page, demo: Demo, current: number, total: number) {
  await expectPageStatus(page, demo, `${current} / ${total}`);
  await expect(activePage(page)).toHaveText(String(current));
  await expect(nextLink(page)).toHaveCount(0);
  await expect(disabledNav(page, 'Next')).toBeVisible();
  await demo.highlight(pager(page), `pager reads "${current} / ${total}", Next disabled`);
}

test('TC-BUG-51-01 the catalog\'s last page /?page=12 lists 2 products with the pager at "12 / 12"', async ({ page, demo }) => {
  await openCatalog(page, demo, 'page=12');

  await test.step('the toolbar reads "101 products"', async () => {
    await expect(count(page)).toHaveText('101 products');
    await demo.highlight(count(page), '101 products');
  });

  await test.step('exactly 2 products are listed', async () => {
    await expect(products(page)).toHaveCount(2);
    const names = await productNames(page).allTextContents();
    await demo.highlight(page.locator('.catalog-items'), `2 products: ${names.join(', ')}`);
  });

  await test.step('the pager reads "12 / 12" with 12 active, Next disabled and Prev linking to /?page=11', async () => {
    await expectPageStatus(page, demo, '12 / 12');
    await expect(activePage(page)).toHaveText('12');
    await expect(nextLink(page)).toHaveCount(0);
    await expect(disabledNav(page, 'Next')).toBeVisible();
    await expect(prevLink(page)).toHaveAttribute('href', `${BASE_URL}/?page=11`);
    await demo.highlight(pager(page), 'pager "12 / 12", Next disabled, Prev -> /?page=11');
  });
});

test('TC-BUG-51-02 /?page=1 lists 9 products with the pager at "1 / 12"', async ({ page, demo }) => {
  await openCatalog(page, demo, 'page=1');

  await test.step('the toolbar reads "101 products"', async () => {
    await expect(count(page)).toHaveText('101 products');
    await demo.highlight(count(page), '101 products');
  });

  await test.step('exactly 9 products are listed', async () => {
    await expect(products(page)).toHaveCount(9);
    await demo.highlight(products(page).first(), 'first of 9 products');
    await demo.highlight(products(page).last(), 'ninth of 9 products');
  });

  await test.step('the pager reads "1 / 12" with 1 active, Prev disabled and Next linking to /?page=2', async () => {
    await expectPageStatus(page, demo, '1 / 12');
    await expect(activePage(page)).toHaveText('1');
    await expect(prevLink(page)).toHaveCount(0);
    await expect(disabledNav(page, 'Prev')).toBeVisible();
    await expect(nextLink(page)).toHaveAttribute('href', `${BASE_URL}/?page=2`);
    await demo.highlight(pager(page), 'pager "1 / 12", Prev disabled, Next -> /?page=2');
  });
});

/** TC-BUG-51-03, -04 and -05: an unfiltered page number past page 12 shows exactly what /?page=12 shows. */
for (const { id, pageNumber, title } of [
  { id: 'TC-BUG-51-03', pageNumber: '50', title: '/?page=50 shows the catalog\'s last page with the pager at "12 / 12"' },
  { id: 'TC-BUG-51-04', pageNumber: '13', title: '/?page=13, one past the last page, shows the last page' },
  { id: 'TC-BUG-51-05', pageNumber: '2147483647', title: '/?page=2147483647 shows the last page' },
]) {
  test(`${id} ${title}`, async ({ page, demo }) => {
    const lastPageNames = await recordLastPage(page, demo, 'page=12', 2);

    await openCatalog(page, demo, `page=${pageNumber}`);

    await test.step('the catalog renders, with no error page or unhandled-error banner', async () => {
      await expect(page.getByText('An unhandled error has occurred')).toBeHidden();
      await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    });

    await test.step('the toolbar reads "101 products"', async () => {
      await expect(count(page)).toHaveText('101 products');
      await demo.highlight(count(page), `/?page=${pageNumber}: 101 products`);
    });

    await test.step('exactly the 2 products of /?page=12 are listed, in the same order', async () => {
      await expect(products(page)).toHaveCount(2);
      await expect(productNames(page)).toHaveText(lastPageNames);
      await demo.highlight(page.locator('.catalog-items'), `same as /?page=12: ${lastPageNames.join(', ')}`);
    });

    await test.step(`the pager reads "12 / 12" with 12 active and Next disabled; "${pageNumber} / 12" is nowhere`, async () => {
      await expectPagerAtLastPage(page, demo, 12, 12);
      expect(await bodyText(page)).not.toContain(`${pageNumber} / 12`);
    });
  });
}

test('TC-BUG-51-06 a brand filter past its last page shows that filter\'s last page', async ({ page, demo }) => {
  const lastPageNames = await test.step('step 1: /?brand=2&page=2 lists 2 of 11 products with the pager at "2 / 2"', async () => {
    const names = await recordLastPage(page, demo, 'brand=2&page=2', 2);
    await expect(count(page)).toHaveText('11 products');
    await expectPageStatus(page, demo, '2 / 2');
    await demo.highlight(pager(page), 'in range: 11 products, pager "2 / 2"');
    return names;
  });

  await openCatalog(page, demo, 'brand=2&page=5');

  await test.step('step 2: the toolbar reads "11 products" and the same 2 products are listed', async () => {
    await expect(count(page)).toHaveText('11 products');
    await demo.highlight(count(page), '/?brand=2&page=5: 11 products');
    await expect(products(page)).toHaveCount(2);
    await expect(productNames(page)).toHaveText(lastPageNames);
    await demo.highlight(page.locator('.catalog-items'), `same as /?brand=2&page=2: ${lastPageNames.join(', ')}`);
  });

  await test.step('step 2: the pager reads "2 / 2" with 2 active and Next disabled; "5 / 2" is nowhere', async () => {
    await expectPagerAtLastPage(page, demo, 2, 2);
    expect(await bodyText(page)).not.toContain('5 / 2');
  });

  await test.step('step 2: the brand filter Gravitator stays selected', async () => {
    const activeBrand = page.locator('.catalog-search-group', { has: page.getByRole('heading', { name: 'Brand' }) }).locator('.catalog-search-tag.active');
    await expect(activeBrand).toHaveCount(1);
    await expect(activeBrand.locator('span').first()).toHaveText('Gravitator');
    await demo.highlight(activeBrand, 'brand filter Gravitator still selected');
  });
});

test('TC-BUG-51-07 a type filter past its last page shows that filter\'s last page', async ({ page, demo }) => {
  const lastPageNames = await test.step('step 1: /?type=3&page=2 lists 9 of 18 products with the pager at "2 / 2"', async () => {
    const names = await recordLastPage(page, demo, 'type=3&page=2', 9);
    await expect(count(page)).toHaveText('18 products');
    await expectPageStatus(page, demo, '2 / 2');
    await demo.highlight(pager(page), 'in range: 18 products, pager "2 / 2"');
    return names;
  });

  await openCatalog(page, demo, 'type=3&page=9');

  await test.step('step 2: the toolbar reads "18 products" and the same 9 products are listed', async () => {
    await expect(count(page)).toHaveText('18 products');
    await demo.highlight(count(page), '/?type=3&page=9: 18 products');
    await expect(products(page)).toHaveCount(9);
    await expect(productNames(page)).toHaveText(lastPageNames);
    await demo.highlight(products(page).first(), `first of 9, same as /?type=3&page=2: ${lastPageNames[0]}`);
    await demo.highlight(products(page).last(), `ninth of 9, same as /?type=3&page=2: ${lastPageNames[8]}`);
  });

  await test.step('step 2: the pager reads "2 / 2" with 2 active and Next disabled; "9 / 2" is nowhere', async () => {
    await expectPagerAtLastPage(page, demo, 2, 2);
    expect(await bodyText(page)).not.toContain('9 / 2');
  });

  await test.step('step 2: the type filter Ski/boarding stays selected', async () => {
    const activeType = page.locator('.catalog-search-group', { has: page.getByRole('heading', { name: 'Type' }) }).locator('.catalog-search-tag.active');
    await expect(activeType).toHaveCount(1);
    await expect(activeType.locator('span').first()).toHaveText('Ski/boarding');
    await demo.highlight(activeType, 'type filter Ski/boarding still selected');
  });
});

test('TC-BUG-51-08 a one-page brand filter with a page past the end shows its products and no pager', async ({ page, demo }) => {
  await openCatalog(page, demo, 'brand=7&page=3');

  await test.step('the toolbar reads "9 products"', async () => {
    await expect(count(page)).toHaveText('9 products');
    await demo.highlight(count(page), '/?brand=7&page=3: 9 products');
  });

  await test.step('exactly 9 products are listed', async () => {
    await expect(products(page)).toHaveCount(9);
    await demo.highlight(products(page).first(), 'first of 9 products');
    await demo.highlight(products(page).last(), 'ninth of 9 products');
  });

  await test.step('no "Catalog pages" navigation is rendered and "3 / 1" is nowhere', async () => {
    await expect(pager(page)).toHaveCount(0);
    expect(await bodyText(page)).not.toContain('3 / 1');
    await demo.absent(products(page).last(), 'no pager below the last row');
  });
});

test('TC-BUG-51-09 a filter matching nothing with a page past the end keeps the no-products state', async ({ page, demo }) => {
  await openCatalog(page, demo, 'brand=13&type=8&page=50');

  await test.step('the heading "No products match these filters" and the "Clear all filters" link are shown', async () => {
    const empty = page.locator('.catalog-empty');
    await expect(empty.getByRole('heading', { name: 'No products match these filters', exact: true })).toBeVisible();
    await expect(empty.getByRole('link', { name: 'Clear all filters', exact: true })).toBeVisible();
    await demo.highlight(empty, 'No products match these filters + Clear all filters');
  });

  await test.step('no product count, sort control, product cards or pager are rendered', async () => {
    await expect(count(page)).toHaveCount(0);
    await expect(page.locator('[data-catalog-sort]')).toHaveCount(0);
    await expect(products(page)).toHaveCount(0);
    await expect(pager(page)).toHaveCount(0);
    await demo.absent(page.locator('.catalog-empty'), 'no count, sort, cards or pager');
  });
});
