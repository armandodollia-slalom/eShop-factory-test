import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// PRB-3: the catalog home page names itself in the browser tab title ("Catalog | AdventureWorks"), nothing else on it changes,
// and the title does not carry over to the item page reached from the catalog.
// Scenario `prb-3` (.factory/stack/scenarios/prb-3): the demo catalog of `default` (101 items; item 99 is "Adventurer GPS Watch").
test.beforeAll(() => {
  loadScenario('prb-3');
});

const CATALOG_TITLE = 'Catalog | AdventureWorks';
const BARE_TITLE = 'AdventureWorks';
const HEADING = 'Ready for a new adventure?';
const SUBTITLE = 'Start the season with the latest in clothing and equipment.';
const PRODUCT_COUNT = '101 products';
const PRODUCTS_ON_PAGE_1 = 9;
const ITEM_NAME = 'Adventurer GPS Watch';
const ITEM_PATH = '/item/99';
const ITEM_TITLE = `${ITEM_NAME} | AdventureWorks`;

type Page = Parameters<Parameters<typeof test>[2]>[0]['page'];

const headerTitle = (page: Page) => page.locator('.eshop-hero-intro h1');

async function openCatalog(page: Page) {
  await test.step('navigate to the WebApp base URL /', async () => {
    await page.goto(BASE_URL);
  });
  await test.step(`wait until the heading "${HEADING}" is visible`, async () => {
    await expect(page.getByRole('heading', { name: HEADING })).toBeVisible();
  });
}

test('TC-PRB-3-01 catalog home page tab title is "Catalog | AdventureWorks"', async ({ page, demo }) => {
  await demo.chapter('Catalog tab title', `Opening the catalog shows "${CATALOG_TITLE}" in the browser tab.`);
  await openCatalog(page);
  await test.step('read the document title', async () => {
    await expect(page).toHaveTitle(CATALOG_TITLE);
    const title = await page.title();
    expect(title).toBe(CATALOG_TITLE);
    expect(title).not.toBe(BARE_TITLE);
    await demo.caption(`Tab title: "${title}"`);
    await demo.highlight(headerTitle(page), `catalog page, tab title "${title}"`);
  });
});

test('TC-PRB-3-02 catalog page content is unchanged by the title fix', async ({ page, demo }) => {
  await demo.chapter('Catalog content unchanged', 'Header, product count and product grid are as before the fix.');
  await openCatalog(page);
  await test.step('read the header h1, the subtitle, the product count and the products on page 1', async () => {
    const h1 = headerTitle(page);
    await expect(h1).toHaveText(HEADING);
    await demo.highlight(h1, `header h1 "${HEADING}"`);

    const subtitle = page.getByText(SUBTITLE, { exact: true });
    await expect(subtitle).toBeVisible();
    await demo.highlight(subtitle, 'header subtitle');

    const count = page.locator('.catalog-count');
    await expect(count).toHaveText(PRODUCT_COUNT);
    await demo.highlight(count, `"${PRODUCT_COUNT}"`);

    await expect(page.locator('.catalog-product')).toHaveCount(PRODUCTS_ON_PAGE_1);
    const watch = page.getByRole('link', { name: ITEM_NAME });
    await expect(watch).toBeVisible();
    await demo.highlight(watch, `"${ITEM_NAME}" in the product grid`);
  });
});

test('TC-PRB-3-03 leaving the catalog for an item page does not keep the "Catalog | AdventureWorks" title', async ({ page, demo }) => {
  await demo.chapter('Item page title', `The item page names the item, not "${CATALOG_TITLE}".`);
  await openCatalog(page);
  await test.step(`click the link "${ITEM_NAME}" in the product grid`, async () => {
    const link = page.getByRole('link', { name: ITEM_NAME });
    await demo.highlight(link, `"${ITEM_NAME}" in the catalog`);
    await link.click();
  });
  await test.step(`wait until the URL path is ${ITEM_PATH} and the header h1 is "${ITEM_NAME}"`, async () => {
    await expect(page).toHaveURL((u) => u.pathname === ITEM_PATH);
    await expect(headerTitle(page)).toHaveText(ITEM_NAME);
  });
  await test.step('read the document title', async () => {
    await expect(page).toHaveTitle(ITEM_TITLE);
    const title = await page.title();
    expect(title).toBe(ITEM_TITLE);
    expect(title).not.toBe(CATALOG_TITLE);
    await demo.caption(`Tab title: "${title}"`);
    await demo.highlight(headerTitle(page), `item page, tab title "${title}"`);
  });
});
