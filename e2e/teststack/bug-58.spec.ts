import { Browser, Page, Response } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// BUG-58: on Identity's sign-in page, spaces before or after the user name are ignored, so " alice" and "alice "
// with alice's password sign in as alice exactly as "alice" does; a wrong password or user name is still refused.
// Scenario `bug-58` (.factory/stack/scenarios/bug-58): the seeded users alice and bob (Pass123$), no nosuchuser.
// Sign-in locks out on failure, so only bob (once) and nosuchuser fail; alice only ever signs in successfully.
// The spaced cases also sign in as plain alice in a second context, and narrated frames add time: past 30 s.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const ALICE = 'alice';
const BOB = 'bob';
const UNKNOWN = 'nosuchuser';
const PASSWORD = 'Pass123$';
const WRONG_PASSWORD = 'factoryfake-wrong-0001';
const INVALID = 'Invalid username or password';

test.beforeAll(() => {
  loadScenario('bug-58');
});

const webAppHost = () => new URL(BASE_URL!).host;
const identityHost = () => new URL(url('identity')).host;

const signInLink = (page: Page) => page.getByLabel('Sign in', { exact: true });
const accountButton = (page: Page) => page.getByRole('button', { name: 'Account', exact: true });
const loginHeading = (page: Page) => page.getByRole('heading', { name: 'Login', exact: true });
const usernameBox = (page: Page) => page.getByPlaceholder('Username', { exact: true });
const passwordBox = (page: Page) => page.getByPlaceholder('Password', { exact: true });
const loginButton = (page: Page) => page.getByRole('button', { name: 'Login', exact: true });
const userMenuName = (page: Page) => page.locator('.user-menu-name');

/** Shows a typed value with its spaces visible: `" alice" (6 chars)`. */
const shown = (value: string) => `${JSON.stringify(value)} (${value.length} chars)`;

/**
 * Collects the body of every HTML page the browser receives, so a case can prove a message was never shown on
 * any page of the flow (including the Identity page that redirects away right after the POST).
 */
function recordPages(page: Page) {
  const bodies: Promise<string>[] = [];
  page.on('response', (response: Response) => {
    if (response.request().resourceType() !== 'document') return;
    bodies.push(response.text().catch(() => ''));
  });
  return async () => (await Promise.all(bodies)).filter((body) => body.includes(INVALID)).length;
}

async function openSignInPage(page: Page, demo: Demo) {
  await test.step('open the WebApp home page (/)', async () => {
    await page.goto(BASE_URL!);
    await expect(signInLink(page)).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
  });
  await test.step('click "Sign in" and wait for the Identity "Login" page', async () => {
    await signInLink(page).click();
    await expect(loginHeading(page)).toBeVisible();
    expect(new URL(page.url()).host).toBe(identityHost());
    await demo.caption(`Sign-in page: ${new URL(page.url()).origin}${new URL(page.url()).pathname}`);
  });
}

async function fillAndSubmit(page: Page, demo: Demo, username: string, password: string) {
  await test.step(`fill Username with ${shown(username)}`, async () => {
    await usernameBox(page).fill(username);
    await expect(usernameBox(page)).toHaveValue(username);
    expect(await usernameBox(page).inputValue()).toHaveLength(username.length);
    await demo.highlight(usernameBox(page), `Username = ${shown(username)}`);
  });
  await test.step('fill Password', async () => {
    await passwordBox(page).fill(password);
    await expect(passwordBox(page)).toHaveValue(password);
  });
  await test.step('click "Login"', async () => {
    await loginButton(page).click();
  });
}

/** Opens the Account menu and returns the signed-in user's name shown in it. */
async function readSignedInName(page: Page, demo: Demo, label: string) {
  return await test.step('open the Account menu and read .user-menu-name', async () => {
    await accountButton(page).hover();
    await accountButton(page).focus();
    await expect(userMenuName(page)).toBeVisible();
    const name = (await userMenuName(page).innerText()).trim();
    await demo.highlight(userMenuName(page), `${label}: "${name}"`);
    return name;
  });
}

async function expectBackOnWebAppSignedIn(page: Page, demo: Demo) {
  await test.step('the browser is back on the WebApp with "Account" and no "Sign in"', async () => {
    await expect(accountButton(page)).toBeVisible();
    expect(new URL(page.url()).host).toBe(webAppHost());
    await expect(signInLink(page)).toHaveCount(0);
    await expect(page.getByText(INVALID)).toHaveCount(0);
    await demo.caption(`After Login: ${page.url()}`);
    await demo.highlight(accountButton(page), 'Signed in: "Account" shown');
    await demo.absent(page.locator('header').first(), 'No "Sign in" button in the header');
  });
}

