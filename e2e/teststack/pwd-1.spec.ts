import { Browser, Page } from '@playwright/test';
import { test, expect, createDemo, Demo } from '../demo';
import { BASE_URL, url } from './ports';
import { loadScenario } from './scenario';

// PWD-1: a signed-in shopper changes their password from the WebApp user menu ("Change password", which opens
// /Manage/ChangePassword on Identity.API). Scenario `pwd-1` (.factory/stack/scenarios/pwd-1): one shopper per
// case (pwd1-*), each starting with the password Factoryfake1$, so no case depends on another's change.
// The narrated highlights and the extra sign-ins in fresh browser contexts push cases past the 30 s default.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const WEBAPP = BASE_URL!;
const IDENTITY = url('identity');
const CHANGE_PATH = '/Manage/ChangePassword';
const CHANGE_URL = `${IDENTITY}${CHANGE_PATH}`;

const INITIAL = 'Factoryfake1$';
const CHANGED = 'Factoryfake2$';

const CHANGED_MESSAGE = 'Your password has been changed.';
const INCORRECT_CURRENT = 'The current password is incorrect.';
const IDENTITY_MISMATCH_RAW = 'Incorrect password.';
const CONFIRM_MISMATCH = 'The new password and confirmation password do not match.';
const LENGTH_MESSAGE = 'The New password must be at least 6 and at max 100 characters long.';
const CURRENT_REQUIRED = 'The Current password field is required.';
const NEW_REQUIRED = 'The New password field is required.';
const NON_ALNUM_RULE = 'Passwords must have at least one non alphanumeric character.';
const DIGIT_RULE = "Passwords must have at least one digit ('0'-'9').";
const UPPER_RULE = "Passwords must have at least one uppercase ('A'-'Z').";
const LOWER_RULE = "Passwords must have at least one lowercase ('a'-'z').";
const INVALID_CREDENTIALS = 'Invalid username or password';

test.beforeAll(() => {
  loadScenario('pwd-1');
});

const accountButton = (page: Page) => page.getByRole('button', { name: 'Account' });
const signInLink = (page: Page) => page.getByRole('link', { name: 'Sign in' });
const menuPanel = (page: Page) => page.locator('.user-menu-panel');
const changeLink = (page: Page) => menuPanel(page).getByRole('link', { name: 'Change password', exact: true });
const logOutButton = (page: Page) => menuPanel(page).getByRole('button', { name: 'Log out', exact: true });
const currentInput = (page: Page) => page.getByLabel('Current password', { exact: true });
const newInput = (page: Page) => page.getByLabel('New password', { exact: true });
const confirmInput = (page: Page) => page.getByLabel('Confirm new password', { exact: true });
const submitButton = (page: Page) => page.locator('form.login-form').getByRole('button', { name: 'Change password', exact: true });
const errorSummary = (page: Page) => page.locator('.alert-danger');
const message = (page: Page, text: string) => page.getByText(text, { exact: true });
/** A password as narrated in step titles and captions: long values are shortened to fit the video. */
const shown = (value: string) => (value.length > 20 ? `${value.slice(0, 13)}... (${value.length} chars)` : value || '(empty)');

