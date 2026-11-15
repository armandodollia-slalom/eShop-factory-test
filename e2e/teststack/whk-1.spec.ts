import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { url } from './ports';
import { loadScenario } from './scenario';

// WHK-1: the Remove button on each row of the registered webhooks list of the WebhookClient home page (`/`).
// Scenario `whk-1` (.factory/stack/scenarios/whk-1): the seeded users alice and bob (Pass123$), no webhook subscriptions.
// Every case starts from a freshly loaded scenario and registers its own webhooks through /add-webhook.
test.describe.configure({ mode: 'serial' });

test.beforeEach(() => {
  loadScenario('whk-1');
});

const CLIENT = () => url('webhooksclient');
const PASSWORD = 'Pass123$';
const NO_LONGER_EXISTS = 'This webhook no longer exists.';

// Opens a WebhookClient page and waits until its Blazor Server circuit is live: the router's FocusOnNavigate
// (Routes.razor, Selector="h1") focuses the header h1 only once the page renders interactively, after prerendering.
// Until then @onclick and @bind handlers are not attached and a click or a typed value would be lost.
async function openInteractive(page: Page, path: string) {
  await page.goto(`${CLIENT()}${path}`);
  await expect(page.locator('header h1')).toBeFocused({ timeout: 30_000 });
}

async function signIn(page: Page, user: string) {
  await openInteractive(page, '/');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByPlaceholder('Username').fill(user);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
}

async function register(page: Page, token: string) {
  await openInteractive(page, '/add-webhook');
  await page.getByPlaceholder('Token').fill(token);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(`${CLIENT()}/`);
}

const rows = (page: Page) => page.locator('table tbody tr');
const row = (page: Page, token: string) =>
  rows(page).filter({ has: page.getByRole('cell', { name: token, exact: true }) });
const removeButtons = (page: Page) => page.getByRole('button', { name: 'Remove', exact: true });
const alert = (page: Page) => page.getByRole('alert');
const tokenCells = async (page: Page) => (await rows(page).locator('td:nth-child(3)').allTextContents()).map((t) => t.trim());

/** Signs in, registers the given tokens in order and leaves `/` open (interactive) showing them. */
async function setUp(page: Page, user: string, tokens: string[]) {
  await test.step(`sign in to the WebhookClient as ${user}`, () => signIn(page, user));
  for (const token of tokens) {
    await test.step(`register a webhook with Token ${token}`, () => register(page, token));
  }
  await test.step('open / showing the registered rows', async () => {
    await openInteractive(page, '/');
    await expect(rows(page)).toHaveCount(tokens.length);
  });
}

async function clickRemove(page: Page, token: string, demo: { highlight: (l: Locator, label?: string) => Promise<void> }) {
  const button = row(page, token).getByRole('button', { name: 'Remove', exact: true });
  await demo.highlight(button, `Remove on the ${token} row`);
  await button.click();
}

test('TC-WHK-1-01 each registered webhook row has exactly one button labeled Remove', async ({ page, demo }) => {
  const A = 'whk1-01-a';
  const B = 'whk1-01-b';
  await setUp(page, 'alice', [A, B]);
  await test.step('open / as alice', async () => {
    await expect(rows(page)).toHaveCount(2);
    expect((await tokenCells(page)).sort()).toEqual([A, B]);
  });
  await test.step('each row has exactly one Remove button and the page has two', async () => {
    for (const token of [A, B]) {
      const buttons = row(page, token).getByRole('button');
      await expect(buttons).toHaveCount(1);
      await expect(buttons).toHaveText('Remove', { useInnerText: true });
      expect((await buttons.textContent())?.trim()).toBe('Remove');
    }
    await expect(removeButtons(page)).toHaveCount(2);
    await demo.highlight(page.locator('table'), 'Two rows, each with one Remove button');
  });
});

test('TC-WHK-1-02 removing one of two webhooks removes its row in place and keeps the other', async ({ page, demo }) => {
  const KEEP = 'whk1-02-keep';
  const REMOVE = 'whk1-02-remove';
  await setUp(page, 'alice', [KEEP, REMOVE]);
  const before = await test.step('record the page URL', () => page.url());
  let loads = 0;
  await test.step(`click Remove on the ${REMOVE} row`, async () => {
    page.on('load', () => loads++);
    await clickRemove(page, REMOVE, demo);
  });
  await test.step('the removed row is gone, the other stays, without a page load', async () => {
    await expect(row(page, REMOVE)).toHaveCount(0);
    await expect(row(page, KEEP)).toHaveCount(1);
    await expect(rows(page)).toHaveCount(1);
    expect(page.url()).toBe(before);
    expect(loads).toBe(0);
    await expect(alert(page).filter({ hasText: NO_LONGER_EXISTS })).toHaveCount(0);
    await demo.highlight(page.locator('table'), `Only ${KEEP} remains, same page`);
  });
});