/** Signs in as plain "alice" in a fresh, signed-out context and returns the name the Account menu shows. */
async function baselineAliceName(browser: Browser) {
  return await test.step(`baseline: sign in as plain "${ALICE}" in a fresh, signed-out context`, async () => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(BASE_URL!);
      await signInLink(page).click();
      await expect(loginHeading(page)).toBeVisible();
      await usernameBox(page).fill(ALICE);
      await passwordBox(page).fill(PASSWORD);
      await loginButton(page).click();
      await expect(accountButton(page)).toBeVisible();
      await accountButton(page).hover();
      await accountButton(page).focus();
      await expect(userMenuName(page)).toBeVisible();
      return (await userMenuName(page).innerText()).trim();
    } finally {
      await context.close();
    }
  });
}

async function spacedAliceSignsIn(page: Page, browser: Browser, demo: Demo, username: string) {
  const invalidPages = recordPages(page);
  await openSignInPage(page, demo);
  await fillAndSubmit(page, demo, username, PASSWORD);
  await expectBackOnWebAppSignedIn(page, demo);
  const name = await readSignedInName(page, demo, `Signed in with ${shown(username)}`);
  await test.step(`"${INVALID}" was not shown on any page of the flow`, async () => {
    expect(await invalidPages()).toBe(0);
  });
  const baseline = await baselineAliceName(browser);
  await test.step('the signed-in user is alice, the same name plain "alice" shows', async () => {
    expect(name.toLowerCase()).toContain(ALICE);
    expect(name.toLowerCase()).not.toContain(BOB);
    expect(name).toBe(baseline);
    await demo.caption(`Signed in as "${name}"; plain "${ALICE}" shows "${baseline}"`);
    await demo.highlight(userMenuName(page), `"${name}" equals plain alice's "${baseline}"`);
  });
}

async function expectRefused(page: Page, demo: Demo) {
  await test.step(`the browser stays on the Identity "Login" page with "${INVALID}"`, async () => {
    const error = page.getByText(INVALID, { exact: true });
    await expect(error).toBeVisible();
    await expect(loginHeading(page)).toBeVisible();
    expect(new URL(page.url()).host).toBe(identityHost());
    await demo.caption(`After Login: still on ${new URL(page.url()).origin}${new URL(page.url()).pathname}`);
    await demo.highlight(error, `Refused: "${INVALID}"`);
  });
  await test.step('open the WebApp home page (/): "Sign in" shown, no "Account"', async () => {
    await page.goto(BASE_URL!);
    await expect(signInLink(page)).toBeVisible();
    await expect(accountButton(page)).toHaveCount(0);
    await demo.caption(`Opened ${page.url()}`);
    await demo.highlight(signInLink(page), 'Still signed out: "Sign in" shown');
    await demo.absent(signInLink(page), 'No "Account" menu');
  });
}

test('TC-BUG-58-01 user name with a trailing space signs in as alice', async ({ page, browser, demo }) => {
  await spacedAliceSignsIn(page, browser, demo, `${ALICE} `);
});

test('TC-BUG-58-02 user name with a leading space signs in as alice', async ({ page, browser, demo }) => {
  await spacedAliceSignsIn(page, browser, demo, ` ${ALICE}`);
});

test('TC-BUG-58-03 user name with spaces on both sides signs in as alice', async ({ page, browser, demo }) => {
  await spacedAliceSignsIn(page, browser, demo, `  ${ALICE}  `);
});

test('TC-BUG-58-04 the exact user name still signs in as alice', async ({ page, demo }) => {
  const invalidPages = recordPages(page);
  await openSignInPage(page, demo);
  await fillAndSubmit(page, demo, ALICE, PASSWORD);
  await expectBackOnWebAppSignedIn(page, demo);
  const name = await readSignedInName(page, demo, `Signed in with ${shown(ALICE)}`);
  await test.step(`"${INVALID}" was not shown and the signed-in user is alice`, async () => {
    expect(await invalidPages()).toBe(0);
    expect(name.toLowerCase()).toContain(ALICE);
    expect(name.toLowerCase()).not.toContain(BOB);
  });
});

test('TC-BUG-58-05 a spaced user name with a wrong password is still refused', async ({ page, demo }) => {
  await openSignInPage(page, demo);
  await fillAndSubmit(page, demo, ` ${BOB} `, WRONG_PASSWORD);
  await expectRefused(page, demo);
});

test('TC-BUG-58-06 a spaced unknown user name with a valid password is still refused', async ({ page, demo }) => {
  await openSignInPage(page, demo);
  await fillAndSubmit(page, demo, ` ${UNKNOWN} `, PASSWORD);
  await expectRefused(page, demo);
});
