import { test, expect } from '../demo';
import type { Locator, Page } from '@playwright/test';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// CART-1 regression: a saved product that has left the catalog must not break the cart page.
// Scenario `cart-1-missing` (.factory/stack/scenarios/cart-1-missing): catalog items 2001 "Alpine Pack" (40.00)
// and 2003 "Cedar Headlamp" (25.00). alice: cart 2001 x 2, saved 2999 x 1 (not in the catalog) and 2003 x 1.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.beforeEach(() => {
  loadScenario('cart-1-missing');
});

const PASSWORD = 'Pass123$';

async function signIn(page: Page, demo: { highlight: (l: Locator, label?: string) => Promise<void> }, user: 'alice') {
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
const orderTotal = (page: Page) => page.locator('.cart-summary-total div').last();

const CART_PRODUCT = 'Alpine Pack';
const CART_QUANTITY = '2';
const ORDER_TOTAL = '$80.00';
const SAVED_HEADING = 'Saved for later (1)';
const SAVED_PRODUCT = 'Cedar Headlamp';
const RETIRED_PRODUCT = 'Retired Lantern';

test('TC-CART-1-23 The cart page renders and skips a saved product that is no longer in the catalog', async ({ page, demo }) => {
  await test.step('sign in as alice', () => signIn(page, demo, 'alice'));
  await test.step('open /cart', async () => {
    await page.goto(`${BASE_URL}/cart`);
  });
  await test.step('the page renders with Alpine Pack x 2 in the cart and an order total of $80.00', async () => {
    await expect(cartLines(page)).toHaveCount(1);
    await expect(cartLine(page, CART_PRODUCT).locator('[data-cart-quantity-input]')).toHaveValue(CART_QUANTITY);
    await demo.highlight(cartLine(page, CART_PRODUCT), `Cart: ${CART_PRODUCT} x ${CART_QUANTITY}`);
    await expect(orderTotal(page)).toHaveText(ORDER_TOTAL);
    await demo.highlight(orderTotal(page), `Order total ${ORDER_TOTAL}`);
  });
  await test.step('Saved for later (1) lists only Cedar Headlamp and Retired Lantern is not shown', async () => {
    await expect(page.getByRole('heading', { name: SAVED_HEADING, exact: true })).toBeVisible();
    await expect(savedLines(page)).toHaveCount(1);
    await expect(savedLine(page, SAVED_PRODUCT)).toHaveCount(1);
    await demo.highlight(savedSection(page), `${SAVED_HEADING}: only ${SAVED_PRODUCT}`);
    await expect(page.getByText(RETIRED_PRODUCT)).toHaveCount(0);
    await demo.absent(savedSection(page), `${RETIRED_PRODUCT} is not shown anywhere on the page`);
  });
});
