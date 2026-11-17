import { Locator, Page } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-46: on /cart, typing a quantity too large for the basket (5000000000) and pressing Enter keeps the
// shopping bag on screen, leaves the quantity and totals unchanged and shows "Enter a smaller quantity."
// next to that item only; a valid quantity applies as before and clears the message.
// Scenario `bug-46` (.factory/stack/scenarios/bug-46): seeded user bob with an empty basket. It is reloaded
// before every case because each case fills bob's bag.
// The narrated highlights (about 2.5 s each) push the longer cases past Playwright's 30 s default.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const USER = 'bob';
const PASSWORD = 'Pass123$';
const BACKPACK_ID = 7;
const BACKPACK = 'Explorer 45L Backpack';
const WATCH_ID = 99;
const WATCH = 'Adventurer GPS Watch';
const TOO_LARGE = '5000000000';
const MESSAGE = 'Enter a smaller quantity.';
const CART_PATH = /\/cart$/;

test.beforeEach(() => {
  loadScenario('bug-46');
});

const row = (page: Page, name: string) =>
  page.locator('.cart-item').filter({ has: page.locator('.name', { hasText: name }) });
const quantityInput = (page: Page, name: string) => page.getByLabel(`Quantity of ${name}`, { exact: true });
const quantityColumn = (page: Page, name: string) => row(page, name).locator('.catalog-item-quantity');
const itemTotal = (page: Page, name: string) => row(page, name).locator('.catalog-item-total');
const summary = (page: Page) => page.locator('.cart-summary');
const summaryHeader = (page: Page) => summary(page).locator('.cart-summary-header');
const badge = (page: Page) => summaryHeader(page).locator('.filter-badge');
const summaryTotal = (page: Page) => summary(page).locator('.cart-summary-total > div').nth(1);
const message = (page: Page) => page.getByText(MESSAGE, { exact: true });

// Blazor's enhanced form post merges the DOM and drops Playwright's overlay host (<x-pw-glass>), which
// Playwright re-attaches only on a new document, so demo.caption/highlight/absent draw nothing on the video
// after pressing Enter. When the host is gone, draw the same caption, outline and label in the page.
// Keyframes are screenshots taken before an overlay is drawn, so a caption that must appear in them
// (the typed value) is always drawn in the page (`inPage`). The form post's DOM merge can also remove that
// caption, so mark() draws the latest one again until the next caption replaces it.
const overlayGone = async (page: Page) => (await page.locator('x-pw-glass').count()) === 0;
const currentCaption = new WeakMap<Page, string>();

async function caption(page: Page, demo: Demo, text: string, inPage = false) {
  currentCaption.set(page, text);
  await demo.caption(text);
  await page.evaluate(() => document.getElementById('e2e-caption')?.remove());
  if (!inPage && !(await overlayGone(page))) return;
  await drawCaption(page, text);
}

async function restoreCaption(page: Page) {
  const text = currentCaption.get(page);
  if (text && (await page.locator('#e2e-caption').count()) === 0) await drawCaption(page, text);
}

async function drawCaption(page: Page, text: string) {
  await page.evaluate(value => {
    const el = document.createElement('div');
    el.id = 'e2e-caption';
    el.textContent = value;
    el.style.cssText = 'position:fixed; left:50%; bottom:28px; transform:translateX(-50%); z-index:2147483647;'
      + ' max-width:80%; padding:10px 18px; border-radius:10px; background:rgba(15,23,42,.85); color:#fff;'
      + ' font:500 18px/1.4 system-ui, sans-serif; text-align:center; box-shadow:0 4px 18px rgba(0,0,0,.35);'
      + ' pointer-events:none;';
    document.body.appendChild(el);
  }, text);
}

