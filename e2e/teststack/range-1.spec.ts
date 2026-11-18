import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// RANGE-1: minPrice/maxPrice on GET /api/catalog/items/facets and the price range in the catalog toolbar.
// Scenario `range-1` (.factory/stack/scenarios/range-1) is the default demo catalog with no extra rows.
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('range-1');
});

const facetsUrl = (query = '') => `${url('catalog')}/api/catalog/items/facets?api-version=1.0${query}`;

type FacetCount = { id: number; count: number };
type Facets = {
  brandCounts: FacetCount[];
  typeCounts: FacetCount[];
  brandTotal: number;
  typeTotal: number;
  minPrice: number | null;
  maxPrice: number | null;
};

async function getFacets(request: APIRequestContext, query: string): Promise<Facets> {
  return await test.step(`GET /api/catalog/items/facets?api-version=1.0${query} anonymously`, async () => {
    const response = await request.get(facetsUrl(query));
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    return (await response.json()) as Facets;
  });
}

// ---------------------------------------------------------------- API (functional cases, run on the stack)

test('TC-RANGE-1-01 facets without filters return minPrice 21.99 and maxPrice 699.00', async ({ request }) => {
  const facets = await getFacets(request, '');
  await test.step('minPrice is 21.99 and maxPrice is 699.00', () => {
    expect(facets.minPrice).toBe(21.99);
    expect(facets.maxPrice).toBe(699);
  });
});

test('TC-RANGE-1-02 facets for brand Daybird return 49.99 and 449.99', async ({ request }) => {
  const facets = await getFacets(request, '&brand=1');
  await test.step('minPrice is 49.99 and maxPrice is 449.99', () => {
    expect(facets.minPrice).toBe(49.99);
    expect(facets.maxPrice).toBe(449.99);
  });
});

test('TC-RANGE-1-03 facets for type Navigation return 59.99 and 299.00', async ({ request }) => {
  const facets = await getFacets(request, '&type=7');
  await test.step('minPrice is 59.99 and maxPrice is 299.00', () => {
    expect(facets.minPrice).toBe(59.99);
    expect(facets.maxPrice).toBe(299);
  });
});

test('TC-RANGE-1-04 facets for brand Daybird and type Footwear return 109.99 and 149.99', async ({ request }) => {
  const facets = await getFacets(request, '&brand=1&type=1');
  await test.step('minPrice is 109.99 and maxPrice is 149.99', () => {
    expect(facets.minPrice).toBe(109.99);
    expect(facets.maxPrice).toBe(149.99);
  });
});

test('TC-RANGE-1-05 repeated brand parameters return the range of the union of those brands', async ({ request }) => {
  const facets = await getFacets(request, '&brand=1&brand=2');
  await test.step('minPrice is 49.99 (Daybird) and maxPrice is 699.00 (Gravitator)', () => {
    expect(facets.minPrice).toBe(49.99);
    expect(facets.maxPrice).toBe(699);
  });
});

test('TC-RANGE-1-06 a selection whose items share one price returns equal minPrice and maxPrice', async ({ request }) => {
  const facets = await getFacets(request, '&brand=6&type=8');
  await test.step('minPrice and maxPrice are both 79.99', () => {
    expect(facets.minPrice).toBe(79.99);
    expect(facets.maxPrice).toBe(79.99);
  });
});

test('TC-RANGE-1-07 a selection with no items returns null for minPrice and maxPrice', async ({ request }) => {
  const facets = await getFacets(request, '&brand=1&type=7');
  await test.step('minPrice and maxPrice are present and JSON null, not 0', () => {
    expect(Object.keys(facets)).toContain('minPrice');
    expect(Object.keys(facets)).toContain('maxPrice');
    expect(facets.minPrice).toBeNull();
    expect(facets.maxPrice).toBeNull();
  });
});

