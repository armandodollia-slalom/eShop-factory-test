import { test, expect } from '../demo';
import type { Locator, Page } from '@playwright/test';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// CART-1: Save for later in the cart - the cases that need a cart other than scenario `cart-1`'s.
// Scenario `cart-1-saved` (.factory/stack/scenarios/cart-1-saved): catalog items 2001 "Alpine Pack" (40.00),
// 2002 "Basecamp Mug" (10.00), 2003 "Cedar Headlamp" (25.00); product 2999 "Retired Lantern" is not in the catalog.
// alice: empty cart, saved 2003 x 2. bob: cart 2001 x 1 (total $40.00), saved 2002 x 1 and 2999 x 1.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.beforeEach(() => {
  loadScenario('cart-1-saved');
});

const PASSWORD = 'Pass123$';

async function signIn(page: Page, demo: { highlight: (l: Locator, label?: string) => Promise<void> }, user: 'alice' | 'bob') {
  await page.goto(`${BASE_URL}/`);
  await page.getByLabel('Sign in').click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await page.getByPlaceholder('Username').fill(user);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  await demo.highlight(page.getByRole('button', { name: 'Account' }), `Signed in as ${user}`);
}

const cartLines = (page: Page) => page.locator('.cart-item');
const cartLine = (page: Page, name: string) => cartLines(page).filter({ has: page.locator('.name', { hasText: new RegExp(`^${name}$`) }) });
const savedSection = (page: Page) => page.locator('section.cart-saved');
const savedLines = (page: Page) => page.locator('.cart-saved-item');
const savedLine = (page: Page, name: string) => savedLines(page).filter({ has: page.locator('.name', { hasText: new RegExp(`^${name}$`) }) });
const savedHeading = (page: Page, count: number) => page.getByRole('heading', { name: `Saved for later (${count})`, exact: true });
const orderTotal = (page: Page) => page.locator('.cart-summary-total div').last();
const badge = (page: Page) => page.locator('.cart-button-count');

test('TC-CART-1-22 Move to cart from an empty cart puts the saved product with its quantity in the cart', async ({ page, demo }) => {
  await test.step('sign in as alice', () => signIn(page, demo, 'alice'));
  await test.step('open /cart: the cart is empty and Cedar Headlamp x 2 is saved', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText('Your shopping bag is empty')).toBeVisible();
    await expect(savedHeading(page, 1)).toBeVisible();
    await expect(savedLine(page, 'Cedar Headlamp').locator('.quantity')).toHaveText('Quantity: 2');
    await expect(badge(page)).toHaveCount(0);
    await demo.highlight(savedSection(page), 'Empty cart, Saved for later (1): Cedar Headlamp x 2');
  });
  await test.step('press Move to cart on "Cedar Headlamp"', async () => {
    const button = savedLine(page, 'Cedar Headlamp').locator('button', { hasText: 'Move to cart' });
    await demo.highlight(button, 'Move to cart on Cedar Headlamp');
    await button.click();
    await expect(cartLines(page)).toHaveCount(1);
  });
  await test.step('the cart has Cedar Headlamp x 2 and the section is gone', async () => {
    await expect(cartLine(page, 'Cedar Headlamp').locator('[data-cart-quantity-input]')).toHaveValue('2');
    await expect(orderTotal(page)).toHaveText('$50.00');
    await expect(badge(page)).toHaveText('2');
    await expect(page.getByText('Your shopping bag is empty')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /^Saved for later/ })).toHaveCount(0);
    await expect(savedSection(page)).toHaveCount(0);
    await demo.highlight(page.locator('.cart-items'), 'Cart: Cedar Headlamp x 2, no Saved for later section');
  });
  await test.step('after a reload the cart still has Cedar Headlamp x 2 and nothing is saved', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(cartLine(page, 'Cedar Headlamp').locator('[data-cart-quantity-input]')).toHaveValue('2');
    await expect(savedSection(page)).toHaveCount(0);
  });
});

test('TC-CART-1-23 a saved product that is no longer in the catalog is skipped and the cart page still renders', async ({ page, demo }) => {
  await test.step('sign in as bob', () => signIn(page, demo, 'bob'));
  await test.step('open /cart', async () => {
    const response = await page.goto(`${BASE_URL}/cart`);
    expect(response?.ok()).toBe(true);
  });
  await test.step('the cart shows Alpine Pack x 1', async () => {
    await expect(cartLines(page)).toHaveCount(1);
    await expect(cartLine(page, 'Alpine Pack').locator('[data-cart-quantity-input]')).toHaveValue('1');
    await expect(orderTotal(page)).toHaveText('$40.00');
    await expect(badge(page)).toHaveText('1');
    await demo.highlight(page.locator('.cart-items'), 'Cart renders: Alpine Pack x 1');
  });
  await test.step('the section lists only Basecamp Mug and skips the product missing from the catalog', async () => {
    await expect(savedHeading(page, 1)).toBeVisible();
    await expect(savedLines(page)).toHaveCount(1);
    await expect(savedLine(page, 'Basecamp Mug').locator('.quantity')).toHaveText('Quantity: 1');
    await expect(page.getByText('Retired Lantern')).toHaveCount(0);
    await demo.highlight(savedSection(page), 'Saved for later (1): Basecamp Mug only, missing product skipped');
  });
});