async function mark(page: Page, demo: Demo, locator: Locator, label: string, kind: 'highlight' | 'absent' = 'highlight') {
  const inPage = await overlayGone(page);
  await restoreCaption(page);
  if (inPage) {
    await locator.scrollIntoViewIfNeeded();
    await locator.evaluate((el, { text, color, style }) => {
      document.getElementById('e2e-mark')?.remove();
      const target = el as HTMLElement;
      target.style.outline = `3px ${style} ${color}`;
      target.style.outlineOffset = '4px';
      const r = target.getBoundingClientRect();
      const tag = document.createElement('div');
      tag.id = 'e2e-mark';
      tag.textContent = text;
      tag.style.cssText = `position:absolute; top:${r.bottom + window.scrollY + 10}px; left:${r.left + window.scrollX + r.width / 2}px;`
        + ` transform:translateX(-50%); z-index:2147483647; padding:6px 12px; border-radius:8px; background:${color};`
        + ' color:#fff; font:600 15px/1.3 system-ui, sans-serif; white-space:nowrap; pointer-events:none;';
      document.body.appendChild(tag);
    }, kind === 'highlight'
      ? { text: label, color: '#16a34a', style: 'solid' }
      : { text: label, color: '#dc2626', style: 'dashed' });
  }
  if (kind === 'highlight') await demo.highlight(locator, label);
  else await demo.absent(locator, label);
  if (inPage) {
    await locator.evaluate(el => {
      (el as HTMLElement).style.outline = '';
      (el as HTMLElement).style.outlineOffset = '';
      document.getElementById('e2e-mark')?.remove();
    });
  }
}

async function signInAsBob(page: Page) {
  await test.step(`sign in as ${USER}`, async () => {
    await page.goto(BASE_URL!);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill(USER);
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  });
}

async function addToBag(page: Page, id: number, name: string) {
  await test.step(`open /item/${id} and click "Add to shopping bag"`, async () => {
    await page.goto(`${BASE_URL}/item/${id}`);
    await expect(page.getByRole('heading', { name })).toBeVisible();
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    await expect(page.locator('.in-cart').getByRole('link', { name: 'shopping bag' })).toBeVisible();
  });
}

async function openCart(page: Page, demo: Demo) {
  await page.goto(`${BASE_URL}/cart`);
  await expect(page).toHaveURL(CART_PATH);
  await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
  await caption(page, demo, `Opened ${page.url()}`);
}

async function typeQuantityAndEnter(page: Page, demo: Demo, name: string, value: string) {
  const input = quantityInput(page, name);
  await input.fill('');
  await input.pressSequentially(value);
  await expect(input).toHaveValue(value);
  await caption(page, demo, `Typed ${value} in "Quantity of ${name}"`, true);
  await mark(page, demo, input, `Typed ${value}, pressing Enter`);
  await input.press('Enter');
  await page.waitForLoadState('networkidle');
  await caption(page, demo, `Pressed Enter with ${value} typed for ${name}`, true);
}

async function expectRowAndSummary(page: Page, name: string, quantity: string, total: string, count: string, bagTotal: string) {
  await expect(quantityInput(page, name)).toHaveValue(quantity);
  await expect(itemTotal(page, name)).toHaveText(total, { useInnerText: true });
  await expect(badge(page)).toHaveText(count);
  await expect(summaryTotal(page)).toHaveText(bagTotal, { useInnerText: true });
}

