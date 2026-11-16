import { execFileSync } from 'child_process';
import { Browser, Page } from '@playwright/test';
import { test, expect, type Demo } from '../demo';
import { BASE_URL, STACK, url } from './ports';
import { DOCKER, loadScenario } from './scenario';

// CANC-1: alice cancels an unpaid order from My orders (/user/orders); bob cannot cancel her orders through the Ordering API.
// Scenario `canc-1` (.factory/stack/scenarios/canc-1): alice owns orders 9101-9108 in every status, bob owns none.
// Every case changes order statuses, so the scenario is loaded before each case and the cases run one at a time.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const HEADING = 'My orders';
const ORDERS_PATH = /\/user\/orders$/;
const CANNOT_CANCEL = 'This order can no longer be cancelled.';
const SEEDED = [9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108];
const ITEM_ID = 99;
const ITEM_NAME = 'Adventurer GPS Watch';
const ADDRESS = { street: '15703 NE 61st Ct', city: 'Redmond', state: 'WA', zip: '98052', country: 'U.S.' };
// The only redirect URI identity registers for this client on the stack (OrderingApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';
const ALICE_ID = '50ddac7e-9b69-4d68-a91b-25100ef2e403';

test.beforeEach(() => {
  loadScenario('canc-1');
});

type Request = Parameters<Parameters<typeof test>[2]>[0]['request'];

/** Access token with the `orders` scope for a seeded user, from the "orderingswaggerui" client's implicit flow. */
async function tokenFor(browser: Browser, user: 'alice' | 'bob'): Promise<string> {
  return test.step(`get ${user}'s bearer token from Identity`, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authorize = new URL(`${url('identity')}/connect/authorize`);
    authorize.search = new URLSearchParams({
      client_id: 'orderingswaggerui',
      response_type: 'token',
      scope: 'orders',
      redirect_uri: REDIRECT,
      state: `canc1-${user}`,
    }).toString();
    await page.goto(authorize.toString());
    await page.getByPlaceholder('Username').fill(user);
    await page.getByPlaceholder('Password').fill('Pass123$');
    const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
    await page.getByRole('button', { name: 'Login' }).click();
    const location = (await callback).headers()['location'] ?? '';
    await context.close();
    const token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
    expect(token).not.toBe('');
    return token;
  });
}

const orderUrl = (orderNumber: number) => `${url('ordering')}/api/orders/${orderNumber}?api-version=1.0`;
const CANCEL_URL = () => `${url('ordering')}/api/orders/cancel?api-version=1.0`;

/** GET /api/orders/<n> with the given token; expects 200 and returns the order's `status`. */
async function readStatus(request: Request, token: string, orderNumber: number): Promise<string> {
  const response = await request.get(orderUrl(orderNumber), { headers: { Authorization: `Bearer ${token}` } });
  expect(response.status()).toBe(200);
  return (await response.json()).status;
}