/** Signs in through the WebApp's sign-in icon and the Identity.API login page. */
async function fillLogin(page: Page, user: string, password: string) {
  await page.goto(WEBAPP);
  await signInLink(page).click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await page.getByPlaceholder('Username').fill(user);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

async function signIn(page: Page, user: string, password: string) {
  await test.step(`open the shop and sign in as ${user} with ${password}`, async () => {
    await fillLogin(page, user, password);
    await expect(accountButton(page)).toBeVisible();
  });
}

async function openUserMenu(page: Page) {
  await accountButton(page).hover();
  await expect(logOutButton(page)).toBeVisible();
}

async function openChangePage(page: Page, demo: Demo) {
  await test.step(`open ${CHANGE_URL}`, async () => {
    await page.goto(CHANGE_URL);
    await expect(page).toHaveURL(CHANGE_URL);
    await expect(currentInput(page)).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
  });
}

async function submitChange(page: Page, demo: Demo, current: string, next: string, confirm: string) {
  await test.step(`fill current ${shown(current)}, new ${shown(next)}, confirm ${shown(confirm)} and submit`, async () => {
    await demo.caption(`Current: ${shown(current)} | New: ${shown(next)} | Confirm: ${shown(confirm)}`);
    await currentInput(page).fill(current);
    await newInput(page).fill(next);
    await confirmInput(page).fill(confirm);
    await submitButton(page).click();
    await page.waitForLoadState('load');
  });
}

/** The change was refused: still on the change page with the form, no success message. */
async function expectRefused(page: Page) {
  await expect(page).toHaveURL(CHANGE_URL);
  await expect(currentInput(page)).toBeVisible();
  await expect(message(page, CHANGED_MESSAGE)).toHaveCount(0);
}

async function expectChanged(page: Page, demo: Demo) {
  await expect(message(page, CHANGED_MESSAGE)).toBeVisible();
  await expect(errorSummary(page)).toHaveCount(0);
  await expect(page.locator('.field-validation-error')).toHaveCount(0);
  await demo.highlight(message(page, CHANGED_MESSAGE), `"${CHANGED_MESSAGE}", no validation error`);
}

/** Signs in as `user` with `password` in a new browser context with no cookies; the sign-in must succeed. */
async function freshSignInSucceeds(browser: Browser, user: string, password: string) {
  await test.step(`new browser context with no cookies: sign in as ${user} with ${shown(password)} succeeds`, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const demo = createDemo(page);
    await fillLogin(page, user, password);
    await expect(page).toHaveURL(`${WEBAPP}/`);
    await openUserMenu(page);
    await expect(menuPanel(page).locator('.user-menu-name')).toHaveText(user);
    await demo.caption(`Fresh browser, ${user} / ${shown(password)}: signed in at ${page.url()}`);
    await demo.highlight(menuPanel(page), `Signed in as ${user} (user menu with Log out)`);
    await demo.dispose();
    await context.close();
  });
}

/** Signs in as `user` with `password` in a new browser context with no cookies; the sign-in must be refused. */
async function freshSignInRefused(browser: Browser, user: string, password: string) {
  await test.step(`new browser context with no cookies: sign in as ${user} with ${password} is refused`, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const demo = createDemo(page);
    await fillLogin(page, user, password);
    await expect(page).toHaveURL(new RegExp(`^${IDENTITY}/Account/Login`));
    await expect(message(page, INVALID_CREDENTIALS)).toBeVisible();
    await demo.caption(`Fresh browser, ${user} / ${password}: still on ${new URL(page.url()).pathname}`);
    await demo.highlight(message(page, INVALID_CREDENTIALS), 'Login refused: invalid credentials');
    await page.goto(WEBAPP);
    await expect(signInLink(page)).toBeVisible();
    await expect(accountButton(page)).toHaveCount(0);
    await demo.caption(`Back on ${page.url()}: not signed in`);
    await demo.highlight(signInLink(page), 'Header shows the sign-in entry, no user menu');
    await demo.dispose();
    await context.close();
  });
}

test('TC-PWD-1-01 signed-in shopper\'s user menu has "Change password" just before "Log out", opening the Identity change page', async ({ page, demo }) => {
  await signIn(page, 'pwd1-menu', INITIAL);

  await test.step('open the user menu in the header', async () => {
    await openUserMenu(page);
    const items = menuPanel(page).locator('.user-menu-item');
    const texts = (await items.allInnerTexts()).map((t) => t.trim());
    const changeIndex = texts.indexOf('Change password');
    expect(changeIndex).toBeGreaterThanOrEqual(0);
    expect(texts[changeIndex + 1]).toBe('Log out');
    await expect(changeLink(page)).toHaveText('Change password');
    await expect(changeLink(page)).toHaveAttribute('href', CHANGE_URL);
    await demo.caption(`Change password -> ${await changeLink(page).getAttribute('href')}`);
    await demo.highlight(changeLink(page), '"Change password" directly before "Log out"');
  });

  await test.step('click "Change password"', async () => {
    await changeLink(page).click();
    await expect(page).toHaveURL(CHANGE_URL);
    await expect(currentInput(page)).toBeVisible();
    await expect(newInput(page)).toBeVisible();
    await expect(confirmInput(page)).toBeVisible();
    await expect(currentInput(page)).toHaveAttribute('type', 'password');
    await expect(newInput(page)).toHaveAttribute('type', 'password');
    await expect(confirmInput(page)).toHaveAttribute('type', 'password');
    await expect(submitButton(page)).toBeVisible();
    await demo.caption(`Opened ${page.url()} without a sign-in prompt`);
    await demo.highlight(page.locator('form.login-form'), 'Current, New and Confirm new password inputs and submit');
  });
});

