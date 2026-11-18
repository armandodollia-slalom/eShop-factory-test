import { Browser, Page, APIRequestContext, Locator } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-53: a webhook registered for CatalogItemPriceChange must be called once when a catalog item's price changes,
// with the item's id, new price and old price; an update that keeps the price calls nothing.
// Scenario `bug-53` (.factory/stack/scenarios/bug-53): item 99 at 199.99, alice (Pass123$), no webhook subscriptions.
// Each case waits the 30 seconds its steps give before reading the webhooks client, so it outlasts the default timeout.
test.describe.configure({ mode: 'serial', timeout: 180_000 });

const USER = 'alice';
const PASSWORD = 'Pass123$';
const ITEM_ID = 99;
const OLD_PRICE = 199.99;
const NEW_PRICE = 149.99;
const DESTINATION = 'http://webhooksclient:8080/webhook-received';
const GRANT_URL = 'http://webhooksclient:8080/check';
const PRICE_TOKEN = 'bug53-price';
const PAID_TOKEN = 'bug53-paid';
const SHIPPED_TOKEN = 'bug53-shipped';
const SAME_TOKEN = 'bug53-same';
const WAIT_MS = 30_000;
// The API serializes WebhookType as its number (src/Webhooks.API/Model/WebhookType.cs).
const CATALOG_ITEM_PRICE_CHANGE = 1;

const CLIENT = () => url('webhooksclient');
const WEBHOOKS_API = () => `${url('webhooks')}/api/webhooks?api-version=1.0`;
const ITEM_API = () => `${url('catalog')}/api/catalog/items/${ITEM_ID}?api-version=2.0`;
// The only redirect URI identity registers for the webhooksswaggerui client; it resolves only inside the compose network.
const REDIRECT = 'http://webhooks-api:8080/swagger/oauth2-redirect.html';

// The webhooks client keeps received messages in memory; the hard load restarts it, so no message from an earlier run remains.
test.beforeEach(() => {
  loadScenario('bug-53', { hard: true });
});

// alice's bearer token for scope `webhooks`: the implicit flow of "webhooksswaggerui" returns it in the redirect fragment.
// Taken after the scenario load, which restarts identity.
async function webhooksApiToken(browser: Browser): Promise<string> {
  return await test.step(`get a Webhooks API token for ${USER}`, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authorize = new URL(`${url('identity')}/connect/authorize`);
    authorize.search = new URLSearchParams({
      client_id: 'webhooksswaggerui',
      response_type: 'token',
      scope: 'webhooks',
      redirect_uri: REDIRECT,
      state: 'bug53',
    }).toString();
    await page.goto(authorize.toString());
    await page.getByPlaceholder('Username').fill(USER);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
    await page.getByRole('button', { name: 'Login' }).click();
    const location = (await callback).headers()['location'] ?? '';
    await context.close();
    const token = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
    expect(token).not.toBe('');
    return token;
  });
}

const registeredSection = (page: Page) =>
  page.getByRole('heading', { name: 'Registered webhooks', exact: true }).locator('xpath=following-sibling::*[1]');
const receivedHeading = (page: Page) => page.getByRole('heading', { name: 'Webhook messages received (orders paid)', exact: true });
const receivedSection = (page: Page) => receivedHeading(page).locator('xpath=following-sibling::*[1]');
const receivedRows = (page: Page, token: string) =>
  receivedSection(page).locator('tbody tr').filter({ has: page.locator('td:nth-child(3)', { hasText: new RegExp(`^${token}$`) }) });

// The grids are rendered again when the Blazor circuit attaches, which can detach an element mid-highlight.
async function mark(demo: Demo, action: 'highlight' | 'absent', locator: Locator, label: string) {
  await expect(async () => {
    await expect(locator.first()).toBeAttached();
    await demo[action](locator, label);
  }).toPass();
}

async function signInToWebhooksClient(page: Page, demo: Demo) {
  await test.step(`sign in to the webhooks client as ${USER}`, async () => {
    await page.goto(`${CLIENT()}/`);
    // The button is interactive: a click before the Blazor circuit connects is ignored, so click until identity opens.
    await expect(async () => {
      await page.getByRole('button', { name: 'Log in', exact: true }).click({ timeout: 2_000 });
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible({ timeout: 2_000 });
    }).toPass();
    await page.getByPlaceholder('Username').fill(USER);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
    await demo.caption(`Signed in as ${USER} on ${page.url()}`);
  });
}

async function register(request: APIRequestContext, demo: Demo, apiToken: string, token: string, event: string) {
  await test.step(`POST /api/webhooks event ${event}, token ${token} answers 201`, async () => {
    const response = await request.post(WEBHOOKS_API(), {
      headers: { Authorization: `Bearer ${apiToken}` },
      data: { url: DESTINATION, grantUrl: GRANT_URL, token, event },
    });
    expect(response.status()).toBe(201);
    await demo.caption(`POST /api/webhooks ${event} (token ${token}) -> ${response.status()}`);
  });
}

async function getItem(request: APIRequestContext, demo: Demo) {
  return await test.step(`GET /api/catalog/items/${ITEM_ID} answers 200 with price ${OLD_PRICE}`, async () => {
    const response = await request.get(ITEM_API());
    expect(response.status()).toBe(200);
    const item = await response.json();
    expect(item.price).toBe(OLD_PRICE);
    await demo.caption(`GET /api/catalog/items/${ITEM_ID} -> ${response.status()}, price ${item.price}`);
    return item as Record<string, unknown>;
  });
}

async function putItem(request: APIRequestContext, demo: Demo, item: Record<string, unknown>, price: number) {
  await test.step(`PUT /api/catalog/items/${ITEM_ID} with price ${price} answers 201`, async () => {
    const response = await request.put(ITEM_API(), { data: { ...item, price } });
    expect(response.status()).toBe(201);
    await demo.caption(`PUT /api/catalog/items/${ITEM_ID} price ${item.price} -> ${price}: ${response.status()}`);
  });
}

