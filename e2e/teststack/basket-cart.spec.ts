import { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-7: a basket line for a product missing from the catalog (99999) must not break the site.
// Scenario `bug-7`: oscar (only 99999), olive (99999 + product 99 x2), bob (product 99 x1 + product 1 x3).
const CART_URL = new URL('/cart', BASE_URL).toString();
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('bug-7');
});

async function signIn(page: Page, user: string) {
  await page.context().clearCookies();
  await page.goto(BASE_URL!);
  await page.getByLabel('Sign in').click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await page.getByPlaceholder('Username').fill(user);
  await page.getByPlaceholder('Password').fill('Pass123$');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
}

test('TC-BUG-7-01 home page renders and the cart menu ignores a basket line for a missing product', async ({ page, demo }) => {
  await demo.chapter('Missing product in the basket', 'oscar\'s basket only holds product 99999, which is not in the catalog.');
  await test.step('Open the home page and sign in as oscar', async () => {
    await signIn(page, 'oscar');
  });
  await test.step('Wait for the catalog list to render', async () => {
    await expect(page.locator('.catalog-product').first()).toBeVisible();
    await expect(page.locator('#blazor-error-ui')).toBeHidden();
    await expect(page.getByText('An unhandled error')).toBeHidden();
  });
  await test.step('Locate the cart link in the header', async () => {
    const cart = page.locator('header').first().locator('a[href="cart"]');
    await expect(cart).toHaveClass(/icon-button/);
    await expect(cart).toHaveAttribute('aria-label', 'Shopping bag');
    await expect(page.locator('.cart-button-count')).toHaveCount(0);
    await expect(page.locator('header').first()).not.toContainText('99999');
    await demo.highlight(cart, 'no count shown');
  });
  await test.step('Another page (a catalog item) renders too', async () => {
    await page.locator('a[href^="item/"]').first().click();
    await expect(page).toHaveURL(/\/item\/\d+/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('#blazor-error-ui')).toBeHidden();
    await expect(page.locator('.catalog-product')).toHaveCount(0);
  });
});

test('TC-BUG-7-03 cart page shows the valid lines and omits the missing product', async ({ page, demo }) => {
  await demo.chapter('Mixed basket', 'olive has product 99999 (missing) and 2 x Adventurer GPS Watch.');
  await test.step('Sign in as olive', async () => {
    await signIn(page, 'olive');
  });
  await test.step('Open the cart page', async () => {
    await page.goto(CART_URL);
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });
  await test.step('Only the valid line is listed', async () => {
    const row = page.locator('.cart-item');
    await expect(page.locator('#blazor-error-ui')).toBeHidden();
    await expect(row.locator('.name')).toHaveText('Adventurer GPS Watch');
    await expect(row.locator('input[data-cart-quantity-input]')).toHaveValue('2');
    const unit = Number.parseFloat(((await row.locator('.price').innerText()).replace(/[^0-9.]/g, '')));
    const total = Number.parseFloat(((await row.locator('.catalog-item-total').innerText()).replace(/[^0-9.]/g, '')));
    expect(unit).toBeGreaterThan(0);
    expect(total).toBeCloseTo(unit * 2, 2);
    await expect(page.locator('.cart-items')).not.toContainText('99999');
    await expect(page.locator('.cart-button-count')).toHaveText('2');
    await demo.highlight(row, 'one row, quantity 2');
  });
});

test('TC-BUG-7-04 cart page shows the empty-cart state when the only line is missing', async ({ page, demo }) => {
  const emptyMessage = async () => {
    await page.goto(CART_URL);
    await expect(page.locator('.cart-empty h2')).toBeVisible();
    await expect(page.locator('#blazor-error-ui')).toBeHidden();
    await expect(page.locator('.cart-item')).toHaveCount(0);
    return page.locator('.cart-empty').innerText();
  };
  await demo.chapter('Only a missing product', 'oscar\'s whole basket is a product that no longer exists.');
  let oscarMessage = '';
  await test.step('Sign in as oscar', async () => {
    await signIn(page, 'oscar');
  });
  await test.step('Open the cart page and record the empty-cart message', async () => {
    oscarMessage = await emptyMessage();
    expect(oscarMessage).toContain('Your shopping bag is empty');
  });
  await test.step('Sign in as alice, open the cart page and compare', async () => {
    await signIn(page, 'alice');
    const aliceMessage = await emptyMessage();
    expect(oscarMessage).toBe(aliceMessage);
  });
});

test('TC-BUG-7-05 a basket whose products all exist is shown unchanged', async ({ page, demo }) => {
  await demo.chapter('Valid basket', 'bob has product 99 x1 and product 1 x3.');
  await test.step('Sign in as bob', async () => {
    await signIn(page, 'bob');
  });
  await test.step('Open the cart page', async () => {
    await page.goto(CART_URL);
    await expect(page.locator('.cart-item')).toHaveCount(2);
  });
  await test.step('Both lines are listed in basket order and the header counts 4', async () => {
    const rows = page.locator('.cart-item');
    await expect(rows.nth(0).locator('.name')).toHaveText('Adventurer GPS Watch');
    await expect(rows.nth(0).locator('input[data-cart-quantity-input]')).toHaveValue('1');
    await expect(rows.nth(1).locator('input[data-cart-quantity-input]')).toHaveValue('3');
    await expect(rows.nth(1).locator('input[name="UpdateQuantityId"]')).toHaveValue('1');
    await expect(page.locator('.cart-button-count')).toHaveText('4');
    await demo.highlight(rows.first(), 'two valid lines');
  });
});
