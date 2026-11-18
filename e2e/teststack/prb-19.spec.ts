import { Page } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// PRB-19: a non-empty shopping bag (/cart) has an "Empty bag" button in the summary box, below "Continue
// shopping"; it empties the bag on the server and shows the empty-bag state. An empty bag has no such button,
// and the rest of the bag page is unchanged.
// Scenario `prb-19` (.factory/stack/scenarios/prb-19): the seeded user alice (Pass123$) with an empty basket.
// Every case starts from that empty basket, so the scenario is reloaded before each case (serial mode).
test.describe.configure({ mode: 'serial' });

const WATCH = { id: 99, name: 'Adventurer GPS Watch', price: '$199.99' };
const BOOTS = { id: 1, name: 'Wanderer Black Hiking Boots', price: '$109.99' };
const EMPTY_HEADING = 'Your shopping bag is empty';
const EMPTY_BAG = 'Empty bag';
const CART_PATH = /\/cart$/;

test.beforeEach(() => {
  loadScenario('prb-19');
});

async function signInAsAlice(page: Page) {
  await test.step('sign in through the WebApp as alice', async () => {
    await page.goto(BASE_URL);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
}

/** Opens /item/<id> and clicks "Add to shopping bag" `times` times, waiting for each add to be counted. */
async function addToBag(page: Page, product: { id: number; name: string }, times: number) {
  await test.step(`open /item/${product.id} and click "Add to shopping bag" ${times === 1 ? 'once' : `${times} times`}`, async () => {
    await page.goto(`${BASE_URL}/item/${product.id}`);
    await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
    for (let n = 1; n <= times; n++) {
      await page.getByRole('button', { name: 'Add to shopping bag' }).click();
      await expect(page.locator('.in-cart strong')).toHaveText(String(n));
    }
  });
}

async function openCart(page: Page, demo: Demo) {
  await test.step('open /cart', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page).toHaveURL(CART_PATH);
    await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
    await demo.pause(500);
  });
}

/**
 * Shows the current URL as a caption right before a highlight or absent frame, so the keyframe shows it. After a
 * click re-renders the page, Playwright's overlay layer is detached from the document and new captions stay
 * invisible; `page.hideHighlight()` drops that layer so the caption is drawn on a fresh one.
 */
async function withUrlCaption(page: Page, demo: Demo, prefix: string, mark: () => Promise<void>) {
  await page.hideHighlight();
  await demo.caption(`${prefix} ${page.url()}`);
  await demo.pause(500);
  await mark();
}

const cartLine = (page: Page, name: string) => page.locator('.cart-item').filter({ has: page.locator('.name', { hasText: name }) });
const summaryBox = (page: Page) => page.locator('.cart-summary-container');
const emptyBagButton = (page: Page) => page.getByRole('button', { name: EMPTY_BAG, exact: true });

async function expectLine(page: Page, product: { name: string; price: string }, quantity: number, total: string) {
  const line = cartLine(page, product.name);
  await expect(line).toHaveCount(1);
  await expect(line.locator('.price')).toHaveText(product.price);
  await expect(line.getByRole('spinbutton', { name: `Quantity of ${product.name}`, exact: true })).toHaveValue(String(quantity));
  await expect(line.locator('.catalog-item-total')).toHaveText(total);
}

async function expectSummary(page: Page, badge: string, total: string) {
  const summary = summaryBox(page);
  await expect(summary.locator('.cart-summary-header')).toContainText('Your shopping bag');
  await expect(summary.locator('.cart-summary-header .filter-badge')).toHaveText(badge);
  await expect(summary.locator('.cart-summary-total > div')).toHaveText(['Total', total]);
}

