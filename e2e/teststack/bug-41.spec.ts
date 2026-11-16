import { Page } from '@playwright/test';
import { test, expect, Demo, createDemo } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// BUG-41: a double-click on "Place order" creates exactly one order; a single click still creates one order and lands
// on My orders, and the shopping bag is emptied either way.
// Scenario `bug-41` (.factory/stack/scenarios/bug-41): alice (Pass123$) with an empty bag and no orders, catalog item 28.
// Every case counts alice's orders from zero, so the scenario is reloaded before each test (serial mode).
// Each case signs in, checks out and narrates several highlights, which takes longer than the default 30 s.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const ITEM_ID = 28;
const ITEM_NAME = 'Alpine Peak Down Jacket';
const ITEM_TOTAL = '$249.99';
const ITEM_UNIT_PRICE = 249.99;
const ADDRESS = '15703 NE 61st Ct';
const CITY = 'Redmond';
const STATE = 'WA';
const ZIP = '98052';
const COUNTRY = 'U.S.';
const ORDERS_PATH = /\/user\/orders$/;
const CHECKOUT_PATH = /\/checkout$/;

const ALICE_ID = '50ddac7e-9b69-4d68-a91b-25100ef2e403';
const REQUEST_ID = '3b7e0c52-9d41-4a6f-8e21-41c7f0d5a9b3';
// The only redirect URI identity registers for this client on the stack (OrderingApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

test.beforeEach(() => {
  loadScenario('bug-41');
});

/** The order date as Orders.razor renders it (DateTime in the WebApp's en-US culture), date part only. */
function displayedDate(date: Date) {
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
}

async function signInAsAlice(page: Page) {
  await test.step('sign in to the WebApp as alice / Pass123$', async () => {
    await page.goto(BASE_URL);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
}

/** Adds the jacket and opens checkout; with `demo`, highlights the bag's line item and total on the way. */
async function addJacketAndOpenCheckout(page: Page, demo?: Demo) {
  await test.step(`open item ${ITEM_ID} "${ITEM_NAME}" and click "Add to shopping bag"`, async () => {
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    await expect(page.locator('.in-cart').getByRole('link', { name: 'shopping bag' })).toBeVisible();
  });
  await test.step('open the shopping bag and click "Check out"', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
    await expect(page.locator('.cart-item .name')).toHaveText([ITEM_NAME]);
    const bagTotal = page.locator('.cart-summary-total');
    await expect(bagTotal).toContainText(ITEM_TOTAL);
    if (demo) {
      await demo.highlight(page.locator('.cart-item'), `Bag: 1 x ${ITEM_NAME}`);
      await demo.highlight(bagTotal, `Bag total: ${ITEM_TOTAL}`);
    }
    await page.getByRole('link', { name: 'Check out' }).click();
    await expect(page).toHaveURL(CHECKOUT_PATH);
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    await expect(page.getByLabel('Address')).toHaveValue(ADDRESS);
    await expect(page.getByLabel('City')).toHaveValue(CITY);
    await expect(page.getByLabel('State')).toHaveValue(STATE);
    await expect(page.getByLabel('Zip code')).toHaveValue(ZIP);
    await expect(page.getByLabel('Country')).toHaveValue(COUNTRY);
  });
}

const placeOrder = (page: Page) => page.getByRole('button', { name: 'Place order' });
const orderRows = (page: Page) => page.locator('.orders-list .orders-item:not(.orders-header)');

/** Opens My orders and waits until the list (or the empty state) has streamed in. */
async function openMyOrders(page: Page) {
  await page.goto(`${BASE_URL}/user/orders`);
  await expect(page.locator('.orders-list, .orders-empty')).toBeVisible();
}

/**
 * Playwright draws captions and highlights into one `x-pw-glass` element it appends to <html> once per document.
 * Place order redirects to My orders with Blazor enhanced navigation, which keeps the document but replaces the
 * children of <html>, so that element is detached and later captions never reach the video. Keep a reference
 * before Place order is clicked so `captionRedirect` can put it back.
 */
async function keepVideoOverlay(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { pwGlass?: Element | null }).pwGlass = document.querySelector('x-pw-glass');
  });
}