test('TC-BUG-46-01 typing 2 and pressing Enter updates the item quantity and the bag totals', async ({ page, demo }) => {
  await signInAsBob(page);
  await addToBag(page, BACKPACK_ID, BACKPACK);
  await test.step(`open /cart: "${BACKPACK}" shows quantity 1`, async () => {
    await openCart(page, demo);
    await expect(quantityInput(page, BACKPACK)).toHaveValue('1');
    await mark(page, demo, row(page, BACKPACK), `${BACKPACK}: quantity 1`);
  });
  await test.step(`type 2 in "Quantity of ${BACKPACK}" and press Enter`, async () => {
    await typeQuantityAndEnter(page, demo, BACKPACK, '2');
  });
  await test.step('the page stays on /cart with quantity 2, item total $299.98, badge 2, Total $299.98 and no message', async () => {
    await expect(page).toHaveURL(CART_PATH);
    await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
    await expect(row(page, BACKPACK)).toBeVisible();
    await expect(summaryHeader(page)).toContainText('Your shopping bag');
    await expectRowAndSummary(page, BACKPACK, '2', '$299.98', '2', '$299.98');
    await expect(message(page)).toHaveCount(0);
    await caption(page, demo, `After Enter: ${page.url()}`);
    await mark(page, demo, row(page, BACKPACK), 'Quantity 2, item total $299.98');
    await mark(page, demo, summary(page), 'Badge 2, Total $299.98');
    await mark(page, demo, quantityColumn(page, BACKPACK), `No "${MESSAGE}"`, 'absent');
  });
  await test.step('reload /cart: quantity is still 2 and Total still $299.98', async () => {
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
    await expect(quantityInput(page, BACKPACK)).toHaveValue('2');
    await expect(summaryTotal(page)).toHaveText('$299.98', { useInnerText: true });
    await caption(page, demo, `Reloaded ${page.url()}`);
    await mark(page, demo, row(page, BACKPACK), 'After reload: quantity 2');
    await mark(page, demo, summary(page), 'After reload: Total $299.98');
  });
});

test('TC-BUG-46-02 typing 5000000000 and pressing Enter keeps the bag page with header, item, totals and shows "Enter a smaller quantity."', async ({ page, demo }) => {
  await signInAsBob(page);
  await addToBag(page, BACKPACK_ID, BACKPACK);
  await test.step('open /cart', async () => {
    await openCart(page, demo);
    await expect(row(page, BACKPACK)).toBeVisible();
  });
  await test.step(`type ${TOO_LARGE} in "Quantity of ${BACKPACK}" and press Enter`, async () => {
    await typeQuantityAndEnter(page, demo, BACKPACK, TOO_LARGE);
  });
  await test.step('the page stays on /cart with header, item, summary and the message next to the item', async () => {
    await expect(page).toHaveURL(CART_PATH);
    const header = page.getByRole('heading', { name: 'Shopping bag', exact: true });
    await expect(header).toBeVisible();
    await expect(row(page, BACKPACK)).toBeVisible();
    await expect(summaryHeader(page)).toContainText('Your shopping bag');
    await expect(summary(page).locator('.cart-summary-total')).toContainText('Total');
    await expect(summary(page).getByRole('link', { name: 'Check out', exact: true })).toBeVisible();
    await expect(quantityColumn(page, BACKPACK).getByText(MESSAGE, { exact: true })).toBeVisible();
    await expect(page.getByText('An unhandled error has occurred')).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Error', exact: true })).toHaveCount(0);
    await caption(page, demo, `After Enter with ${TOO_LARGE}: ${page.url()}`);
    await mark(page, demo, header, 'Header "Shopping bag" still shown');
    await mark(page, demo, quantityColumn(page, BACKPACK), `"${MESSAGE}" next to ${BACKPACK}`);
    await mark(page, demo, summary(page), 'Summary with Total and Check out still shown');
  });
});

test('TC-BUG-46-03 after a too-large quantity the item quantity stays 1 and the totals are unchanged, also after a reload', async ({ page, demo }) => {
  await signInAsBob(page);
  await addToBag(page, BACKPACK_ID, BACKPACK);
  await test.step('open /cart: quantity 1 and Total $149.99', async () => {
    await openCart(page, demo);
    await expect(quantityInput(page, BACKPACK)).toHaveValue('1');
    await expect(summaryTotal(page)).toHaveText('$149.99', { useInnerText: true });
    await mark(page, demo, summary(page), 'Before: quantity 1, Total $149.99');
  });
  await test.step(`type ${TOO_LARGE} in "Quantity of ${BACKPACK}" and press Enter`, async () => {
    await typeQuantityAndEnter(page, demo, BACKPACK, TOO_LARGE);
    await expect(message(page)).toBeVisible();
  });
  await test.step('quantity 1, item total $149.99, badge 1, Total $149.99', async () => {
    await expectRowAndSummary(page, BACKPACK, '1', '$149.99', '1', '$149.99');
    await mark(page, demo, row(page, BACKPACK), 'Quantity still 1, item total $149.99');
    await mark(page, demo, summary(page), 'Badge 1, Total $149.99');
  });
  await test.step('reload /cart: the same values and exactly one row', async () => {
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
    await expectRowAndSummary(page, BACKPACK, '1', '$149.99', '1', '$149.99');
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await caption(page, demo, `Reloaded ${page.url()}`);
    await mark(page, demo, page.locator('.cart-items'), 'After reload: one row, quantity 1, $149.99');
    await mark(page, demo, summary(page), 'After reload: badge 1, Total $149.99');
  });
});