test('TC-PRB-19-01 a non-empty bag shows "Empty bag" in the summary box below "Continue shopping"', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, WATCH, 1);
  await openCart(page, demo);
  await test.step('exactly one "Empty bag" button, visible and enabled, inside the summary box below "Continue shopping"', async () => {
    const summary = summaryBox(page);
    await expect(emptyBagButton(page)).toHaveCount(1);
    const button = summary.getByRole('button', { name: EMPTY_BAG, exact: true });
    await expect(button).toHaveCount(1);
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    await expect(summary.locator('.cart-summary-header')).toContainText('Your shopping bag');
    await expect(summary.locator('.cart-summary-total').getByText('Total', { exact: true })).toBeVisible();
    await expect(summary.getByRole('link', { name: 'Check out', exact: true })).toBeVisible();
    const continueShopping = summary.getByRole('link', { name: 'Continue shopping', exact: true });
    await expect(continueShopping).toBeVisible();

    // Document order: "Continue shopping" precedes the button.
    const linkPrecedesButton = await continueShopping.evaluate(
      (link, btn) => (link.compareDocumentPosition(btn as Node) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      await button.elementHandle(),
    );
    expect(linkPrecedesButton).toBe(true);
    const linkBox = (await continueShopping.boundingBox())!;
    const buttonBox = (await button.boundingBox())!;
    expect(buttonBox.y).toBeGreaterThanOrEqual(linkBox.y + linkBox.height);

    await withUrlCaption(page, demo, 'On', () => demo.highlight(continueShopping, 'Continue shopping'));
    await withUrlCaption(page, demo, 'On', () => demo.highlight(button, 'Empty bag: in the summary box, below Continue shopping'));
  });
});

test('TC-PRB-19-02 "Empty bag" removes every product and shows the empty-bag state', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, WATCH, 2);
  await addToBag(page, BOOTS, 1);
  await openCart(page, demo);
  await test.step(`the bag lists "${WATCH.name}" (quantity 2) and "${BOOTS.name}" (quantity 1)`, async () => {
    await expect(page.locator('.cart-item')).toHaveCount(2);
    await expect(cartLine(page, WATCH.name).getByRole('spinbutton')).toHaveValue('2');
    await expect(cartLine(page, BOOTS.name).getByRole('spinbutton')).toHaveValue('1');
    await demo.highlight(page.locator('.cart-items'), 'Bag before: GPS Watch x2, Hiking Boots x1');
  });
  await test.step('click "Empty bag"', async () => {
    await demo.highlight(emptyBagButton(page), 'Click Empty bag');
    await emptyBagButton(page).click();
  });
  await test.step('the page stays on /cart and shows the empty-bag state with no products, summary or error', async () => {
    const heading = page.getByRole('heading', { name: EMPTY_HEADING, exact: true });
    await expect(heading).toBeVisible();
    await expect(page).toHaveURL(CART_PATH);
    await expect(page.locator('.cart-empty').getByRole('link', { name: 'Start shopping', exact: true })).toBeVisible();
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await expect(page.getByText(WATCH.name)).toHaveCount(0);
    await expect(page.getByText(BOOTS.name)).toHaveCount(0);
    await expect(page.locator('.cart-summary')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Check out', exact: true })).toHaveCount(0);
    await expect(emptyBagButton(page)).toHaveCount(0);
    await expect(page.locator('#blazor-error-ui')).toBeHidden();
    await expect(page.getByRole('heading', { name: /error/i })).toHaveCount(0);
    await withUrlCaption(page, demo, 'After Empty bag, still on', () =>
      demo.highlight(page.locator('.cart-empty'), 'Your shopping bag is empty + Start shopping'));
    await withUrlCaption(page, demo, 'After Empty bag, still on', () =>
      demo.absent(page.locator('.cart-empty'), 'No product lines, summary box, Check out or Empty bag'));
  });
});