test('TC-RANGE-1-08 the facets existing fields are unchanged by the new price fields', async ({ request }) => {
  const facets = await getFacets(request, '&brand=1');
  const byId = (counts: FacetCount[]) => [...counts].sort((a, b) => a.id - b.id);
  await test.step('the body has exactly brandCounts, typeCounts, brandTotal, typeTotal, minPrice, maxPrice', () => {
    expect(Object.keys(facets).sort()).toEqual(['brandCounts', 'brandTotal', 'maxPrice', 'minPrice', 'typeCounts', 'typeTotal']);
  });
  await test.step('typeCounts are Daybird items per type and typeTotal is 10', () => {
    expect(byId(facets.typeCounts)).toEqual([
      { id: 1, count: 2 },
      { id: 3, count: 4 },
      { id: 4, count: 1 },
      { id: 5, count: 1 },
      { id: 6, count: 1 },
      { id: 8, count: 1 },
    ]);
    expect(facets.typeTotal).toBe(10);
  });
  await test.step('brandCounts has 13 entries summing to 101, Daybird is 10, brandTotal is 101', () => {
    expect(facets.brandCounts).toHaveLength(13);
    expect(facets.brandCounts.reduce((sum, c) => sum + c.count, 0)).toBe(101);
    expect(facets.brandCounts.find((c) => c.id === 1)).toEqual({ id: 1, count: 10 });
    expect(facets.brandTotal).toBe(101);
  });
});

test('TC-RANGE-1-17 repeated type parameters return the range of the union of those types', async ({ request }) => {
  const facets = await getFacets(request, '&type=2&type=7');
  await test.step('minPrice is 21.99 (Climbing) and maxPrice is 299.00 (Navigation)', () => {
    expect(facets.minPrice).toBe(21.99);
    expect(facets.maxPrice).toBe(299);
  });
});

// ---------------------------------------------------------------- Catalog toolbar (e2e)

const countOf = (page: Page) => page.locator('.catalog-count');
const rangeOf = (page: Page) => page.locator('.catalog-count .catalog-price-range');

function filterLink(page: Page, group: 'Brand' | 'Type', name: string) {
  return page
    .locator('.catalog-search-group')
    .filter({ has: page.getByRole('heading', { name: group, exact: true }) })
    .locator('a.catalog-search-tag')
    .filter({ has: page.locator('span', { hasText: new RegExp(`^${name}$`) }) });
}

// Scroll the element to the middle of the viewport so the bottom caption does not cover it.
async function centre(locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: 'center' }));
}

// Blazor's enhanced navigation patches the current document instead of loading a new one, and drops the
// pane Playwright draws video captions and highlights in (<x-pw-glass>, installed once per document).
// Keep a reference before the click and put the pane back once the new page has rendered, so the
// captions and highlights after the navigation appear in the video.
async function clickKeepingOverlays(page: Page, locator: Locator) {
  await page.evaluate(() => {
    (window as unknown as { __pwGlass: Element | null }).__pwGlass = document.querySelector('x-pw-glass');
  });
  await locator.click();
}

async function restoreOverlays(page: Page) {
  await page.evaluate(() => {
    const glass = (window as unknown as { __pwGlass?: HTMLElement | null }).__pwGlass;
    if (glass && !glass.isConnected) {
      document.documentElement.appendChild(glass);
      glass.showPopover();
    }
  });
}

async function openCatalog(page: Page, path = '') {
  await page.goto(`${BASE_URL}/${path}`);
  await expect(countOf(page)).toBeVisible();
}

test('TC-RANGE-1-09 unfiltered catalog toolbar shows 101 products and Prices $21.99 – $699.00 in the count style', async ({ page, demo }) => {
  await test.step('Open / with no query string', async () => {
    await openCatalog(page);
    await demo.caption(`Opened ${page.url()} (no filter)`);
  });

  await test.step('the count paragraph shows "101 products" followed by the range', async () => {
    await expect(countOf(page)).toContainText('101 products');
    await expect(rangeOf(page)).toHaveText('Prices $21.99 – $699.00');
    const text = (await countOf(page).textContent())!.replace(/\s+/g, ' ').trim();
    expect(text.indexOf('101 products')).toBe(0);
    expect(text.indexOf('Prices $21.99 – $699.00')).toBeGreaterThan(text.indexOf('101 products'));
    await centre(countOf(page));
    await demo.highlight(countOf(page), '101 products · Prices $21.99 – $699.00');
  });

  await test.step('the range has the count paragraph font size, weight and colour', async () => {
    const style = (el: Element) => {
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color };
    };
    const countStyle = await countOf(page).evaluate(style);
    const rangeStyle = await rangeOf(page).evaluate(style);
    expect(rangeStyle).toEqual(countStyle);
    await demo.caption(`Range style ${JSON.stringify(rangeStyle)} = count style`);
    await centre(rangeOf(page));
    await demo.highlight(rangeOf(page), 'same font size, weight and colour as the count');
  });
});

