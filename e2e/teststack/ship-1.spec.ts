import { execFileSync } from 'child_process';
import { APIRequestContext, Browser, Locator, Page } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { BASE_URL, STACK, url } from './ports';
import { DOCKER, loadScenario } from './scenario';

// SHIP-1: GET /api/orders returns each order's city and country next to its existing fields, and My orders
// (/user/orders) shows them as "City, Country" under a "Ships to" heading between Date and Total.
// Scenario `ship-1` (.factory/stack/scenarios/ship-1): seeded users alice and bob, no orders. It is reloaded
// before every case because each case places its own orders as alice.
// The narrated highlights (about 2.5 s each) push the longer cases past Playwright's 30 s default.
test.describe.configure({ mode: 'serial', timeout: 120_000 });
test.use({ viewport: { width: 1280, height: 800 } });

const PASSWORD = 'Pass123$';
// alice's subject id on the stack (UsersSeed.cs); the order is created for the userId in the body.
const ALICE_ID = '50ddac7e-9b69-4d68-a91b-25100ef2e403';
const ORDERS = () => `${url('ordering')}/api/orders?api-version=1.0`;
// The only redirect URI identity registers for the "orderingswaggerui" client on the stack.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

type Address = { street: string; city: string; state: string; country: string; zipCode: string };

const REDMOND: Address = { street: '15703 NE 61st Ct', city: 'Redmond', state: 'WA', country: 'U.S.', zipCode: '98052' };
const PARIS: Address = { street: '1 Rue de Rivoli', city: 'Paris', state: 'IDF', country: 'France', zipCode: '75001' };
const LLANFAIR: Address = {
  street: '1 Station Road',
  city: 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch',
  state: 'Anglesey',
  country: 'United Kingdom',
  zipCode: 'LL61 5UJ',
};

// Order statuses in the order an order moves through them; a status may only advance while a case runs.
const STATUS_SEQUENCE = ['Submitted', 'AwaitingValidation', 'StockConfirmed', 'Paid', 'Shipped', 'Cancelled'];

// The Ordering API stamps an order's date with its container's clock, which is not this host's clock: read that
// clock (epoch milliseconds) to compare the date with the time of a request.
const orderingClock = () =>
  Number(execFileSync(DOCKER, ['exec', `${STACK.project}-ordering-api-1`, 'date', '+%s%3N'], { encoding: 'utf8' }).trim());

type OrderSummary = { orderNumber: number; date: string; status: string; total: number; city: string; country: string };

test.beforeEach(() => {
  loadScenario('ship-1');
});

// The "orderingswaggerui" client uses the implicit flow: signing in as alice returns an access token with the
// orders scope in the redirect fragment.
async function aliceToken(browser: Browser): Promise<string> {
  return test.step('get a bearer token for alice with the orders scope', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authorize = new URL(`${url('identity')}/connect/authorize`);
    authorize.search = new URLSearchParams({
      client_id: 'orderingswaggerui',
      response_type: 'token',
      scope: 'orders',
      redirect_uri: REDIRECT,
      state: 'ship1',
    }).toString();
    await page.goto(authorize.toString());
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill(PASSWORD);
    const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
    await page.getByRole('button', { name: 'Login' }).click();
    const location = (await callback).headers()['location'] ?? '';
    const token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
    await context.close();
    expect(token).not.toBe('');
    return token;
  });
}

// The plan's order body; only the address varies.
const orderBody = (address: Address) => ({
  userId: ALICE_ID,
  userName: 'alice',
  ...address,
  cardNumber: '4012888888881881',
  cardHolderName: 'Alice Smith',
  cardExpiration: '2030-12-31T00:00:00Z',
  cardSecurityNumber: '123',
  cardTypeId: 2,
  buyer: 'alice',
  items: [{ id: '1', productId: 99, productName: 'Adventurer GPS Watch', unitPrice: 10.0, oldUnitPrice: 10.0, quantity: 1, pictureUrl: null }],
});

// Places an order and returns its orderNumber: the one number the list gains. Order numbers come from a HiLo
// sequence, so after a scenario reload a later order can get a lower number than an earlier one.
async function placeOrder(request: APIRequestContext, token: string, address: Address): Promise<number> {
  return test.step(`place an order as alice shipping to ${address.city}, ${address.country}`, async () => {
    const before = new Set((await listOrders(request, token)).body.map((o) => o.orderNumber));
    const response = await request.post(ORDERS(), {
      headers: { Authorization: `Bearer ${token}`, 'x-requestid': crypto.randomUUID() },
      data: orderBody(address),
    });
    expect(response.status()).toBe(200);
    const added = (await listOrders(request, token)).body.map((o) => o.orderNumber).filter((n) => !before.has(n));
    expect(added).toHaveLength(1);
    return added[0];
  });
}