test('TC-PRB-19-03 an emptied bag is still empty after a page reload', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, WATCH, 1);
  await addToBag(page, BOOTS, 1);
  await openCart(page, demo);
  await test.step('click "Empty bag" and wait for "Your shopping bag is empty"', async () => {
    await expect(page.locator('.cart-item')).toHaveCount(2);
    await emptyBagButton(page).click();
    await expect(page.getByRole('heading', { name: EMPTY_HEADING, exact: true })).toBeVisible();
  });
  await test.step('reload the page', async () => {
    await page.reload();
    await demo.caption(`Reloaded ${page.url()}`);
  });
  await test.step('after the reload /cart still shows the empty bag with no products and no "Empty bag" button', async () => {
    const heading = page.getByRole('heading', { name: EMPTY_HEADING, exact: true });
    await expect(heading).toBeVisible();
    await expect(page).toHaveURL(CART_PATH);
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await expect(page.getByText(WATCH.name)).toHaveCount(0);
    await expect(page.getByText(BOOTS.name)).toHaveCount(0);
    await expect(emptyBagButton(page)).toHaveCount(0);
    await demo.highlight(heading, 'After reload: Your shopping bag is empty');
    await demo.absent(page.locator('.cart-empty'), 'No products and no Empty bag button after reload');
    await demo.caption('');
  });
});

test('TC-PRB-19-04 an empty bag shows no "Empty bag" button', async ({ page, demo }) => {
  await signInAsAlice(page);
  await openCart(page, demo);
  await test.step('the empty-bag state has no "Empty bag" element and no summary box', async () => {
    const heading = page.getByRole('heading', { name: EMPTY_HEADING, exact: true });
    await expect(heading).toBeVisible();
    await expect(emptyBagButton(page)).toHaveCount(0);
    await expect(page.getByText(EMPTY_BAG, { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: EMPTY_BAG })).toHaveCount(0);
    await expect(page.locator('.cart-summary')).toHaveCount(0);
    await withUrlCaption(page, demo, 'On', () => demo.highlight(heading, 'Never-filled bag: Your shopping bag is empty'));
    await withUrlCaption(page, demo, 'On', () => demo.absent(page.locator('.cart-empty'), 'No Empty bag button and no summary box'));
  });
});

test('TC-PRB-19-05 product lines, quantity controls, totals, "Check out" and "Continue shopping" are unchanged', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, WATCH, 2);
  await addToBag(page, BOOTS, 1);
  await openCart(page, demo);
  await test.step('two product lines with exact unit prices, quantities and line totals', async () => {
    await expect(page.locator('.cart-item')).toHaveCount(2);
    await expectLine(page, WATCH, 2, '$399.98');
    await expectLine(page, BOOTS, 1, '$109.99');
    await demo.highlight(page.locator('.cart-items'), 'Lines: Watch $199.99 x2 = $399.98; Boots $109.99 x1 = $109.99');
  });
  await test.step('each line has its named quantity controls; only the quantity-1 line has Decrease disabled', async () => {
    for (const product of [WATCH, BOOTS]) {
      const line = cartLine(page, product.name);
      await expect(line.getByRole('button', { name: `Decrease quantity of ${product.name}`, exact: true })).toBeVisible();
      await expect(line.getByRole('spinbutton', { name: `Quantity of ${product.name}`, exact: true })).toBeVisible();
      await expect(line.getByRole('button', { name: `Increase quantity of ${product.name}`, exact: true })).toBeVisible();
      await expect(line.getByRole('button', { name: `Remove ${product.name} from your bag`, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: `Decrease quantity of ${BOOTS.name}`, exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: `Decrease quantity of ${WATCH.name}`, exact: true })).toBeEnabled();
    await demo.highlight(cartLine(page, WATCH.name).locator('.catalog-item-quantity'), 'Watch: Decrease enabled, quantity, Increase, Remove');
    await demo.highlight(cartLine(page, BOOTS.name).locator('.catalog-item-quantity'), 'Boots: Decrease disabled (quantity 1)');
  });
  await test.step('the summary box shows badge 3, Total $509.97, Check out, Continue shopping and Empty bag only', async () => {
    const summary = summaryBox(page);
    await expectSummary(page, '3', '$509.97');
    const checkOut = summary.getByRole('link', { name: 'Check out', exact: true });
    await expect(checkOut).toBeVisible();
    await expect(checkOut).toHaveAttribute('href', 'checkout');
    await expect(summary.getByRole('link', { name: 'Continue shopping', exact: true })).toBeVisible();
    await expect(summary.getByRole('button', { name: EMPTY_BAG, exact: true })).toBeVisible();
    // The only controls in the summary box: the two existing links and the new button.
    await expect(summary.getByRole('link')).toHaveText(['Check out', 'Continue shopping']);
    await expect(summary.getByRole('button')).toHaveText([EMPTY_BAG]);
    await expect(summary.locator('input:not([type="hidden"]), select, textarea')).toHaveCount(0);
    await withUrlCaption(page, demo, 'On', () =>
      demo.highlight(summary, 'Summary: badge 3, Total $509.97, Check out, Continue shopping, Empty bag'));
  });
});

