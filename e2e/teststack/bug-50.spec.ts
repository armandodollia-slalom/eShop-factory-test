import { APIRequestContext, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-50: the webhook client's home page ("Order management") shows the "Webhook messages received (orders paid)"
// list, with each message's token, only to signed-in users; anonymous visitors get a log-in prompt instead.
// Scenario `bug-50` (.factory/stack/scenarios/bug-50): the seeded user alice. Received messages are kept in the
// client's memory, so each case delivers its own run-unique message and asserts on that message.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const USER = 'alice';
const PASSWORD = 'Pass123$';
const WHEN = '2026-11-18T00:50:00Z';
const PAGE_TITLE = 'Order management';
const MESSAGES_HEADING = 'Webhook messages received (orders paid)';
const HOOKS_HEADING = 'Registered webhooks';
const MESSAGES_PROMPT = 'Log in to view webhook messages received';
const HOOKS_PROMPT = 'Log in to view or edit webhook registrations';

const CLIENT = () => url('webhooksclient');

test.beforeAll(() => {
  loadScenario('bug-50');
});

/** A run-unique order id, so the delivered message can be told apart from any other in the client's memory. */
const uniqueOrderId = () => Date.now() % 1_000_000_000;

const payloadOf = (orderId: number) => JSON.stringify({ OrderId: orderId, OrderStatus: 'paid' });

/** Step 1 of both cases: the same request the Webhooks API sends when an order is paid, with no cookies. */
async function deliverMessage(request: APIRequestContext, orderId: number, token: string) {
  await test.step(`POST ${CLIENT()}/webhook-received with X-eshop-whtoken: ${token} (OrderId ${orderId})`, async () => {
    const response = await request.post(`${CLIENT()}/webhook-received`, {
      headers: { 'X-eshop-whtoken': token, 'Content-Type': 'application/json' },
      data: { when: WHEN, payload: payloadOf(orderId), type: 'OrderPaid' },
    });
    expect(response.status()).toBe(200);
  });
}

const heading = (page: Page, name: string) => page.getByRole('heading', { level: 2, name, exact: true });
/** What the page renders right under a section heading (AuthorizeView adds no wrapper element). */
const sectionBody = (page: Page, name: string) => heading(page, name).locator('xpath=following-sibling::*[1]');

async function openHome(page: Page) {
  await page.goto(`${CLIENT()}/`);
  await expect(page).toHaveTitle(PAGE_TITLE);
  await expect(heading(page, MESSAGES_HEADING)).toBeVisible();
  await page.waitForLoadState('networkidle');
}

test('TC-BUG-50-01 anonymous visitor sees a log-in prompt instead of received messages and tokens', async ({ page, request, demo }) => {
  const orderId = uniqueOrderId();
  const token = `bug50-anon-${orderId}`;

  await deliverMessage(request, orderId, token);

  await test.step(`open ${CLIENT()}/ in a new browser context with no cookies (not signed in)`, async () => {
    expect(await page.context().cookies()).toEqual([]);
    await openHome(page);
    await demo.caption(`Signed out, opened ${page.url()}`);
  });

  await test.step('the messages section asks the visitor to log in, like the registered webhooks section', async () => {
    await expect(page).toHaveTitle(PAGE_TITLE);
    await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
    await expect(sectionBody(page, HOOKS_HEADING)).toHaveText(HOOKS_PROMPT);
    await demo.highlight(sectionBody(page, HOOKS_HEADING),`"${HOOKS_HEADING}": "${HOOKS_PROMPT}"`);
    await expect(sectionBody(page, MESSAGES_HEADING)).toHaveText(MESSAGES_PROMPT);
    await demo.highlight(sectionBody(page, MESSAGES_HEADING), `"${MESSAGES_HEADING}": "${MESSAGES_PROMPT}"`);
  });

  await test.step(`no grid, no When/Data/Token columns, no token ${token} and no message data on the page`, async () => {
    await expect(page.locator('table')).toHaveCount(0);
    await expect(heading(page, MESSAGES_HEADING).locator('xpath=following-sibling::table')).toHaveCount(0);
    for (const column of ['When', 'Data', 'Token']) {
      await expect(page.getByRole('columnheader', { name: column })).toHaveCount(0);
    }
    const text = await page.locator('body').innerText();
    expect(text).not.toContain(token);
    expect(text).not.toContain(`"OrderId":${orderId}`);
    expect(text).not.toContain('OrderStatus');
    expect(text).not.toContain('None yet received');
    await demo.caption(`Delivered token ${token} (OrderId ${orderId}) is not on the page`);
    await demo.absent(sectionBody(page, MESSAGES_HEADING), `No grid, no token ${token}, no OrderId ${orderId}`);
  });
});

test('TC-BUG-50-02 signed-in user sees received messages with When, Data and Token as before', async ({ page, request, demo }) => {
  const orderId = uniqueOrderId();
  const token = `bug50-auth-${orderId}`;
  const data = payloadOf(orderId);

  await deliverMessage(request, orderId, token);

  await test.step(`open ${CLIENT()}/, follow "Log in" and sign in on Identity as ${USER}`, async () => {
    await openHome(page);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await demo.caption(`Identity sign-in: ${page.url().split('?')[0]}`);
    await page.getByPlaceholder('Username').fill(USER);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText(USER, { exact: true })).toBeVisible();
  });

  await test.step(`open ${CLIENT()}/ again and wait for the page to render`, async () => {
    await openHome(page);
    await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
    await demo.caption(`Signed in as ${USER}, opened ${page.url()}`);
  });

  await test.step('the messages grid shows When, Data and Token, with the delivered message', async () => {
    await expect(page.getByText(MESSAGES_PROMPT)).toHaveCount(0);
    const grid = heading(page, MESSAGES_HEADING).locator('xpath=following-sibling::table[1]');
    await expect(grid).toBeVisible();
    await expect(grid.locator('thead th')).toHaveText(['When', 'Data', 'Token']);

    const row = grid.locator('tbody tr').filter({ has: page.locator('td', { hasText: token }) });
    await expect(row).toHaveCount(1);
    const cells = row.locator('td');
    await expect(cells).toHaveCount(3);
    await expect(cells.nth(1)).toHaveText(data);
    await expect(cells.nth(2)).toHaveText(token);
    // The grid renders the DateTime with the server's invariant culture.
    await expect(cells.nth(0)).toHaveText('11/18/2026 00:50:00');
    await demo.highlight(grid.locator('thead'), 'Columns: When, Data, Token');
    await demo.highlight(row, `Row: 11/18/2026 00:50:00 | ${data} | ${token}`);
  });
});