async function listOrders(request: APIRequestContext, token: string): Promise<{ status: number; body: OrderSummary[] }> {
  const response = await request.get(ORDERS(), { headers: { Authorization: `Bearer ${token}` } });
  return { status: response.status(), body: response.status() === 200 ? await response.json() : [] };
}

async function signIn(page: Page, user: string) {
  await test.step(`sign in to the WebApp as ${user}`, async () => {
    await page.goto(BASE_URL!);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill(user);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
}

const orderRows = (page: Page) => page.locator('li.orders-item:not(.orders-header)');
const headerRow = (page: Page) => page.locator('li.orders-header');
const rowWithNumber = (page: Page, orderNumber: number) =>
  orderRows(page).filter({ has: page.locator('.order-number', { hasText: new RegExp(`^\\s*${orderNumber}\\s*$`) }) });
const rowShippingTo = (page: Page, text: string) =>
  orderRows(page).filter({ has: page.locator('.order-ships-to', { hasText: text }) });

async function openMyOrders(page: Page, demo: Demo, rows: number) {
  await test.step('navigate to /user/orders', async () => {
    await page.goto(`${BASE_URL}/user/orders`);
    await expect(page).toHaveURL(/\/user\/orders$/);
    if (rows > 0) await expect(orderRows(page)).toHaveCount(rows);
    await demo.caption(`Opened ${page.url()}`);
  });
}

// What `@order.Date` renders in the WebApp: System.Text.Json reads the date's own fields without time-zone
// conversion, and DateTime.ToString() in the container's invariant culture prints "MM/dd/yyyy HH:mm:ss".
function invariantDateTime(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(iso);
  expect(m, `date "${iso}" is ISO 8601`).not.toBeNull();
  const [, y, mo, d, h, mi, s] = m!;
  return `${mo}/${d}/${y} ${h}:${mi}:${s}`;
}

const trimmed = (locator: Locator) => locator.evaluate((el) => (el.textContent ?? '').trim());

test('TC-SHIP-1-01 the order list returns each order\'s city and country as entered at checkout', async ({ browser, request, page, demo }) => {
  const token = await aliceToken(browser);
  const numberA = await placeOrder(request, token, REDMOND);
  const numberB = await placeOrder(request, token, PARIS);
  await test.step('GET /api/orders?api-version=1.0 as alice', async () => {
    const { status, body } = await listOrders(request, token);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    const a = body.find((o) => o.orderNumber === numberA)!;
    const b = body.find((o) => o.orderNumber === numberB)!;
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a.city).toBe('Redmond');
    expect(a.country).toBe('U.S.');
    expect(b.city).toBe('Paris');
    expect(b.country).toBe('France');
    await showJson(page, demo, `GET /api/orders as alice -> ${status}`, [a, b]);
  });
});

test('TC-SHIP-1-02 the order list keeps every existing field with its name and value', async ({ browser, request, page, demo }) => {
  const token = await aliceToken(browser);
  const t0 = Date.now();
  await placeOrder(request, token, REDMOND);
  await test.step('GET /api/orders?api-version=1.0 as alice', async () => {
    const { status, body } = await listOrders(request, token);
    const getTime = orderingClock();
    expect(Number.isInteger(getTime)).toBe(true);
    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    const item = body[0];
    expect(Object.keys(item).sort()).toEqual(['city', 'country', 'date', 'orderNumber', 'status', 'total']);
    expect(Number.isInteger(item.orderNumber)).toBe(true);
    expect(item.orderNumber).toBeGreaterThan(0);
    expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/);
    // A date without an offset is the UTC time the order was stored.
    const date = Date.parse(/(Z|[+-]\d{2}:\d{2})$/.test(item.date) ? item.date : `${item.date}Z`);
    expect(date).toBeGreaterThanOrEqual(t0 - 60_000);
    expect(date).toBeLessThanOrEqual(getTime);
    expect(typeof item.status).toBe('string');
    expect(item.status.trim()).not.toBe('');
    expect(item.total).toBe(10);
    await showJson(page, demo, `GET /api/orders as alice -> ${status}`, body);
  });
});