test('TC-BUG-46-04 the message disappears once a valid quantity is applied after a too-large one', async ({ page, demo }) => {
  await signInAsBob(page);
  await addToBag(page, BACKPACK_ID, BACKPACK);
  await test.step('open /cart', async () => {
    await openCart(page, demo);
    await expect(row(page, BACKPACK)).toBeVisible();
  });
  await test.step(`type ${TOO_LARGE} and press Enter: "${MESSAGE}" is shown`, async () => {
    await typeQuantityAndEnter(page, demo, BACKPACK, TOO_LARGE);
    await expect(quantityColumn(page, BACKPACK).getByText(MESSAGE, { exact: true })).toBeVisible();
    await mark(page, demo, quantityColumn(page, BACKPACK), `"${MESSAGE}" shown`);
  });
  await test.step('type 3 in the same input and press Enter', async () => {
    await typeQuantityAndEnter(page, demo, BACKPACK, '3');
  });
  await test.step('no message; quantity 3, item total $449.97, badge 3, Total $449.97', async () => {
    await expect(message(page)).toHaveCount(0);
    await expectRowAndSummary(page, BACKPACK, '3', '$449.97', '3', '$449.97');
    await mark(page, demo, quantityColumn(page, BACKPACK), `"${MESSAGE}" gone`, 'absent');
    await mark(page, demo, row(page, BACKPACK), 'Quantity 3, item total $449.97');
    await mark(page, demo, summary(page), 'Badge 3, Total $449.97');
  });
});

test('TC-BUG-46-05 with two items in the bag the message appears only next to the item with the too-large quantity', async ({ page, demo }) => {
  await signInAsBob(page);
  await addToBag(page, BACKPACK_ID, BACKPACK);
  await addToBag(page, WATCH_ID, WATCH);
  let before = '';
  await test.step('open /cart and record the Total with both items at quantity 1', async () => {
    await openCart(page, demo);
    await expect(page.locator('.cart-item')).toHaveCount(2);
    await expect(quantityInput(page, BACKPACK)).toHaveValue('1');
    await expect(quantityInput(page, WATCH)).toHaveValue('1');
    before = (await summaryTotal(page).innerText()).trim();
    expect(before).toMatch(/^\$\d/);
    await mark(page, demo, summary(page), `Total T = ${before}`);
  });
  await test.step(`type ${TOO_LARGE} in "Quantity of ${BACKPACK}" and press Enter`, async () => {
    await typeQuantityAndEnter(page, demo, BACKPACK, TOO_LARGE);
  });
  await test.step(`the message is next to ${BACKPACK} only; both quantities 1, badge 2, Total T`, async () => {
    await expect(row(page, BACKPACK).getByText(MESSAGE, { exact: true })).toBeVisible();
    await expect(row(page, WATCH).getByText(MESSAGE)).toHaveCount(0);
    await expect(message(page)).toHaveCount(1);
    await expect(quantityInput(page, BACKPACK)).toHaveValue('1');
    await expect(quantityInput(page, WATCH)).toHaveValue('1');
    await expect(badge(page)).toHaveText('2');
    await expect(summaryTotal(page)).toHaveText(before, { useInnerText: true });
    await mark(page, demo, row(page, BACKPACK), `${BACKPACK}: "${MESSAGE}", quantity 1`);
    await mark(page, demo, quantityColumn(page, WATCH), `${WATCH}: no message, quantity 1`, 'absent');
    await mark(page, demo, summary(page), `Badge 2, Total still ${before}`);
  });
});