/** Once the stream-rendered My orders page has finished loading, shows the URL the browser was redirected to. */
async function captionRedirect(page: Page, demo: Demo) {
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(ORDERS_PATH);
  await page.evaluate(() => {
    const glass = (window as unknown as { pwGlass?: Element | null }).pwGlass;
    if (glass && !glass.isConnected) document.documentElement.appendChild(glass);
  });
  await demo.caption(`Redirected to ${page.url()}`);
}

async function expectBagEmpty(page: Page, demo: Demo) {
  await page.goto(`${BASE_URL}/cart`);
  const empty = page.locator('.cart-empty');
  await expect(empty.getByRole('heading', { name: 'Your shopping bag is empty', exact: true })).toBeVisible();
  await expect(page.locator('.cart-item')).toHaveCount(0);
  await expect(page.locator('.cart').getByText(ITEM_NAME)).toHaveCount(0);
  await expect(page.locator('.cart-button-count')).toHaveCount(0);
  const bagIcon = page.locator('a.icon-button[aria-label="Shopping bag"]');
  await expect(bagIcon).toBeVisible();
  await demo.caption(`Opened ${page.url()}`);
  await demo.highlight(empty, `Shopping bag is empty: no "${ITEM_NAME}"`);
  await demo.caption('Header bag icon shows no item count');
  await demo.highlight(bagIcon, 'No item count');
  await demo.caption('');
}

test('TC-BUG-41-01 double-clicking Place order creates exactly one order with the bag\'s total', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addJacketAndOpenCheckout(page, demo);
  const before = new Date();
  await test.step('double-click "Place order"', async () => {
    await demo.highlight(placeOrder(page), 'Double-click: Place order');
    await placeOrder(page).dblclick();
  });
  await test.step('wait until the browser leaves /checkout, then open My orders', async () => {
    await expect(page).not.toHaveURL(CHECKOUT_PATH);
    await demo.caption(`Left checkout for ${page.url()}`);
    await openMyOrders(page);
  });
  const after = new Date();
  await test.step('My orders lists exactly one order, total $249.99, dated today', async () => {
    await expect(orderRows(page)).toHaveCount(1);
    await expect(orderRows(page).locator('.order-total')).toHaveText([ITEM_TOTAL]);
    const dateText = (await orderRows(page).locator('.order-date').innerText()).trim();
    expect([displayedDate(before), displayedDate(after)]).toContain(dateText.split(' ')[0]);
    await demo.caption(`Opened ${page.url()}`);
    await demo.highlight(page.locator('.orders-list'), `One order: ${ITEM_TOTAL}, ${dateText.split(' ')[0]}`);
  });
  await test.step('reload /user/orders: still exactly one order', async () => {
    await page.reload();
    await expect(page.locator('.orders-list, .orders-empty')).toBeVisible();
    await expect(orderRows(page)).toHaveCount(1);
    await expect(orderRows(page).locator('.order-total')).toHaveText([ITEM_TOTAL]);
    await demo.caption(`Reloaded ${page.url()}`);
    await demo.highlight(page.locator('.orders-list'), 'After reload: still one order');
    await demo.caption('');
  });
});

test('TC-BUG-41-02 after a double-click on Place order the shopping bag is empty', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addJacketAndOpenCheckout(page);
  await test.step('double-click "Place order"', async () => {
    await demo.highlight(placeOrder(page), 'Double-click: Place order');
    await placeOrder(page).dblclick();
  });
  await test.step('wait until the browser leaves /checkout', async () => {
    await expect(page).not.toHaveURL(CHECKOUT_PATH);
  });
  await test.step('open /cart: no items and no item count on the header badge', async () => {
    await expectBagEmpty(page, demo);
  });
});

test('TC-BUG-41-03 a single click on Place order creates one order and lands on My orders', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addJacketAndOpenCheckout(page);
  const before = new Date();
  await test.step('click "Place order" once', async () => {
    await demo.highlight(placeOrder(page), 'Single click: Place order');
    await keepVideoOverlay(page);
    await placeOrder(page).click();
  });
  await test.step('the browser lands on My orders with exactly one order, total $249.99, dated today', async () => {
    await expect(page).toHaveURL(ORDERS_PATH);
    await expect(page.locator('.eshop-hero-intro h1')).toHaveText('My orders');
    await expect(page).toHaveTitle('My orders | AdventureWorks');
    await expect(orderRows(page)).toHaveCount(1);
    await expect(orderRows(page).locator('.order-total')).toHaveText([ITEM_TOTAL]);
    const after = new Date();
    const dateText = (await orderRows(page).locator('.order-date').innerText()).trim();
    expect([displayedDate(before), displayedDate(after)]).toContain(dateText.split(' ')[0]);
    const landed = new URL(page.url()).pathname;
    await captionRedirect(page, demo);
    await demo.highlight(page.locator('.eshop-hero-intro h1'), `Redirected to ${landed}: My orders`);
    await demo.highlight(page.locator('.orders-list'), `${landed}: one order, ${ITEM_TOTAL}, ${dateText.split(' ')[0]}`);
    await demo.caption('');
  });
});

