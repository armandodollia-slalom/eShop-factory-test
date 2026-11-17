import { Locator, Page, request as playwrightRequest } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// ORDST-1: a "Status" filter on My orders (/user/orders?status=<name>) and GET /api/orders?status=<name>.
// Scenario `ordst-1` (.factory/stack/scenarios/ordst-1): alice owns orders 101 and 102 (Paid), 103 (Shipped) and
// 104 (Cancelled) with totals 10, 20, 30 and 40; bob has no orders. TC-ORDST-1-16 ships order 101, so it runs last.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const PASSWORD = 'Pass123$';
const ORDERS_API = (query = '') => `${url('ordering')}/api/orders?api-version=1.0${query}`;
const ORDERS_PAGE = (query = '') => `${BASE_URL}/user/orders${query}`;
const STATUS_OPTIONS = ['All', 'Submitted', 'AwaitingValidation', 'StockConfirmed', 'Paid', 'Shipped', 'Cancelled'];
const ALL_ORDERS = ['101', '102', '103', '104'];
// The only redirect URI identity registers for this client on the stack (OrderingApiClient); it resolves only inside the compose network.
const REDIRECT = 'http://ordering-api:8080/swagger/oauth2-redirect.html';

type OrderSummary = { orderNumber: number; date: string; status: string; total: number };

const tokens: Record<string, string> = {};

test.beforeAll(() => {
  loadScenario('ordst-1');
});

// The "orderingswaggerui" client uses the implicit flow: signing in returns an access token with the orders scope in the
// redirect fragment. The sign-in runs over HTTP without a browser, so the API cases record no video.
async function tokenFor(user: string): Promise<string> {
  if (tokens[user]) return tokens[user];
  // The Identity URL may use a host name only the containers and the browser (--host-resolver-rules) resolve, so the
  // requests go to 127.0.0.1 with the original Host header and every redirect is followed by hand.
  const identity = new URL(url('identity'));
  const local = `${identity.protocol}//127.0.0.1:${identity.port}`;
  const http = await playwrightRequest.newContext({ extraHTTPHeaders: { Host: identity.host } });
  const at = (location: string) => {
    const target = new URL(location, local);
    return `${local}${target.pathname}${target.search}`;
  };
  try {
    const authorize = new URLSearchParams({
      client_id: 'orderingswaggerui',
      response_type: 'token',
      scope: 'orders',
      redirect_uri: REDIRECT,
      state: 'ordst1',
    });
    const challenge = await http.get(`${local}/connect/authorize?${authorize}`, { maxRedirects: 0 });
    expect(challenge.status()).toBe(302);
    const loginUrl = at(challenge.headers()['location'] ?? '');
    const loginPage = await http.get(loginUrl, { maxRedirects: 0 });
    expect(loginPage.status()).toBe(200);
    const html = await loginPage.text();
    const antiforgery = /<input[^>]*name="__RequestVerificationToken"[^>]*value="([^"]+)"/.exec(html)?.[1] ?? '';
    const returnUrl = new URL(loginUrl).searchParams.get('ReturnUrl') ?? '';
    expect(returnUrl).not.toBe('');
    const login = await http.post(loginUrl, {
      form: { ReturnUrl: returnUrl, Username: user, Password: PASSWORD, button: 'login', __RequestVerificationToken: antiforgery },
      maxRedirects: 0,
    });
    expect(login.status()).toBe(302);
    const callback = await http.get(at(login.headers()['location'] ?? ''), { maxRedirects: 0 });
    expect(callback.status()).toBe(302);
    const location = callback.headers()['location'] ?? '';
    const token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
    expect(token).not.toBe('');
    tokens[user] = token;
    return token;
  } finally {
    await http.dispose();
  }
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// ---------------------------------------------------------------- page helpers

const statusFilter = (page: Page) => page.getByRole('navigation', { name: 'Status', exact: true });
const filterOption = (page: Page, name: string) => statusFilter(page).getByRole('link', { name, exact: true });
const ordersList = (page: Page) => page.locator('ul.orders-list');
const headerRow = (page: Page) => page.locator('ul.orders-list li.orders-header');
const orderRows = (page: Page) => page.locator('ul.orders-list li.orders-item:not(.orders-header)');
const orderNumbers = (page: Page) => orderRows(page).locator('.order-number');

