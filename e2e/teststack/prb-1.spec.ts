import type { Page } from '@playwright/test';
import { test, expect, type Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// PRB-1: the shopping bag page's browser tab title reads "Shopping bag | AdventureWorks" (lower-case "b"),
// and nothing else on the page changes.
// Scenario `prb-1` (.factory/stack/scenarios/prb-1): the seeded users alice and bob (Pass123$) with empty baskets,
// and catalog item 99 "Adventurer GPS Watch".
test.describe.configure({ mode: 'serial' });

const PASSWORD = 'Pass123$';
const EXPECTED_TITLE = 'Shopping bag | AdventureWorks';
const HEADING = 'Shopping bag';
const EMPTY_HEADING = 'Your shopping bag is empty';
const START_SHOPPING = 'Start shopping';
const FOOTER_LINK = 'Shopping bag';
const ITEM_ID = 99;
const ITEM_NAME = 'Adventurer GPS Watch';

test.beforeAll(() => {
  loadScenario('prb-1');
});

async function signIn(page: Page, demo: Demo, username: string) {
  await page.goto(BASE_URL);
  await page.getByLabel('Sign in').click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  await demo.highlight(page.getByRole('button', { name: 'Account' }), `Signed in as ${username}`);
}

async function openCart(page: Page) {
  await page.goto(`${BASE_URL}/cart`);
  await expect(page).toHaveURL(/\/cart$/);
}

const pageHeading = (page: Page) => page.locator('h1');

test('TC-PRB-1-01 shopping bag tab title reads "Shopping bag | AdventureWorks"', async ({ page, demo }) => {
  await test.step('sign in as alice', () => signIn(page, demo, 'alice'));
  await test.step('navigate to /cart', async () => {
    await openCart(page);
    await expect(page.locator('.cart-empty h2')).toHaveText(EMPTY_HEADING);
  });
  await test.step('read the page title', async () => {
    await expect(page).toHaveTitle(EXPECTED_TITLE);
    const title = await page.title();
    await demo.caption(`Opened ${page.url()} - tab title: "${title}"`);
    await demo.highlight(pageHeading(page), `Tab title: "${title}" on /cart`);
  });
});

test('TC-PRB-1-02 the rest of the shopping bag page is unchanged', async ({ page, demo }) => {
  await test.step('sign in as alice', () => signIn(page, demo, 'alice'));
  await test.step('navigate to /cart', async () => {
    await openCart(page);
    await demo.caption(`Opened ${page.url()}`);
  });
  await test.step('read the page header h1', async () => {
    await expect(pageHeading(page)).toHaveText(HEADING);
    await demo.highlight(pageHeading(page), `Page header h1: "${HEADING}"`);
  });
  await test.step('read the .cart-empty block', async () => {
    const empty = page.locator('.cart-empty');
    await expect(empty).toHaveCount(1);
    await expect(empty.locator('h2')).toHaveText(EMPTY_HEADING);
    const start = empty.getByRole('link', { name: START_SHOPPING, exact: true });
    await expect(start).toHaveText(START_SHOPPING);
    await expect(start).toHaveAttribute('href', '/');
    await demo.highlight(empty, `Empty bag: "${EMPTY_HEADING}" with "${START_SHOPPING}"`);
  });
  await test.step('read the footer link with href="cart"', async () => {
    const link = page.locator('footer a[href="cart"]');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveText(FOOTER_LINK);
    await demo.highlight(link, `Footer link: "${FOOTER_LINK}"`);
  });
});

test('TC-PRB-1-03 tab title reads "Shopping bag | AdventureWorks" when the bag holds an item', async ({ page, demo }) => {
  await test.step('sign in as bob', () => signIn(page, demo, 'bob'));
  await test.step(`navigate to /item/${ITEM_ID} and click Add to shopping bag`, async () => {
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    const inCart = page.locator('.in-cart').getByRole('link', { name: 'shopping bag' });
    await expect(inCart).toBeVisible();
    await demo.highlight(inCart, `${ITEM_NAME} added to the shopping bag`);
  });
  await test.step('navigate to /cart', async () => {
    await openCart(page);
    const items = page.locator('.cart-item');
    await expect(items).toHaveCount(1);
    await expect(items.locator('.name')).toHaveText(ITEM_NAME);
    await expect(page.locator('.cart-empty')).toHaveCount(0);
    await demo.highlight(items, `One cart item: ${ITEM_NAME}`);
  });
  await test.step('read the page title and the page header h1', async () => {
    await expect(page).toHaveTitle(EXPECTED_TITLE);
    await expect(pageHeading(page)).toHaveText(HEADING);
    await demo.caption(`Opened ${page.url()} - tab title: "${await page.title()}"`);
    await demo.highlight(pageHeading(page), `Tab title: "${EXPECTED_TITLE}", h1: "${HEADING}"`);
  });
});
