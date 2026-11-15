import type { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// ORDD-1: the order details page /user/orders/{orderNumber} and the order-number links on My orders.
// Scenario `ordd-1` (.factory/stack/scenarios/ordd-1): bob owns order 1 (Shipped, 309.97, two items, Redmond address),
// alice owns order 2 (Cancelled, 239.97, Alpine Fusion Goggles, Seattle address); no order 0 or 999999.
// TC-ORDD-1-09 (the API refuses another buyer's order) runs in tests/Ordering.FunctionalTests/OrderDetailsTests.cs.
test.describe.configure({ mode: 'serial' });

// Hard load: the scenario seeds orders 1-2 with fixed ids, and Ordering.API keeps a block of HiLo ids in memory
// (handed out before the load, for example by CheckoutTest). Restarting it makes its next block come from the
// sequences the scenario moved past the seeded ids, so orders placed after this spec do not collide with them.
test.beforeAll(() => {
  loadScenario('ordd-1', { hard: true });
});

const BOB = 'bob';
const PASSWORD = 'Pass123$';
const MY_ORDERS_PATH = '/user/orders';
const detailsPath = (orderNumber: number) => `${MY_ORDERS_PATH}/${orderNumber}`;
const NOT_FOUND_TEXT = 'Order not found';

// bob's order 1
const BOB_ORDER = 1;
const BOB_TOTAL = '$309.97';
const BOB_STATUS = 'Shipped';
const BOB_ADDRESS = { Street: '15703 NE 61st Ct', City: 'Redmond', State: 'WA', Country: 'U.S.', 'Zip code': '98052' };
const BOOTS = { name: 'Wanderer Black Hiking Boots', unitPrice: '$109.99', units: '2', lineTotal: '$219.98' };
const HARNESS = { name: 'Summit Pro Harness', unitPrice: '$89.99', units: '1', lineTotal: '$89.99' };

// alice's order 2: none of these may appear to bob
const ALICE_ORDER = 2;
const ALICE_CONTENT = ['Alpine Fusion Goggles', '100 Alice Lane', 'Seattle', '98101', '$239.97', '$79.99'];

const headerTitle = (page: Page) => page.locator('.eshop-hero-intro h1');
const summaryRow = (page: Page) => page.locator('.order-details-summary .orders-item:not(.orders-header)');
const addressSection = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Delivery address' }) });
const itemsSection = (page: Page) => page.locator('section', { has: page.getByRole('heading', { name: 'Items' }) });
const itemRows = (page: Page) => itemsSection(page).locator('.order-details-items .orders-item:not(.orders-header)');
const myOrdersRow = (page: Page, orderNumber: number) =>
  page.locator('.orders-list .orders-item:not(.orders-header)').filter({ has: page.locator('.order-number', { hasText: new RegExp(`^\\s*${orderNumber}\\s*$`) }) });

async function signInAsBob(page: Page) {
  await test.step('sign in as bob', async () => {
    await page.goto(BASE_URL);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill(BOB);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  });
}

test('TC-ORDD-1-01 order number on My orders links to its details page', async ({ page, demo }) => {
  await signInAsBob(page);
  const link = myOrdersRow(page, BOB_ORDER).locator('.order-number').getByRole('link', { name: String(BOB_ORDER), exact: true });
  await test.step('open /user/orders', async () => {
    await page.goto(`${BASE_URL}${MY_ORDERS_PATH}`);
    await expect(link).toBeVisible();
  });
  await test.step('the link of order 1 points to /user/orders/1', async () => {
    // the anchor's href property is the attribute resolved against the document's <base href>
    const href = await link.evaluate((a) => (a as HTMLAnchorElement).href);
    expect(new URL(href).pathname).toBe(detailsPath(BOB_ORDER));
    await demo.highlight(link, 'Order 1 links to /user/orders/1');
  });
  await test.step('click the order number link 1', async () => {
    await link.click();
    await expect(page).toHaveURL((u) => u.pathname === detailsPath(BOB_ORDER));
    await expect(headerTitle(page)).toHaveText('Order details');
    await demo.highlight(headerTitle(page), 'Order details page of order 1');
  });
});

test('TC-ORDD-1-02 details page shows the order number, date, status and total', async ({ page, demo }) => {
  await signInAsBob(page);
  let listedDate = '';
  await test.step('open /user/orders and read the date of order 1', async () => {
    await page.goto(`${BASE_URL}${MY_ORDERS_PATH}`);
    const date = myOrdersRow(page, BOB_ORDER).locator('.order-date');
    await expect(date).toBeVisible();
    listedDate = (await date.innerText()).trim();
    expect(listedDate).not.toBe('');
    await demo.highlight(date, `My orders date of order 1: ${listedDate}`);
  });
  await test.step('click the order number link 1', async () => {
    await myOrdersRow(page, BOB_ORDER).getByRole('link', { name: String(BOB_ORDER), exact: true }).click();
    await expect(page).toHaveURL((u) => u.pathname === detailsPath(BOB_ORDER));
  });
  await test.step('the summary shows number 1, the same date, Shipped and $309.97', async () => {
    const row = summaryRow(page);
    await expect(row).toHaveCount(1);
    await expect(row.locator('.order-number')).toHaveText(String(BOB_ORDER));
    await expect(row.locator('.order-total')).toHaveText(BOB_TOTAL);
    await expect(row.locator('.order-status')).toHaveText(BOB_STATUS);
    const date = (await row.locator('.order-date').innerText()).trim();
    expect(date).not.toBe('');
    expect(date).toBe(listedDate);
    await demo.highlight(row, `Order 1, ${listedDate}, ${BOB_STATUS}, ${BOB_TOTAL}`);
  });
});

test('TC-ORDD-1-03 details page shows the delivery address', async ({ page, demo }) => {
  await signInAsBob(page);
  await test.step('open /user/orders/1', async () => {
    const response = await page.goto(`${BASE_URL}${detailsPath(BOB_ORDER)}`);
    expect(response!.status()).toBe(200);
  });
  await test.step('Delivery address shows street, city, state, country and zip code', async () => {
    const section = addressSection(page);
    await expect(section).toBeVisible();
    for (const [label, value] of Object.entries(BOB_ADDRESS)) {
      // each value is the <dd> right after its <dt> label
      await expect(section.locator(`dt:text-is("${label}") + dd`)).toHaveText(value);
    }
    await demo.highlight(section, 'Delivery address of order 1');
  });
});

test('TC-ORDD-1-04 details page lists each item with name, unit price, units and line total', async ({ page, demo }) => {
  await signInAsBob(page);
  await test.step('open /user/orders/1', async () => {
    await page.goto(`${BASE_URL}${detailsPath(BOB_ORDER)}`);
    await expect(itemsSection(page)).toBeVisible();
  });
  await test.step('exactly two item rows with unit price, units and line total', async () => {
    await expect(itemRows(page)).toHaveCount(2);
    for (const item of [BOOTS, HARNESS]) {
      const row = itemRows(page).filter({ has: page.locator('.item-name', { hasText: item.name }) });
      await expect(row).toHaveCount(1);
      await expect(row.locator('.item-numeric')).toHaveText([item.unitPrice, item.units, item.lineTotal]);
      await expect(row.locator('.item-line-total')).toHaveText(item.lineTotal);
    }
    await demo.highlight(itemsSection(page), 'Boots $109.99 x 2 = $219.98; Harness $89.99 x 1 = $89.99');
  });
});

test('TC-ORDD-1-05 Back to my orders returns to the My orders page', async ({ page, demo }) => {
  await signInAsBob(page);
  const back = page.getByRole('link', { name: 'Back to my orders', exact: true });
  await test.step('open /user/orders/1', async () => {
    await page.goto(`${BASE_URL}${detailsPath(BOB_ORDER)}`);
    await expect(back).toBeVisible();
    await demo.highlight(back, 'Back to my orders');
  });
  await test.step('click Back to my orders', async () => {
    await back.click();
    await expect(page).toHaveURL((u) => u.pathname === MY_ORDERS_PATH);
    await expect(headerTitle(page)).toHaveText('Orders');
    const row = myOrdersRow(page, BOB_ORDER);
    await expect(row).toHaveCount(1);
    await demo.highlight(row, 'My orders lists order 1');
  });
});

test('TC-ORDD-1-06 order number that does not exist shows Order not found with 404', async ({ page, demo }) => {
  await signInAsBob(page);
  await test.step('navigate to /user/orders/999999', async () => {
    const response = await page.goto(`${BASE_URL}${detailsPath(999999)}`);
    expect(response!.status()).toBe(404);
  });
  await test.step('Order not found is shown and no order content', async () => {
    const notFound = page.locator('.order-details-notfound');
    await expect(notFound).toHaveText(NOT_FOUND_TEXT);
    await demo.highlight(notFound, 'Order 999999: Order not found (HTTP 404)');
    await expect(page.locator('.order-details-summary')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Delivery address' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Items' })).toHaveCount(0);
    await demo.absent(page.locator('.order-details'), 'no summary, Delivery address or Items');
  });
});

