import { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { loadScenario } from './scenario';

// ORD-1: the "Items" column of the order history (/user/orders).
// Scenario `ord-1` (.factory/stack/scenarios/ord-1): alice has order 101 (2 + 1 units, "3 items") and order 102
// (1 unit, "1 item"); bob has order 103 (4 units); carol has no orders. All passwords are Pass123$.
test.describe.configure({ mode: 'serial' });

const PASSWORD = 'Pass123$';
const ALICE_ORDER_WITH_THREE_ITEMS = '101';
const ALICE_ORDER_WITH_ONE_ITEM = '102';
const BOB_ORDER = '103';

test.beforeAll(() => {
  loadScenario('ord-1');
});

async function signInAndOpenOrders(page: Page, user: string) {
  await page.goto('/user/orders');
  await page.getByPlaceholder('Username').fill(user);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/user\/orders/);
}

const orderRow = (page: Page, orderNumber: string) =>
  page.locator('.orders-item:not(.orders-header)').filter({ has: page.locator('.order-number', { hasText: new RegExp(`^\\s*${orderNumber}\\s*$`) }) });

test('TC-ORD-1-05 Items column sits between Date and Total and shows 3 items', async ({ page, demo }) => {
  await test.step('Sign in as alice and open /user/orders', async () => {
    await signInAndOpenOrders(page, 'alice');
  });
  await test.step('Header cells read Number, Date, Items, Total, Status', async () => {
    const header = page.locator('.orders-header');
    await expect(header.locator('> div')).toHaveText(['Number', 'Date', 'Items', 'Total', 'Status']);
    await demo.highlight(header, 'Header: Number, Date, Items, Total, Status');
  });
  await test.step('Order 101 shows "3 items"', async () => {
    const cell = orderRow(page, ALICE_ORDER_WITH_THREE_ITEMS).locator('> div').nth(2);
    await expect(cell).toHaveText('3 items');
    await demo.highlight(orderRow(page, ALICE_ORDER_WITH_THREE_ITEMS), 'Order 101: 3 items');
  });
});

test('TC-ORD-1-06 one-unit order shows 1 item', async ({ page, demo }) => {
  await test.step('Sign in as alice and open /user/orders', async () => {
    await signInAndOpenOrders(page, 'alice');
  });
  await test.step('Order 102 shows exactly "1 item"', async () => {
    const row = orderRow(page, ALICE_ORDER_WITH_ONE_ITEM);
    await expect(row.locator('.order-items')).toHaveText(/^\s*1 item\s*$/);
    await demo.highlight(row, 'Order 102: 1 item');
  });
});

test('TC-ORD-1-07 user with no orders sees the unchanged empty state', async ({ page, demo }) => {
  await test.step('Sign in as carol and open /user/orders', async () => {
    await signInAndOpenOrders(page, 'carol');
  });
  await test.step('The empty state is shown without a list or Items header', async () => {
    const empty = page.locator('.orders-empty');
    await expect(empty.getByRole('heading', { name: 'No orders yet' })).toBeVisible();
    await expect(page.locator('.orders-list')).toHaveCount(0);
    await expect(page.getByText('Items', { exact: true })).toHaveCount(0);
    await demo.highlight(empty, 'Empty state: No orders yet');
    await demo.absent(empty, 'No Items header or order list');
  });
});

test('TC-ORD-1-08 order history lists only the signed-in user\'s orders', async ({ browser, page, demo }) => {
  // Bob signs in in a fresh browser context; closing it signs him out before alice signs in on the recorded page.
  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  await test.step('Sign in as bob and open /user/orders: only order 103 with "4 items"', async () => {
    await signInAndOpenOrders(bobPage, 'bob');
    await expect(bobPage.locator('.orders-item:not(.orders-header)')).toHaveCount(1);
    await expect(orderRow(bobPage, BOB_ORDER).locator('.order-items')).toHaveText('4 items');
    await expect(orderRow(bobPage, ALICE_ORDER_WITH_THREE_ITEMS)).toHaveCount(0);
  });
  await bobContext.close();

  await test.step('Sign out, sign in as alice and open /user/orders: orders 101 and 102, no 103', async () => {
    await signInAndOpenOrders(page, 'alice');
    await expect(page.locator('.orders-item:not(.orders-header)')).toHaveCount(2);
    await expect(orderRow(page, ALICE_ORDER_WITH_THREE_ITEMS).locator('.order-items')).toHaveText('3 items');
    await expect(orderRow(page, ALICE_ORDER_WITH_ONE_ITEM).locator('.order-items')).toHaveText(/^\s*1 item\s*$/);
    await expect(orderRow(page, BOB_ORDER)).toHaveCount(0);
    await demo.highlight(page.locator('.orders-list'), 'Alice sees orders 101 and 102 only');
    await demo.absent(orderRow(page, ALICE_ORDER_WITH_ONE_ITEM), 'No row for order 103');
  });
});