test('TC-RANGE-1-10 choosing brand Daybird shows Prices $49.99 – $449.99', async ({ page, demo }) => {
  await test.step('Open /', async () => {
    await openCatalog(page);
    await demo.caption(`Opened ${page.url()}`);
  });

  await test.step('Click the "Daybird" link in the Brand filter', async () => {
    const daybird = filterLink(page, 'Brand', 'Daybird');
    await demo.highlight(daybird, 'Brand: Daybird');
    await clickKeepingOverlays(page, daybird);
    await expect(page).toHaveURL(/[?&]brand=1(&|$)/);
  });

  await test.step('the toolbar shows 10 products and Prices $49.99 – $449.99', async () => {
    await expect(countOf(page)).toContainText('10 products');
    await expect(rangeOf(page)).toHaveText('Prices $49.99 – $449.99');
    await restoreOverlays(page);
    await demo.caption(`Now at ${page.url()}`);
    await centre(countOf(page));
    await demo.highlight(countOf(page), '10 products · Prices $49.99 – $449.99');
  });
});

test('TC-RANGE-1-11 choosing type Navigation shows Prices $59.99 – $299.00', async ({ page, demo }) => {
  await test.step('Open /', async () => {
    await openCatalog(page);
    await demo.caption(`Opened ${page.url()}`);
  });

  await test.step('Click the "Navigation" link in the Type filter', async () => {
    const navigation = filterLink(page, 'Type', 'Navigation');
    await demo.highlight(navigation, 'Type: Navigation');
    await clickKeepingOverlays(page, navigation);
    await expect(page).toHaveURL(/[?&]type=7(&|$)/);
  });

  await test.step('the toolbar shows 11 products and Prices $59.99 – $299.00', async () => {
    await expect(countOf(page)).toContainText('11 products');
    await expect(rangeOf(page)).toHaveText('Prices $59.99 – $299.00');
    await restoreOverlays(page);
    await demo.caption(`Now at ${page.url()}`);
    await centre(countOf(page));
    await demo.highlight(countOf(page), '11 products · Prices $59.99 – $299.00');
  });
});

test('TC-RANGE-1-12 choosing brand Daybird and type Footwear shows Prices $109.99 – $149.99', async ({ page, demo }) => {
  await test.step('Open /', async () => {
    await openCatalog(page);
    await demo.caption(`Opened ${page.url()}`);
  });

  await test.step('Click the "Daybird" link in the Brand filter', async () => {
    const daybird = filterLink(page, 'Brand', 'Daybird');
    await demo.highlight(daybird, 'Brand: Daybird');
    await clickKeepingOverlays(page, daybird);
    await expect(page).toHaveURL(/[?&]brand=1(&|$)/);
    await expect(countOf(page)).toContainText('10 products');
    await restoreOverlays(page);
  });

  await test.step('Click the "Footwear" link in the Type filter', async () => {
    const footwear = filterLink(page, 'Type', 'Footwear');
    await demo.highlight(footwear, 'Type: Footwear');
    await clickKeepingOverlays(page, footwear);
    await expect(page).toHaveURL(/[?&]brand=1(&|$)/);
    await expect(page).toHaveURL(/[?&]type=1(&|$)/);
  });

  await test.step('the toolbar shows 2 products and Prices $109.99 – $149.99', async () => {
    await expect(countOf(page)).toContainText('2 products');
    await expect(rangeOf(page)).toHaveText('Prices $109.99 – $149.99');
    await restoreOverlays(page);
    await demo.caption(`Now at ${page.url()}`);
    await centre(countOf(page));
    await demo.highlight(countOf(page), '2 products · Prices $109.99 – $149.99');
  });
});

test('TC-RANGE-1-13 a selection whose products share one price shows Price $79.99', async ({ page, demo }) => {
  await test.step('Open /?brand=6&type=8', async () => {
    await openCatalog(page, '?brand=6&type=8');
    await demo.caption(`Opened ${page.url()} (Raptor Elite + Cycling)`);
  });

  await test.step('the toolbar shows 2 products and exactly Price $79.99', async () => {
    await expect(countOf(page)).toContainText('2 products');
    await expect(rangeOf(page)).toHaveText('Price $79.99');
    const text = (await rangeOf(page).textContent())!;
    expect(text).not.toContain('Prices');
    expect(text).not.toContain('–');
    await centre(countOf(page));
    await demo.highlight(countOf(page), '2 products · Price $79.99 (single price)');
  });
});

