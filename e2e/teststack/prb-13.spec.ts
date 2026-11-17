import { Locator, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// PRB-13: a "Surprise me" link in the catalog's filter panel opens the product page (/item/{id}) of a random
// product among those the current brand/type filters list, and is hidden when the filters list no product.
// Scenario `prb-13` (.factory/stack/scenarios/prb-13): the default catalog, browsed anonymously.
// The repeated-click cases and the page-wide check of TC-PRB-13-08 hold many highlights, beyond the 30 s default.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const SURPRISE = 'Surprise me';
const ITEM_PATH = /\/item\/(\d+)$/;
const TOTAL_PRODUCTS = 101;
const XE = 'XE';
const XE_PRODUCTS = ['Survivor 2-Person Tent', 'Pathfinder GPS Watch', 'Nomad 2-Person Tent'];
const CYCLING = 'Cycling';
const NAVIGATION = 'Navigation';
const CLIMBING = 'Climbing';
const PATHFINDER = 'Pathfinder GPS Watch';

test.beforeAll(() => {
  loadScenario('prb-13');
});

const filterPanel = (page: Page) => page.locator('aside.catalog-search');
const surpriseLink = (page: Page) => filterPanel(page).getByRole('link', { name: SURPRISE, exact: true });
const filterGroup = (page: Page, heading: 'Brand' | 'Type') =>
  filterPanel(page).locator('.catalog-search-group').filter({ has: page.getByRole('heading', { name: heading, exact: true }) });
/** The brand or type tag whose label (first span) is exactly `label`. */
const filterTag = (page: Page, heading: 'Brand' | 'Type', label: string) =>
  filterGroup(page, heading).locator('a.catalog-search-tag').filter({ has: page.locator('span:first-child', { hasText: new RegExp(`^${label}$`) }) });
const catalogCount = (page: Page) => page.locator('.catalog-count');
const productCards = (page: Page) => page.locator('.catalog-items .catalog-item');
/** The page header h1: the product's name on a product page. */
const pageHeading = (page: Page) => page.locator('.eshop-hero-intro h1');
const pageSubtitle = (page: Page) => page.locator('.eshop-hero-intro p');

async function hrefOf(link: Locator): Promise<URL> {
  const href = await link.getAttribute('href');
  expect(href).not.toBeNull();
  return new URL(href!, BASE_URL);
}

async function openCatalog(page: Page) {
  await page.goto(BASE_URL!);
  await expect(catalogCount(page)).toHaveText(`${TOTAL_PRODUCTS} products`);
}

async function selectFilter(page: Page, heading: 'Brand' | 'Type', label: string, expectedCount: string) {
  await test.step(`select ${heading.toLowerCase()} "${label}" in the ${heading} filter`, async () => {
    await filterTag(page, heading, label).click();
    await expect(filterTag(page, heading, label)).toHaveClass(/\bactive\b/);
    await expect(catalogCount(page)).toHaveText(expectedCount);
  });
}

/** Waits until the page has loaded, its fonts and images are ready and the browser has painted it, so keyframes
 * and captions show the new page rather than a blank or half-patched one. */
async function settle(page: Page) {
  await page.waitForLoadState('load');
  // Enhanced navigation streams the new page in and patches the DOM until its fetch ends.
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.race([
      Promise.all(Array.from(document.images).filter(img => !img.complete)
        .map(img => new Promise(resolve => { img.onload = img.onerror = resolve; }))),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

/** Clicks "Surprise me" and waits for the product page; returns its id and heading. */
async function clickSurprise(page: Page): Promise<{ id: number; name: string; url: string }> {
  await surpriseLink(page).click();
  await expect(page).toHaveURL(ITEM_PATH);
  await expect(pageHeading(page)).not.toHaveText('');
  await expect(page.locator('.item-page')).toBeVisible();
  await settle(page);
  await expect(pageHeading(page)).toBeVisible();
  const id = Number(ITEM_PATH.exec(new URL(page.url()).pathname)![1]);
  return { id, name: (await pageHeading(page).innerText()).trim(), url: page.url() };
}

/** Back from the product page to the filtered catalog the click started from. */
async function backToCatalog(page: Page, catalogUrl: string, expectedCount: string) {
  await page.goBack();
  await expect(page).toHaveURL(catalogUrl);
  await expect(catalogCount(page)).toHaveText(expectedCount);
  await expect(surpriseLink(page)).toBeVisible();
}

test('TC-PRB-13-01 "Surprise me" link is shown in the filter panel of the unfiltered catalog', async ({ page, demo }) => {
  await test.step('open the catalog page / with no query string', async () => {
    await openCatalog(page);
    await demo.caption(`Opened ${page.url()}`);
  });
  await test.step('exactly one "Surprise me" link, in the filter panel after the Brand and Type groups, pointing to /surprise', async () => {
    await expect(page.getByRole('link', { name: SURPRISE, exact: true })).toHaveCount(1);
    const link = surpriseLink(page);
    await expect(link).toBeVisible();
    const order = await link.evaluate(el => {
      const panel = el.closest('aside.catalog-search')!;
      const headings = Array.from(panel.querySelectorAll('h3')).map(h => h.textContent!.trim());
      const precedes = (text: string) => {
        const h = Array.from(panel.querySelectorAll('h3')).find(x => x.textContent!.trim() === text);
        return !!h && (h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      };
      return { headings, brandBefore: precedes('Brand'), typeBefore: precedes('Type') };
    });
    expect(order.headings).toEqual(['Brand', 'Type']);
    expect(order.brandBefore).toBe(true);
    expect(order.typeBefore).toBe(true);
    const href = await hrefOf(link);
    expect(href.pathname).toBe('/surprise');
    expect(href.searchParams.has('brand')).toBe(false);
    expect(href.searchParams.has('type')).toBe(false);
    await demo.caption(`href = ${href.pathname}${href.search} (no brand, no type)`);
    await demo.highlight(filterGroup(page, 'Type'), 'Type filter group, above the link');
    await demo.highlight(link, '"Surprise me" below the Brand and Type filters');
    await demo.caption('');
  });
});

test('TC-PRB-13-02 without filters, "Surprise me" opens the product page of a catalog product', async ({ page, request, demo }) => {
  await test.step('open the catalog page / with no filter selected', async () => {
    await openCatalog(page);
    await demo.highlight(surpriseLink(page), 'No filter selected: click "Surprise me"');
  });
  const opened = await test.step('click the "Surprise me" link', () => clickSurprise(page));
  await test.step('the product page /item/<id> (1-101) shows the name the Catalog API returns for that id', async () => {
    expect(opened.id).toBeGreaterThanOrEqual(1);
    expect(opened.id).toBeLessThanOrEqual(TOTAL_PRODUCTS);
    const itemUrl = new URL(`/api/catalog/items/${opened.id}`, url('catalog'));
    itemUrl.searchParams.set('api-version', '1.0');
    const response = await request.get(itemUrl.href);
    expect(response.status()).toBe(200);
    const item = await response.json();
    expect(opened.name).toBe(item.name);
    await expect(pageHeading(page)).toHaveText(item.name);
    await expect(pageHeading(page)).not.toHaveText('Not found');
    await expect(page.locator('.item-notfound')).toHaveCount(0);
    await expect(page.locator('h1, h2').filter({ hasText: /not found|error/i })).toHaveCount(0);
    await expect(page).toHaveTitle(`${item.name} | AdventureWorks`);
    await demo.caption(`Landed on ${page.url()} (API name: ${item.name})`);
    await demo.highlight(pageHeading(page), `Product page of item ${opened.id}: ${item.name}`);
    await demo.caption('');
  });
});

test('TC-PRB-13-03 repeated "Surprise me" clicks open different products', async ({ page, demo }) => {
  const ids: number[] = [];
  for (let i = 1; i <= 10; i++) {
    await test.step(`click ${i} of 10: open /, click "Surprise me" and record the item id`, async () => {
      await openCatalog(page);
      const opened = await clickSurprise(page);
      expect(opened.id).toBeGreaterThanOrEqual(1);
      expect(opened.id).toBeLessThanOrEqual(TOTAL_PRODUCTS);
      ids.push(opened.id);
      await demo.caption(`Click ${i}: ${new URL(opened.url).pathname}`);
      await demo.highlight(pageHeading(page), `Click ${i}: item ${opened.id}`, 800);
    });
  }
  await test.step('the 10 recorded ids contain at least 2 distinct values', async () => {
    expect(ids).toHaveLength(10);
    const distinct = new Set(ids);
    expect(distinct.size).toBeGreaterThanOrEqual(2);
    await demo.caption(`Ids: ${ids.join(', ')} -> ${distinct.size} distinct`);
    await demo.highlight(pageHeading(page), `${distinct.size} distinct products in 10 clicks`);
    await demo.caption('');
  });
});

test('TC-PRB-13-04 with a brand selected, every surprise product belongs to that brand', async ({ page, demo }) => {
  let xeId = '';
  let catalogUrl = '';
  await test.step('open / and select the brand "XE" (no type)', async () => {
    await openCatalog(page);
    xeId = (await hrefOf(filterTag(page, 'Brand', XE))).searchParams.get('brand')!;
    await selectFilter(page, 'Brand', XE, '3 products');
    await expect(filterTag(page, 'Type', 'All')).toHaveClass(/\bactive\b/);
    catalogUrl = page.url();
  });
  await test.step('the catalog shows "3 products" and the link carries the XE brand id', async () => {
    await expect(catalogCount(page)).toHaveText('3 products');
    await expect(productCards(page)).toHaveCount(3);
    expect((await productCards(page).locator('.name').allInnerTexts()).map(n => n.trim()).sort()).toEqual([...XE_PRODUCTS].sort());
    const href = await hrefOf(surpriseLink(page));
    expect(href.pathname).toBe('/surprise');
    expect(href.searchParams.getAll('brand')).toEqual([xeId]);
    expect(href.searchParams.has('type')).toBe(false);
    await demo.caption(`Brand XE: ${catalogUrl} -> link ${href.pathname}${href.search}`);
    await demo.highlight(catalogCount(page), 'Brand XE: 3 products');
    await demo.highlight(surpriseLink(page), `"Surprise me" with brand=${xeId}`);
  });
  for (let i = 1; i <= 8; i++) {
    await test.step(`click ${i} of 8: "Surprise me" opens one of the 3 XE products`, async () => {
      const opened = await clickSurprise(page);
      expect(XE_PRODUCTS).toContain(opened.name);
      await expect(pageSubtitle(page)).toHaveText(XE);
      await demo.caption(`Click ${i}: ${new URL(opened.url).pathname}`);
      await demo.highlight(pageHeading(page), `Click ${i}: ${opened.name} (brand XE)`, 800);
      await backToCatalog(page, catalogUrl, '3 products');
    });
  }
});

test('TC-PRB-13-05 with a type selected, every surprise product is one the filtered list shows', async ({ page, demo }) => {
  let cyclingId = '';
  let catalogUrl = '';
  let names: string[] = [];
  await test.step('open / and select the type "Cycling" (no brand)', async () => {
    await openCatalog(page);
    cyclingId = (await hrefOf(filterTag(page, 'Type', CYCLING))).searchParams.get('type')!;
    await selectFilter(page, 'Type', CYCLING, '9 products');
    await expect(filterTag(page, 'Brand', 'All')).toHaveClass(/\bactive\b/);
    catalogUrl = page.url();
  });
  await test.step('the catalog shows "9 products"; record the 9 names listed', async () => {
    await expect(catalogCount(page)).toHaveText('9 products');
    await expect(productCards(page)).toHaveCount(9);
    names = (await productCards(page).locator('.name').allInnerTexts()).map(n => n.trim());
    expect(names).toHaveLength(9);
    const href = await hrefOf(surpriseLink(page));
    expect(href.pathname).toBe('/surprise');
    expect(href.searchParams.getAll('type')).toEqual([cyclingId]);
    expect(href.searchParams.has('brand')).toBe(false);
    await demo.caption(`Type Cycling: link ${href.pathname}${href.search}`);
    await demo.highlight(page.locator('.catalog-items'), 'Type Cycling: the 9 products listed');
    await demo.highlight(surpriseLink(page), `"Surprise me" with type=${cyclingId}`);
  });
  for (let i = 1; i <= 8; i++) {
    await test.step(`click ${i} of 8: "Surprise me" opens one of the 9 listed products`, async () => {
      const opened = await clickSurprise(page);
      expect(names).toContain(opened.name);
      await demo.caption(`Click ${i}: ${new URL(opened.url).pathname}`);
      await demo.highlight(pageHeading(page), `Click ${i}: ${opened.name} (listed under Cycling)`, 800);
      await backToCatalog(page, catalogUrl, '9 products');
    });
  }
});

test('TC-PRB-13-06 with brand and type selected that list one product, "Surprise me" always opens that product', async ({ page, demo }) => {
  let catalogUrl = '';
  await test.step('open / and select brand "XE" and type "Navigation"', async () => {
    await openCatalog(page);
    await selectFilter(page, 'Brand', XE, '3 products');
    await selectFilter(page, 'Type', NAVIGATION, '1 product');
    catalogUrl = page.url();
  });
  await test.step('the catalog shows "1 product" and the "Surprise me" link is visible', async () => {
    await expect(catalogCount(page)).toHaveText('1 product');
    await expect(surpriseLink(page)).toBeVisible();
    await demo.caption(`Opened ${catalogUrl}`);
    await demo.highlight(catalogCount(page), 'XE + Navigation: 1 product');
    await demo.highlight(surpriseLink(page), '"Surprise me" still shown for 1 product');
  });
  const urls: string[] = [];
  for (let i = 1; i <= 3; i++) {
    await test.step(`click ${i} of 3: "Surprise me" opens "${PATHFINDER}"`, async () => {
      const opened = await clickSurprise(page);
      expect(opened.name).toBe(PATHFINDER);
      urls.push(opened.url);
      await demo.caption(`Click ${i}: ${new URL(opened.url).pathname}`);
      await demo.highlight(pageHeading(page), `Click ${i}: ${PATHFINDER}`, 800);
      await backToCatalog(page, catalogUrl, '1 product');
    });
  }
  await test.step('all 3 clicks ended on the same /item/<id> page', async () => {
    expect(urls).toHaveLength(3);
    expect(new Set(urls).size).toBe(1);
  });
});

test('TC-PRB-13-07 filters that list no product hide the "Surprise me" link', async ({ page, demo }) => {
  let xeId = '';
  let climbingId = '';
  await test.step('read the XE brand id and the Climbing type id from the filter tags on /', async () => {
    await openCatalog(page);
    xeId = (await hrefOf(filterTag(page, 'Brand', XE))).searchParams.get('brand')!;
    climbingId = (await hrefOf(filterTag(page, 'Type', CLIMBING))).searchParams.get('type')!;
    expect(xeId).toMatch(/^\d+$/);
    expect(climbingId).toMatch(/^\d+$/);
  });
  await test.step(`open /?brand=${xeId}&type=${climbingId} directly`, async () => {
    await page.goto(`${BASE_URL}/?brand=${xeId}&type=${climbingId}`);
    await demo.caption(`Opened ${page.url()}`);
  });
  await test.step('"No products match these filters", no "Surprise me", XE and Climbing still active', async () => {
    const empty = page.getByRole('heading', { name: 'No products match these filters', exact: true });
    await expect(empty).toBeVisible();
    await expect(filterTag(page, 'Brand', XE)).toHaveClass(/\bactive\b/);
    await expect(filterTag(page, 'Type', CLIMBING)).toHaveClass(/\bactive\b/);
    await expect(page.getByRole('link', { name: SURPRISE })).toHaveCount(0);
    await expect(page.getByText(SURPRISE)).toHaveCount(0);
    await demo.highlight(empty, 'XE + Climbing: no products');
    await demo.highlight(filterTag(page, 'Brand', XE), 'Brand XE active');
    await demo.highlight(filterTag(page, 'Type', CLIMBING), 'Type Climbing active');
    await demo.caption('');
    // Centre the Type group so its bottom edge, where the link would follow, is in the frame.
    await filterGroup(page, 'Type').evaluate(el => el.scrollIntoView({ block: 'center' }));
    await demo.absent(filterGroup(page, 'Type'), 'No "Surprise me" link below the filters');
  });
});

test('TC-PRB-13-08 the rest of the catalog page is unchanged', async ({ page, demo }) => {
  /** The filter panel's links that are not a brand tag, a type tag or "Clear all filters". */
  const otherPanelLinks = () => filterPanel(page).locator('a:not(.catalog-search-tag):not(.catalog-search-clear)');

  await test.step('open the catalog page / with no filter', async () => {
    await openCatalog(page);
    await demo.caption(`Opened ${page.url()}`);
  });
  await test.step('header, filters, count, 9 cards and paging on page 1 are as before', async () => {
    const header = page.locator('header.eshop-topbar');
    await expect(header).toBeVisible();
    await expect(header.getByRole('img', { name: 'AdventureWorks' })).toBeVisible();
    await expect(header.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Shop all', exact: true })).toBeVisible();
    await demo.highlight(header, 'Header: logo and navigation');

    const brandTags = filterGroup(page, 'Brand').locator('a.catalog-search-tag');
    const typeTags = filterGroup(page, 'Type').locator('a.catalog-search-tag');
    await expect(brandTags).toHaveCount(14);
    await expect(typeTags).toHaveCount(9);
    await expect(brandTags.first().locator('span').first()).toHaveText('All');
    await expect(typeTags.first().locator('span').first()).toHaveText('All');
    await expect(filterTag(page, 'Brand', 'All')).toHaveClass(/\bactive\b/);
    await expect(filterTag(page, 'Type', 'All')).toHaveClass(/\bactive\b/);
    await expect(filterPanel(page).getByRole('link', { name: 'Clear all filters' })).toHaveCount(0);
    await demo.highlight(filterGroup(page, 'Brand'), 'Brand: All + 13 brands, All active');
    await demo.highlight(filterGroup(page, 'Type'), 'Type: All + 8 types, All active');

    await expect(otherPanelLinks()).toHaveCount(1);
    await expect(otherPanelLinks()).toHaveText(SURPRISE);

    await expect(catalogCount(page)).toHaveText('101 products');
    await expect(productCards(page)).toHaveCount(9);
    await demo.highlight(catalogCount(page), '101 products');
    await demo.highlight(productCards(page).last(), '9 product cards on page 1');

    const pager = page.getByRole('navigation', { name: 'Catalog pages' });
    await expect(pager.locator('[aria-current="page"]')).toHaveText('1');
    await expect(pager.getByRole('link', { name: '2', exact: true })).toBeVisible();
    await demo.highlight(pager, 'Paging: page 1 current, link to page 2');
  });
  await test.step('click page number "2" in the paging control', async () => {
    await page.getByRole('navigation', { name: 'Catalog pages' }).getByRole('link', { name: '2', exact: true }).click();
    await expect(page).toHaveURL(/[?&]page=2\b/);
    const pager = page.getByRole('navigation', { name: 'Catalog pages' });
    await expect(pager.locator('[aria-current="page"]')).toHaveText('2');
    // The click's own result, before any reload: nine cards and the link after enhanced navigation.
    await expect(productCards(page)).toHaveCount(9);
    await expect(surpriseLink(page)).toBeVisible();
    await expect(otherPanelLinks()).toHaveCount(1);
    await expect(otherPanelLinks()).toHaveText(SURPRISE);
    // Blazor's enhanced navigation rewrites <html>'s children and drops the recorder's caption layer with them;
    // reloading the URL the click reached gives a fresh document so the caption naming it is recorded.
    const reached = page.url();
    await page.reload();
    await expect(page).toHaveURL(reached);
    await expect(pager.locator('[aria-current="page"]')).toHaveText('2');
    await settle(page);
    await demo.caption(`Now on ${page.url()}`);
  });
  await test.step('page 2 is current, 9 cards, and "Surprise me" is still the only other filter-panel link', async () => {
    const pager = page.getByRole('navigation', { name: 'Catalog pages' });
    const current = new URL(page.url());
    await expect(pager.locator('[aria-current="page"]')).toHaveText('2');
    await expect(productCards(page)).toHaveCount(9);
    await expect(surpriseLink(page)).toBeVisible();
    await expect(otherPanelLinks()).toHaveCount(1);
    await expect(otherPanelLinks()).toHaveText(SURPRISE);
    await demo.highlight(pager, `Paging: page 2 current (${current.pathname}${current.search})`);
    await demo.highlight(productCards(page).last(), '9 product cards on page 2');
    await demo.highlight(surpriseLink(page), '"Surprise me" still in the filter panel');
    await demo.caption('');
  });
});
