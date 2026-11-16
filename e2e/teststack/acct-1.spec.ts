import { Page } from '@playwright/test';
import { test, expect, createDemo } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// ACCT-1: a "My account" entry in the WebApp user menu opens /user/account, which shows the signed-in user's
// name, email and shipping address from their claims and requires sign-in.
// Scenario `acct-1` (.factory/stack/scenarios/acct-1): the seeded users alice and bob (Pass123$), no orders.
test.describe.configure({ mode: 'serial' });

const PASSWORD = 'Pass123$';
const HEADING = 'My account';
const TITLE = 'My account | AdventureWorks';
const ORDERS_TITLE = 'My orders | AdventureWorks';
const ACCOUNT_PATH = /\/user\/account$/;
const ORDERS_PATH = /\/user\/orders$/;
const ALICE_NAME = 'Alice Smith';
const ALICE_EMAIL = 'AliceSmith@email.com';
const ALICE_ADDRESS = '15703 NE 61st Ct, Redmond, WA 98052, U.S.';
const BOB_NAME = 'Bob Smith';
const BOB_EMAIL = 'BobSmith@email.com';

test.beforeAll(() => {
  loadScenario('acct-1');
});

/** The page header h1, which renders the `page-header-title` section outlet. */
const headerTitle = (page: Page) => page.locator('.eshop-hero-intro h1');
const menuPanel = (page: Page) => page.locator('.user-menu-panel');
const accountDetails = (page: Page) => page.locator('.account-details');

/** Fills the Identity service's login form and submits it. */
async function submitLogin(page: Page, user: string) {
  await expect(page.getByPlaceholder('Username')).toBeVisible();
  await page.getByPlaceholder('Username').fill(user);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
}

