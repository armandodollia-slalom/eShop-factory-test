/// <reference types="node" />
import { execFileSync } from 'child_process';
import { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { STACK, url } from './ports';
import { DOCKER, loadScenario } from './scenario';

// HINT-1: the Webhooks API's read endpoints return tokenHint instead of the token, and the webhooks client's
// Registered webhooks grid shows that hint (or "None") in its Token column.
// Scenario `hint-1` (.factory/stack/scenarios/hint-1): alice (Pass123$) owns subscriptions 9101 (http://receiver.test/long,
// token fake-token-3c4d), 9102 (http://receiver.test/short, token wxyz) and 9103 (http://receiver.test/none, no token).
// Each UI case signs in through identity and holds several narrated frames, which takes longer than the default 30 s.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const USER = 'alice';
const PASSWORD = 'Pass123$';
const ELLIPSIS = '…';
const LONG = { destination: 'http://receiver.test/long', token: 'fake-token-3c4d', hint: `${ELLIPSIS}3c4d` };
const SHORT = { destination: 'http://receiver.test/short', token: 'wxyz', hint: ELLIPSIS };
const NONE = { destination: 'http://receiver.test/none', hint: 'None' };
const FIRST_SUBSCRIPTION_ID = 9101;
const REGISTERED_DESTINATION = 'http://webhooksclient:8080/webhook-received';

const CLIENT = () => url('webhooksclient');
const API = (path = '') => `${url('webhooks')}/api/webhooks${path}?api-version=1.0`;

// Every case starts from alice's three seeded subscriptions, so the grid holds them plus only what that case registers.
test.beforeEach(() => {
  loadScenario('hint-1');
});

const tokenBox = (page: Page) => page.getByPlaceholder('Token', { exact: true });
const registerButton = (page: Page) => page.getByRole('button', { name: 'Register', exact: true });
const errorMessage = (page: Page) => page.locator('p.error-message');
const registeredSection = (page: Page) =>
  page.getByRole('heading', { name: 'Registered webhooks', exact: true }).locator('xpath=following-sibling::*[1]');
const rowFor = (page: Page, destination: string) =>
  registeredSection(page).locator('tbody tr').filter({ has: page.locator('td', { hasText: destination }) });
const tokenCell = (page: Page, destination: string) => rowFor(page, destination).locator('td').nth(2);

/** The hint rule of the story: "…" plus the last 4 characters, "…" alone for 1 to 4 characters. */
const hintOf = (token: string) => (token.length > 4 ? `${ELLIPSIS}${token.slice(-4)}` : ELLIPSIS);

/**
 * WebhookClientOptions:Token as the running webhooks client reads it: the WebhookClientOptions__Token environment
 * variable when the stack sets one, else the value in the container's appsettings.json.
 */
function configuredClientToken(): string {
  const docker = (args: string[]) => execFileSync(DOCKER, args, { encoding: 'utf8', windowsHide: true }).trim();
  const container = docker([
    'ps', '-q',
    '--filter', `label=com.docker.compose.project=${STACK.project}`,
    '--filter', 'label=com.docker.compose.service=webhooksclient',
  ]);
  expect(container, 'running webhooksclient container').not.toBe('');
  const fromEnv = docker(['exec', container, 'sh', '-c', 'printenv WebhookClientOptions__Token || true']);
  if (fromEnv) return fromEnv;
  const settings = JSON.parse(docker(['exec', container, 'cat', 'appsettings.json']));
  return settings?.WebhookClientOptions?.Token ?? '';
}

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
  });
}

// The pages are interactive server rendering: form handlers and @bind only work once the circuit is connected.
// Blazor removes the prerendered "Blazor:" component markers from the DOM when it attaches the circuit.
async function waitForCircuit(page: Page) {
  await page.waitForFunction(() => {
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_COMMENT);
    while (walker.nextNode()) if ((walker.currentNode as Comment).data.startsWith('Blazor:')) return false;
    return true;
  });
}