test('TC-SHIP-1-03 My orders shows a "Ships to" column with the order\'s city and country', async ({ browser, request, page, demo }) => {
  const token = await aliceToken(browser);
  await placeOrder(request, token, REDMOND);
  await signIn(page, 'alice');
  await openMyOrders(page, demo, 1);
  await test.step('the header row reads Number, Date, Ships to, Total, Status', async () => {
    const headers = await headerRow(page).locator('> div').evaluateAll((els) => els.map((el) => (el.textContent ?? '').trim()));
    expect(headers).toEqual(['Number', 'Date', 'Ships to', 'Total', 'Status']);
    await demo.highlight(headerRow(page), 'Number | Date | Ships to | Total | Status');
  });
  await test.step('the only order row shows "Redmond, U.S." between the date and the total', async () => {
    await expect(orderRows(page)).toHaveCount(1);
    const row = orderRows(page).first();
    const shipsTo = row.locator('.order-ships-to');
    expect(await trimmed(shipsTo)).toBe('Redmond, U.S.');
    const classes = await row.locator('> div').evaluateAll((els) => els.map((el) => el.className));
    expect(classes.indexOf('order-ships-to')).toBe(classes.indexOf('order-date') + 1);
    expect(classes.indexOf('order-total')).toBe(classes.indexOf('order-ships-to') + 1);
    const [date, ships, total] = await Promise.all(['.order-date', '.order-ships-to', '.order-total'].map((s) => row.locator(s).boundingBox()));
    expect(date!.x + date!.width).toBeLessThanOrEqual(ships!.x);
    expect(ships!.x + ships!.width).toBeLessThanOrEqual(total!.x);
    await demo.highlight(shipsTo, 'Ships to: Redmond, U.S.');
  });
});

test('TC-SHIP-1-04 two orders with different addresses each show their own city and country', async ({ browser, request, page, demo }) => {
  const token = await aliceToken(browser);
  const a = await placeOrder(request, token, REDMOND);
  const b = await placeOrder(request, token, PARIS);
  await signIn(page, 'alice');
  await openMyOrders(page, demo, 2);
  await test.step(`row ${a} ships to Redmond, U.S. and row ${b} ships to Paris, France`, async () => {
    await expect(orderRows(page)).toHaveCount(2);
    const shipsA = rowWithNumber(page, a).locator('.order-ships-to');
    const shipsB = rowWithNumber(page, b).locator('.order-ships-to');
    await expect(rowWithNumber(page, a)).toHaveCount(1);
    await expect(rowWithNumber(page, b)).toHaveCount(1);
    const textA = await trimmed(shipsA);
    const textB = await trimmed(shipsB);
    expect(textA).toBe('Redmond, U.S.');
    expect(textB).toBe('Paris, France');
    expect(textA).not.toContain('Paris');
    expect(textA).not.toContain('France');
    expect(textB).not.toContain('Redmond');
    expect(textB).not.toContain('U.S.');
    await demo.highlight(rowWithNumber(page, a), `Order ${a}: Redmond, U.S.`);
    await demo.highlight(rowWithNumber(page, b), `Order ${b}: Paris, France`);
  });
});

test('TC-SHIP-1-05 a shopper with no orders sees the unchanged empty state', async ({ page, demo }) => {
  await signIn(page, 'bob');
  await openMyOrders(page, demo, 0);
  await test.step('the empty state is shown with no orders list and no "Ships to"', async () => {
    await expect(page).toHaveTitle('My orders | AdventureWorks');
    await expect(page.locator('.eshop-hero h1')).toHaveText('My orders');
    await demo.highlight(page.locator('.eshop-hero h1'), 'Page header: My orders');
    const empty = page.locator('.orders-empty');
    await expect(empty.getByRole('heading', { name: 'No orders yet', exact: true })).toBeVisible();
    await expect(empty.locator('p')).toHaveText('When you place an order, it shows up here with its status and total.');
    const start = empty.getByRole('link', { name: 'Start shopping', exact: true });
    await expect(start).toBeVisible();
    await expect(start).toHaveAttribute('href', '/');
    await expect(page.locator('.orders-list')).toHaveCount(0);
    await expect(page.locator('.orders-header')).toHaveCount(0);
    await expect(page.getByText('Ships to')).toHaveCount(0);
    await demo.highlight(empty, 'No orders yet');
    await demo.absent(page.locator('div.orders'), 'no orders list and no "Ships to" heading');
  });
});

