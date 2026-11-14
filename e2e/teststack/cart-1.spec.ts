import { test, expect } from '../demo';
import type { Locator, Page } from '@playwright/test';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// CART-1: Save for later in the cart (WebApp cart page + Basket.API).
// Scenario `cart-1` (.factory/stack/scenarios/cart-1): catalog items 2001 "Alpine Pack" (40.00), 2002 "Basecamp Mug"
// (10.00), 2003 "Cedar Headlamp" (25.00). alice: cart 2001 x 2 and 2002 x 1 (total $90.00, badge 3), saved 2003 x 3.
// bob: empty basket.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.beforeEach(() => {
  loadScenario('cart-1');
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
// Tall viewport, so the place below the last block where the section would follow is inside the frame.
async function absentBelow(page: Page, demo: { absent: (anchor: Locator, label: string) => Promise<void> }, anchor: Locator, label: string) {
  await page.setViewportSize({ width: 1280, height: 1600 });
  await demo.absent(anchor, label);
}

test('TC-CART-1-16 pressing Save for later moves a cart line to the Saved for later section', async ({ page, demo }) => {
  await test.step('sign in as alice', () => signIn(page, demo, 'alice'));
  await test.step('open /cart', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(cartLines(page)).toHaveCount(2);
    await expect(orderTotal(page)).toHaveText('$90.00');
    await expect(badge(page)).toHaveText('3');
    await demo.highlight(savedHeading(page, 1), 'Alice starts with Saved for later (1)');
  });
  await test.step('press Save for later on "Alpine Pack"', async () => {
    const button = cartLine(page, 'Alpine Pack').locator('button', { hasText: 'Save for later' });
    await demo.highlight(button, 'Save for later on Alpine Pack');
    await button.click();
    await expect(savedHeading(page, 2)).toBeVisible();
  });
  await test.step('the cart keeps only "Basecamp Mug" x 1', async () => {
    await expect(cartLines(page)).toHaveCount(1);
    await expect(cartLine(page, 'Basecamp Mug')).toHaveCount(1);
    await expect(cartLine(page, 'Basecamp Mug').locator('[data-cart-quantity-input]')).toHaveValue('1');
    await expect(cartLine(page, 'Alpine Pack')).toHaveCount(0);
    await expect(orderTotal(page)).toHaveText('$10.00');
    await expect(badge(page)).toHaveText('1');
    await demo.highlight(page.locator('.cart-items'), 'Cart has only Basecamp Mug');
  });
  await test.step('the section lists Cedar Headlamp x 3 and Alpine Pack x 2', async () => {
    await expect(savedLines(page)).toHaveCount(2);
    const cedar = savedLine(page, 'Cedar Headlamp');
    const alpine = savedLine(page, 'Alpine Pack');
    await expect(cedar.locator('.quantity')).toHaveText('Quantity: 3');
    await expect(cedar.locator('.price')).toHaveText('$25.00');
    await expect(alpine.locator('.quantity')).toHaveText('Quantity: 2');
    await expect(alpine.locator('.price')).toHaveText('$40.00');
    for (const [line, name] of [[cedar, 'Cedar Headlamp'], [alpine, 'Alpine Pack']] as const) {
      await expect(line.locator('img')).toHaveAttribute('alt', name);
      await expect(line.locator('img')).toHaveAttribute('src', /.+/);
      await expect(line.locator('button', { hasText: 'Move to cart' })).toBeVisible();
      await expect(line.locator('button', { hasText: 'Remove' })).toBeVisible();
    }
    await demo.highlight(savedSection(page), 'Saved for later (2) lists Cedar Headlamp and Alpine Pack');
  });
});

test('TC-CART-1-17 an empty cart with saved products shows the empty message and the section', async ({ page, demo }) => {
  await test.step('sign in as alice and save both cart lines', async () => {
    await signIn(page, demo, 'alice');
    await page.goto(`${BASE_URL}/cart`);
    await cartLine(page, 'Alpine Pack').locator('button', { hasText: 'Save for later' }).click();
    await expect(savedHeading(page, 2)).toBeVisible();
    await cartLine(page, 'Basecamp Mug').locator('button', { hasText: 'Save for later' }).click();
    await expect(savedHeading(page, 3)).toBeVisible();
  });
  await test.step('open /cart with a fresh page load', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText('Your shopping bag is empty')).toBeVisible();
    await demo.highlight(page.getByText('Your shopping bag is empty'), 'Empty-cart message');
  });
  await test.step('the section Saved for later (3) is shown below it', async () => {
    await expect(savedHeading(page, 3)).toBeVisible();
    await expect(savedLines(page)).toHaveCount(3);
    await expect(badge(page)).toHaveCount(0);
    await demo.highlight(savedSection(page), 'Saved for later (3) below the empty-cart message');
  });
});

