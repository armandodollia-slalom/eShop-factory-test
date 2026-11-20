import type { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BRAND-2: from a brand card on /brands to the catalog filtered to that brand, and the "Brand: <name>" header.
// Scenario `brand-2` (.factory/stack/scenarios/brand-2) is the demo catalog of `default`: 13 brands, 101 items,
// Daybird (id 1) 10 items, Gravitator (id 2) 11 items. TC-BRAND-2-10 needs a brand without products, which only
// scenario `brand-1` has (brand 14 "Acme Empty", brand 15 "Mono Gear" with one item), so it loads that one.
// Each case holds several highlights on screen, which together come close to the default 30 s timeout.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const USUAL_TITLE = 'Ready for a new adventure?';
const USUAL_SUBTITLE = 'Start the season with the latest in clothing and equipment.';

const heroTitle = (page: Page) => page.locator('.eshop-hero-intro h1');
const heroSubtitle = (page: Page) => page.locator('.eshop-hero-intro p');
const toolbarCount = (page: Page) => page.locator('.catalog-toolbar .catalog-count');
const brandGroup = (page: Page) =>
  page.locator('.catalog-search-group', { has: page.getByRole('heading', { name: 'Brand', exact: true }) });
const brandTag = (page: Page, name: string) =>
  brandGroup(page).locator('a.catalog-search-tag').filter({ has: page.getByText(name, { exact: true }) });
const brandCards = (page: Page) => page.locator('article.brand-card');
const brandCard = (page: Page, name: string) =>
  brandCards(page).filter({ has: page.getByRole('heading', { name, exact: true }) });
const enclosingLink = (page: Page, name: string) => brandCard(page, name).locator('xpath=ancestor::a');
const productNames = (page: Page) => page.locator('.catalog-items .catalog-item .name');
const ACTIVE = /(^|\s)active(\s|$)/;

function currentUrl(page: Page) {
  return new URL(page.url());
}

async function expectOnCatalogFilteredTo(page: Page, brandId: string) {
  await expect(page).toHaveURL((u) => u.pathname === '/' && u.searchParams.getAll('brand').join(',') === brandId);
  const u = currentUrl(page);
  expect(u.pathname).toBe('/');
  expect(u.searchParams.getAll('brand')).toEqual([brandId]);
}

test.describe('demo catalog (scenario brand-2)', () => {
  test.beforeAll(() => {
    loadScenario('brand-2');
  });

  test('TC-BRAND-2-01 selecting the Daybird card opens the catalog filtered to Daybird', async ({ page, demo }) => {
    await test.step('open /brands', async () => {
      await page.goto(`${BASE_URL}/brands`);
      await expect(brandCards(page)).toHaveCount(13);
      await demo.caption(`Opened ${currentUrl(page).pathname}`);
    });
    await test.step('click the card whose heading is "Daybird"', async () => {
      const card = brandCard(page, 'Daybird');
      await demo.highlight(card, 'Click the Daybird card');
      await card.click();
      await expectOnCatalogFilteredTo(page, '1');
      await demo.caption(`Now at ${currentUrl(page).pathname}${currentUrl(page).search}`);
    });
    await test.step('the catalog lists 10 products with only Daybird active in the Brand filter', async () => {
      await expect(toolbarCount(page)).toHaveText('10 products');
      await demo.highlight(toolbarCount(page), '10 products');
      await expect(brandTag(page, 'Daybird')).toHaveClass(ACTIVE);
      await expect(brandTag(page, 'All')).not.toHaveClass(ACTIVE);
      const active = brandGroup(page).locator('a.catalog-search-tag.active');
      await expect(active).toHaveCount(1);
      await expect(active.getByText('Daybird', { exact: true })).toHaveCount(1);
      await demo.highlight(brandTag(page, 'Daybird'), 'Brand filter: only "Daybird" active, "All" not');
    });
  });

  test('TC-BRAND-2-02 the Gravitator card applies the same filter as the Brand filter tag', async ({ page, demo }) => {
    type Journey = { path: string; query: string; toolbar: string; names: string[] };
    const record = async (): Promise<Journey> => {
      const u = currentUrl(page);
      return {
        path: u.pathname,
        query: u.search,
        toolbar: ((await toolbarCount(page).textContent()) ?? '').trim(),
        names: (await productNames(page).allTextContents()).map((n) => n.trim()),
      };
    };
    // One frame per grid row so every page-1 name is on screen and readable.
    const showRows = async (journey: string, names: string[]) => {
      const tops: number[] = [];
      for (let i = 0; i < names.length; i++) {
        tops.push(Math.round((await productNames(page).nth(i).boundingBox())!.y));
      }
      let start = 0;
      while (start < names.length) {
        let end = start;
        while (end + 1 < names.length && Math.abs(tops[end + 1] - tops[start]) < 20) end++;
        const row = names.slice(start, end + 1).map((n, k) => `${start + k + 1}. ${n}`).join(', ');
        await demo.highlight(productNames(page).nth(start), `Via the ${journey}: ${row}`);
        start = end + 1;
      }
    };

    let viaFilter: Journey | undefined;
    await test.step('open /, click the "Gravitator" tag in the Brand filter and record the result', async () => {
      await page.goto(BASE_URL!);
      await expect(toolbarCount(page)).toHaveText('101 products');
      await demo.caption(`Opened ${currentUrl(page).pathname}`);
      const tag = brandTag(page, 'Gravitator');
      await demo.highlight(tag, 'Click the "Gravitator" Brand filter tag');
      await tag.click();
      await expectOnCatalogFilteredTo(page, '2');
      await expect(toolbarCount(page)).toHaveText('11 products');
      await expect(productNames(page)).toHaveCount(9);
      await expect(brandTag(page, 'Gravitator')).toHaveClass(ACTIVE);
      viaFilter = await record();
      await demo.caption(`Via filter: ${viaFilter.path}${viaFilter.query}, ${viaFilter.toolbar}`);
      await demo.highlight(toolbarCount(page), `Via the filter: ${viaFilter.toolbar}`);
      await demo.highlight(brandTag(page, 'Gravitator'), 'Via the filter: "Gravitator" active');
      await showRows('filter', viaFilter.names);
    });

    let viaCard: Journey | undefined;
    await test.step('open /brands, click the "Gravitator" card and record the result', async () => {
      await page.goto(`${BASE_URL}/brands`);
      await demo.caption(`Opened ${currentUrl(page).pathname}`);
      const card = brandCard(page, 'Gravitator');
      await demo.highlight(card, 'Click the Gravitator card');
      await card.click();
      await expectOnCatalogFilteredTo(page, '2');
      await expect(toolbarCount(page)).toHaveText('11 products');
      await expect(productNames(page)).toHaveCount(9);
      await expect(brandTag(page, 'Gravitator')).toHaveClass(ACTIVE);
      viaCard = await record();
      await demo.caption(`Via card: ${viaCard.path}${viaCard.query}, ${viaCard.toolbar}`);
      await demo.highlight(toolbarCount(page), `Via the card: ${viaCard.toolbar}`);
      await demo.highlight(brandTag(page, 'Gravitator'), 'Via the card: "Gravitator" active');
      await showRows('card', viaCard.names);
    });

    await test.step('both journeys show the same URL, count and page-1 products', async () => {
      for (const j of [viaFilter!, viaCard!]) {
        expect(j.path).toBe('/');
        expect(j.query).toBe('?brand=2');
        expect(j.toolbar).toBe('11 products');
      }
      expect(viaCard!.names).toEqual(viaFilter!.names);
      await demo.highlight(productNames(page).first(), `Card 1 of 9 in both: ${viaCard!.names[0]}`);
      await demo.highlight(productNames(page).nth(8), `Card 9 of 9 in both: ${viaCard!.names[8]}`);
    });
  });

  test('TC-BRAND-2-03 every brand card links to /?brand=<its own id>', async ({ page, demo }) => {
    await test.step('open /brands', async () => {
      await page.goto(`${BASE_URL}/brands`);
      await demo.caption(`Opened ${currentUrl(page).pathname}`);
      await expect(brandCards(page)).toHaveCount(13);
    });
    await test.step('read each card\'s data-brand-id and the href of the link around it', async () => {
      const hrefs: string[] = [];
      for (let i = 0; i < 13; i++) {
        const card = brandCards(page).nth(i);
        const id = await card.getAttribute('data-brand-id');
        expect(id).toMatch(/^\d+$/);
        const link = card.locator('xpath=ancestor::a');
        await expect(link).toHaveCount(1);
        const href = await link.getAttribute('href');
        expect(href).toBe(`/?brand=${id}`);
        hrefs.push(href!);
      }
      expect(new Set(hrefs).size).toBe(13);
      await expect(enclosingLink(page, 'Daybird')).toHaveAttribute('href', '/?brand=1');
      await expect(enclosingLink(page, 'XE')).toHaveAttribute('href', '/?brand=13');
      await demo.caption('13 cards, 13 different links /?brand=<data-brand-id>');
      await demo.highlight(brandCards(page).first(), `First card links to ${await brandCards(page).first().locator('xpath=ancestor::a').getAttribute('href')}`);
      await demo.highlight(brandCard(page, 'Daybird'), 'Daybird card links to /?brand=1');
      await demo.highlight(brandCard(page, 'XE'), 'XE card links to /?brand=13');
    });
  });

  test('TC-BRAND-2-04 catalog filtered to Daybird shows "Brand: Daybird" instead of the usual title', async ({ page, demo }) => {
    await test.step('open /brands and click the "Daybird" card', async () => {
      await page.goto(`${BASE_URL}/brands`);
      const card = brandCard(page, 'Daybird');
      await demo.highlight(card, 'Click the Daybird card');
      await card.click();
      await expectOnCatalogFilteredTo(page, '1');
      await demo.caption(`Now at ${currentUrl(page).pathname}${currentUrl(page).search}`);
    });
    await test.step('wait for "10 products" and read the page header title', async () => {
      await expect(toolbarCount(page)).toHaveText('10 products');
      await expect(heroTitle(page)).toHaveText('Brand: Daybird');
      await expect(page.locator('body')).not.toContainText(USUAL_TITLE);
      await expect(heroSubtitle(page)).not.toContainText(USUAL_SUBTITLE);
      await demo.highlight(heroTitle(page), 'Header title: "Brand: Daybird"');
      await demo.absent(heroSubtitle(page), 'no usual title or subtitle text');
    });
  });

  test('TC-BRAND-2-05 "All brands" link under the brand title opens the Brands page', async ({ page, demo }) => {
    await test.step('open /?brand=1 and wait for "Brand: Daybird"', async () => {
      await page.goto(`${BASE_URL}/?brand=1`);
      await expect(heroTitle(page)).toHaveText('Brand: Daybird');
      await demo.caption(`Opened ${currentUrl(page).pathname}${currentUrl(page).search}`);
      const links = heroSubtitle(page).locator('a');
      await expect(links).toHaveCount(1);
      await expect(links).toHaveText('All brands');
      await demo.highlight(heroSubtitle(page), 'Subtitle: one link, "All brands"');
    });
    await test.step('click "All brands" in the header subtitle', async () => {
      await heroSubtitle(page).getByRole('link', { name: 'All brands', exact: true }).click();
      await expect(page).toHaveURL((u) => u.pathname === '/brands');
      const u = currentUrl(page);
      expect(u.pathname).toBe('/brands');
      expect(u.search).toBe('');
      await expect(page.getByRole('heading', { name: 'Brands', level: 1, exact: true })).toBeVisible();
      await expect(brandCards(page)).toHaveCount(13);
      await demo.caption(`Now at ${u.pathname}${u.search}: 13 brand cards`);
      await demo.highlight(page.getByRole('heading', { name: 'Brands', level: 1, exact: true }), `Brands page at ${u.pathname}`);
      await demo.highlight(brandCards(page).last(), 'Last of the 13 brand cards');
    });
  });

  test('TC-BRAND-2-06 choosing Gravitator in the Brand filter names it in the header', async ({ page, demo }) => {
    await test.step('open / with the usual title', async () => {
      await page.goto(BASE_URL!);
      await expect(heroTitle(page)).toHaveText(USUAL_TITLE);
      await demo.caption(`Opened ${currentUrl(page).pathname}`);
      await demo.highlight(heroTitle(page), `Usual title: "${USUAL_TITLE}"`);
    });
    await test.step('click the "Gravitator" tag in the Brand filter', async () => {
      const tag = brandTag(page, 'Gravitator');
      await demo.highlight(tag, 'Click "Gravitator"');
      await tag.click();
      await expectOnCatalogFilteredTo(page, '2');
      await demo.caption(`Now at ${currentUrl(page).pathname}${currentUrl(page).search}`);
      await expect(heroTitle(page)).toHaveText('Brand: Gravitator');
      const allBrands = heroSubtitle(page).getByRole('link', { name: 'All brands', exact: true });
      await expect(allBrands).toHaveCount(1);
      await expect(allBrands).toHaveAttribute('href', '/brands');
      // The tag click keeps the scroll offset, which leaves the title under the sticky site header.
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await demo.highlight(heroTitle(page), 'Header title: "Brand: Gravitator"');
      await demo.highlight(allBrands, '"All brands" links to /brands');
    });
  });

  test('TC-BRAND-2-07 one brand plus a type filter still names the brand in the header', async ({ page, demo }) => {
    await test.step('open /?brand=1&type=1', async () => {
      await page.goto(`${BASE_URL}/?brand=1&type=1`);
      await demo.caption(`Opened ${currentUrl(page).pathname}${currentUrl(page).search}`);
      await expect(toolbarCount(page)).toHaveText(/^(1 product|\d+ products)$/);
      const count = Number.parseInt(((await toolbarCount(page).textContent()) ?? '').trim(), 10);
      expect(count).toBeGreaterThanOrEqual(1);
      await demo.highlight(toolbarCount(page), `${count} product(s) of Daybird and type 1`);
      await expect(heroTitle(page)).toHaveText('Brand: Daybird');
      const allBrands = heroSubtitle(page).getByRole('link', { name: 'All brands', exact: true });
      await expect(allBrands).toHaveCount(1);
      await expect(allBrands).toHaveAttribute('href', '/brands');
      await demo.highlight(heroTitle(page), 'Header title: "Brand: Daybird"');
      await demo.highlight(allBrands, '"All brands" links to /brands');
    });
  });

  test('TC-BRAND-2-08 catalog without a brand filter shows the usual title and no "All brands" link', async ({ page, demo }) => {
    await test.step('open / and wait for "101 products"', async () => {
      await page.goto(BASE_URL!);
      await demo.caption(`Opened ${currentUrl(page).pathname} (no brand filter)`);
      await expect(toolbarCount(page)).toHaveText('101 products');
      await expect(heroTitle(page)).toHaveText(USUAL_TITLE);
      await expect(heroSubtitle(page)).toHaveText(USUAL_SUBTITLE);
      await expect(page.getByRole('link', { name: 'All brands' })).toHaveCount(0);
      await expect(page.locator('body')).not.toContainText('Brand:');
      await demo.highlight(heroTitle(page), `Usual title: "${USUAL_TITLE}"`);
      await demo.absent(heroSubtitle(page), 'Usual subtitle, no "All brands" link');
    });
  });

  test('TC-BRAND-2-09 catalog filtered to two brands shows the usual title and no "All brands" link', async ({ page, demo }) => {
    await test.step('open /?brand=1&brand=2 and wait for "21 products"', async () => {
      await page.goto(`${BASE_URL}/?brand=1&brand=2`);
      await demo.caption(`Opened ${currentUrl(page).pathname}${currentUrl(page).search}`);
      await expect(toolbarCount(page)).toHaveText('21 products');
      await expect(heroTitle(page)).toHaveText(USUAL_TITLE);
      await expect(heroSubtitle(page)).toHaveText(USUAL_SUBTITLE);
      await expect(page.getByRole('link', { name: 'All brands' })).toHaveCount(0);
      await expect(page.locator('body')).not.toContainText('Brand: Daybird');
      await expect(page.locator('body')).not.toContainText('Brand: Gravitator');
      await expect(brandTag(page, 'Daybird')).toHaveClass(ACTIVE);
      await expect(brandTag(page, 'Gravitator')).toHaveClass(ACTIVE);
      await demo.highlight(heroTitle(page), `Two brands: usual title "${USUAL_TITLE}"`);
      await demo.absent(heroSubtitle(page), 'Usual subtitle, no "All brands" link');
      await demo.highlight(brandTag(page, 'Daybird'), '"Daybird" active');
      await demo.highlight(brandTag(page, 'Gravitator'), '"Gravitator" active');
    });
  });
});

test.describe('brand without products (scenario brand-1)', () => {
  test.beforeAll(() => {
    loadScenario('brand-1');
  });

  test('TC-BRAND-2-10 card of a brand without products is not a link and says "No products yet"', async ({ page, demo }) => {
    await test.step('open /brands', async () => {
      await page.goto(`${BASE_URL}/brands`);
      await demo.caption(`Opened ${currentUrl(page).pathname}`);
      await expect(brandCards(page)).toHaveCount(15);
    });
    await test.step('find the "Acme Empty" card (data-brand-id 14) and check it is not inside a link', async () => {
      const empty = brandCard(page, 'Acme Empty');
      await expect(empty).toHaveCount(1);
      await expect(empty).toHaveAttribute('data-brand-id', '14');
      await expect(empty).toContainText('No products yet');
      await expect(empty.locator('xpath=ancestor::a')).toHaveCount(0);
      await expect(empty.locator('a')).toHaveCount(0);
      await expect(page.locator('a[href="/?brand=14"]')).toHaveCount(0);
      await demo.highlight(empty, 'Acme Empty: "No products yet", not a link');
    });
    await test.step('click the heading "Acme Empty"', async () => {
      await brandCard(page, 'Acme Empty').getByRole('heading', { name: 'Acme Empty', exact: true }).click();
      await expect(page).toHaveURL((u) => u.pathname === '/brands');
      await expect(page.getByRole('heading', { name: 'Brands', level: 1, exact: true })).toBeVisible();
      expect(currentUrl(page).pathname).toBe('/brands');
      await demo.caption(`After the click still at ${currentUrl(page).pathname}`);
      await demo.highlight(brandCard(page, 'Acme Empty'), `Still on ${currentUrl(page).pathname}`);
    });
    await test.step('the "Mono Gear" card (one product) links to /?brand=15', async () => {
      await expect(enclosingLink(page, 'Mono Gear')).toHaveCount(1);
      await expect(enclosingLink(page, 'Mono Gear')).toHaveAttribute('href', '/?brand=15');
      await demo.highlight(brandCard(page, 'Mono Gear'), 'Mono Gear (1 product) links to /?brand=15');
    });
  });
});