test('TC-PWD-1-02 visitor who is not signed in sees no "Change password" entry', async ({ page, demo }) => {
  await test.step(`open ${WEBAPP}/ without signing in`, async () => {
    await page.goto(WEBAPP);
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    await demo.caption(`Opened ${page.url()} as an anonymous visitor`);
  });

  await test.step('inspect the header: sign-in link, no user menu, no Change password entry', async () => {
    await expect(signInLink(page)).toBeVisible();
    const href = await signInLink(page).getAttribute('href');
    expect(href).not.toBeNull();
    await expect(accountButton(page)).toHaveCount(0);
    await expect(page.locator('.user-menu')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);
    await expect(page.getByText('Change password')).toHaveCount(0);
    await expect(page.locator('a[href$="/Manage/ChangePassword"]')).toHaveCount(0);
    await demo.highlight(signInLink(page), 'Header user icon is the Sign in link');
    await demo.absent(page.locator('header').first(), 'No user menu and no "Change password" in the header');
  });

  await test.step('the sign-in link leads to the Identity.API login page', async () => {
    await signInLink(page).click();
    await expect(page).toHaveURL(new RegExp(`^${IDENTITY}/Account/Login`));
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await demo.caption(`Sign in link opened ${new URL(page.url()).origin}${new URL(page.url()).pathname}`);
    await demo.highlight(page.getByRole('heading', { name: 'Login' }), 'Identity.API login page');
  });
});

test('TC-PWD-1-03 valid change shows the confirmation and a "Back to the shop" link to the shop home', async ({ page, demo }) => {
  await signIn(page, 'pwd1-change', INITIAL);

  await test.step('open the user menu and click "Change password"', async () => {
    await openUserMenu(page);
    await changeLink(page).click();
    await expect(page).toHaveURL(CHANGE_URL);
    await demo.caption(`Opened ${page.url()}`);
  });

  await submitChange(page, demo, INITIAL, CHANGED, CHANGED);

  const back = page.getByRole('link', { name: 'Back to the shop', exact: true });
  await test.step('the page confirms the change and offers "Back to the shop"', async () => {
    await expectChanged(page, demo);
    await expect(back).toHaveText('Back to the shop');
    await expect(back).toHaveAttribute('href', WEBAPP);
    await demo.caption(`Back to the shop -> ${await back.getAttribute('href')}`);
    await demo.highlight(back, '"Back to the shop" links to the shop home');
  });

  await test.step('click "Back to the shop"', async () => {
    await back.click();
    await expect(page).toHaveURL(`${WEBAPP}/`);
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    await expect(page.locator('.catalog-item').first()).toBeVisible();
    await expect(accountButton(page)).toBeVisible();
    await expect(signInLink(page)).toHaveCount(0);
    await demo.caption(`Now on ${page.url()}, still signed in`);
    await demo.highlight(accountButton(page), 'Shop home, header shows the user menu (still signed in)');
  });
});

test('TC-PWD-1-05 after a change, the old password is refused at sign-in', async ({ page, demo, browser }) => {
  await signIn(page, 'pwd1-oldrefused', INITIAL);
  await openChangePage(page, demo);
  await submitChange(page, demo, INITIAL, CHANGED, CHANGED);
  await test.step(`the page shows "${CHANGED_MESSAGE}"`, async () => {
    await expectChanged(page, demo);
  });

  await freshSignInRefused(browser, 'pwd1-oldrefused', INITIAL);
});

