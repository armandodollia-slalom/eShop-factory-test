import { Page } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// BUG-52: on the webhooks client's /add-webhook page, Register with an empty Token box must say a token is needed
// and register nothing; Register with a token keeps registering the OrderPaid webhook and returning home.
// Scenario `bug-52` (.factory/stack/scenarios/bug-52): the demo user alice (Pass123$), no webhook subscriptions.
// Each case signs in through identity and holds several narrated frames, which takes longer than the default 30 s.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const USER = 'alice';
const PASSWORD = 'Pass123$';
const MESSAGE = 'A token is needed to register a webhook.';
const DESTINATION = 'http://webhooksclient:8080/webhook-received';
const TOKEN = 'bug52-token';
const RETRY_TOKEN = 'bug52-retry';
// Lists show only a hint of the token: an ellipsis and its last four characters.
const TOKEN_HINT = '…oken';
const RETRY_TOKEN_HINT = '…etry';
const ORDER_PAID = 3;

const CLIENT = () => url('webhooksclient');
const API = () => `${url('webhooks')}/api/webhooks?api-version=1.0`;
// The only redirect URI identity registers for the webhooksswaggerui client; it resolves only inside the compose network.
const REDIRECT = 'http://webhooks-api:8080/swagger/oauth2-redirect.html';

let apiToken = '';

// Each case starts from no subscriptions, so the registered-webhooks grid holds only the row that case creates.
test.beforeEach(() => {
  loadScenario('bug-52');
});

// alice's bearer token for scope `webhooks`: the implicit flow of "webhooksswaggerui" returns it in the redirect fragment.
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const authorize = new URL(`${url('identity')}/connect/authorize`);
  authorize.search = new URLSearchParams({
    client_id: 'webhooksswaggerui',
    response_type: 'token',
    scope: 'webhooks',
    redirect_uri: REDIRECT,
    state: 'bug52',
  }).toString();
  await page.goto(authorize.toString());
  await page.getByPlaceholder('Username').fill(USER);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  const callback = page.waitForResponse((r) => r.url().includes('/connect/authorize/callback') && r.status() === 302);
  await page.getByRole('button', { name: 'Login' }).click();
  const location = (await callback).headers()['location'] ?? '';
  apiToken = new URLSearchParams(location.split('#')[1] ?? '').get('access_token') ?? '';
  await context.close();
  expect(apiToken).not.toBe('');
});

const heading = (page: Page) => page.getByRole('heading', { name: 'Register a new webhook', exact: true });
const tokenBox = (page: Page) => page.getByPlaceholder('Token', { exact: true });
const registerButton = (page: Page) => page.getByRole('button', { name: 'Register', exact: true });
const errorMessage = (page: Page) => page.locator('p.error-message');
const registeredSection = (page: Page) =>
  page.getByRole('heading', { name: 'Registered webhooks', exact: true }).locator('xpath=following-sibling::*[1]');
const gridRows = (page: Page) => registeredSection(page).locator('tbody tr');

async function signInToWebhooksClient(page: Page) {
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
    await expect(page.getByRole('link', { name: 'Add webhook registration' })).toBeVisible();
  });
}

// The page is interactive server rendering: its form handler and @bind only work once the circuit is connected.
// Blazor removes the prerendered "Blazor:" component markers from the DOM when it attaches the circuit.
async function waitForCircuit(page: Page) {
  await page.waitForFunction(() => {
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
    while (walker.nextNode()) if ((walker.currentNode as Comment).data.startsWith('Blazor:')) return false;
    return true;
  });
}

async function openAddWebhook(page: Page, demo: Demo) {
  await test.step('navigate to <webhooksclient>/add-webhook', async () => {
    await page.goto(`${CLIENT()}/add-webhook`);
    await expect(heading(page)).toBeVisible();
    await waitForCircuit(page);
    await demo.caption(`Opened ${page.url()}`);
  });
}

async function clearTokenBox(page: Page, demo: Demo) {
  await test.step('clear the Token box', async () => {
    await tokenBox(page).fill('');
    await tokenBox(page).blur();
    await expect(tokenBox(page)).toHaveValue('');
    await demo.highlight(tokenBox(page), 'Token box is empty');
  });
}

async function listSubscriptions(page: Page) {
  const response = await page.request.get(API(), { headers: { Authorization: `Bearer ${apiToken}` } });
  return { status: response.status(), body: await response.json() };
}

test('TC-BUG-52-01 Register with an empty Token box shows "A token is needed to register a webhook." next to the form', async ({ page, demo }) => {
  await signInToWebhooksClient(page);
  await openAddWebhook(page, demo);
  await clearTokenBox(page, demo);

  await test.step('click Register', async () => {
    await registerButton(page).click();
    await expect(errorMessage(page)).toBeVisible();
  });

  await test.step('the page stays on /add-webhook and shows the message below the Register button', async () => {
    await expect(page).toHaveURL(`${CLIENT()}/add-webhook`);
    await expect(errorMessage(page)).toHaveText(MESSAGE, { useInnerText: true });
    const button = await registerButton(page).boundingBox();
    const message = await errorMessage(page).boundingBox();
    expect(button).not.toBeNull();
    expect(message).not.toBeNull();
    expect(message!.y).toBeGreaterThanOrEqual(button!.y + button!.height);
    await demo.caption(`Still on ${page.url()}`);
    await demo.highlight(errorMessage(page), `"${MESSAGE}" below Register`);
  });

  await test.step('the heading, the empty Token box and the Register button are still shown; no rejection text', async () => {
    await expect(heading(page)).toBeVisible();
    await expect(tokenBox(page)).toBeVisible();
    await expect(tokenBox(page)).toHaveValue('');
    await expect(registerButton(page)).toBeVisible();
    await expect(page.getByText(/^Registation was rejected/)).toHaveCount(0);
    await demo.highlight(page.locator('form').filter({ has: registerButton(page) }), 'form unchanged: empty Token box and Register');
    await demo.absent(errorMessage(page), 'no "Registation was rejected" text');
  });
});