test('TC-PRB-19-06 the quantity stepper still updates a line and the totals', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, WATCH, 1);
  await addToBag(page, BOOTS, 1);
  await openCart(page, demo);
  await test.step(`click "Increase quantity of ${WATCH.name}"`, async () => {
    await expectLine(page, WATCH, 1, '$199.99');
    const increase = page.getByRole('button', { name: `Increase quantity of ${WATCH.name}`, exact: true });
    await demo.highlight(increase, 'Increase GPS Watch quantity (1)');
    await increase.click();
  });
  await test.step('the watch line shows 2 / $399.98, the boots line is unchanged, totals show 3 / $509.97 and the bag is not emptied', async () => {
    await expectLine(page, WATCH, 2, '$399.98');
    await expectLine(page, BOOTS, 1, '$109.99');
    await expectSummary(page, '3', '$509.97');
    await expect(page.locator('.cart-item')).toHaveCount(2);
    await expect(emptyBagButton(page)).toHaveCount(1);
    await expect(page.getByRole('heading', { name: EMPTY_HEADING, exact: true })).toHaveCount(0);
    await withUrlCaption(page, demo, 'After Increase, on', () => demo.highlight(cartLine(page, WATCH.name), 'Watch: quantity 2, $399.98'));
    await withUrlCaption(page, demo, 'After Increase, on', () =>
      demo.highlight(summaryBox(page), 'Badge 3, Total $509.97, Empty bag still present'));
  });
});

test('TC-PRB-19-07 removing one product still removes only that line', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, WATCH, 1);
  await addToBag(page, BOOTS, 1);
  await openCart(page, demo);
  await test.step(`click "Remove ${BOOTS.name} from your bag"`, async () => {
    await expect(page.locator('.cart-item')).toHaveCount(2);
    const remove = page.getByRole('button', { name: `Remove ${BOOTS.name} from your bag`, exact: true });
    await demo.highlight(remove, 'Remove Hiking Boots only');
    await remove.click();
  });
  await test.step('only the watch line remains, totals show 1 / $199.99 and "Empty bag" is still there', async () => {
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expectLine(page, WATCH, 1, '$199.99');
    await expect(page.getByText(BOOTS.name)).toHaveCount(0);
    await expectSummary(page, '1', '$199.99');
    await expect(emptyBagButton(page)).toHaveCount(1);
    await expect(page.getByRole('heading', { name: EMPTY_HEADING, exact: true })).toHaveCount(0);
    await withUrlCaption(page, demo, 'After Remove, on', () =>
      demo.highlight(page.locator('.cart-items'), 'One line left: GPS Watch x1, $199.99'));
    await withUrlCaption(page, demo, 'After Remove, on', () =>
      demo.highlight(summaryBox(page), 'Badge 1, Total $199.99, Empty bag still present'));
  });
});