test('TC-PWD-1-06 wrong current password shows "The current password is incorrect." and changes nothing', async ({ page, demo, browser }) => {
  await signIn(page, 'pwd1-wrongcurrent', INITIAL);
  await openChangePage(page, demo);
  await submitChange(page, demo, 'Factoryfake9$', CHANGED, CHANGED);

  await test.step(`still on the change page with "${INCORRECT_CURRENT}"`, async () => {
    await expectRefused(page);
    await expect(message(page, INCORRECT_CURRENT)).toBeVisible();
    await expect(page.getByText(IDENTITY_MISMATCH_RAW)).toHaveCount(0);
    await demo.caption(`Still on ${page.url()}`);
    await demo.highlight(message(page, INCORRECT_CURRENT), INCORRECT_CURRENT);
  });

  await freshSignInSucceeds(browser, 'pwd1-wrongcurrent', INITIAL);
  await freshSignInRefused(browser, 'pwd1-wrongcurrent', CHANGED);
});

test('TC-PWD-1-07 new and confirmation entries that differ are reported and change nothing', async ({ page, demo, browser }) => {
  await signIn(page, 'pwd1-mismatch', INITIAL);
  await openChangePage(page, demo);
  await submitChange(page, demo, INITIAL, CHANGED, 'Factoryfake3$');

  await test.step(`still on the change page with "${CONFIRM_MISMATCH}"`, async () => {
    await expectRefused(page);
    await expect(message(page, CONFIRM_MISMATCH).first()).toBeVisible();
    await demo.caption(`Still on ${page.url()}`);
    await demo.highlight(message(page, CONFIRM_MISMATCH).first(), 'Confirmation does not match');
  });

  await freshSignInSucceeds(browser, 'pwd1-mismatch', INITIAL);
});

test("TC-PWD-1-08 new password breaking Identity's character rules shows Identity's own messages and changes nothing", async ({ page, demo, browser }) => {
  const value = 'factoryfakenodigits';
  await signIn(page, 'pwd1-rules', INITIAL);
  await openChangePage(page, demo);
  await submitChange(page, demo, INITIAL, value, value);

  await test.step("still on the change page with Identity's non-alphanumeric, digit and uppercase messages", async () => {
    await expectRefused(page);
    await expect(message(page, NON_ALNUM_RULE)).toBeVisible();
    await expect(message(page, DIGIT_RULE)).toBeVisible();
    await expect(message(page, UPPER_RULE)).toBeVisible();
    await expect(message(page, INCORRECT_CURRENT)).toHaveCount(0);
    await demo.caption(`Still on ${page.url()}`);
    await demo.highlight(errorSummary(page), "Identity's rule messages: non alphanumeric, digit, uppercase");
  });

  await freshSignInSucceeds(browser, 'pwd1-rules', INITIAL);
});

test('TC-PWD-1-09 new password of 5 characters (one below minimum) is refused', async ({ page, demo, browser }) => {
  const value = 'Fk1$a';
  expect(value).toHaveLength(5);
  await signIn(page, 'pwd1-short', INITIAL);
  await openChangePage(page, demo);
  await submitChange(page, demo, INITIAL, value, value);

  await test.step('still on the change page with the length message', async () => {
    await expectRefused(page);
    await expect(message(page, LENGTH_MESSAGE).first()).toBeVisible();
    await demo.caption(`Still on ${page.url()}`);
    await demo.highlight(message(page, LENGTH_MESSAGE).first(), '5 characters refused');
  });

  await freshSignInSucceeds(browser, 'pwd1-short', INITIAL);
});

test('TC-PWD-1-10 new password of exactly 6 characters (minimum) is accepted', async ({ page, demo, browser }) => {
  const value = 'Fk1$ab';
  expect(value).toHaveLength(6);
  await signIn(page, 'pwd1-min', INITIAL);
  await openChangePage(page, demo);
  await submitChange(page, demo, INITIAL, value, value);
  await test.step(`the page shows "${CHANGED_MESSAGE}"`, async () => {
    await expectChanged(page, demo);
  });

  await freshSignInSucceeds(browser, 'pwd1-min', value);
});

test('TC-PWD-1-11 new password of 101 characters (one above maximum) is refused', async ({ page, demo, browser }) => {
  const value = `Factoryfake1$${'a'.repeat(88)}`;
  expect(value).toHaveLength(101);
  await signIn(page, 'pwd1-long', INITIAL);
  await openChangePage(page, demo);
  await submitChange(page, demo, INITIAL, value, value);

  await test.step('still on the change page with the length message', async () => {
    await expectRefused(page);
    await expect(message(page, LENGTH_MESSAGE).first()).toBeVisible();
    await demo.caption(`Still on ${page.url()}`);
    await demo.highlight(message(page, LENGTH_MESSAGE).first(), '101 characters refused');
  });

  await freshSignInSucceeds(browser, 'pwd1-long', INITIAL);
});