test('TC-SHIP-1-06 number, date, total and status columns show the same values as before', async ({ browser, request, page, demo }) => {
  const token = await aliceToken(browser);
  await placeOrder(request, token, REDMOND);
  const recorded = await test.step('GET /api/orders as alice and record orderNumber, date and status', async () => {
    const { status, body } = await listOrders(request, token);
    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    return body[0];
  });
  await signIn(page, 'alice');
  await openMyOrders(page, demo, 1);
  const row = orderRows(page).first();
  await test.step(`the row shows number ${recorded.orderNumber}, its date, $10.00 and its status`, async () => {
    expect(await trimmed(row.locator('.order-number'))).toBe(String(recorded.orderNumber));
    expect(await trimmed(row.locator('.order-date'))).toBe(invariantDateTime(recorded.date));
    expect(await trimmed(row.locator('.order-total'))).toBe('$10.00');
    const badge = row.locator('.order-status span.status');
    await expect(badge).toHaveCount(1);
    const shown = await trimmed(badge);
    if (shown !== recorded.status) {
      // The order moved on after the recorded GET: the badge must show a later status the order really has now.
      const { body } = await listOrders(request, token);
      const current = body.find((o) => o.orderNumber === recorded.orderNumber)!;
      expect(current).toBeDefined();
      expect(STATUS_SEQUENCE.indexOf(shown)).toBeGreaterThan(STATUS_SEQUENCE.indexOf(recorded.status));
      expect(shown).toBe(current.status);
    }
    expect((await badge.getAttribute('class'))!.split(/\s+/).sort()).toEqual(['status', shown.toLowerCase()].sort());
    for (const cell of ['.order-number', '.order-date', '.order-total', '.order-status']) {
      const text = await trimmed(row.locator(cell));
      expect(text).not.toContain('Redmond');
      expect(text).not.toContain('U.S.');
    }
    await demo.caption(`API: #${recorded.orderNumber}, ${recorded.date}, ${recorded.status}, total 10`);
    await demo.highlight(row, `#${recorded.orderNumber} | ${invariantDateTime(recorded.date)} | $10.00 | ${shown}`);
  });
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('TC-SHIP-1-07 at phone width "Ships to" takes its row\'s full width and the page does not scroll sideways', async ({ browser, request, page, demo }) => {
    const token = await aliceToken(browser);
    await placeOrder(request, token, REDMOND);
    await placeOrder(request, token, LLANFAIR);
    await signIn(page, 'alice');
    await openMyOrders(page, demo, 2);
    await demo.caption('Viewport 375 x 667');

    await test.step('the page does not scroll sideways', async () => {
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    const measure = (cell: Locator) =>
      cell.evaluate((el) => {
        const row = el.closest('li.orders-item') as HTMLElement;
        const rowStyle = getComputedStyle(row);
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const lineHeight = style.lineHeight === 'normal' ? parseFloat(style.fontSize) * 1.2 : parseFloat(style.lineHeight);
        return {
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          rowContent: row.getBoundingClientRect().width - parseFloat(rowStyle.paddingLeft) - parseFloat(rowStyle.paddingRight),
          lineHeight,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        };
      });

    await test.step('order A: "Redmond, U.S." fills its row on a single line', async () => {
      const cell = rowShippingTo(page, 'Redmond, U.S.').locator('.order-ships-to');
      await expect(cell).toHaveCount(1);
      expect(await trimmed(cell)).toBe('Redmond, U.S.');
      const m = await measure(cell);
      expect(Math.abs(m.width - m.rowContent)).toBeLessThanOrEqual(1);
      expect(m.height).toBeLessThanOrEqual(1.5 * m.lineHeight);
      await demo.highlight(cell, 'Full width, one line');
    });

    await test.step('order B: the 58-letter city wraps inside a full-width cell; United and Kingdom stay whole', async () => {
      const full = `${LLANFAIR.city}, ${LLANFAIR.country}`;
      const cell = rowShippingTo(page, LLANFAIR.city).locator('.order-ships-to');
      await expect(cell).toHaveCount(1);
      await expect(cell).toBeVisible();
      expect(await trimmed(cell)).toBe(full);
      const m = await measure(cell);
      expect(Math.abs(m.width - m.rowContent)).toBeLessThanOrEqual(1);
      expect(m.left).toBeGreaterThanOrEqual(0);
      expect(m.right).toBeLessThanOrEqual(375);
      expect(m.scrollWidth).toBeLessThanOrEqual(m.clientWidth);
      const tops = await cell.evaluate((el) => {
        const topsOf = (word: string) => {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const at = (node.textContent ?? '').indexOf(word);
            if (at < 0) continue;
            const range = document.createRange();
            range.setStart(node, at);
            range.setEnd(node, at + word.length);
            return Array.from(range.getClientRects()).map((r) => Math.round(r.top));
          }
          return [];
        };
        return { united: topsOf('United'), kingdom: topsOf('Kingdom') };
      });
      expect(tops.united.length).toBeGreaterThan(0);
      expect(tops.kingdom.length).toBeGreaterThan(0);
      expect(new Set(tops.united).size).toBe(1);
      expect(new Set(tops.kingdom).size).toBe(1);
      await demo.highlight(cell, 'Wraps inside the row, no sideways scroll');
    });
  });
});

// API cases have no page of their own: show the JSON the case asserts so the video proves it.
async function showJson(page: Page, demo: Demo, title: string, body: unknown) {
  await page.setContent(`<h2 style="font:600 20px system-ui;margin:16px">${title.replace(/</g, '&lt;')}</h2>
    <pre id="json" style="font:16px/1.4 monospace;margin:16px;padding:12px;background:#f1f5f9;border-radius:8px">${JSON.stringify(body, null, 2).replace(/</g, '&lt;')}</pre>`);
  await demo.highlight(page.locator('#json'), title);
}
