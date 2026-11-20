import { Page } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-55: on the Identity sign-in page a correct password entered after repeated wrong ones either signs the
// shopper in or explains why they cannot sign in and what to do; it is never answered "Invalid username or password".
// Scenario `bug-55` (.factory/stack/scenarios/bug-55): users bug55-retry, bug55-typo, bug55-expired and bug55-locked,
// copies of bob (Pass123$) in different lockout states, plus the seeded alice. Reloaded before every case because
// the wrong passwords change each user's failed-attempt count.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const PASSWORD = 'Pass123$';
const WRONG_PASSWORD = 'factoryfake-wrong-0001';
const INVALID = 'Invalid username or password';
const LOGIN_PATH = /\/Account\/Login/i;

test.beforeEach(() => {
  loadScenario('bug-55');
});

const summary = (page: Page) => page.locator('.login-form .alert-danger');
const signInLink = (page: Page) => page.getByLabel('Sign in', { exact: true });
const accountButton = (page: Page) => page.getByRole('button', { name: 'Account', exact: true });
const userMenuName = (page: Page) => page.locator('.user-menu-name');

async function openLogin(page: Page, demo: Demo) {
  await test.step('open the WebApp home page and click the sign-in link; wait for the Identity login form', async () => {
    await page.goto(BASE_URL!);
    await expect(signInLink(page)).toBeVisible();
    await signInLink(page).click();
    await expect(page).toHaveURL(LOGIN_PATH);
    await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible();
    await demo.caption(`Opened ${new URL(page.url()).pathname}`);
  });
}

async function submit(page: Page, demo: Demo, user: string, password: string) {
  await page.getByPlaceholder('Username').fill(user);
  await page.getByPlaceholder('Password').fill(password);
  await demo.caption(`User ${user}, password ${password === PASSWORD ? 'correct (Pass123$)' : WRONG_PASSWORD}`);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForLoadState('load');
}

/** A wrong-password submit that must reload the form with "Invalid username or password" and nothing about a lockout. */
async function wrongAndExpectInvalid(page: Page, demo: Demo, user: string, attempt: number) {
  await submit(page, demo, user, WRONG_PASSWORD);
  await expect(page).toHaveURL(LOGIN_PATH);
  await expect(summary(page)).toContainText(INVALID);
  await expect(page.getByText(/locked/i)).toHaveCount(0);
  await demo.highlight(summary(page), `wrong password #${attempt}: "${INVALID}"`, 1200);
}

/** The WebApp header shows the signed-in user menu (with the user's name) instead of the sign-in link. */
async function expectSignedIn(page: Page, demo: Demo, name: string) {
  await expect(page).not.toHaveURL(LOGIN_PATH);
  expect(new URL(page.url()).origin).toBe(new URL(BASE_URL!).origin);
  await expect(accountButton(page)).toBeVisible();
  await expect(signInLink(page)).toHaveCount(0);
  await accountButton(page).hover();
  await expect(userMenuName(page)).toHaveText(name);
  await demo.caption(`Redirected to ${page.url()}`);
  await demo.highlight(userMenuName(page), `signed in as ${name}`);
}

test('TC-BUG-55-01 correct password after five wrong ones is never reported as wrong', async ({ page, demo }) => {
  const user = 'bug55-retry';
  await openLogin(page, demo);
  await test.step(`enter ${user} with a wrong password and log in, five times`, async () => {
    for (let attempt = 1; attempt <= 4; attempt++) {
      await submit(page, demo, user, WRONG_PASSWORD);
      await expect(page).toHaveURL(LOGIN_PATH);
      await expect(summary(page)).toContainText(INVALID);
      await demo.highlight(summary(page), `wrong password #${attempt}: "${INVALID}"`, 1200);
    }
    await submit(page, demo, user, WRONG_PASSWORD);
    await expect(page).toHaveURL(LOGIN_PATH);
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await demo.highlight(summary(page), 'wrong password #5 submitted', 1200);
  });
  await test.step(`enter ${user} with the correct password and log in`, async () => {
    await submit(page, demo, user, PASSWORD);
    // Either outcome the ticket allows: the lockout explanation on the login form, or the WebApp's user menu.
    await expect(summary(page).or(accountButton(page))).toBeVisible();
    await expect(page.getByText(INVALID)).toHaveCount(0);
    if (LOGIN_PATH.test(new URL(page.url()).pathname)) {
      await expect(summary(page)).toBeVisible();
      const message = (await summary(page).innerText()).toLowerCase();
      expect(message).not.toContain(INVALID.toLowerCase());
      expect(message).toContain('locked');
      expect(message).toContain('wait');
      expect(message).toContain('try again');
      await demo.caption(`Still on ${new URL(page.url()).pathname}: told why and to wait`);
      await demo.highlight(summary(page), 'correct password: account locked, wait and try again');
      await demo.absent(page.locator('.login-form'), `no "${INVALID}" after the correct password`);
    } else {
      await expectSignedIn(page, demo, user);
      await demo.absent(page.locator('.user-menu'), `no "${INVALID}" after the correct password`);
    }
  });
});

test('TC-BUG-55-02 correct password after four wrong ones signs the shopper in', async ({ page, demo }) => {
  const user = 'bug55-typo';
  await openLogin(page, demo);
  await test.step(`enter ${user} with a wrong password and log in, four times`, async () => {
    for (let attempt = 1; attempt <= 4; attempt++) await wrongAndExpectInvalid(page, demo, user, attempt);
  });
  await test.step(`enter ${user} with the correct password and log in`, async () => {
    await submit(page, demo, user, PASSWORD);
    await expectSignedIn(page, demo, user);
  });
});

test('TC-BUG-55-05 correct password after the lockout has ended signs the shopper in', async ({ page, demo }) => {
  const user = 'bug55-expired';
  await openLogin(page, demo);
  await test.step(`enter ${user} (lockout ended 2020-01-01) with the correct password and log in`, async () => {
    await submit(page, demo, user, PASSWORD);
    await expect(page.getByText(INVALID)).toHaveCount(0);
    await expect(page.getByText(/locked/i)).toHaveCount(0);
    await expectSignedIn(page, demo, user);
    await demo.absent(page.locator('.user-menu'), 'no "Invalid username or password" or "locked" message');
  });
});

test('TC-BUG-55-06 alice signs in with her correct password while another account is locked out', async ({ page, demo }) => {
  await openLogin(page, demo);
  await test.step('enter bug55-locked (locked until 2099) with a wrong password and log in', async () => {
    await submit(page, demo, 'bug55-locked', WRONG_PASSWORD);
    await expect(page).toHaveURL(LOGIN_PATH);
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await demo.highlight(summary(page), 'bug55-locked refused');
  });
  await test.step('in the same browser, enter alice with her correct password and log in', async () => {
    await submit(page, demo, 'alice', PASSWORD);
    await expectSignedIn(page, demo, 'alice');
  });
});