// Blazor's enhanced navigation and DOM sync remove Playwright's overlay host (<x-pw-glass>) from <html>, and
// Playwright re-attaches it only on a new document, so captions and outlines drawn after a filter click or a live
// refresh would go to a detached element. Put the host back whenever it is removed.
async function keepOverlayHostAttached(page: Page) {
  await page.addInitScript(() => {
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.removedNodes)) {
          if (node instanceof HTMLElement && node.localName === 'x-pw-glass' && !node.isConnected) {
            document.documentElement.appendChild(node);
            try {
              node.showPopover();
            } catch {
              // Already in the top layer.
            }
          }
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
}

async function signIn(page: Page, user: string) {
  await keepOverlayHostAttached(page);
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

async function openOrders(page: Page, demo: Demo, query = '') {
  await page.goto(ORDERS_PAGE(query));
  await expect(page.locator('.orders-loading')).toHaveCount(0);
  await demo.caption(`Opened ${page.url()}`);
}

/** Path and query of the current URL, for example `/user/orders?status=Paid`. */
const pathAndQuery = (page: Page) => {
  const current = new URL(page.url());
  return current.pathname + current.search;
};

async function expectOnlySelected(page: Page, selected: string) {
  await expect(filterOption(page, selected)).toHaveAttribute('aria-current', 'true');
  for (const name of STATUS_OPTIONS.filter((n) => n !== selected)) {
    await expect(filterOption(page, name)).not.toHaveAttribute('aria-current', /.*/);
  }
}

async function expectAllFourOrders(page: Page) {
  await expect(orderNumbers(page)).toHaveText(ALL_ORDERS);
}

type RowSnapshot = { cells: string[]; badgeClass: string | null };

async function rowSnapshot(row: Locator): Promise<RowSnapshot> {
  return {
    cells: (await row.locator(':scope > div').allInnerTexts()).map((t) => t.trim()),
    badgeClass: await row.locator('.order-status span').getAttribute('class'),
  };
}

const rowOf = (page: Page, orderNumber: string) => orderRows(page).filter({ has: page.locator('.order-number', { hasText: orderNumber }) });

// ---------------------------------------------------------------- API (run on the stack with real bearer tokens)

test('TC-ORDST-1-01 GET /api/orders?status=Paid returns only alice\'s two Paid orders, each as the unfiltered request returns it', async ({ request }) => {
  const token = await tokenFor('alice');
  const all: OrderSummary[] = await test.step('GET /api/orders as alice and keep the body as all', async () => {
    const response = await request.get(ORDERS_API(), { headers: auth(token) });
    expect(response.status()).toBe(200);
    return response.json();
  });
  await test.step('GET /api/orders?status=Paid as alice', async () => {
    const response = await request.get(ORDERS_API('&status=Paid'), { headers: auth(token) });
    expect(response.status()).toBe(200);
    const paid: OrderSummary[] = await response.json();
    expect(Array.isArray(paid)).toBe(true);
    expect(paid).toHaveLength(2);
    expect(paid.map((o) => o.orderNumber).sort()).toEqual([101, 102]);
    expect(paid.map((o) => o.status)).toEqual(['Paid', 'Paid']);
    for (const order of paid) {
      expect(order).toStrictEqual(all.find((o) => o.orderNumber === order.orderNumber));
    }
    expect(paid.some((o) => o.orderNumber === 103 || o.orderNumber === 104)).toBe(false);
  });
});

test('TC-ORDST-1-02 GET /api/orders without status still returns all four of alice\'s orders', async ({ request }) => {
  const token = await tokenFor('alice');
  await test.step('GET /api/orders as alice, no status parameter', async () => {
    const response = await request.get(ORDERS_API(), { headers: auth(token) });
    expect(response.status()).toBe(200);
    const orders: OrderSummary[] = await response.json();
    expect(orders).toHaveLength(4);
    const byNumber = [...orders].sort((a, b) => a.orderNumber - b.orderNumber);
    expect(byNumber.map((o) => o.orderNumber)).toEqual([101, 102, 103, 104]);
    expect(byNumber.map((o) => o.status)).toEqual(['Paid', 'Paid', 'Shipped', 'Cancelled']);
    expect(byNumber.map((o) => o.total)).toEqual([10, 20, 30, 40]);
  });
});

test('TC-ORDST-1-03 GET /api/orders?status=sHiPpEd matches the status name ignoring case', async ({ request }) => {
  const token = await tokenFor('alice');
  await test.step('GET /api/orders?status=sHiPpEd as alice', async () => {
    const response = await request.get(ORDERS_API('&status=sHiPpEd'), { headers: auth(token) });
    expect(response.status()).toBe(200);
    const orders: OrderSummary[] = await response.json();
    expect(orders).toHaveLength(1);
    expect(orders[0].orderNumber).toBe(103);
    expect(orders[0].status).toBe('Shipped');
    expect(orders[0].total).toBe(30);
  });
});

test('TC-ORDST-1-04 GET /api/orders?status=Submitted returns an empty list when alice has no Submitted orders', async ({ request }) => {
  const token = await tokenFor('alice');
  await test.step('GET /api/orders?status=Submitted as alice', async () => {
    const response = await request.get(ORDERS_API('&status=Submitted'), { headers: auth(token) });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});

test('TC-ORDST-1-05 bob\'s GET /api/orders?status=Paid does not return alice\'s Paid orders', async ({ request }) => {
  const token = await tokenFor('bob');
  await test.step('GET /api/orders?status=Paid as bob', async () => {
    const response = await request.get(ORDERS_API('&status=Paid'), { headers: auth(token) });
    expect(response.status()).toBe(200);
    const orders: OrderSummary[] = await response.json();
    expect(orders).toEqual([]);
    expect(orders.some((o) => o.orderNumber === 101 || o.orderNumber === 102)).toBe(false);
  });
});

// ---------------------------------------------------------------- My orders page

test('TC-ORDST-1-09 My orders shows a "Status" filter with All and the six names in order, All selected', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await test.step('open /user/orders', async () => {
    await openOrders(page, demo);
  });
  await test.step('a "Status" filter above the list with All and the six names, All selected', async () => {
    await expect(statusFilter(page)).toBeVisible();
    await expect(page.locator('#orders-filter-label')).toHaveText('Status');
    const filterBox = await statusFilter(page).boundingBox();
    const headerBox = await headerRow(page).boundingBox();
    expect(filterBox!.y).toBeLessThan(headerBox!.y);
    await expect(statusFilter(page).getByRole('link')).toHaveText(STATUS_OPTIONS);
    await expectOnlySelected(page, 'All');
    await demo.highlight(statusFilter(page), 'Status filter: All + six names, All selected');
  });
  await test.step('the list shows orders 101, 102, 103 and 104', async () => {
    await expectAllFourOrders(page);
    await demo.highlight(ordersList(page), 'all four orders 101-104');
  });
});

test('TC-ORDST-1-10 choosing "Paid" shows only the Paid orders, unchanged, and the address becomes /user/orders?status=Paid', async ({ page, demo }) => {
  await signIn(page, 'alice');
  const before = await test.step('open /user/orders and record the header row and the rows of 101 and 102', async () => {
    await openOrders(page, demo);
    await expectAllFourOrders(page);
    const numbers = (await orderNumbers(page).allInnerTexts()).map((t) => t.trim());
    const snapshot = {
      header: await headerRow(page).locator(':scope > div').allInnerTexts(),
      row101: await rowSnapshot(rowOf(page, '101')),
      row102: await rowSnapshot(rowOf(page, '102')),
      order: numbers.filter((n) => n === '101' || n === '102'),
    };
    await demo.highlight(ordersList(page), 'unfiltered list: 101 and 102 recorded');
    return snapshot;
  });
  await test.step('click the Paid option of the Status filter', async () => {
    await filterOption(page, 'Paid').click();
    await expect(page).toHaveURL(/\/user\/orders\?status=Paid$/);
  });
  await test.step('only 101 and 102, unchanged, at /user/orders?status=Paid', async () => {
    expect(pathAndQuery(page)).toBe('/user/orders?status=Paid');
    await expectOnlySelected(page, 'Paid');
    await demo.caption(`After clicking Paid: ${page.url()}`);
    await demo.highlight(filterOption(page, 'Paid'), `Paid selected at ${pathAndQuery(page)}`);
    await expect(orderNumbers(page)).toHaveText(before.order);
    await expect(orderRows(page)).toHaveCount(2);
    expect(await headerRow(page).locator(':scope > div').allInnerTexts()).toEqual(before.header);
    const row101 = await rowSnapshot(rowOf(page, '101'));
    const row102 = await rowSnapshot(rowOf(page, '102'));
    expect(row101).toEqual(before.row101);
    expect(row102).toEqual(before.row102);
    expect(row101.cells[2]).toContain('10.00');
    expect(row102.cells[2]).toContain('20.00');
    expect(row101.badgeClass).toBe('status paid');
    expect(row102.badgeClass).toBe('status paid');
    await demo.highlight(ordersList(page), 'only Paid orders 101 and 102, rows unchanged');
    await demo.absent(orderRows(page).last(), 'no orders 103 or 104');
  });
});

test('TC-ORDST-1-11 choosing "All" after a filter shows every order again at /user/orders', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await test.step('open /user/orders?status=Shipped (only order 103)', async () => {
    await openOrders(page, demo, '?status=Shipped');
    await expect(orderNumbers(page)).toHaveText(['103']);
    await demo.highlight(ordersList(page), 'filtered: only Shipped order 103');
  });
  await test.step('click the All option of the Status filter', async () => {
    await filterOption(page, 'All').click();
    await expect(page).toHaveURL(/\/user\/orders$/);
  });
  await test.step('every order shows again at /user/orders with no query', async () => {
    expect(pathAndQuery(page)).toBe('/user/orders');
    await expectOnlySelected(page, 'All');
    await expect(orderRows(page)).toHaveCount(4);
    await demo.caption(`After clicking All: ${page.url()}`);
    await demo.highlight(filterOption(page, 'All'), `All selected at ${pathAndQuery(page)}`);
    await expectAllFourOrders(page);
    await demo.highlight(ordersList(page), `all four orders 101-104 at ${pathAndQuery(page)}`);
  });
});

test('TC-ORDST-1-12 opening /user/orders?status=Cancelled directly selects Cancelled and filters the list', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await test.step('navigate directly to /user/orders?status=Cancelled', async () => {
    await openOrders(page, demo, '?status=Cancelled');
  });
  await test.step('Cancelled is selected and only order 104 is shown', async () => {
    await expectOnlySelected(page, 'Cancelled');
    await demo.highlight(filterOption(page, 'Cancelled'), 'Cancelled selected');
    await expect(orderRows(page)).toHaveCount(1);
    const row = await rowSnapshot(rowOf(page, '104'));
    expect(row.cells[0]).toBe('104');
    expect(row.cells[2]).toContain('40.00');
    expect(row.cells[3]).toBe('Cancelled');
    await demo.highlight(ordersList(page), 'only order 104, Cancelled, 40.00');
    expect(pathAndQuery(page)).toBe('/user/orders?status=Cancelled');
  });
});

test('TC-ORDST-1-13 opening /user/orders?status=Delivered shows every order with "All" selected', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await test.step('navigate directly to /user/orders?status=Delivered', async () => {
    await openOrders(page, demo, '?status=Delivered');
  });
  await test.step('All is selected and every order is shown, with no error', async () => {
    await expectOnlySelected(page, 'All');
    await demo.highlight(statusFilter(page), 'All selected for an unknown status');
    await expect(orderRows(page)).toHaveCount(4);
    await expectAllFourOrders(page);
    await demo.highlight(ordersList(page), 'all four orders 101-104');
    await expect(page.getByText('No orders yet')).toHaveCount(0);
    await expect(page.getByText('No Delivered orders.')).toHaveCount(0);
    await expect(page.locator('#blazor-error-ui')).toBeHidden();
    await expect(page.getByText(/error/i).filter({ visible: true })).toHaveCount(0);
    await demo.absent(orderRows(page).last(), 'no error and no empty-state message');
  });
});