test('TC-HINT-1-11 GET /api/webhooks without a bearer token is still refused with 401', async ({ request }) => {
  const leaks = ['tokenHint', LONG.token, LONG.token.slice(-4), SHORT.token];

  await test.step('GET /api/webhooks with no Authorization header returns 401 without hints or tokens', async () => {
    const response = await request.get(API());
    const body = await response.text();
    expect(response.status()).toBe(401);
    for (const leak of leaks) expect(body).not.toContain(leak);
  });

  await test.step(`GET /api/webhooks/${FIRST_SUBSCRIPTION_ID} with no Authorization header returns 401 without hints or tokens`, async () => {
    const response = await request.get(API(`/${FIRST_SUBSCRIPTION_ID}`));
    const body = await response.text();
    expect(response.status()).toBe(401);
    for (const leak of leaks) expect(body).not.toContain(leak);
  });
});

test('TC-HINT-1-12 after registering on /add-webhook the home page Token column shows "…" and the last 4 characters', async ({ page, demo }) => {
  const clientToken = configuredClientToken();
  expect(clientToken, 'WebhookClientOptions:Token on the stack').not.toBe('');
  const hint = hintOf(clientToken);
  await signInToWebhooksClient(page);

  await test.step('open /add-webhook', async () => {
    await page.goto(`${CLIENT()}/add-webhook`);
    await expect(page.getByRole('heading', { name: 'Register a new webhook', exact: true })).toBeVisible();
    await waitForCircuit(page);
    await demo.caption(`Opened ${page.url()}`);
  });

  await test.step("clear the Token box, fill it with the client's configured token and click Register", async () => {
    await tokenBox(page).fill('');
    await demo.type(tokenBox(page), clientToken);
    await tokenBox(page).blur();
    await expect(tokenBox(page)).toHaveValue(clientToken);
    // A blurred input scrolls back to its start; put the caret at the end so the box shows the token's tail.
    await tokenBox(page).focus();
    await tokenBox(page).press('End');
    await demo.caption(`Token ends in ${clientToken.slice(-4)}`);
    await demo.highlight(tokenBox(page), `Token: the client's configured token, ending ${clientToken.slice(-4)}`);
    await registerButton(page).click();
    await expect(page).toHaveURL(`${CLIENT()}/`);
    await expect(errorMessage(page)).toHaveCount(0);
    await demo.caption(`After Register: ${page.url()}`);
  });

  await test.step('the Registered webhooks grid has the new row with the token hint and no whole token', async () => {
    await expect(rowFor(page, REGISTERED_DESTINATION)).toHaveCount(1);
    await expect(rowFor(page, REGISTERED_DESTINATION).locator('td').nth(1)).toHaveText(REGISTERED_DESTINATION);
    await expect(tokenCell(page, REGISTERED_DESTINATION)).toHaveText(hint);
    expect(await page.locator('body').innerText()).not.toContain(clientToken);
    await demo.highlight(rowFor(page, REGISTERED_DESTINATION), `new row: ${REGISTERED_DESTINATION} / Token ${hint}`);
    await demo.highlight(tokenCell(page, REGISTERED_DESTINATION), `Token ${hint}, not the whole token`);
  });
});

test('TC-HINT-1-13 the home page Token column shows "None" for a webhook without a token and hints for the others', async ({ page, demo }) => {
  await signInToWebhooksClient(page);

  await test.step('open the webhooks client home page', async () => {
    await page.goto(`${CLIENT()}/`);
    await waitForCircuit(page);
    await expect(rowFor(page, LONG.destination)).toHaveCount(1);
    await demo.caption(`Opened ${page.url()}`);
  });

  await test.step('read the Token cell of each row of the Registered webhooks grid', async () => {
    for (const row of [LONG, SHORT, NONE]) {
      await expect(tokenCell(page, row.destination)).toHaveText(row.hint);
      await demo.highlight(rowFor(page, row.destination), `${row.destination}: Token ${row.hint}`);
    }
  });

  await test.step(`the page text contains neither ${LONG.token} nor ${SHORT.token}`, async () => {
    const text = await page.locator('body').innerText();
    expect(text).not.toContain(LONG.token);
    expect(text).not.toContain(SHORT.token);
    await demo.absent(registeredSection(page), `no ${LONG.token} or ${SHORT.token} in the grid`);
  });
});
