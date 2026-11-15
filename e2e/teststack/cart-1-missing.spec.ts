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

test('CART-1 regression: the cart page skips a saved product that is no longer in the catalog', async ({ page, demo }) => {
  await test.step('sign in as alice', () => signIn(page, demo, 'alice'));
  await test.step('open /cart: the cart renders and only the saved product still in the catalog is listed', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(cartLines(page)).toHaveCount(1);
    await expect(cartLine(page, 'Alpine Pack').locator('[data-cart-quantity-input]')).toHaveValue('2');
    await expect(orderTotal(page)).toHaveText('$80.00');
    await expect(page.getByRole('heading', { name: 'Saved for later (1)', exact: true })).toBeVisible();
    await expect(savedLines(page)).toHaveCount(1);
    await expect(savedLine(page, 'Cedar Headlamp')).toHaveCount(1);
    await expect(page.getByText('Retired Lantern')).toHaveCount(0);
    await demo.highlight(savedSection(page), 'Saved for later lists only Cedar Headlamp; the retired product is skipped');
  });
});