test('TC-BUG-52-02 Register with an empty Token box registers no webhook', async ({ page, demo }) => {
  await signInToWebhooksClient(page);
  await openAddWebhook(page, demo);
  await clearTokenBox(page, demo);

  await test.step('click Register and wait for the error message', async () => {
    await registerButton(page).click();
    await expect(errorMessage(page)).toHaveText(MESSAGE, { useInnerText: true });
    await demo.highlight(errorMessage(page), MESSAGE);
  });

  await test.step('navigate to the webhooks client home page', async () => {
    await page.goto(`${CLIENT()}/`);
    await waitForCircuit(page);
    await expect(registeredSection(page)).toHaveText('None registered');
    await demo.caption(`Opened ${page.url()}`);
    // The grid is rendered again when the circuit loads the list, which can detach the element mid-highlight.
    await expect(async () => {
      await expect(registeredSection(page)).toHaveText('None registered');
      await demo.highlight(registeredSection(page), 'Registered webhooks: None registered');
    }).toPass();
  });

  await test.step(`GET /api/webhooks as ${USER} returns 200 []`, async () => {
    const { status, body } = await listSubscriptions(page);
    expect(status).toBe(200);
    expect(body).toEqual([]);
    await demo.caption(`GET /api/webhooks as ${USER} -> ${status} ${JSON.stringify(body)}`);
    await demo.highlight(registeredSection(page), `API lists ${JSON.stringify(body)}`);
  });
});

test('TC-BUG-52-03 Register with a token registers the webhook and returns to the home page as before', async ({ page, demo }) => {
  await signInToWebhooksClient(page);
  await openAddWebhook(page, demo);

  await test.step(`clear the Token box and type "${TOKEN}"`, async () => {
    await tokenBox(page).fill('');
    await demo.type(tokenBox(page), TOKEN);
    await tokenBox(page).blur();
    await expect(tokenBox(page)).toHaveValue(TOKEN);
    await demo.highlight(tokenBox(page), `Token: ${TOKEN}`);
  });

  await test.step('click Register', async () => {
    await registerButton(page).click();
    await expect(page).toHaveURL(`${CLIENT()}/`);
    await demo.caption(`After Register: ${page.url()}`);
  });

  await test.step('the home page lists exactly one webhook with the token hint and no message is shown', async () => {
    await expect(page.getByText(MESSAGE)).toHaveCount(0);
    await expect(gridRows(page)).toHaveCount(1);
    const row = gridRows(page).first();
    await expect(row.locator('td').nth(1)).toHaveText(DESTINATION);
    await expect(row.locator('td').nth(2)).toHaveText(TOKEN_HINT);
    await demo.highlight(row, `one row: ${DESTINATION} / ${TOKEN_HINT}`);
    await demo.absent(registeredSection(page), `no "${MESSAGE}"`);
  });

  await test.step(`GET /api/webhooks as ${USER} returns the one OrderPaid subscription`, async () => {
    const { status, body } = await listSubscriptions(page);
    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ tokenHint: TOKEN_HINT, destUrl: DESTINATION });
    expect(body[0]).not.toHaveProperty('token');
    // The API serializes WebhookType as its number: OrderPaid = 3 (src/Webhooks.API/Model/WebhookType.cs).
    expect(body[0].type).toBe(ORDER_PAID);
    await demo.caption(`GET /api/webhooks -> ${status}, 1 subscription: type ${body[0].type} (OrderPaid), token hint ${body[0].tokenHint}`);
    await demo.highlight(gridRows(page).first(), `API: 1 OrderPaid subscription, token hint ${TOKEN_HINT}`);
  });
});

test('TC-BUG-52-04 After the empty-token message, entering a token and registering succeeds', async ({ page, demo }) => {
  await signInToWebhooksClient(page);
  await openAddWebhook(page, demo);
  await clearTokenBox(page, demo);

  await test.step('click Register and wait for the message', async () => {
    await registerButton(page).click();
    await expect(page.getByText(MESSAGE, { exact: true })).toBeVisible();
    await demo.highlight(errorMessage(page), MESSAGE);
  });

  await test.step(`type "${RETRY_TOKEN}" into the Token box`, async () => {
    await demo.type(tokenBox(page), RETRY_TOKEN);
    await tokenBox(page).blur();
    await expect(tokenBox(page)).toHaveValue(RETRY_TOKEN);
    await demo.highlight(tokenBox(page), `Token: ${RETRY_TOKEN}`);
  });

  await test.step('click Register', async () => {
    await registerButton(page).click();
    await expect(page).toHaveURL(`${CLIENT()}/`);
    await demo.caption(`After Register: ${page.url()}`);
  });

  await test.step(`the home page lists exactly one webhook with token hint "${RETRY_TOKEN_HINT}" and no message`, async () => {
    await expect(gridRows(page)).toHaveCount(1);
    await expect(gridRows(page).first().locator('td').nth(2)).toHaveText(RETRY_TOKEN_HINT);
    await expect(page.getByText(MESSAGE)).toHaveCount(0);
    await demo.highlight(gridRows(page).first(), `one row, Token ${RETRY_TOKEN_HINT}`);
    await demo.absent(registeredSection(page), `no "${MESSAGE}"`);
  });
});
