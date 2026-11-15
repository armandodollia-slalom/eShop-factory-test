import { Page } from '@playwright/test';
import { test, expect, createDemo, Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// SUMM-1: the checkout page shows an "Order summary" (bag lines with name, quantity and line total in bag order,
// item count and order total, or "Your shopping bag is empty"); placing an order, the address form, its
// validation and the "Back to the shopping bag" link are unchanged.
// Scenario `summ-1` (.factory/stack/scenarios/summ-1): the `default` demo catalog (item 1 "Wanderer Black Hiking
// Boots" $109.99, item 2 "Summit Pro Harness" $89.99) and the users alice and bob (Pass123$), empty baskets, no
// orders. It is reloaded before each test so every case starts from empty bags and no orders.
test.describe.configure({ mode: 'serial' });

test.beforeEach(() => {
  loadScenario('summ-1');
});

const PASSWORD = 'Pass123$';
const BOOTS_ID = 1;
const BOOTS = 'Wanderer Black Hiking Boots';
const HARNESS_ID = 2;
const HARNESS = 'Summit Pro Harness';
const EMPTY_SUMMARY = 'Your shopping bag is empty';
const EMPTY_CART_ERROR = 'Your cart is empty';
const NO_ORDERS = 'No orders yet';

const at = (path: string) => `${BASE_URL}${path}`;

async function signIn(page: Page, user: 'alice' | 'bob') {
  await page.goto(at('/'));
  await page.getByLabel('Sign in').click();
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await page.getByPlaceholder('Username').fill(user);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
}

/** On /item/<id>, presses "Add to shopping bag" `times` times, waiting for the "n in your shopping bag" count each time. */
async function addToBag(page: Page, id: number, name: string, times: number) {
  await page.goto(at(`/item/${id}`));
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  for (let n = 1; n <= times; n++) {
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    await expect(page.locator('.in-cart strong')).toHaveText(String(n));
  }
}

/** On /cart, presses "Increase quantity of <name>" once and waits until the bag committed `quantity` and `bagCount`. */
async function increaseInBag(page: Page, name: string, quantity: number, bagCount: number) {
  const update = page.waitForRequest(r => r.method() === 'POST' && new URL(r.url()).pathname === '/cart');
  await Promise.all([update, page.getByRole('button', { name: `Increase quantity of ${name}` }).click()]);
  // The bag badge counts the committed basket, so it changes only once the update is saved.
  await expect(page.getByRole('spinbutton', { name: `Quantity of ${name}` })).toHaveValue(String(quantity));
  await expect(page.locator('.cart-summary .filter-badge')).toHaveText(String(bagCount));
}

const summary = (page: Page) => page.locator('section.order-summary');
const items = (page: Page) => summary(page).locator('li.order-summary-item');
const line = (page: Page, name: string) => items(page).filter({ has: page.locator('.order-summary-item-name', { hasText: name }) });
// The value is the last span of each totals row; the first is its label ("Items" / "Total").
const countValue = (page: Page) => summary(page).locator('.order-summary-count span').last();
const totalValue = (page: Page) => summary(page).locator('.order-summary-total span').last();

async function openCheckout(page: Page) {
  await page.goto(at('/checkout'));
  await expect(summary(page).getByRole('heading', { name: 'Order summary' })).toBeVisible();
}

async function expectLine(page: Page, name: string, quantity: string, total: string) {
  const row = line(page, name);
  await expect(row).toHaveCount(1);
  await expect(row.locator('.order-summary-item-name')).toHaveText(name);
  await expect(row.locator('.order-summary-item-quantity')).toHaveText(quantity);
  await expect(row.locator('.order-summary-item-total')).toHaveText(total);
}

/** Fills alice's bag with 2 × boots then 1 × harness (the story's bag). */
async function fillStoryBag(page: Page) {
  await addToBag(page, BOOTS_ID, BOOTS, 2);
  await addToBag(page, HARNESS_ID, HARNESS, 1);
}

async function expectNoOrders(page: Page, demo: Demo) {
  await page.goto(at('/user/orders'));
  const empty = page.getByRole('heading', { name: NO_ORDERS });
  await expect(empty).toBeVisible();
  await expect(page.locator('.order-number')).toHaveCount(0);
  await demo.highlight(page.locator('.orders-empty'), 'No orders yet: no order was placed');
}

test('TC-SUMM-1-01 summary lists each bag line with name, quantity and line total', async ({ page, demo }) => {
  await test.step('sign in as alice; add item 1 twice and item 2 once', async () => {
    await signIn(page, 'alice');
    await fillStoryBag(page);
  });
  await test.step('navigate to /checkout', async () => {
    await openCheckout(page);
  });
  await test.step('Order summary lists 2 lines: boots Qty 2 $219.98, harness Qty 1 $89.99', async () => {
    await expect(summary(page).locator('h2')).toHaveText('Order summary');
    await expect(items(page)).toHaveCount(2);
    const first = items(page).nth(0);
    await expect(first.locator('.order-summary-item-name')).toHaveText(BOOTS);
    await expect(first.locator('.order-summary-item-quantity')).toHaveText('Qty 2');
    await expect(first.locator('.order-summary-item-total')).toHaveText('$219.98');
    const second = items(page).nth(1);
    await expect(second.locator('.order-summary-item-name')).toHaveText(HARNESS);
    await expect(second.locator('.order-summary-item-quantity')).toHaveText('Qty 1');
    await expect(second.locator('.order-summary-item-total')).toHaveText('$89.99');
    await expect(summary(page).locator('.order-summary-empty')).toHaveCount(0);
    await demo.highlight(first, `${BOOTS}: Qty 2, $219.98`);
    await demo.highlight(second, `${HARNESS}: Qty 1, $89.99`);
  });
});

test('TC-SUMM-1-02 summary lines follow the shopping bag order', async ({ page, demo }) => {
  const bagOrder = [HARNESS, BOOTS];
  await test.step('sign in as alice; add item 2 once, then item 1 twice', async () => {
    await signIn(page, 'alice');
    await addToBag(page, HARNESS_ID, HARNESS, 1);
    await addToBag(page, BOOTS_ID, BOOTS, 2);
  });
  await test.step('navigate to /cart and read the line names in order', async () => {
    await page.goto(at('/cart'));
    const names = page.locator('.cart-item .name');
    await expect(names).toHaveText(bagOrder);
    await demo.highlight(page.locator('.cart-items'), 'Bag order: Summit Pro Harness, then Wanderer Black Hiking Boots');
  });
  await test.step('navigate to /checkout and read the summary names in order', async () => {
    await openCheckout(page);
    await expect(items(page).locator('.order-summary-item-name')).toHaveText(bagOrder);
    await demo.highlight(summary(page).locator('ul.order-summary-items'), 'Summary order matches the bag');
  });
});

test('TC-SUMM-1-03 summary shows the item count 3 and order total $309.97', async ({ page, demo }) => {
  await test.step('sign in as alice; add item 1 twice and item 2 once', async () => {
    await signIn(page, 'alice');
    await fillStoryBag(page);
  });
  await test.step('navigate to /checkout', async () => {
    await openCheckout(page);
  });
  await test.step('Items 3 and Total $309.97', async () => {
    const count = summary(page).locator('.order-summary-count');
    const total = summary(page).locator('.order-summary-total');
    await expect(count.locator('span').first()).toHaveText('Items');
    await expect(countValue(page)).toHaveText('3');
    await expect(total.locator('span').first()).toHaveText('Total');
    await expect(totalValue(page)).toHaveText('$309.97');
    await demo.highlight(count, 'Items: 3 (sum of quantities)');
    await demo.highlight(total, 'Total: $309.97');
  });
});

test('TC-SUMM-1-04 line total and order total above $1,000 use the bag thousands format', async ({ page, demo }) => {
  await test.step('sign in as alice; add item 1, raise it to 10 on /cart, add item 2', async () => {
    await signIn(page, 'alice');
    await addToBag(page, BOOTS_ID, BOOTS, 1);
    await page.goto(at('/cart'));
    for (let quantity = 2; quantity <= 10; quantity++) {
      await increaseInBag(page, BOOTS, quantity, quantity);
    }
    await addToBag(page, HARNESS_ID, HARNESS, 1);
  });
  await test.step('navigate to /cart and read the boots line total', async () => {
    await page.goto(at('/cart'));
    const bootsTotal = page.locator('.cart-item', { has: page.locator('.name', { hasText: BOOTS }) }).locator('.catalog-item-total');
    await expect(bootsTotal).toHaveText('$1,099.90');
    await demo.highlight(bootsTotal, 'Bag shows $1,099.90');
  });
  await test.step('navigate to /checkout', async () => {
    await openCheckout(page);
  });
  await test.step('boots Qty 10 $1,099.90; Items 11; Total $1,189.89', async () => {
    await expectLine(page, BOOTS, 'Qty 10', '$1,099.90');
    await expect(countValue(page)).toHaveText('11');
    await expect(totalValue(page)).toHaveText('$1,189.89');
    await demo.highlight(line(page, BOOTS), 'Summary line: Qty 10, $1,099.90');
    await demo.highlight(summary(page).locator('.order-summary-totals'), 'Items 11, Total $1,189.89');
  });
});

test('TC-SUMM-1-05 changing a quantity in the bag updates the summary on the next checkout visit', async ({ page, demo }) => {
  await test.step('sign in as alice; add item 1 twice and item 2 once', async () => {
    await signIn(page, 'alice');
    await fillStoryBag(page);
  });
  await test.step('navigate to /checkout: boots Qty 2, Total $309.97', async () => {
    await openCheckout(page);
    await expect(line(page, BOOTS).locator('.order-summary-item-quantity')).toHaveText('Qty 2');
    await expect(totalValue(page)).toHaveText('$309.97');
    await demo.highlight(summary(page), 'Before: boots Qty 2, Total $309.97');
  });
  await test.step('on /cart increase the boots quantity once to 3 ($329.97)', async () => {
    await page.goto(at('/cart'));
    await increaseInBag(page, BOOTS, 3, 4);
    const bootsTotal = page.locator('.cart-item', { has: page.locator('.name', { hasText: BOOTS }) }).locator('.catalog-item-total');
    await expect(bootsTotal).toHaveText('$329.97');
    await demo.highlight(bootsTotal, 'Bag: boots now 3, $329.97');
  });
  await test.step('navigate to /checkout again', async () => {
    await openCheckout(page);
  });
  await test.step('boots Qty 3 $329.97, harness Qty 1 $89.99, Items 4, Total $419.96', async () => {
    await expectLine(page, BOOTS, 'Qty 3', '$329.97');
    await expectLine(page, HARNESS, 'Qty 1', '$89.99');
    await expect(countValue(page)).toHaveText('4');
    await expect(totalValue(page)).toHaveText('$419.96');
    await demo.highlight(summary(page), 'After: boots Qty 3 $329.97, Items 4, Total $419.96');
  });
});

test('TC-SUMM-1-06 empty bag shows "Your shopping bag is empty" instead of list and totals', async ({ page, demo }) => {
  await test.step('sign in as alice (empty bag)', async () => {
    await signIn(page, 'alice');
  });
  await test.step('navigate to /checkout', async () => {
    await openCheckout(page);
  });
  await test.step('empty message, no lines, no count, no total; form and Place order present', async () => {
    await expect(summary(page).locator('h2')).toHaveText('Order summary');
    const empty = summary(page).locator('.order-summary-empty');
    await expect(empty).toHaveText(EMPTY_SUMMARY);
    await expect(page.locator('li.order-summary-item')).toHaveCount(0);
    await expect(page.locator('.order-summary-count')).toHaveCount(0);
    await expect(page.locator('.order-summary-total')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Shipping address' })).toBeVisible();
    await expect(page.getByLabel('Address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Place order' })).toBeVisible();
    await demo.highlight(empty, EMPTY_SUMMARY);
    await demo.absent(summary(page), 'no item lines, no Items count, no Total');
    await demo.highlight(page.getByRole('button', { name: 'Place order' }), 'Address form and Place order still shown');
  });
});

test('TC-SUMM-1-07 place order with an empty bag still shows "Your cart is empty"', async ({ page, demo }) => {
  await test.step('sign in as alice (empty bag, no orders)', async () => {
    await signIn(page, 'alice');
  });
  await test.step('navigate to /checkout', async () => {
    await openCheckout(page);
  });
  await test.step('press Place order with the pre-filled address', async () => {
    await page.getByRole('button', { name: 'Place order' }).click();
    const errors = page.locator('ul.validation-errors');
    await expect(errors).toContainText(EMPTY_CART_ERROR);
    expect(new URL(page.url()).pathname).toBe('/checkout');
    await demo.highlight(errors, `Validation: ${EMPTY_CART_ERROR}`);
  });
  await test.step('navigate to /user/orders', async () => {
    await expectNoOrders(page, demo);
  });
});

test('TC-SUMM-1-08 summary shows only the signed-in shopper bag, not another user', async ({ page, demo, browser }) => {
  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  const bobDemo = createDemo(bobPage);
  try {
    await test.step('context A: bob signs in and adds item 2 once', async () => {
      await signIn(bobPage, 'bob');
      await addToBag(bobPage, HARNESS_ID, HARNESS, 1);
    });
    await test.step('context B: alice signs in and adds item 1 once', async () => {
      await signIn(page, 'alice');
      await addToBag(page, BOOTS_ID, BOOTS, 1);
    });
    await test.step('alice opens /checkout: only her boots line', async () => {
      await openCheckout(page);
      await expect(items(page)).toHaveCount(1);
      await expectLine(page, BOOTS, 'Qty 1', '$109.99');
      await expect(countValue(page)).toHaveText('1');
      await expect(totalValue(page)).toHaveText('$109.99');
      await expect(summary(page)).not.toContainText(HARNESS);
      await demo.highlight(summary(page), `alice: only ${BOOTS}, Total $109.99`);
    });
    await test.step('bob opens /checkout: only his harness line', async () => {
      await openCheckout(bobPage);
      await expect(items(bobPage)).toHaveCount(1);
      await expectLine(bobPage, HARNESS, 'Qty 1', '$89.99');
      await expect(totalValue(bobPage)).toHaveText('$89.99');
      await expect(summary(bobPage)).not.toContainText(BOOTS);
      await bobDemo.highlight(summary(bobPage), `bob: only ${HARNESS}, Total $89.99`);
    });
  } finally {
    await bobDemo.dispose();
    await bobContext.close();
  }
});

test('TC-SUMM-1-09 placing the order from checkout lands on the orders page with the new order', async ({ page, demo }) => {
  await test.step('sign in as alice; add item 1 twice and item 2 once', async () => {
    await signIn(page, 'alice');
    await fillStoryBag(page);
  });
  await test.step('navigate to /checkout', async () => {
    await openCheckout(page);
    await expect(page.getByLabel('Address')).toHaveValue('15703 NE 61st Ct');
    await expect(page.getByLabel('City')).toHaveValue('Redmond');
    await expect(page.getByLabel('State')).toHaveValue('WA');
    await expect(page.getByLabel('Zip code')).toHaveValue('98052');
    await expect(page.getByLabel('Country')).toHaveValue('U.S.');
    await demo.highlight(summary(page), 'Order summary before placing the order');
  });
  await test.step('press Place order with the pre-filled address', async () => {
    await page.getByRole('button', { name: 'Place order' }).click();
    await expect(page).toHaveURL(at('/user/orders'));
    expect(new URL(page.url()).pathname).toBe('/user/orders');
    await expect(page.getByRole('heading', { name: 'Orders', exact: true })).toBeVisible();
  });
  await test.step('wait up to 30 s for exactly one order row with total $309.97', async () => {
    const rows = page.locator('li.orders-item', { has: page.locator('.order-number') });
    await expect(async () => {
      await page.reload();
      await expect(rows).toHaveCount(1, { timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await expect(rows.locator('.order-total')).toHaveText('$309.97');
    await demo.highlight(rows, 'One new order, total $309.97');
  });
});

test('TC-SUMM-1-10 shipping address validation still blocks an order with an empty Address', async ({ page, demo }) => {
  await test.step('sign in as alice; add item 2 once', async () => {
    await signIn(page, 'alice');
    await addToBag(page, HARNESS_ID, HARNESS, 1);
  });
  await test.step('navigate to /checkout', async () => {
    await openCheckout(page);
  });
  await test.step('clear Address and press Place order', async () => {
    await page.getByLabel('Address').fill('');
    await page.getByRole('button', { name: 'Place order' }).click();
    const message = page.locator('label', { has: page.getByLabel('Address') }).locator('.validation-message');
    await expect(message).toHaveText('The Street field is required.');
    expect(new URL(page.url()).pathname).toBe('/checkout');
    await expect(page.getByText(EMPTY_CART_ERROR)).toHaveCount(0);
    await demo.highlight(message, 'The Street field is required.');
  });
  await test.step('navigate to /user/orders', async () => {
    await expectNoOrders(page, demo);
  });
});

test('TC-SUMM-1-11 "Back to the shopping bag" link still returns to /cart', async ({ page, demo }) => {
  await test.step('sign in as alice; add item 2 once', async () => {
    await signIn(page, 'alice');
    await addToBag(page, HARNESS_ID, HARNESS, 1);
  });
  await test.step('navigate to /checkout', async () => {
    await openCheckout(page);
    await demo.highlight(page.getByRole('link', { name: 'Back to the shopping bag' }), 'Back to the shopping bag');
  });
  await test.step('click Back to the shopping bag', async () => {
    await page.getByRole('link', { name: 'Back to the shopping bag' }).click();
    await expect(page).toHaveURL(at('/cart'));
    expect(new URL(page.url()).pathname).toBe('/cart');
    const cartItems = page.locator('.cart-item');
    await expect(cartItems).toHaveCount(1);
    await expect(cartItems.locator('.name')).toHaveText(HARNESS);
    await demo.highlight(cartItems, `Bag page: 1 line, ${HARNESS}`);
  });
});
