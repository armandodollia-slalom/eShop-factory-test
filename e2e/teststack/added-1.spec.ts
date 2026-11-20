import { Locator, Page } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// ADDED-1: each shopping bag line says when its product was first added ("Added on d MMM yyyy", UTC date) under
// the product name; a quantity change or adding more keeps the date, a remove and re-add gets the new date, and a
// line stored before the change shows no date.
// TC-ADDED-1-01..04 start from `default` (alice, empty basket) and add item 99 themselves. TC-ADDED-1-19 loads
// scenario `added-1` (.factory/stack/scenarios/added-1), which stores alice's basket in the pre-change JSON.
// Signing in and the narrated highlights take longer than Playwright's 30 s default.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const USER = 'alice';
const PASSWORD = 'Pass123$';
const ITEM_ID = 99;
const ITEM_NAME = 'Adventurer GPS Watch';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Added on" and today's UTC date as the bag formats it (`d MMM yyyy`, invariant culture). */
function addedOnToday(): string {
  const now = new Date();
  return `Added on ${now.getUTCDate()} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
}

const cartLines = (page: Page) => page.locator('.cart-items .cart-item');
const watchLine = (page: Page) => cartLines(page).filter({ hasText: ITEM_NAME });
const addedOn = (line: Locator) => line.locator('.added-on');
const quantityInput = (page: Page) => page.getByRole('spinbutton', { name: `Quantity of ${ITEM_NAME}`, exact: true });

async function signInAsAlice(page: Page) {
  await test.step(`sign in to the WebApp as ${USER}`, async () => {
    await page.goto(BASE_URL!);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill(USER);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
}

async function addWatchFromProductPage(page: Page, demo: Demo, expectedInBag: number) {
  await test.step(`open the product page of item ${ITEM_ID} and click "Add to shopping bag"`, async () => {
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    const inCart = page.locator('.in-cart');
    await expect(inCart).toHaveText(`${expectedInBag} in your shopping bag`);
    // The add is a form post; let its navigation finish before the overlay is drawn and the next page opens.
    await page.waitForLoadState('networkidle');
    await demo.highlight(inCart, `${expectedInBag} ${ITEM_NAME} in the shopping bag`);
  });
}

async function openCart(page: Page, demo: Demo) {
  await test.step('open the shopping bag page (/cart)', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await demo.caption(`Opened ${page.url()}`);
  });
}

/** Opens /cart and checks the bag holds exactly one watch line with the given quantity; returns its "Added on" text. */
async function openCartWithOneWatchLine(page: Page, demo: Demo, quantity: number): Promise<string> {
  await openCart(page, demo);
  await expect(cartLines(page)).toHaveCount(1);
  await expect(watchLine(page).locator('.name')).toHaveText(ITEM_NAME);
  await expect(quantityInput(page)).toHaveValue(String(quantity));
  return (await addedOn(watchLine(page)).innerText()).trim();
}

test.describe('lines added after the change', () => {
  // `default`: alice with an empty basket, so each case starts from an empty bag and adds item 99 itself.
  test.beforeEach(() => {
    loadScenario('default');
  });

  test('TC-ADDED-1-01 shopping bag line shows "Added on" with today\'s date after adding a product', async ({ page, demo }) => {
    await signInAsAlice(page);
    await addWatchFromProductPage(page, demo, 1);
    const expected = addedOnToday();
    await openCart(page, demo);
    await test.step(`the one "${ITEM_NAME}" line, quantity 1, reads "${expected}" under the name in the price's muted style`, async () => {
      await expect(cartLines(page)).toHaveCount(1);
      const line = watchLine(page);
      await expect(line.locator('.name')).toHaveText(ITEM_NAME);
      await expect(quantityInput(page)).toHaveValue('1');
      await expect(addedOn(line)).toHaveText(expected);
      await expect(addedOn(line)).toHaveCount(1);
      // Directly under the product name: the "Added on" paragraph is the name's next sibling.
      await expect(line.locator('p.name + p.added-on')).toHaveText(expected);
      const addedOnColor = await addedOn(line).evaluate(el => getComputedStyle(el).color);
      const priceColor = await line.locator('.catalog-item-content .price').evaluate(el => getComputedStyle(el).color);
      expect(addedOnColor).toBe(priceColor);
      await demo.caption(`Today (UTC) is ${expected.replace('Added on ', '')}; "Added on" color ${addedOnColor} = price color`);
      await demo.highlight(addedOn(line), expected);
    });
  });

  test('TC-ADDED-1-02 changing a line\'s quantity in the shopping bag keeps its "Added on" date', async ({ page, demo }) => {
    await signInAsAlice(page);
    await addWatchFromProductPage(page, demo, 1);
    const before = await openCartWithOneWatchLine(page, demo, 1);
    await test.step(`note the line's date before the change: "${before}"`, async () => {
      expect(before).toBe(addedOnToday());
      await demo.highlight(addedOn(watchLine(page)), `Before: ${before}`);
    });
    await test.step(`click "Increase quantity of ${ITEM_NAME}" twice, to 2 and then 3`, async () => {
      const increase = page.getByRole('button', { name: `Increase quantity of ${ITEM_NAME}`, exact: true });
      await increase.click();
      await expect(quantityInput(page)).toHaveValue('2');
      await increase.click();
      await expect(quantityInput(page)).toHaveValue('3');
    });
    await test.step('reload /cart', async () => {
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
    });
    await test.step(`one line, quantity 3, still "${before}"`, async () => {
      await expect(cartLines(page)).toHaveCount(1);
      await expect(quantityInput(page)).toHaveValue('3');
      await expect(addedOn(watchLine(page))).toHaveText(before);
      await demo.highlight(quantityInput(page), 'Quantity 3 after reload');
      await demo.highlight(addedOn(watchLine(page)), `After: ${before} (unchanged)`);
    });
  });

  test('TC-ADDED-1-03 adding more of a product already in the bag keeps its "Added on" date', async ({ page, demo }) => {
    await signInAsAlice(page);
    await addWatchFromProductPage(page, demo, 1);
    const before = await openCartWithOneWatchLine(page, demo, 1);
    await test.step(`note the line's date before adding more: "${before}"`, async () => {
      expect(before).toBe(addedOnToday());
      await demo.highlight(addedOn(watchLine(page)), `Before: ${before}`);
    });
    await addWatchFromProductPage(page, demo, 2);
    await openCart(page, demo);
    await test.step(`one "${ITEM_NAME}" line, quantity 2, still "${before}"`, async () => {
      await expect(cartLines(page)).toHaveCount(1);
      await expect(watchLine(page).locator('.name')).toHaveText(ITEM_NAME);
      await expect(quantityInput(page)).toHaveValue('2');
      await expect(addedOn(watchLine(page))).toHaveText(before);
      await demo.highlight(quantityInput(page), 'Quantity 2');
      await demo.highlight(addedOn(watchLine(page)), `After adding more: ${before} (unchanged)`);
    });
  });

  test('TC-ADDED-1-04 removing a product and adding it again shows it with today\'s date', async ({ page, demo }) => {
    await signInAsAlice(page);
    await addWatchFromProductPage(page, demo, 1);
    await openCartWithOneWatchLine(page, demo, 1);
    await test.step(`click "Remove ${ITEM_NAME} from your bag"; the bag no longer lists it`, async () => {
      await page.getByRole('button', { name: `Remove ${ITEM_NAME} from your bag`, exact: true }).click();
      const empty = page.getByRole('heading', { name: 'Your shopping bag is empty' });
      await expect(empty).toBeVisible();
      await expect(cartLines(page)).toHaveCount(0);
      await demo.highlight(empty, `${ITEM_NAME} removed`);
    });
    await addWatchFromProductPage(page, demo, 1);
    const expected = addedOnToday();
    await openCart(page, demo);
    await test.step(`one "${ITEM_NAME}" line, quantity 1, "${expected}"`, async () => {
      await expect(cartLines(page)).toHaveCount(1);
      await expect(watchLine(page).locator('.name')).toHaveText(ITEM_NAME);
      await expect(quantityInput(page)).toHaveValue('1');
      await expect(addedOn(watchLine(page))).toHaveText(expected);
      await demo.highlight(addedOn(watchLine(page)), `Added again: ${expected}`);
    });
  });
});