test('TC-RANGE-1-14 a selection with no products shows no price range', async ({ page, demo }) => {
  const heading = page.getByRole('heading', { name: 'No products match these filters' });

  await test.step('Open /?brand=1&type=7', async () => {
    await page.goto(`${BASE_URL}/?brand=1&type=7`);
    await expect(heading).toBeVisible();
    await demo.caption(`Opened ${page.url()} (Daybird + Navigation)`);
  });

  await test.step('the empty state shows and no price range is rendered', async () => {
    await demo.highlight(heading, 'No products match these filters');
    await expect(page.locator('.catalog-price-range')).toHaveCount(0);
    const main = page.locator('main');
    await expect(main).not.toContainText('Price $');
    await expect(main).not.toContainText('Prices $');
    await demo.absent(page.locator('.catalog-results'), 'no price range in the empty selection');
  });
});

test('TC-RANGE-1-15 moving to page 2 keeps the range of the whole selection', async ({ page, demo }) => {
  await test.step('Open /', async () => {
    await openCatalog(page);
    await expect(rangeOf(page)).toHaveText('Prices $21.99 – $699.00');
    await demo.caption(`Opened ${page.url()}`);
  });

  await test.step('Click the "Next page" link of the pagination', async () => {
    const next = page.getByRole('link', { name: 'Next page' });
    await demo.highlight(next, 'Next page');
    await clickKeepingOverlays(page, next);
    await expect(page).toHaveURL(/[?&]page=2(&|$)/);
  });

  await test.step('page 2 is current and the toolbar keeps 101 products and Prices $21.99 – $699.00', async () => {
    const current = page.locator('.catalog-pagination [aria-current="page"]');
    await expect(current).toHaveText('2');
    await expect(countOf(page)).toContainText('101 products');
    await restoreOverlays(page);
    await demo.caption(`Now at ${page.url()}`);
    await centre(current);
    await demo.highlight(current, 'page 2 is the current page');
    await expect(countOf(page)).toContainText('101 products');
    await expect(rangeOf(page)).toHaveText('Prices $21.99 – $699.00');
    await centre(countOf(page));
    await demo.highlight(countOf(page), 'page 2: 101 products · Prices $21.99 – $699.00');
  });
});

test('TC-RANGE-1-16 changing the sort order keeps the range of the whole selection', async ({ page, demo }) => {
  const sortValue = page.locator('[data-catalog-sort-value]');

  await test.step('Open / (no filter)', async () => {
    await openCatalog(page);
    await expect(rangeOf(page)).toHaveText('Prices $21.99 – $699.00');
    await demo.caption(`Opened ${page.url()}`);
  });

  await test.step('Open the "Sort" combobox and choose "Price: High to Low"', async () => {
    await page.getByRole('combobox', { name: /Sort/ }).click();
    const option = page.getByRole('option', { name: 'Price: High to Low', exact: true });
    await demo.highlight(option, 'Price: High to Low');
    await clickKeepingOverlays(page, option);
  });

  await test.step('the sort shows Price: High to Low and the first card is $249.99', async () => {
    await expect(sortValue).toHaveText('Price: High to Low');
    const firstPrice = page.locator('.catalog-items .catalog-item').first().locator('.price');
    await expect(firstPrice).toHaveText('$249.99');
    await restoreOverlays(page);
    await centre(sortValue);
    await demo.highlight(sortValue, 'sorted Price: High to Low');
    await centre(firstPrice);
    await demo.highlight(firstPrice, 'first card $249.99');
  });

  await test.step('the toolbar keeps 101 products and Prices $21.99 – $699.00, not the page range', async () => {
    await expect(countOf(page)).toContainText('101 products');
    await expect(rangeOf(page)).toHaveText('Prices $21.99 – $699.00');
    await expect(rangeOf(page)).not.toContainText('$79.99');
    await expect(rangeOf(page)).not.toContainText('$249.99');
    await centre(countOf(page));
    await demo.highlight(countOf(page), 'after sort: 101 products · Prices $21.99 – $699.00');
  });
});