async function signIn(page: Page, user: string) {
  await test.step(`sign in as ${user} through the user icon ("Sign in")`, async () => {
    await page.goto(BASE_URL);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await submitLogin(page, user);
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
}

async function openUserMenu(page: Page) {
  await test.step('hover the user icon button "Account" to open the user menu', async () => {
    await page.getByRole('button', { name: 'Account' }).hover();
    await expect(menuPanel(page).getByRole('link', { name: HEADING, exact: true })).toBeVisible();
  });
}

/** Moves the pointer away from the user icon so the hover menu closes and the page below it is visible. */
async function movePointerOffMenu(page: Page) {
  await page.mouse.move(400, 600);
  await expect(menuPanel(page)).toBeHidden();
}

async function logOut(page: Page) {
  await test.step('open the user menu and click "Log out"', async () => {
    await page.getByRole('button', { name: 'Account' }).hover();
    await expect(menuPanel(page).getByRole('button', { name: 'Log out', exact: true })).toBeVisible();
    await menuPanel(page).getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Account' })).toHaveCount(0);
  });
}

async function openAccountPage(page: Page, demo: { caption(text: string): Promise<void> }) {
  await test.step('navigate to /user/account', async () => {
    await page.goto(`${BASE_URL}/user/account`);
    await expect(page).toHaveURL(ACCOUNT_PATH);
    await expect(headerTitle(page)).toHaveText(HEADING);
    await demo.caption(`Opened ${page.url()}`);
  });
}

/**
 * The recording has no address bar, and keyframe screenshots do not include caption overlays, so this pins a
 * banner into the page itself that shows the browser's current `location.href` and `document.title`, read in
 * the page at run time. Returns its locator so the test can highlight it.
 */
async function showAddressBar(page: Page) {
  await page.evaluate(() => {
    document.getElementById('e2e-address-bar')?.remove();
    const bar = document.createElement('div');
    bar.id = 'e2e-address-bar';
    bar.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:2147483647;'
      + 'padding:8px 16px;border-radius:8px;background:#0f172a;color:#fff;font:500 16px/1.5 monospace;'
      + 'white-space:pre;pointer-events:none;';
    bar.textContent = `URL:            ${location.href}\ndocument.title: ${document.title}`;
    document.body.appendChild(bar);
  });
  return page.locator('#e2e-address-bar');
}

async function hideAddressBar(page: Page) {
  await page.evaluate(() => document.getElementById('e2e-address-bar')?.remove());
}

/** Asserts the browser is on the Identity service's login page and shows its form. */
async function expectIdentityLogin(page: Page) {
  await expect(page.getByPlaceholder('Username')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  expect(new URL(page.url()).origin).toBe(new URL(url('identity')).origin);
}

test('TC-ACCT-1-01 user menu lists "My account" directly above "My orders"', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await openUserMenu(page);
  await test.step('read the user menu items in document order', async () => {
    const items = menuPanel(page).locator('.user-menu-item');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toHaveText(HEADING);
    await expect(items.nth(1)).toHaveText('My orders');
    await expect(items.nth(2)).toHaveText('Log out');
    await expect(menuPanel(page).getByRole('link', { name: HEADING, exact: true })).toHaveCount(1);
    await demo.highlight(items.nth(0), '"My account" (1st item)');
    await page.getByRole('button', { name: 'Account' }).hover();
    await demo.highlight(menuPanel(page), 'Menu order: My account, My orders, Log out');
  });
});

test('TC-ACCT-1-02 "My account" link opens /user/account', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await openUserMenu(page);
  await test.step('click the "My account" link', async () => {
    const link = menuPanel(page).getByRole('link', { name: HEADING, exact: true });
    await demo.highlight(link, 'Click: My account');
    await page.getByRole('button', { name: 'Account' }).hover();
    await link.click();
  });
  await test.step('the URL path is /user/account and the page is headed "My account"', async () => {
    await expect(page).toHaveURL(ACCOUNT_PATH);
    expect(new URL(page.url()).pathname).toBe('/user/account');
    await expect(headerTitle(page)).toHaveText(HEADING);
    await expect(page.getByPlaceholder('Username')).toHaveCount(0);
    await expect(accountDetails(page)).toBeVisible();
    await movePointerOffMenu(page);
    await demo.highlight(headerTitle(page), 'Heading: My account');
    await demo.caption(`Now on ${page.url()}`);
    const bar = await showAddressBar(page);
    await expect(bar).toContainText(`URL:            ${page.url()}`);
    await demo.highlight(bar, `URL path: ${new URL(page.url()).pathname}`);
    await hideAddressBar(page);
  });
});

test('TC-ACCT-1-03 account page heading is "My account" and tab title is "My account | AdventureWorks"', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await openAccountPage(page, demo);
  await test.step('the page heading and document.title are exact', async () => {
    await expect(page.getByRole('heading', { name: HEADING, exact: true })).toHaveText(HEADING);
    await expect(page).toHaveTitle(TITLE);
    expect(await page.evaluate(() => document.title)).toBe(TITLE);
    await demo.caption(`document.title = "${TITLE}"`);
    await demo.highlight(headerTitle(page), `Heading: ${HEADING}`);
    const bar = await showAddressBar(page);
    await expect(bar).toContainText(`document.title: ${TITLE}`);
    await demo.highlight(bar, `Tab title: ${TITLE}`);
    await hideAddressBar(page);
  });
});

test('TC-ACCT-1-04 account page shows alice\'s name, email and shipping address', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await openAccountPage(page, demo);
  await test.step('the page shows alice\'s name, email and shipping address', async () => {
    await expect(page.getByText(ALICE_NAME, { exact: true })).toBeVisible();
    await expect(page.locator('.account-name')).toHaveText(ALICE_NAME);
    await expect(page.getByText(ALICE_EMAIL, { exact: true })).toBeVisible();
    await expect(page.locator('.account-email')).toHaveText(ALICE_EMAIL);
    await expect(page.getByText(ALICE_ADDRESS, { exact: true })).toBeVisible();
    await expect(page.locator('.account-address')).toHaveText(ALICE_ADDRESS);
    await demo.highlight(page.locator('.account-name'), `Name: ${ALICE_NAME}`);
    await demo.highlight(page.locator('.account-email'), `Email: ${ALICE_EMAIL}`);
    await demo.highlight(page.locator('.account-address'), `Address: ${ALICE_ADDRESS}`);
  });
});

