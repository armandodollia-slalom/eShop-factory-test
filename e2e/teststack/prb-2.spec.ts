import { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// PRB-2: the orders page (/user/orders) is headed "My orders" with the tab title "My orders | AdventureWorks",
// matching the "My orders" links in the user menu and the footer; the rest of the page is unchanged.
// Scenario `prb-2` (.factory/stack/scenarios/prb-2): the seeded user alice (Pass123$), empty basket, no orders.
// TC-PRB-2-05 places alice's only order, so it runs after the empty-state cases (serial mode).
test.describe.configure({ mode: 'serial' });

const HEADING = 'My orders';
const OLD_HEADING = 'Orders';
const TITLE = 'My orders | AdventureWorks';
const ORDERS_PATH = /\/user\/orders$/;
const ITEM_ID = 99;
const ITEM_NAME = 'Adventurer GPS Watch';
const ADDRESS = '15703 NE 61st Ct';
const CITY = 'Redmond';

test.beforeAll(() => {
  loadScenario('prb-2');
});

/** The page header h1, which renders the `page-header-title` section outlet. */
const headerTitle = (page: Page) => page.locator('.eshop-hero-intro h1');

async function signInAsAlice(page: Page) {
  await test.step('sign in as alice', async () => {
    await page.goto(BASE_URL);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
}

async function openMyOrdersFromUserMenu(page: Page) {
  await test.step('hover the "Account" button to open the user menu', async () => {
    await page.getByRole('button', { name: 'Account' }).hover();
    await expect(page.locator('.user-menu-panel').getByRole('link', { name: HEADING, exact: true })).toBeVisible();
  });
  await test.step('click "My orders" in the user menu', async () => {
    await page.locator('.user-menu-panel').getByRole('link', { name: HEADING, exact: true }).click();
    await expect(page).toHaveURL(ORDERS_PATH);
  });
}

test('TC-PRB-2-01 opening "My orders" from the user menu shows the page heading "My orders"', async ({ page, demo }) => {
  await signInAsAlice(page);
  await openMyOrdersFromUserMenu(page);
  await test.step('the page header h1 reads "My orders" and no h1 reads "Orders"', async () => {
    await expect(page).toHaveURL(ORDERS_PATH);
    await expect(headerTitle(page)).toHaveText(HEADING);
    await expect(page.getByRole('heading', { level: 1, name: HEADING, exact: true })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1, name: OLD_HEADING, exact: true })).toHaveCount(0);
    await demo.highlight(headerTitle(page), 'Page heading: My orders (not "Orders")');
  });
});

test('TC-PRB-2-02 the orders page\'s browser tab title is "My orders | AdventureWorks"', async ({ page, demo }) => {
  await signInAsAlice(page);
  await openMyOrdersFromUserMenu(page);
  await test.step('read the page title (document.title)', async () => {
    await expect(page).toHaveTitle(TITLE);
    expect(await page.evaluate(() => document.title)).toBe(TITLE);
    await demo.caption(`document.title = "${TITLE}"`);
    await demo.highlight(headerTitle(page), `Tab title: ${TITLE}`);
    await demo.caption('');
  });
});

test('TC-PRB-2-03 the footer link "My orders" opens a page headed "My orders"', async ({ page, demo }) => {
  await signInAsAlice(page);
  await test.step('click "My orders" in the page footer', async () => {
    const footerLink = page.locator('footer').getByRole('link', { name: HEADING, exact: true });
    await demo.highlight(footerLink, 'Footer link: My orders');
    await footerLink.click();
  });
  await test.step('the URL, header h1 and tab title all say "My orders"', async () => {
    await expect(page).toHaveURL(ORDERS_PATH);
    await expect(headerTitle(page)).toHaveText(HEADING);
    await expect(page).toHaveTitle(TITLE);
    await demo.highlight(headerTitle(page), 'Footer link lands on: My orders');
  });
});

test('TC-PRB-2-04 with no orders, the page body still shows the "No orders yet" empty state', async ({ page, demo }) => {
  await signInAsAlice(page);
  await test.step('navigate to /user/orders', async () => {
    await page.goto(`${BASE_URL}/user/orders`);
    await expect(headerTitle(page)).toHaveText(HEADING);
  });
  await test.step('the empty state is unchanged and no orders list is shown', async () => {
    const empty = page.locator('.orders-empty');
    await expect(empty.getByRole('heading', { level: 2, name: 'No orders yet', exact: true })).toBeVisible();
    await expect(empty.getByText('When you place an order, it shows up here with its status and total.', { exact: true })).toBeVisible();
    const startShopping = empty.getByRole('link', { name: 'Start shopping', exact: true });
    await expect(startShopping).toBeVisible();
    await expect(startShopping).toHaveAttribute('href', '/');
    await expect(page.locator('.orders-list')).toHaveCount(0);
    await demo.highlight(empty, 'Empty state: No orders yet, Start shopping');
  });
});

test('TC-PRB-2-05 with one order, the orders list still shows its header row and the order under the "My orders" heading', async ({ page, demo }) => {
  await signInAsAlice(page);
  await test.step(`add item ${ITEM_ID} "${ITEM_NAME}" to the shopping bag from its product page`, async () => {
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    await expect(page.locator('.in-cart').getByRole('link', { name: 'shopping bag' })).toBeVisible();
  });
  await test.step('navigate to /cart and click "Check out"', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Check out' }).click();
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  });
  await test.step('keep the pre-filled address and click "Place order"', async () => {
    await expect(page.getByLabel('Address')).toHaveValue(ADDRESS);
    await expect(page.getByLabel('City')).toHaveValue(CITY);
    await page.getByRole('button', { name: 'Place order' }).click();
  });
  await test.step('the orders page lists the one order under "My orders"', async () => {
    await expect(page).toHaveURL(ORDERS_PATH);
    await expect(headerTitle(page)).toHaveText(HEADING);
    await expect(page).toHaveTitle(TITLE);
    const list = page.locator('.orders-list');
    await expect(list).toBeVisible();
    await expect(list.locator('.orders-header > div')).toHaveText(['Number', 'Date', 'Total', 'Status']);
    await expect(page.locator('.order-number')).toHaveCount(1);
    await expect(page.locator('.orders-empty')).toHaveCount(0);
    await demo.highlight(headerTitle(page), 'Heading: My orders');
    await demo.highlight(list, 'Orders list: header row and one order');
  });
});

test('TC-PRB-2-06 an anonymous visitor opening /user/orders is sent to the Login page and does not see the "My orders" page', async ({ page, demo }) => {
  await test.step('navigate to /user/orders without signing in', async () => {
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/user/orders`);
  });
  await test.step('the Identity Login page is shown, not the orders page', async () => {
    const login = page.getByRole('heading', { name: 'Login', exact: true });
    await expect(login).toBeVisible();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: HEADING, exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'No orders yet', exact: true })).toHaveCount(0);
    await expect(page.locator('.orders-list')).toHaveCount(0);
    await demo.highlight(login, 'Anonymous visitor: sent to Login');
    await demo.absent(login, 'No "My orders" page shown');
  });
});