test('TC-WHK-1-03 a removed webhook is still gone after the page is reloaded', async ({ page, demo }) => {
  const KEEP = 'whk1-03-keep';
  const REMOVE = 'whk1-03-remove';
  await setUp(page, 'alice', [KEEP, REMOVE]);
  await test.step(`click Remove on the ${REMOVE} row and wait until it is gone`, async () => {
    await clickRemove(page, REMOVE, demo);
    await expect(row(page, REMOVE)).toHaveCount(0);
  });
  await test.step('reload the page', async () => {
    await page.reload();
    await expect(rows(page)).toHaveCount(1);
  });
  await test.step(`after the reload only ${KEEP} is listed`, async () => {
    expect(await tokenCells(page)).toEqual([KEEP]);
    await expect(row(page, REMOVE)).toHaveCount(0);
    await demo.highlight(page.locator('table'), `After reload: only ${KEEP}`);
  });
});

test('TC-WHK-1-04 removing the last webhook shows None registered', async ({ page, demo }) => {
  const ONLY = 'whk1-04-only';
  await setUp(page, 'alice', [ONLY]);
  await test.step(`click Remove on the ${ONLY} row`, () => clickRemove(page, ONLY, demo));
  await test.step('the list shows None registered, no row and no Remove button', async () => {
    const placeholder = page.getByText('None registered', { exact: true });
    await expect(placeholder).toBeVisible();
    await expect(rows(page)).toHaveCount(0);
    await expect(removeButtons(page)).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/');
    await demo.highlight(placeholder, 'None registered after removing the last webhook');
  });
});

test('TC-WHK-1-05 alice removing her webhook leaves bob\'s webhook registered', async ({ browser, demo }) => {
  const ALICE = 'whk1-05-alice';
  const BOB = 'whk1-05-bob';
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  try {
    await setUp(pageA, 'alice', [ALICE]);
    await setUp(pageB, 'bob', [BOB]);
    await test.step(`in context A, open / and click Remove on the ${ALICE} row`, async () => {
      await pageA.bringToFront();
      await clickRemove(pageA, ALICE, demo);
    });
    await test.step('in context A, wait until the page shows None registered', async () => {
      await expect(pageA.getByText('None registered', { exact: true })).toBeVisible();
    });
    await test.step('in context B, open /', async () => {
      await pageB.bringToFront();
      await pageB.goto(`${CLIENT()}/`);
      await expect(rows(pageB)).toHaveCount(1);
    });
    await test.step(`bob still has ${BOB} with its Remove button`, async () => {
      expect(await tokenCells(pageB)).toEqual([BOB]);
      await expect(row(pageB, BOB).getByRole('button', { name: 'Remove', exact: true })).toHaveCount(1);
      await expect(pageB.getByText('None registered', { exact: true })).toHaveCount(0);
      await demo.highlight(row(pageB, BOB), `Bob's ${BOB} is still registered`);
    });
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

test('TC-WHK-1-07 removing a webhook already deleted in another tab shows the message and reloads the list', async ({ page, context, demo }) => {
  const STALE = 'whk1-07-stale';
  const KEEP = 'whk1-07-keep';
  await setUp(page, 'alice', [STALE, KEEP]);
  const tab2 = await context.newPage();
  await test.step(`in tab 2, open / and remove ${STALE}`, async () => {
    await openInteractive(tab2, '/');
    await tab2.getByRole('button', { name: 'Remove', exact: true }).first().waitFor();
    await row(tab2, STALE).getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(row(tab2, STALE)).toHaveCount(0);
    await tab2.close();
  });
  await test.step(`in tab 1 (not reloaded), click Remove on the ${STALE} row`, async () => {
    await page.bringToFront();
    await expect(row(page, STALE)).toHaveCount(1);
    await clickRemove(page, STALE, demo);
  });
  await test.step('tab 1 shows the message and the reloaded list', async () => {
    const message = alert(page);
    await expect(message).toHaveText(NO_LONGER_EXISTS);
    expect((await message.textContent())?.trim()).toBe(NO_LONGER_EXISTS);
    await expect(row(page, STALE)).toHaveCount(0);
    await expect(rows(page)).toHaveCount(1);
    expect(await tokenCells(page)).toEqual([KEEP]);
    expect(new URL(page.url()).pathname).toBe('/');
    await demo.highlight(message, NO_LONGER_EXISTS);
    await demo.highlight(page.locator('table'), `Reloaded list: only ${KEEP}`);
  });
});