test.describe('a line stored before the change', () => {
  // `added-1`: alice's basket in Redis as the Basket API stored it before added_at (item 99, quantity 1, no AddedAt).
  test.beforeEach(() => {
    loadScenario('added-1');
  });

  test('TC-ADDED-1-19 a shopping bag line stored before the change shows no "Added on" text', async ({ page, demo }) => {
    await signInAsAlice(page);
    await openCart(page, demo);
    await test.step(`the bag shows one "${ITEM_NAME}" line, quantity 1, and no "Added on" anywhere`, async () => {
      await expect(cartLines(page)).toHaveCount(1);
      const line = watchLine(page);
      await expect(line.locator('.name')).toHaveText(ITEM_NAME);
      await expect(quantityInput(page)).toHaveValue('1');
      await expect(page.locator('.cart-empty')).toHaveCount(0);
      await expect(page.locator('#blazor-error-ui')).toBeHidden();
      await expect(page.getByText(/error/i).filter({ visible: true })).toHaveCount(0);
      await expect(line.locator('.added-on')).toHaveCount(0);
      await expect(line).not.toContainText('Added on');
      await expect(page.locator('body')).not.toContainText('Added on');
      await demo.caption('Basket stored without AddedAt (scenario added-1)');
      await demo.absent(line.locator('.catalog-item-content'), 'No "Added on" under the product name');
    });
  });
});