test('TC-PWD-1-12 opening the change page without an Identity session asks to sign in and returns to the change page', async ({ page, demo, browser }) => {
  await test.step(`open ${CHANGE_URL} directly with no cookies`, async () => {
    await page.goto(CHANGE_URL);
    await expect(page).toHaveURL(new RegExp(`^${IDENTITY}/Account/Login\\?`));
    const returnUrl = new URL(page.url()).searchParams.get('ReturnUrl');
    expect(returnUrl).toBe(CHANGE_PATH);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(currentInput(page)).toHaveCount(0);
    await demo.caption(`Requested ${CHANGE_PATH} -> ${new URL(page.url()).pathname}?ReturnUrl=${returnUrl}`);
    await demo.highlight(page.getByRole('heading', { name: 'Login' }), 'Asked to sign in first');
  });

  await test.step('sign in as pwd1-menu with Factoryfake1$', async () => {
    await page.getByPlaceholder('Username').fill('pwd1-menu');
    await page.getByPlaceholder('Password').fill(INITIAL);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(CHANGE_URL);
    await expect(currentInput(page)).toBeVisible();
    await expect(newInput(page)).toBeVisible();
    await expect(confirmInput(page)).toBeVisible();
    await demo.caption(`After sign-in: ${page.url()}`);
    await demo.highlight(page.locator('form.login-form'), 'Back on the change page');
  });

  await freshSignInSucceeds(browser, 'pwd1-menu', INITIAL);
});

test('TC-PWD-1-13 submitting the change form empty shows the required-field messages and changes nothing', async ({ page, demo, browser }) => {
  await signIn(page, 'pwd1-empty', INITIAL);
  await openChangePage(page, demo);
  await submitChange(page, demo, '', '', '');

  await test.step('still on the change page with the required-field messages', async () => {
    await expectRefused(page);
    await expect(message(page, CURRENT_REQUIRED).first()).toBeVisible();
    await expect(message(page, NEW_REQUIRED).first()).toBeVisible();
    await demo.caption(`Still on ${page.url()}`);
    await demo.highlight(errorSummary(page), 'Current and New password are required');
  });

  await freshSignInSucceeds(browser, 'pwd1-empty', INITIAL);
});

test("TC-PWD-1-14 new password without a lowercase letter shows Identity's lowercase message and changes nothing", async ({ page, demo, browser }) => {
  const value = 'factoryfake1$'.toUpperCase();
  expect(value).toHaveLength(13);
  await signIn(page, 'pwd1-nolower', INITIAL);
  await openChangePage(page, demo);
  await submitChange(page, demo, INITIAL, value, value);

  await test.step("still on the change page with Identity's lowercase message only", async () => {
    await expectRefused(page);
    await expect(message(page, LOWER_RULE)).toBeVisible();
    for (const other of [DIGIT_RULE, UPPER_RULE, NON_ALNUM_RULE, CHANGED_MESSAGE, INCORRECT_CURRENT]) {
      await expect(message(page, other)).toHaveCount(0);
    }
    await demo.caption(`Still on ${page.url()}`);
    await demo.highlight(errorSummary(page), 'Only the lowercase rule message');
  });

  await freshSignInSucceeds(browser, 'pwd1-nolower', INITIAL);
});

test('TC-PWD-1-15 new password of exactly 100 characters (maximum) is accepted', async ({ page, demo, browser }) => {
  const value = `Factoryfake1$${'a'.repeat(87)}`;
  expect(value).toHaveLength(100);
  await signIn(page, 'pwd1-max', INITIAL);
  await openChangePage(page, demo);
  await submitChange(page, demo, INITIAL, value, value);
  await test.step(`the page shows "${CHANGED_MESSAGE}"`, async () => {
    await expectChanged(page, demo);
  });

  await freshSignInSucceeds(browser, 'pwd1-max', value);
});