// The case's step waits 30 seconds after the PUT before reading the grid; this waits whatever is left of that window.
async function waitOutWindow(page: Page, demo: Demo, putAt: number) {
  const left = putAt + WAIT_MS - Date.now();
  await demo.caption(`Waiting until 30 s after the PUT (${Math.max(0, Math.round(left / 1000))} s left)`);
  if (left > 0) await page.waitForTimeout(left);
}

async function openReceivedMessages(page: Page, demo: Demo) {
  await page.goto(`${CLIENT()}/`);
  await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
  await expect(receivedSection(page)).not.toHaveText('Loading...');
  await demo.caption(`Opened ${page.url()} as ${USER}`);
}

test('TC-BUG-53-01 changing item 99\'s price calls the CatalogItemPriceChange webhook once with id, new and old price, and no order webhook', async ({ page, request, browser, demo }) => {
  const apiToken = await webhooksApiToken(browser);
  await signInToWebhooksClient(page, demo);

  await register(request, demo, apiToken, PAID_TOKEN, 'OrderPaid');
  await register(request, demo, apiToken, SHIPPED_TOKEN, 'OrderShipped');
  await register(request, demo, apiToken, PRICE_TOKEN, 'CatalogItemPriceChange');

  await test.step('GET /api/webhooks lists the CatalogItemPriceChange subscription', async () => {
    const response = await request.get(WEBHOOKS_API(), { headers: { Authorization: `Bearer ${apiToken}` } });
    expect(response.status()).toBe(200);
    const subscriptions = (await response.json()) as { type: number; destUrl: string; token: string }[];
    const price = subscriptions.filter((s) => s.token === PRICE_TOKEN);
    expect(price).toHaveLength(1);
    expect(price[0]).toMatchObject({ type: CATALOG_ITEM_PRICE_CHANGE, destUrl: DESTINATION, token: PRICE_TOKEN });
    await demo.caption(`GET /api/webhooks -> ${response.status()}: type ${price[0].type} (CatalogItemPriceChange), ${price[0].destUrl}, token ${price[0].token}`);
    await page.reload();
    const row = registeredSection(page).locator('tbody tr').filter({ hasText: PRICE_TOKEN });
    await expect(row).toHaveCount(1);
    await mark(demo, 'highlight', row, `registered: ${DESTINATION} / ${PRICE_TOKEN}`);
  });

  const item = await getItem(request, demo);
  await putItem(request, demo, item, NEW_PRICE);
  const putAt = Date.now();

  await test.step('wait 30 seconds, then read the Received messages grid', async () => {
    await expect(async () => {
      await openReceivedMessages(page, demo);
      await expect(receivedRows(page, PRICE_TOKEN)).not.toHaveCount(0, { timeout: 1_000 });
    }).toPass({ timeout: WAIT_MS });
    await waitOutWindow(page, demo, putAt);
    await openReceivedMessages(page, demo);
  });

  await test.step(`exactly one row with Token ${PRICE_TOKEN}, Data holds ProductId 99, NewPrice 149.99, OldPrice 199.99`, async () => {
    const rows = receivedRows(page, PRICE_TOKEN);
    await expect(rows).toHaveCount(1);
    const data = JSON.parse((await rows.locator('td').nth(1).innerText()).trim());
    expect(data.ProductId).toBe(ITEM_ID);
    expect(data.NewPrice).toBe(NEW_PRICE);
    expect(data.OldPrice).toBe(OLD_PRICE);
    await mark(demo, 'highlight', rows, `one message, token ${PRICE_TOKEN}: ProductId ${data.ProductId}, NewPrice ${data.NewPrice}, OldPrice ${data.OldPrice}`);
  });

  await test.step(`no row with Token ${PAID_TOKEN} or ${SHIPPED_TOKEN}`, async () => {
    await expect(receivedRows(page, PAID_TOKEN)).toHaveCount(0);
    await expect(receivedRows(page, SHIPPED_TOKEN)).toHaveCount(0);
    await mark(demo, 'absent', receivedSection(page), `no message with token ${PAID_TOKEN} or ${SHIPPED_TOKEN}`);
  });
});

test('TC-BUG-53-03 an update of item 99 that keeps its price calls no webhook', async ({ page, request, browser, demo }) => {
  const apiToken = await webhooksApiToken(browser);
  await signInToWebhooksClient(page, demo);

  await register(request, demo, apiToken, SAME_TOKEN, 'CatalogItemPriceChange');

  const item = await getItem(request, demo);
  await putItem(request, demo, item, item.price as number);
  const putAt = Date.now();

  await test.step('wait 30 seconds, then read the Received messages grid', async () => {
    await waitOutWindow(page, demo, putAt);
    await openReceivedMessages(page, demo);
  });

  await test.step(`no row with Token ${SAME_TOKEN}`, async () => {
    await expect(receivedRows(page, SAME_TOKEN)).toHaveCount(0);
    await mark(demo, 'absent', receivedSection(page), `no message with token ${SAME_TOKEN}`);
  });

  await test.step(`GET /api/catalog/items/${ITEM_ID} still answers price ${OLD_PRICE}`, async () => {
    const response = await request.get(ITEM_API());
    expect(response.status()).toBe(200);
    const after = await response.json();
    expect(after.price).toBe(OLD_PRICE);
    await demo.caption(`GET /api/catalog/items/${ITEM_ID} -> ${response.status()}, price ${after.price}`);
    await mark(demo, 'highlight', receivedHeading(page),`price still ${after.price}; no message for ${SAME_TOKEN}`);
  });
});