/** Runs one SQL statement on the stack's orderingdb (this session's slot, from TESTSTACK_SLOT). */
function runOrderingSql(sql: string) {
  execFileSync(
    DOCKER,
    ['compose', '-p', STACK.project, 'exec', '-T', 'postgres', 'sh', '-c', 'PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -h localhost -U postgres -d orderingdb -c "$0"', sql],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
}

const headerTitle = (page: Page) => page.locator('.eshop-hero-intro h1');
const orderRows = (page: Page) => page.locator('.orders-list li.orders-item:not(.orders-header)');
const orderRow = (page: Page, orderNumber: number | string) =>
  orderRows(page).filter({ has: page.locator('.order-number', { hasText: new RegExp(`^\\s*${orderNumber}\\s*$`) }) });
const cancelButton = (page: Page, orderNumber: number | string) =>
  page.getByRole('button', { name: `Cancel order ${orderNumber}`, exact: true });

async function signInAsAlice(page: Page) {
  await test.step('sign in to the WebApp as alice / Pass123$', async () => {
    await page.goto(`${BASE_URL}/`);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
}

async function openMyOrders(page: Page, demo: { caption(text: string): Promise<void>; pause(ms?: number): Promise<void> }) {
  await test.step('open /user/orders', async () => {
    await page.goto(`${BASE_URL}/user/orders`);
    await expect(page).toHaveURL(ORDERS_PATH);
    await expect(headerTitle(page)).toHaveText(HEADING);
    await expect(orderRows(page).first()).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
    await demo.pause(1500);
    // The caption sits over the lower rows, which the following highlights need to show.
    await demo.caption('');
  });
}

/** Still on /user/orders under "My orders", with no error page. */
async function expectNoErrorPage(page: Page) {
  await expect(page).toHaveURL(ORDERS_PATH);
  await expect(headerTitle(page)).toHaveText(HEADING);
  await expect(page.locator('#blazor-error-ui')).toBeHidden();
  await expect(page.getByRole('heading', { name: /error/i })).toHaveCount(0);
  await expect(page.getByText(/An error occurred while processing your request/)).toHaveCount(0);
}

/** Checks out item 99; with `demo`, the video shows the bag with the item and the "Place order" click. */
async function placeOrderForItem99(page: Page, demo?: Demo) {
  await test.step(`open /item/${ITEM_ID} and click "Add to shopping bag"`, async () => {
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    await expect(page.locator('.in-cart').getByRole('link', { name: 'shopping bag' })).toBeVisible();
  });
  await test.step('open the shopping bag and click "Check out"', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
    if (demo) {
      await demo.caption(`Shopping bag: ${page.url()}`);
      await demo.highlight(page.getByText(ITEM_NAME).first(), `${ITEM_NAME} in the bag`);
      await demo.caption('');
    }
    await page.getByRole('link', { name: 'Check out' }).click();
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  });
  await test.step(`enter ${ADDRESS.street}, ${ADDRESS.city}, ${ADDRESS.state}, ${ADDRESS.zip}, ${ADDRESS.country} and click "Place order"`, async () => {
    await page.getByLabel('Address', { exact: true }).fill(ADDRESS.street);
    await page.getByLabel('City', { exact: true }).fill(ADDRESS.city);
    await page.getByLabel('State', { exact: true }).fill(ADDRESS.state);
    await page.getByLabel('Zip code', { exact: true }).fill(ADDRESS.zip);
    await page.getByLabel('Country', { exact: true }).fill(ADDRESS.country);
    const placeOrder = page.getByRole('button', { name: 'Place order' });
    if (demo) {
      await demo.highlight(placeOrder, 'Click "Place order"');
    }
    await placeOrder.click();
    await expect(page).toHaveURL(ORDERS_PATH);
  });
}

/** The one listed order whose number is not a seeded one. */
async function newOrderNumber(page: Page): Promise<number> {
  await expect(orderRows(page)).toHaveCount(SEEDED.length + 1);
  const numbers = (await page.locator('.orders-list .order-number').allInnerTexts()).map((t) => Number.parseInt(t.trim(), 10));
  const created = numbers.filter((n) => !SEEDED.includes(n));
  expect(created).toHaveLength(1);
  return created[0];
}

test('TC-CANC-1-01 Submitted, AwaitingValidation and StockConfirmed orders each show a "Cancel order" button', async ({ page, demo }) => {
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step('rows 9101, 9102, 9103, 9107 and 9108 each have one "Cancel order" button and their status', async () => {
    const expected: [number, string][] = [
      [9101, 'Submitted'],
      [9102, 'AwaitingValidation'],
      [9103, 'StockConfirmed'],
      [9107, 'StockConfirmed'],
      [9108, 'Submitted'],
    ];
    for (const [orderNumber, status] of expected) {
      const row = orderRow(page, orderNumber);
      await expect(row).toHaveCount(1);
      await expect(row.locator('.order-status')).toHaveText(status);
      const buttons = row.getByRole('button', { name: 'Cancel order', exact: false });
      await expect(buttons).toHaveCount(1);
      await expect(buttons).toHaveText('Cancel order');
      await expect(buttons).toHaveAccessibleName(`Cancel order ${orderNumber}`);
      await demo.highlight(row, `${orderNumber} ${status}: "Cancel order" button`, 1200);
    }
    await expectNoErrorPage(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test('TC-CANC-1-02 Paid, Shipped and Cancelled orders show no "Cancel order" button', async ({ page, demo }) => {
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step('rows 9104, 9105 and 9106 are Paid, Shipped and Cancelled with no "Cancel order" button', async () => {
    const expected: [number, string][] = [
      [9104, 'Paid'],
      [9105, 'Shipped'],
      [9106, 'Cancelled'],
    ];
    for (const [orderNumber, status] of expected) {
      const row = orderRow(page, orderNumber);
      await expect(row).toHaveCount(1);
      await expect(row.locator('.order-status')).toHaveText(status);
      await expect(row.getByRole('button')).toHaveCount(0);
      await expect(cancelButton(page, orderNumber)).toHaveCount(0);
      await demo.absent(row.locator('.order-actions'), `${orderNumber} ${status}: no "Cancel order" button`, 1500);
    }
  });
});

test('TC-CANC-1-03 cancelling a Submitted order shows it as Cancelled without an error', async ({ page, demo, browser, request }) => {
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step('click the button "Cancel order 9101"', async () => {
    await expect(orderRow(page, 9101).locator('.order-status')).toHaveText('Submitted');
    await demo.highlight(cancelButton(page, 9101), 'Cancel order 9101 (Submitted)');
    await cancelButton(page, 9101).click();
  });
  await test.step('order 9101 shows Cancelled with no button; 9102 is unchanged; no error, no alert', async () => {
    const row = orderRow(page, 9101);
    await expect(row.locator('.order-status')).toHaveText('Cancelled');
    await expect(cancelButton(page, 9101)).toHaveCount(0);
    await expect(row.getByRole('button')).toHaveCount(0);
    await expectNoErrorPage(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(CANNOT_CANCEL)).toHaveCount(0);
    await expect(orderRow(page, 9102).locator('.order-status')).toHaveText('AwaitingValidation');
    await expect(cancelButton(page, 9102)).toHaveCount(1);
    await demo.caption(`After the cancel: ${page.url()}`);
    await demo.highlight(row, '9101 now Cancelled, no button');
    await demo.highlight(orderRow(page, 9102), '9102 still AwaitingValidation with its button');
    await demo.absent(page.locator('.orders-list'), 'No error and no alert message');
  });
  const aliceToken = await tokenFor(browser, 'alice');
  await test.step('GET /api/orders/9101 as alice returns 200 with status Cancelled', async () => {
    expect(await readStatus(request, aliceToken, 9101)).toBe('Cancelled');
    await demo.caption('GET /api/orders/9101 as alice -> 200, status "Cancelled"');
    await demo.highlight(orderRow(page, 9101).locator('.order-status'), 'API: 9101 status Cancelled');
  });
});

test('TC-CANC-1-04 a just-placed order cancelled before processing stays Cancelled after the processors have run', async ({ page, demo, browser, request }) => {
  test.setTimeout(360_000);
  await signInAsAlice(page);
  await placeOrderForItem99(page);
  const placedAt = Date.now();
  let orderNumber = 0;
  await test.step('open /user/orders and click the new order\'s "Cancel order" button within 30 seconds', async () => {
    await page.goto(`${BASE_URL}/user/orders`);
    orderNumber = await newOrderNumber(page);
    const row = orderRow(page, orderNumber);
    await expect(row.locator('.order-status')).toHaveText('Submitted');
    await expect(row.locator('.order-total')).toHaveText('$199.99');
    await demo.caption(`New order ${orderNumber}: Submitted, $199.99`);
    await cancelButton(page, orderNumber).click();
    await expect(row.locator('.order-status')).toHaveText('Cancelled');
    expect(Date.now() - placedAt).toBeLessThan(30_000);
    await demo.highlight(row, `${orderNumber} Cancelled ${Math.round((Date.now() - placedAt) / 1000)}s after placing it`);
  });
  const aliceToken = await tokenFor(browser, 'alice');
  await test.step('wait 120 seconds while the OrderProcessor and PaymentProcessor run; the order stays Cancelled', async () => {
    await demo.caption(`Waiting 120 s for the processors; order ${orderNumber} must stay Cancelled`);
    const until = Date.now() + 120_000;
    while (Date.now() < until) {
      expect(await readStatus(request, aliceToken, orderNumber)).toBe('Cancelled');
      await page.waitForTimeout(Math.min(10_000, Math.max(0, until - Date.now())));
    }
  });
  await test.step('reload /user/orders: the order is still Cancelled with no "Cancel order" button', async () => {
    await page.reload();
    await expect(headerTitle(page)).toHaveText(HEADING);
    const row = orderRow(page, orderNumber);
    await expect(row.locator('.order-status')).toHaveText('Cancelled');
    await expect(cancelButton(page, orderNumber)).toHaveCount(0);
    await demo.caption(`Reloaded ${page.url()} ${Math.round((Date.now() - placedAt) / 1000)}s after placing order ${orderNumber}`);
    await demo.highlight(row, `${orderNumber} still Cancelled, never Paid`);
  });
  await test.step(`GET /api/orders/<new order> as alice returns 200 with status Cancelled`, async () => {
    expect(await readStatus(request, aliceToken, orderNumber)).toBe('Cancelled');
    await demo.caption(`GET /api/orders/${orderNumber} as alice -> 200, status "Cancelled"`);
    await demo.highlight(orderRow(page, orderNumber).locator('.order-status'), `API: ${orderNumber} status Cancelled`);
  });
});

test('TC-CANC-1-06 cancelling a StockConfirmed order shows it as Cancelled', async ({ page, demo, browser, request }) => {
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step('click the button "Cancel order 9103"', async () => {
    await expect(orderRow(page, 9103).locator('.order-status')).toHaveText('StockConfirmed');
    await demo.highlight(cancelButton(page, 9103), 'Cancel order 9103 (StockConfirmed)');
    await cancelButton(page, 9103).click();
  });
  await test.step('order 9103 shows Cancelled with no button; no error, no alert', async () => {
    const row = orderRow(page, 9103);
    await expect(row.locator('.order-status')).toHaveText('Cancelled');
    await expect(cancelButton(page, 9103)).toHaveCount(0);
    await expectNoErrorPage(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await demo.highlight(row, '9103 now Cancelled, no button');
    await demo.absent(page.locator('.orders-list'), 'No error and no alert message');
  });
  const aliceToken = await tokenFor(browser, 'alice');
  await test.step('GET /api/orders/9103 as alice returns 200 with status Cancelled', async () => {
    expect(await readStatus(request, aliceToken, 9103)).toBe('Cancelled');
    await demo.caption('GET /api/orders/9103 as alice -> 200, status "Cancelled"');
    await demo.highlight(orderRow(page, 9103).locator('.order-status'), 'API: 9103 status Cancelled');
  });
});

test('TC-CANC-1-07 cancelling an AwaitingValidation order shows it as Cancelled', async ({ page, demo, browser, request }) => {
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step('click the button "Cancel order 9102"', async () => {
    await expect(orderRow(page, 9102).locator('.order-status')).toHaveText('AwaitingValidation');
    await demo.highlight(cancelButton(page, 9102), 'Cancel order 9102 (AwaitingValidation)');
    await cancelButton(page, 9102).click();
  });
  await test.step('order 9102 shows Cancelled with no button; no error, no alert', async () => {
    const row = orderRow(page, 9102);
    await expect(row.locator('.order-status')).toHaveText('Cancelled');
    await expect(cancelButton(page, 9102)).toHaveCount(0);
    await expectNoErrorPage(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await demo.highlight(row, '9102 now Cancelled, no button');
    await demo.absent(page.locator('.orders-list'), 'No error and no alert message');
  });
  const aliceToken = await tokenFor(browser, 'alice');
  await test.step('GET /api/orders/9102 as alice returns 200 with status Cancelled', async () => {
    expect(await readStatus(request, aliceToken, 9102)).toBe('Cancelled');
    await demo.caption('GET /api/orders/9102 as alice -> 200, status "Cancelled"');
    await demo.highlight(orderRow(page, 9102).locator('.order-status'), 'API: 9102 status Cancelled');
  });
});

test('TC-CANC-1-08 cancelling an order paid after the page loaded shows "This order can no longer be cancelled." and keeps it Paid', async ({ page, demo, browser, request }) => {
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step('the button "Cancel order 9107" is visible', async () => {
    await expect(orderRow(page, 9107).locator('.order-status')).toHaveText('StockConfirmed');
    await expect(cancelButton(page, 9107)).toBeVisible();
    await demo.highlight(cancelButton(page, 9107), 'Cancel order 9107 (StockConfirmed)');
  });
  await test.step('without reloading, set order 9107 to Paid in orderingdb', async () => {
    runOrderingSql(`UPDATE ordering.orders SET "OrderStatus" = 'Paid' WHERE "Id" = 9107;`);
    await demo.caption(`SQL: UPDATE ordering.orders SET "OrderStatus" = 'Paid' WHERE "Id" = 9107`);
    await expect(cancelButton(page, 9107)).toBeVisible();
    await demo.highlight(orderRow(page, 9107), 'Page not reloaded: 9107 still shows StockConfirmed');
    await demo.caption('');
  });
  await test.step('click the button "Cancel order 9107"', async () => {
    await cancelButton(page, 9107).click();
  });
  await test.step('"This order can no longer be cancelled." is shown in row 9107, in view; 9107 shows Paid with no button; no error page', async () => {
    const alert = page.getByRole('alert');
    await expect(alert).toHaveCount(1);
    await expect(alert).toHaveText(CANNOT_CANCEL);
    const row = orderRow(page, 9107);
    // The message sits in the row that was clicked, so it is on screen without scrolling.
    await expect(row.getByRole('alert')).toHaveText(CANNOT_CANCEL);
    await expect(alert).toBeInViewport();
    await expect(row.locator('.order-status')).toHaveText('Paid');
    await expect(cancelButton(page, 9107)).toHaveCount(0);
    await expectNoErrorPage(page);
    await demo.highlight(alert, `Message: ${CANNOT_CANCEL}`);
    await demo.highlight(row, '9107 Paid, no "Cancel order" button, message in its row');
  });
  const aliceToken = await tokenFor(browser, 'alice');
  await test.step('GET /api/orders/9107 as alice returns 200 with status Paid', async () => {
    expect(await readStatus(request, aliceToken, 9107)).toBe('Paid');
    await demo.caption('GET /api/orders/9107 as alice -> 200, status "Paid"');
    await demo.highlight(orderRow(page, 9107).locator('.order-status'), 'API: 9107 status Paid');
  });
});

test('TC-CANC-1-09 bob\'s cancel request for alice\'s order is refused and the order stays Submitted', async ({ page, demo, browser, request }) => {
  const bobToken = await tokenFor(browser, 'bob');
  const aliceToken = await tokenFor(browser, 'alice');
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step('PUT /api/orders/cancel {"orderNumber": 9108} as bob returns 404', async () => {
    const response = await request.put(CANCEL_URL(), {
      headers: { Authorization: `Bearer ${bobToken}`, 'x-requestid': crypto.randomUUID(), 'Content-Type': 'application/json' },
      data: { orderNumber: 9108 },
    });
    expect(response.status()).toBe(404);
    await demo.caption(`PUT /api/orders/cancel {"orderNumber": 9108} as bob -> ${response.status()}`);
    await demo.highlight(orderRow(page, 9108), 'Bob\'s cancel of 9108 refused (404)');
  });
  await test.step('GET /api/orders/9108 as alice returns 200 with status Submitted', async () => {
    expect(await readStatus(request, aliceToken, 9108)).toBe('Submitted');
    await page.reload();
    await expect(orderRow(page, 9108).locator('.order-status')).toHaveText('Submitted');
    await demo.caption('GET /api/orders/9108 as alice -> 200, status "Submitted"');
    await demo.highlight(orderRow(page, 9108).locator('.order-status'), 'API and My orders: 9108 still Submitted');
  });
});

test('TC-CANC-1-10 bob cannot cancel alice\'s order by putting alice\'s identity in the request body', async ({ page, demo, browser, request }) => {
  const bobToken = await tokenFor(browser, 'bob');
  const aliceToken = await tokenFor(browser, 'alice');
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step(`PUT /api/orders/cancel {"orderNumber": 9108, "buyerIdentityGuid": "${ALICE_ID}"} as bob returns 404`, async () => {
    const response = await request.put(CANCEL_URL(), {
      headers: { Authorization: `Bearer ${bobToken}`, 'x-requestid': crypto.randomUUID(), 'Content-Type': 'application/json' },
      data: { orderNumber: 9108, buyerIdentityGuid: ALICE_ID },
    });
    expect(response.status()).toBe(404);
    await demo.caption('PUT /api/orders/cancel as bob, body {"orderNumber": 9108,');
    await demo.pause(1500);
    await demo.caption(`"buyerIdentityGuid": "${ALICE_ID}"} -> ${response.status()}`);
    await demo.highlight(orderRow(page, 9108), 'Bob naming alice in the body: refused (404)');
  });
  await test.step('GET /api/orders/9108 as alice returns 200 with status Submitted', async () => {
    expect(await readStatus(request, aliceToken, 9108)).toBe('Submitted');
    await page.reload();
    await expect(orderRow(page, 9108).locator('.order-status')).toHaveText('Submitted');
    await demo.caption('GET /api/orders/9108 as alice -> 200, status "Submitted"');
    await demo.highlight(orderRow(page, 9108).locator('.order-status'), 'API and My orders: 9108 still Submitted');
  });
});

test('TC-CANC-1-11 My orders still shows each order\'s number, date, total and status', async ({ page, demo }) => {
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step('the header row shows Number, Date, Total and Status in that order', async () => {
    const header = page.locator('.orders-list .orders-header');
    await expect(header.locator('> div').nth(0)).toHaveText('Number');
    await expect(header.locator('> div').nth(1)).toHaveText('Date');
    await expect(header.locator('> div').nth(2)).toHaveText('Total');
    await expect(header.locator('> div').nth(3)).toHaveText('Status');
    await demo.highlight(header, 'Columns: Number, Date, Total, Status');
  });
  await test.step('exactly 8 order rows are listed (9101 to 9108)', async () => {
    await expect(orderRows(page)).toHaveCount(8);
    const numbers = (await page.locator('.orders-list .order-number').allInnerTexts()).map((t) => Number.parseInt(t.trim(), 10));
    expect([...numbers].sort((a, b) => a - b)).toEqual(SEEDED);
    await demo.highlight(orderRows(page).first(), 'First of 8 rows', 1000);
    await demo.highlight(orderRows(page).last(), 'Last of 8 rows', 1000);
  });
  const rows: [number, string, string, string][] = [
    [9102, '11/02/2026 10:00:00', '$30.00', 'AwaitingValidation'],
    [9104, '11/04/2026 10:00:00', '$25.00', 'Paid'],
    [9106, '11/06/2026 10:00:00', '$50.00', 'Cancelled'],
  ];
  for (const [orderNumber, date, total, status] of rows) {
    await test.step(`row ${orderNumber}: ${date}, ${total}, ${status}`, async () => {
      const row = orderRow(page, orderNumber);
      await expect(row.locator('.order-number')).toHaveText(String(orderNumber));
      await expect(row.locator('.order-date')).toHaveText(date);
      await expect(row.locator('.order-total')).toHaveText(total);
      await expect(row.locator('.order-status')).toHaveText(status);
      await demo.highlight(row, `${orderNumber} | ${date} | ${total} | ${status}`);
    });
  }
});

test('TC-CANC-1-12 placing an order through checkout still works and the new order is listed as Submitted', async ({ page, demo }) => {
  await signInAsAlice(page);
  await placeOrderForItem99(page, demo);
  await test.step('the browser is on /user/orders with no error page and no alert', async () => {
    await expectNoErrorPage(page);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await demo.caption(`After "Place order": ${page.url()}`);
    await demo.pause(1500);
    await demo.caption('');
  });
  await test.step('9 rows: the 8 seeded orders and one new Submitted $199.99 order with a "Cancel order" button', async () => {
    const orderNumber = await newOrderNumber(page);
    expect(SEEDED).not.toContain(orderNumber);
    const row = orderRow(page, orderNumber);
    await expect(row.locator('.order-total')).toHaveText('$199.99');
    await expect(row.locator('.order-status')).toHaveText('Submitted');
    await expect(cancelButton(page, orderNumber)).toHaveCount(1);
    await expect(cancelButton(page, orderNumber)).toHaveText('Cancel order');
    await demo.highlight(row, `New order ${orderNumber}: $199.99, Submitted, Cancel order`);
  });
  await test.step('the shopping bag is empty afterwards', async () => {
    await page.goto(`${BASE_URL}/cart`);
    const empty = page.getByRole('heading', { name: 'Your shopping bag is empty', exact: true });
    await expect(empty).toBeVisible();
    await demo.highlight(empty, 'Shopping bag is empty');
  });
});

test('CANC-1 bob replaying a request id already used for a cancel is still refused for alice\'s order', async ({ page, demo, browser, request }) => {
  const bobToken = await tokenFor(browser, 'bob');
  const aliceToken = await tokenFor(browser, 'alice');
  const requestId = crypto.randomUUID();
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step(`PUT /api/orders/cancel {"orderNumber": 9101} as alice with x-requestid ${requestId} returns 200`, async () => {
    const response = await request.put(CANCEL_URL(), {
      headers: { Authorization: `Bearer ${aliceToken}`, 'x-requestid': requestId, 'Content-Type': 'application/json' },
      data: { orderNumber: 9101 },
    });
    expect(response.status()).toBe(200);
    await demo.caption(`PUT /api/orders/cancel {"orderNumber": 9101} as alice -> ${response.status()}`);
    await demo.pause(1500);
  });
  await test.step('PUT /api/orders/cancel {"orderNumber": 9108} as bob with the same x-requestid returns 404', async () => {
    const response = await request.put(CANCEL_URL(), {
      headers: { Authorization: `Bearer ${bobToken}`, 'x-requestid': requestId, 'Content-Type': 'application/json' },
      data: { orderNumber: 9108 },
    });
    expect(response.status()).toBe(404);
    await demo.caption(`Same x-requestid, {"orderNumber": 9108} as bob -> ${response.status()}`);
    await demo.highlight(orderRow(page, 9108), 'Bob\'s replayed request for 9108 refused (404)');
  });
  await test.step('GET /api/orders/9108 as alice returns 200 with status Submitted', async () => {
    expect(await readStatus(request, aliceToken, 9108)).toBe('Submitted');
    await page.reload();
    await expect(orderRow(page, 9108).locator('.order-status')).toHaveText('Submitted');
    await demo.caption('GET /api/orders/9108 as alice -> 200, status "Submitted"');
    await demo.highlight(orderRow(page, 9108).locator('.order-status'), 'API and My orders: 9108 still Submitted');
    await demo.caption('');
  });
});

test('CANC-1 a cancel the Ordering API cannot carry out shows "We couldn\'t cancel your order right now." and no error page', async ({ page, demo }) => {
  const COULD_NOT_CANCEL = "We couldn't cancel your order right now. Please try again.";
  await signInAsAlice(page);
  await openMyOrders(page, demo);
  await test.step('point the "Cancel order 9101" form at order 999999, which does not exist (the API answers 404)', async () => {
    const form = page.locator('form').filter({ has: cancelButton(page, 9101) });
    await form.locator('input[name="CancelOrderNumber"]').evaluate((input: HTMLInputElement) => { input.value = '999999'; });
    await demo.highlight(cancelButton(page, 9101), 'Cancel order 9101, posting order 999999');
  });
  await test.step('click "Cancel order 9101"', async () => {
    await cancelButton(page, 9101).click();
  });
  await test.step(`"${COULD_NOT_CANCEL}" is shown in view; 9101 is still Submitted; no error page`, async () => {
    const alert = page.getByRole('alert');
    await expect(alert).toHaveCount(1);
    await expect(alert).toHaveText(COULD_NOT_CANCEL);
    await expect(alert).toBeInViewport();
    await expect(orderRow(page, 9101).locator('.order-status')).toHaveText('Submitted');
    await expectNoErrorPage(page);
    await demo.highlight(alert, `Message: ${COULD_NOT_CANCEL}`);
    await demo.highlight(orderRow(page, 9101), '9101 still Submitted');
  });
});

test('CANC-1 My orders shows "We couldn\'t load your orders right now." when the Ordering API fails, and no error page', async ({ page, demo }) => {
  const COULD_NOT_LOAD = "We couldn't load your orders right now. Please reload the page.";
  await signInAsAlice(page);
  try {
    await test.step('make GET /api/orders fail: rename ordering.orders in orderingdb', async () => {
      runOrderingSql('ALTER TABLE ordering.orders RENAME TO orders_canc1_offline;');
    });
    await test.step('open /user/orders', async () => {
      await page.goto(`${BASE_URL}/user/orders`);
      await expect(page).toHaveURL(ORDERS_PATH);
      await expect(headerTitle(page)).toHaveText(HEADING);
    });
    await test.step(`"${COULD_NOT_LOAD}" is shown with no list and no error page`, async () => {
      const alert = page.getByRole('alert');
      await expect(alert).toHaveText(COULD_NOT_LOAD, { timeout: 60_000 });
      await expect(page.locator('.orders-list')).toHaveCount(0);
      await expect(page.getByRole('status')).toHaveCount(0);
      await expectNoErrorPage(page);
      await demo.caption('GET /api/orders fails (orders table renamed)');
      await demo.highlight(alert, `Message: ${COULD_NOT_LOAD}`);
      await demo.caption('');
    });
  } finally {
    runOrderingSql('ALTER TABLE IF EXISTS ordering.orders_canc1_offline RENAME TO orders;');
  }
});