test('TC-CART-1-18 Move to cart returns the saved product to the cart and hides the section', async ({ page, demo }) => {
  await test.step('sign in as alice', () => signIn(page, demo, 'alice'));
  await test.step('open /cart', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await demo.highlight(savedHeading(page, 1), 'Saved for later (1) before the move');
  });
  await test.step('press Move to cart on "Cedar Headlamp"', async () => {
    const button = savedLine(page, 'Cedar Headlamp').locator('button', { hasText: 'Move to cart' });
    await button.click();
    await expect(cartLines(page)).toHaveCount(3);
  });
  await test.step('the cart has three lines and no saved section', async () => {
    await expect(cartLine(page, 'Alpine Pack').locator('[data-cart-quantity-input]')).toHaveValue('2');
    await expect(cartLine(page, 'Basecamp Mug').locator('[data-cart-quantity-input]')).toHaveValue('1');
    await expect(cartLine(page, 'Cedar Headlamp').locator('[data-cart-quantity-input]')).toHaveValue('3');
    await expect(page.getByRole('heading', { name: /^Saved for later/ })).toHaveCount(0);
    await expect(orderTotal(page)).toHaveText('$165.00');
    await expect(badge(page)).toHaveText('6');
    await demo.highlight(page.locator('.cart-items'), 'Cart with Cedar Headlamp x 3');
    await absentBelow(page, demo, cartLines(page).last(), 'no Saved for later section below the cart');
  });
});

test('TC-CART-1-19 Remove deletes the saved product and leaves the cart unchanged', async ({ page, demo }) => {
  await test.step('sign in as alice', () => signIn(page, demo, 'alice'));
  await test.step('open /cart', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(savedLine(page, 'Cedar Headlamp')).toHaveCount(1);
  });
  await test.step('press Remove on "Cedar Headlamp"', async () => {
    const button = savedLine(page, 'Cedar Headlamp').locator('button', { hasText: 'Remove' });
    await demo.highlight(button, 'Remove on Cedar Headlamp');
    await button.click();
    await expect(page.getByRole('heading', { name: /^Saved for later/ })).toHaveCount(0);
  });
  await test.step('the cart is unchanged', async () => {
    await expect(cartLines(page)).toHaveCount(2);
    await expect(cartLine(page, 'Alpine Pack').locator('[data-cart-quantity-input]')).toHaveValue('2');
    await expect(cartLine(page, 'Basecamp Mug').locator('[data-cart-quantity-input]')).toHaveValue('1');
    await expect(orderTotal(page)).toHaveText('$90.00');
    await expect(badge(page)).toHaveText('3');
    await demo.highlight(page.locator('.cart-items'), 'Cart unchanged: Alpine Pack x 2, Basecamp Mug x 1');
  });
  await test.step('after a reload Cedar Headlamp is neither in the cart nor saved', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(cartLines(page)).toHaveCount(2);
    await expect(page.getByText('Cedar Headlamp')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /^Saved for later/ })).toHaveCount(0);
    await absentBelow(page, demo, cartLines(page).last(), 'no Cedar Headlamp and no saved section below the cart after reload');
  });
});

test('TC-CART-1-20 placing an order orders only cart items and keeps the saved product', async ({ page, demo }) => {
  let existingNumbers: string[] = [];
  await test.step('sign in as alice and count her orders', async () => {
    await signIn(page, demo, 'alice');
    await page.goto(`${BASE_URL}/user/orders`);
    await expect(page.getByRole('heading', { name: 'Orders', exact: true })).toBeVisible();
    existingNumbers = (await page.locator('.order-number').allTextContents()).map(n => n.trim());
  });
  await test.step('check out from /cart and place the order', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(orderTotal(page)).toHaveText('$90.00');
    await page.getByRole('link', { name: 'Check out' }).click();
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    await expect(page.getByLabel('Address')).toHaveValue('15703 NE 61st Ct');
    await expect(page.getByLabel('City')).toHaveValue('Redmond');
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page).toHaveURL(/\/user\/orders$/);
  });
  await test.step('the new order totals $90.00 (cart items only)', async () => {
    await expect(page.locator('.order-number')).toHaveCount(existingNumbers.length + 1);
    const numbers = (await page.locator('.order-number').allTextContents()).map(n => n.trim());
    const newNumbers = numbers.filter(n => !existingNumbers.includes(n));
    expect(newNumbers).toHaveLength(1);
    const newOrder = page.locator('li.orders-item').filter({ has: page.locator('.order-number', { hasText: new RegExp(`^\\s*${newNumbers[0]}\\s*$`) }) });
    await expect(newOrder).toHaveCount(1);
    const total = newOrder.locator('.order-total');
    await expect(total).toHaveText('$90.00');
    await expect(total).not.toContainText('$165.00');
    await demo.highlight(newOrder, 'New order total $90.00, not $165.00');
  });
  await test.step('the cart is empty once the basket is deleted and Cedar Headlamp is still saved', async () => {
    await expect(async () => {
      await page.goto(`${BASE_URL}/cart`);
      await expect(page.getByText('Your shopping bag is empty')).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(savedHeading(page, 1)).toBeVisible();
    await expect(savedLines(page)).toHaveCount(1);
    await expect(savedLine(page, 'Cedar Headlamp').locator('.quantity')).toHaveText('Quantity: 3');
    await demo.highlight(savedSection(page), 'Saved for later (1): Cedar Headlamp x 3 after the order');
  });
});

test('TC-CART-1-21 bob does not see alice\'s saved products', async ({ page, demo }) => {
  await test.step('sign in as bob', () => signIn(page, demo, 'bob'));
  await test.step('open /cart', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByText('Your shopping bag is empty')).toBeVisible();
    await demo.highlight(page.getByText('Your shopping bag is empty'), 'Bob\'s cart is empty');
  });
  await test.step('no Saved for later section and no Cedar Headlamp', async () => {
    await expect(page.getByRole('heading', { name: /^Saved for later/ })).toHaveCount(0);
    await expect(page.getByText('Cedar Headlamp')).toHaveCount(0);
    await absentBelow(page, demo, page.locator('.cart-empty'), 'no Saved for later section below bob\'s empty cart');
  });
});