test('TC-ORDST-1-14 a status none of alice\'s orders has shows "No StockConfirmed orders." and a "Show all orders" link', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await test.step('open /user/orders', async () => {
    await openOrders(page, demo);
    await expectAllFourOrders(page);
  });
  const showAll = page.getByRole('link', { name: 'Show all orders', exact: true });
  await test.step('click the StockConfirmed option of the Status filter', async () => {
    await filterOption(page, 'StockConfirmed').click();
    await expect(page).toHaveURL(/\/user\/orders\?status=StockConfirmed$/);
    expect(pathAndQuery(page)).toBe('/user/orders?status=StockConfirmed');
    await expect(page.getByText('No StockConfirmed orders.', { exact: true })).toBeVisible();
    await expect(orderRows(page)).toHaveCount(0);
    await expect(headerRow(page)).toHaveCount(0);
    await expect(page.getByText('No orders yet')).toHaveCount(0);
    await expect(statusFilter(page)).toBeVisible();
    await expectOnlySelected(page, 'StockConfirmed');
    await demo.caption(`After clicking StockConfirmed: ${page.url()}`);
    await demo.highlight(filterOption(page, 'StockConfirmed'), `StockConfirmed selected at ${pathAndQuery(page)}`);
    await demo.highlight(page.locator('.orders-filter-empty'), `"No StockConfirmed orders." at ${pathAndQuery(page)}`);
    // The anchor's href property is the URL the browser resolves against the page's <base href="/">.
    const target = new URL(await showAll.evaluate((a: HTMLAnchorElement) => a.href));
    expect(target.pathname + target.search).toBe('/user/orders');
    await demo.highlight(showAll, 'Show all orders -> /user/orders');
  });
  await test.step('click the link "Show all orders"', async () => {
    await showAll.click();
    await expect(page).toHaveURL(/\/user\/orders$/);
    expect(pathAndQuery(page)).toBe('/user/orders');
    await expectOnlySelected(page, 'All');
    await expectAllFourOrders(page);
    await demo.caption(`After clicking Show all orders: ${page.url()}`);
    await demo.highlight(ordersList(page), `All selected, orders 101-104 at ${pathAndQuery(page)}`);
  });
});