test('TC-ACCT-1-05 account page shows bob\'s own name and email and none of alice\'s', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const demo = createDemo(page);
  try {
    await signIn(page, 'bob');
    await openAccountPage(page, demo);
    await test.step('the page shows bob\'s name and email and nothing of alice\'s', async () => {
      await expect(page.locator('.account-name')).toHaveText(BOB_NAME);
      await expect(page.getByText(BOB_NAME, { exact: true })).toBeVisible();
      await expect(page.locator('.account-email')).toHaveText(BOB_EMAIL);
      await expect(page.getByText(BOB_EMAIL, { exact: true })).toBeVisible();
      await expect(page.getByText(ALICE_NAME)).toHaveCount(0);
      await expect(page.getByText(ALICE_EMAIL)).toHaveCount(0);
      await demo.highlight(page.locator('.account-name'), `Name: ${BOB_NAME}`);
      await demo.highlight(page.locator('.account-email'), `Email: ${BOB_EMAIL}`);
      await demo.absent(accountDetails(page), `No "${ALICE_NAME}" or "${ALICE_EMAIL}"`);
    });
  } finally {
    await demo.dispose();
    await context.close();
  }
});

test('TC-ACCT-1-06 after alice logs out and bob signs in in the same browser, the page shows only bob\'s details', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await openAccountPage(page, demo);
  await test.step('the account page shows "Alice Smith"', async () => {
    await expect(page.locator('.account-name')).toHaveText(ALICE_NAME);
    await demo.highlight(page.locator('.account-name'), `Signed in as alice: ${ALICE_NAME}`);
  });
  await logOut(page);
  await test.step('click the user icon ("Sign in") and sign in as bob', async () => {
    await page.getByRole('link', { name: 'Sign in' }).click();
    await submitLogin(page, 'bob');
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
  await openAccountPage(page, demo);
  await test.step('the page shows bob\'s name and email and nothing of alice\'s', async () => {
    await expect(page.locator('.account-name')).toHaveText(BOB_NAME);
    await expect(page.getByText(BOB_NAME, { exact: true })).toBeVisible();
    await expect(page.locator('.account-email')).toHaveText(BOB_EMAIL);
    await expect(page.getByText(BOB_EMAIL, { exact: true })).toBeVisible();
    await expect(page.getByText(ALICE_NAME)).toHaveCount(0);
    await expect(page.getByText(ALICE_EMAIL)).toHaveCount(0);
    await demo.highlight(page.locator('.account-name'), `After switching to bob: ${BOB_NAME}`);
    await demo.highlight(page.locator('.account-email'), `Email: ${BOB_EMAIL}`);
    await demo.absent(accountDetails(page), `No "${ALICE_NAME}" or "${ALICE_EMAIL}"`);
  });
});

test('TC-ACCT-1-07 anonymous visitor opening /user/account is sent to sign in', async ({ page, demo }) => {
  await test.step('navigate directly to /user/account without signing in', async () => {
    await page.goto(`${BASE_URL}/user/account`);
  });
  await test.step('the browser is on the Identity login page and no account details are shown', async () => {
    await expectIdentityLogin(page);
    await demo.caption(`Requested ${BASE_URL}/user/account -> ${new URL(page.url()).origin}${new URL(page.url()).pathname}`);
    await expect(page.getByRole('heading', { name: HEADING, exact: true })).toHaveCount(0);
    await expect(page.locator('.account-details')).toHaveCount(0);
    for (const text of [ALICE_NAME, BOB_NAME, ALICE_EMAIL, BOB_EMAIL]) {
      await expect(page.getByText(text)).toHaveCount(0);
    }
    const bar = await showAddressBar(page);
    await demo.highlight(bar, `Requested /user/account -> ${new URL(page.url()).origin}`);
    await hideAddressBar(page);
    await demo.highlight(page.getByRole('button', { name: 'Login' }), 'Identity login page (Username, Password, Login)');
    await demo.absent(page.getByRole('button', { name: 'Login' }), 'No "My account" heading or account details');
  });
});

test('TC-ACCT-1-08 signing in as alice from the redirect lands on /user/account', async ({ page, demo }) => {
  await test.step('navigate directly to /user/account (redirected to the Identity login page)', async () => {
    await page.goto(`${BASE_URL}/user/account`);
    await expectIdentityLogin(page);
    await demo.caption(`Requested ${BASE_URL}/user/account -> Identity login`);
  });
  await test.step('fill Username alice, Password Pass123$ and click "Login"', async () => {
    await submitLogin(page, 'alice');
  });
  await test.step('the browser is back on /user/account showing "My account" and "Alice Smith"', async () => {
    await expect(page).toHaveURL(ACCOUNT_PATH);
    expect(new URL(page.url()).origin).toBe(new URL(BASE_URL!).origin);
    expect(new URL(page.url()).pathname).toBe('/user/account');
    await expect(headerTitle(page)).toHaveText(HEADING);
    await expect(page.locator('.account-name')).toHaveText(ALICE_NAME);
    await demo.caption(`Landed on ${page.url()}`);
    const bar = await showAddressBar(page);
    await expect(bar).toContainText(`URL:            ${page.url()}`);
    await demo.highlight(bar, `Landed on ${new URL(page.url()).pathname}`);
    await hideAddressBar(page);
    await demo.highlight(headerTitle(page), 'Back on: My account');
    await demo.highlight(page.locator('.account-name'), `Name: ${ALICE_NAME}`);
  });
});

test('TC-ACCT-1-09 "My orders" is still in the user menu and opens the orders page', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await openUserMenu(page);
  await test.step('click "My orders"', async () => {
    const link = menuPanel(page).getByRole('link', { name: 'My orders', exact: true });
    await demo.highlight(link, 'Click: My orders');
    await page.getByRole('button', { name: 'Account' }).hover();
    await link.click();
  });
  await test.step('the URL path is /user/orders and the tab title is "My orders | AdventureWorks"', async () => {
    await expect(page).toHaveURL(ORDERS_PATH);
    expect(new URL(page.url()).pathname).toBe('/user/orders');
    await expect(page).toHaveTitle(ORDERS_TITLE);
    expect(await page.evaluate(() => document.title)).toBe(ORDERS_TITLE);
    await movePointerOffMenu(page);
    await demo.highlight(headerTitle(page), 'Orders page: My orders');
    await demo.caption(`Now on ${page.url()} - document.title = "${ORDERS_TITLE}"`);
    const bar = await showAddressBar(page);
    await expect(bar).toContainText(`URL:            ${page.url()}`);
    await expect(bar).toContainText(`document.title: ${ORDERS_TITLE}`);
    await demo.highlight(bar, `URL path: /user/orders; tab title: ${ORDERS_TITLE}`);
    await hideAddressBar(page);
  });
});

