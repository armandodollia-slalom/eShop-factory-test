import { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// PRB-9: the footer's "Shop all" link under the Shop navigation is announced as "Shop all products" while its
// visible text ("Shop all") and destination (the catalog, `/`) are unchanged.
// Scenario `prb-9` (.factory/stack/scenarios/prb-9): the default catalog, browsed anonymously.

const NAV_NAME = 'Shop';
const NEW_NAME = 'Shop all products';
const OLD_NAME = 'Shop all';
const ITEM_ID = 99;
const ITEM_NAME = 'Adventurer GPS Watch';
const CATALOG_HEADING = 'Ready for a new adventure?';

test.beforeAll(() => {
  loadScenario('prb-9');
});

const shopNav = (page: Page) => page.getByRole('navigation', { name: NAV_NAME, exact: true });
const headerTitle = (page: Page) => page.locator('.eshop-hero-intro h1');

async function openHomePage(page: Page) {
  await test.step('open the WebApp home page /', async () => {
    await page.context().clearCookies();
    await page.goto(BASE_URL);
    await expect(headerTitle(page)).toHaveText(CATALOG_HEADING);
  });
}

test('TC-PRB-9-01 footer "Shop all" link\'s accessible name is "Shop all products"', async ({ page, demo }) => {
  await openHomePage(page);
  await test.step('locate the footer navigation landmark named "Shop"', async () => {
    await expect(shopNav(page)).toHaveCount(1);
    await expect(shopNav(page)).toBeVisible();
  });
  await test.step('query its links by the accessible name "Shop all products" (exact)', async () => {
    const link = shopNav(page).getByRole('link', { name: NEW_NAME, exact: true });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAccessibleName(NEW_NAME);
    const href = await link.evaluate(a => (a as HTMLAnchorElement).href);
    expect(href).toBe(new URL('/', BASE_URL).href);
    await demo.caption(`Accessible name: "${NEW_NAME}", href -> ${href}`);
    await demo.highlight(link, `Announced as "${NEW_NAME}"`);
    await demo.caption('');
  });
});

test('TC-PRB-9-02 footer "Shop all" link\'s visible text is unchanged', async ({ page, demo }) => {
  await openHomePage(page);
  await test.step('in the "Shop" navigation, locate the link named "Shop all products"', async () => {
    await expect(shopNav(page).getByRole('link', { name: NEW_NAME, exact: true })).toHaveCount(1);
  });
  await test.step('read its rendered inner text and check that it is visible', async () => {
    const link = shopNav(page).getByRole('link', { name: NEW_NAME, exact: true });
    await expect(link).toBeVisible();
    expect((await link.innerText()).trim()).toBe(OLD_NAME);
    await expect(shopNav(page).getByText(NEW_NAME, { exact: true })).toHaveCount(0);
    expect(await shopNav(page).innerText()).not.toContain(NEW_NAME);
    await demo.highlight(link, `Visible text still "${OLD_NAME}"`);
    await demo.absent(shopNav(page), `No visible "${NEW_NAME}" text in the Shop navigation`);
  });
});

test('TC-PRB-9-03 footer "Shop all" link still opens the catalog', async ({ page, demo }) => {
  await test.step(`open /item/${ITEM_ID} and wait for the heading "${ITEM_NAME}"`, async () => {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
    await expect(headerTitle(page)).toHaveText(ITEM_NAME);
    await demo.caption(`Opened ${page.url()}`);
    await demo.highlight(headerTitle(page), `Item page: ${ITEM_NAME}`);
  });
  await test.step('click the footer "Shop" link named "Shop all products"', async () => {
    const link = shopNav(page).getByRole('link', { name: NEW_NAME, exact: true });
    await demo.highlight(link, `Click "${OLD_NAME}" (announced "${NEW_NAME}")`);
    await link.click();
  });
  await test.step('the catalog page at / is shown', async () => {
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
    expect(page.url()).toBe(new URL('/', BASE_URL).href);
    await expect(headerTitle(page)).toHaveText(CATALOG_HEADING);
    await expect(headerTitle(page)).not.toHaveText(ITEM_NAME);
    await expect(page.getByRole('heading', { level: 1, name: ITEM_NAME, exact: true })).toHaveCount(0);
    const cards = page.locator('a.catalog-product');
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toHaveAttribute('href', /(^|\/)item\/\d+$/);
    await demo.caption(`After click: ${page.url()}`);
    await demo.highlight(headerTitle(page), `Catalog heading: ${CATALOG_HEADING}`);
    await demo.highlight(cards.first(), 'Catalog grid: first item card links to /item/<id>');
    await demo.caption('');
  });
});

test('TC-PRB-9-04 no footer Shop link is announced with the bare name "Shop all"', async ({ page, demo }) => {
  await openHomePage(page);
  await test.step('locate the footer navigation landmark named "Shop"', async () => {
    await expect(shopNav(page)).toHaveCount(1);
  });
  await test.step('count links with the exact accessible name "Shop all"', async () => {
    await expect(shopNav(page).getByRole('link', { name: OLD_NAME, exact: true })).toHaveCount(0);
    const visibleText = shopNav(page).getByText(OLD_NAME, { exact: true });
    await expect(visibleText).toHaveCount(1);
    await demo.highlight(visibleText, `Text "${OLD_NAME}" is shown`);
    await demo.absent(visibleText, `0 links announced as exactly "${OLD_NAME}"`);
  });
});