test('TC-ORDST-1-15 a shopper with no orders still sees "No orders yet" and no filter', async ({ page, demo }) => {
  await signIn(page, 'bob');
  for (const query of ['', '?status=Paid']) {
    await test.step(`open /user/orders${query}`, async () => {
      await openOrders(page, demo, query);
    });
    await test.step(`"No orders yet" and no filter at /user/orders${query}`, async () => {
      const empty = page.locator('.orders-empty');
      await expect(empty.getByRole('heading', { name: 'No orders yet', exact: true })).toBeVisible();
      await expect(empty.getByText('When you place an order, it shows up here with its status and total.', { exact: true })).toBeVisible();
      await demo.highlight(empty, `"No orders yet" at /user/orders${query}`);
      await expect(statusFilter(page)).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Paid', exact: true })).toHaveCount(0);
      await expect(page.getByText('No Paid orders.')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Show all orders' })).toHaveCount(0);
      await expect(orderRows(page)).toHaveCount(0);
      await demo.absent(empty, 'no Status filter, no order rows');
    });
  }
});

test('TC-ORDST-1-16 when a Paid order is shipped, the refreshed list keeps the Paid filter', async ({ page, demo, request }) => {
  const token = await tokenFor('alice');
  await signIn(page, 'alice');
  await test.step('open /user/orders?status=Paid; the list shows 101 and 102', async () => {
    await openOrders(page, demo, '?status=Paid');
    await expect(orderNumbers(page)).toHaveText(['101', '102']);
    await demo.highlight(ordersList(page), 'Paid filter: 101 and 102');
  });
  await test.step('without reloading, PUT /api/orders/ship for order 101 as alice', async () => {
    const response = await request.put(`${url('ordering')}/api/orders/ship?api-version=1.0`, {
      headers: { ...auth(token), 'x-requestid': crypto.randomUUID() },
      data: { orderNumber: 101 },
    });
    expect(response.status()).toBe(200);
    await demo.caption('Shipped order 101 through PUT /api/orders/ship');
  });
  await test.step('the list updates on its own and keeps the Paid filter', async () => {
    await expect(orderNumbers(page)).toHaveText(['102'], { timeout: 15_000 });
    await expect(orderRows(page).locator('.order-status')).toHaveText(['Paid']);
    expect(pathAndQuery(page)).toBe('/user/orders?status=Paid');
    await expectOnlySelected(page, 'Paid');
    await demo.caption(`After the live refresh: ${page.url()}`);
    await demo.highlight(filterOption(page, 'Paid'), `Paid still selected at ${pathAndQuery(page)}`);
    await demo.highlight(ordersList(page), `only 102 left at ${pathAndQuery(page)}; 101 shipped`);
    await demo.absent(orderRows(page).last(), 'no orders 101, 103 or 104');
  });
});