test('TC-ORDD-1-07 another shopper\'s order shows Order not found with 404 and none of its content', async ({ page, demo }) => {
  await signInAsBob(page);
  await test.step('navigate to /user/orders/2 (alice\'s order)', async () => {
    const response = await page.goto(`${BASE_URL}${detailsPath(ALICE_ORDER)}`);
    expect(response!.status()).toBe(404);
  });
  await test.step('Order not found is shown and nothing of alice\'s order', async () => {
    const notFound = page.locator('.order-details-notfound');
    await expect(notFound).toHaveText(NOT_FOUND_TEXT);
    await demo.highlight(notFound, 'Order not found for alice\'s order 2 (HTTP 404)');
    const content = await page.content();
    for (const text of ALICE_CONTENT) {
      expect(content, `page shows "${text}"`).not.toContain(text);
    }
    await expect(page.locator('.order-details-summary')).toHaveCount(0);
    await demo.absent(page.locator('.order-details'), 'none of alice\'s items, address or total');
  });
});

// The Identity pages send a Content-Security-Policy that blocks inline styles, so the demo overlays rendered unstyled
// and clipped at the top-left corner. Bypassing it only affects the narration, not the redirect under test.
test.describe(() => {
  test.use({ bypassCSP: true });

  test('TC-ORDD-1-08 visitor not signed in is sent to the sign-in page', async ({ page, demo }) => {
    await test.step('navigate to /user/orders/1 without signing in', async () => {
      await page.goto(`${BASE_URL}${detailsPath(BOB_ORDER)}`);
    });
    await test.step('the Identity sign-in page is shown', async () => {
      await expect(page).toHaveURL((u) => u.host === new URL(url('identity')).host && u.pathname === '/Account/Login');
      await expect(page.getByPlaceholder('Username')).toBeVisible();
      await expect(page.getByPlaceholder('Password')).toBeVisible();
      const signIn = new URL(page.url());
      await demo.caption(`Opened ${detailsPath(BOB_ORDER)} → sent to sign-in (${signIn.origin}${signIn.pathname})`);
      await demo.highlight(page.locator('form', { has: page.getByPlaceholder('Username') }), `Opened ${detailsPath(BOB_ORDER)} → sign-in page`);
      await expect(page.getByText('Order details')).toHaveCount(0);
      await expect(page.getByText(BOOTS.name)).toHaveCount(0);
      await expect(page.getByText(BOB_ADDRESS.Street)).toHaveCount(0);
    });
  });
});

test('TC-ORDD-1-10 order number 0 shows Order not found with 404', async ({ page, demo }) => {
  await signInAsBob(page);
  await test.step('navigate to /user/orders/0', async () => {
    const response = await page.goto(`${BASE_URL}${detailsPath(0)}`);
    expect(response!.status()).toBe(404);
  });
  await test.step('Order not found is shown', async () => {
    const notFound = page.locator('.order-details-notfound');
    await expect(notFound).toHaveText(NOT_FOUND_TEXT);
    await demo.highlight(notFound, 'Order 0: Order not found (HTTP 404)');
  });
});