test('TC-BUG-41-04 after a single click on Place order the shopping bag is empty', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addJacketAndOpenCheckout(page);
  await test.step('click "Place order" once and wait for /user/orders', async () => {
    await demo.caption(`Opened ${page.url()}`);
    await demo.highlight(page.getByRole('heading', { name: 'Checkout' }), 'Checkout page');
    await demo.caption('');
    await demo.highlight(placeOrder(page), 'Single click: Place order');
    await placeOrder(page).click();
    await expect(page).toHaveURL(ORDERS_PATH);
    await expect(page.locator('.orders-list')).toBeVisible();
  });
  await test.step('open /cart: no items and no item count on the header badge', async () => {
    await expectBagEmpty(page, demo);
  });
});

test('TC-BUG-41-05 two separate checkouts, one click each, create two orders', async ({ page, demo }) => {
  await signInAsAlice(page);
  await test.step('first checkout: add the jacket, check out, click "Place order" once', async () => {
    await addJacketAndOpenCheckout(page);
    await placeOrder(page).click();
    await expect(page).toHaveURL(ORDERS_PATH);
  });
  await test.step('My orders lists exactly one order with total $249.99', async () => {
    await expect(orderRows(page)).toHaveCount(1);
    await expect(orderRows(page).locator('.order-total')).toHaveText([ITEM_TOTAL]);
    await demo.highlight(page.locator('.orders-list'), `After 1st checkout: one order, ${ITEM_TOTAL}`);
  });
  await test.step('second checkout on a newly loaded /checkout: add the jacket, check out, click "Place order" once', async () => {
    await addJacketAndOpenCheckout(page);
    await placeOrder(page).click();
    await expect(page).toHaveURL(ORDERS_PATH);
  });
  await test.step('My orders lists exactly two orders, each with total $249.99', async () => {
    await expect(orderRows(page)).toHaveCount(2);
    await expect(orderRows(page).locator('.order-total')).toHaveText([ITEM_TOTAL, ITEM_TOTAL]);
    await demo.highlight(page.locator('.orders-list'), `After 2nd checkout: two orders, ${ITEM_TOTAL} each`);
  });
  await test.step('the shopping bag is empty', async () => {
    await expectBagEmpty(page, demo);
  });
});

test('TC-BUG-41-06 Place order still works after the form was rejected by a validation error', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addJacketAndOpenCheckout(page);
  const address = page.getByLabel('Address');
  await test.step('clear the Address field and click "Place order" once', async () => {
    await address.fill('');
    await placeOrder(page).click();
  });
  await test.step('the browser stays on /checkout with a validation message for Address', async () => {
    const message = page.locator('label', { has: address }).locator('.validation-message');
    await expect(message).toBeVisible();
    await expect(message).not.toHaveText('');
    await expect(page).toHaveURL(CHECKOUT_PATH);
    await demo.caption(`Still on ${page.url()}`);
    await demo.highlight(message, `Address validation: "${(await message.innerText()).trim()}"`);
    await demo.caption('');
  });
  await test.step('in a separate tab, /user/orders lists no orders', async () => {
    const tab = await page.context().newPage();
    await openMyOrders(tab);
    const noOrders = tab.locator('.orders-empty').getByRole('heading', { name: 'No orders yet', exact: true });
    await expect(noOrders).toBeVisible();
    await expect(orderRows(tab)).toHaveCount(0);
    const tabUrl = tab.url();
    const tabDemo = createDemo(tab);
    await tabDemo.caption(`Separate tab ${tabUrl}`);
    await tabDemo.highlight(noOrders, 'No orders yet');
    await tabDemo.dispose();
    await tab.close();
    await demo.caption(`Separate tab ${tabUrl}: "No orders yet"`);
    await demo.pause(1500);
    await demo.caption('');
    await demo.highlight(placeOrder(page), 'No order placed yet');
  });
  await test.step(`type "${ADDRESS}" into Address and click "Place order" once`, async () => {
    await demo.type(address, ADDRESS);
    await expect(address).toHaveValue(ADDRESS);
    await keepVideoOverlay(page);
    await placeOrder(page).click();
  });
  await test.step('the browser lands on /user/orders with exactly one order, total $249.99', async () => {
    await expect(page).toHaveURL(ORDERS_PATH);
    await expect(orderRows(page)).toHaveCount(1);
    await expect(orderRows(page).locator('.order-total')).toHaveText([ITEM_TOTAL]);
    const landed = new URL(page.url()).pathname;
    await captionRedirect(page, demo);
    await demo.highlight(page.locator('.eshop-hero-intro h1'), `Redirected to ${landed}: My orders`);
    await demo.highlight(page.locator('.orders-list'), `${landed}: one order after fixing Address, ${ITEM_TOTAL}`);
    await demo.caption('');
  });
});