test('TC-ACCT-1-10 "Log out" is still in the user menu and signs the user out', async ({ page, demo }) => {
  await signIn(page, 'alice');
  await test.step('open the user menu and click "Log out"', async () => {
    await page.getByRole('button', { name: 'Account' }).hover();
    const logout = menuPanel(page).getByRole('button', { name: 'Log out', exact: true });
    await demo.highlight(logout, 'Click: Log out');
    await page.getByRole('button', { name: 'Account' }).hover();
    await logout.click();
  });
  await test.step('the header shows the "Sign in" user icon and no user menu', async () => {
    const signInLink = page.getByRole('link', { name: 'Sign in' });
    await expect(signInLink).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Account' })).toHaveCount(0);
    await expect(page.locator('.user-menu')).toHaveCount(0);
    await demo.highlight(signInLink, 'Signed out: "Sign in" icon, no user menu');
  });
  await test.step('navigate to /user/account', async () => {
    await page.goto(`${BASE_URL}/user/account`);
  });
  await test.step('the browser is on the Identity login page, not the account page', async () => {
    await expectIdentityLogin(page);
    await expect(page.locator('.account-details')).toHaveCount(0);
    await demo.caption(`Requested /user/account -> ${new URL(page.url()).origin}${new URL(page.url()).pathname}`);
    const bar = await showAddressBar(page);
    await demo.highlight(bar, `Requested /user/account -> ${new URL(page.url()).origin}`);
    await hideAddressBar(page);
    await demo.highlight(page.getByRole('button', { name: 'Login' }), 'Identity login page, not My account');
  });
});