test('TC-BUG-41-07 two concurrent order requests with the same request id create one order', async ({ browser, request, demo, page }) => {
  const token = await test.step('get a bearer token for alice with the orders scope', async () => {
    const context = await browser.newContext();
    const login = await context.newPage();
    const authorize = new URL(`${url('identity')}/connect/authorize`);
    authorize.search = new URLSearchParams({
      client_id: 'orderingswaggerui',
      response_type: 'token',
      scope: 'orders',
      redirect_uri: REDIRECT,
      state: 'bug41',
    }).toString();
    await login.goto(authorize.toString());
    await login.getByPlaceholder('Username').fill('alice');
    await login.getByPlaceholder('Password').fill('Pass123$');
    const callback = login.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
    await login.getByRole('button', { name: 'Login' }).click();
    const location = (await callback).headers()['location'] ?? '';
    await context.close();
    const value = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
    expect(value).not.toBe('');
    return value;
  });
  const orders = `${url('ordering')}/api/orders?api-version=1.0`;
  const body = {
    userId: ALICE_ID,
    userName: 'alice',
    city: CITY,
    street: ADDRESS,
    state: STATE,
    country: COUNTRY,
    zipCode: ZIP,
    cardNumber: '4012888888881881',
    cardHolderName: 'Alice Smith',
    cardExpiration: '2030-12-31T00:00:00Z',
    cardSecurityNumber: '123',
    cardTypeId: 1,
    buyer: 'alice',
    items: [{ id: '1', productId: ITEM_ID, productName: ITEM_NAME, unitPrice: ITEM_UNIT_PRICE, oldUnitPrice: ITEM_UNIT_PRICE, quantity: 1, pictureUrl: null }],
  };
  const headers = { Authorization: `Bearer ${token}`, 'x-requestid': REQUEST_ID, 'Content-Type': 'application/json' };

  const statuses = await test.step(`send two POST /api/orders at once with x-requestid ${REQUEST_ID}`, async () => {
    const responses = await Promise.all([request.post(orders, { headers, data: body }), request.post(orders, { headers, data: body })]);
    const codes = responses.map((r) => r.status());
    expect(codes.filter((c) => c === 200).length).toBeGreaterThanOrEqual(1);
    return codes;
  });
  const list = await test.step('GET /api/orders as alice: exactly one order with total 249.99', async () => {
    const response = await request.get(orders, { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status()).toBe(200);
    const result: { orderNumber: number; total: number }[] = await response.json();
    expect(result).toHaveLength(1);
    expect(result[0].total).toBe(ITEM_UNIT_PRICE);
    return result;
  });
  await test.step('show the API results on screen', async () => {
    await page.setContent(
      `<main style="font:20px sans-serif;padding:24px">
        <h1>BUG-41: two concurrent POST /api/orders</h1>
        <p>x-requestid: ${REQUEST_ID} (both requests)</p>
        <p id="statuses">Responses: ${statuses.join(', ')}</p>
        <p id="orders">GET /api/orders as alice: ${list.length} order(s), total ${list.map((o) => o.total).join(', ')}</p>
      </main>`,
    );
    await demo.highlight(page.locator('#statuses'), `Responses: ${statuses.join(', ')}`);
    await demo.highlight(page.locator('#orders'), `Exactly one order, total ${list[0].total}`);
  });
});
