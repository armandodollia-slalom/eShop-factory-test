import { Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// PRB-6: on the shopping bag page (/cart) each line's remove button is announced as
// "Remove {product} from your shopping bag"; its visible text ("Remove") and what it does are unchanged.
// Scenario `prb-6` (.factory/stack/scenarios/prb-6): the seeded user alice (Pass123$) with an empty basket and the
// demo catalog. Every case fills alice's basket itself, so the scenario is reloaded before each case.
test.describe.configure({ mode: 'serial' });

const BOOTS_ID = 1;
const BOOTS = 'Wanderer Black Hiking Boots';
const HARNESS_ID = 2;
const HARNESS = 'Summit Pro Harness';
const removeName = (product: string) => `Remove ${product} from your shopping bag`;
const oldRemoveName = (product: string) => `Remove ${product} from your bag`;
const EMPTY_HEADING = 'Your shopping bag is empty';

test.beforeAll(() => {
  loadScenario('prb-6');
});

test.beforeEach(() => {
  loadScenario('prb-6');
});

const lines = (page: Page) => page.locator('.cart-items .cart-item');
const line = (page: Page, product: string) =>
  lines(page).filter({ has: page.locator('p.name').getByText(product, { exact: true }) });
const removeButton = (page: Page, product: string) =>
  page.getByRole('button', { name: removeName(product), exact: true });

async function signInAsAlice(page: Page) {
  await test.step('sign in as alice / Pass123$', async () => {
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

async function addToBag(page: Page, id: number, product: string) {
  await test.step(`add item ${id} "${product}" from /item/${id} ("Add to shopping bag")`, async () => {
    await page.goto(`${BASE_URL}/item/${id}`);
    await expect(page.getByRole('heading', { name: product })).toBeVisible();
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    await expect(page.locator('.in-cart').getByRole('link', { name: 'shopping bag' })).toBeVisible();
  });
}

async function openCart(page: Page, demo: { caption(text: string): Promise<void> }) {
  await page.goto(`${BASE_URL}/cart`);
  await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
  await demo.caption(`Opened ${page.url()}`);
}

test('TC-PRB-6-01 remove button is named "Remove Wanderer Black Hiking Boots from your shopping bag"', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, BOOTS_ID, BOOTS);
  await test.step('navigate to /cart', async () => {
    await openCart(page, demo);
  });
  await test.step(`read the accessible name of the "${BOOTS}" line's remove button`, async () => {
    await expect(lines(page)).toHaveCount(1);
    await expect(line(page, BOOTS)).toHaveCount(1);
    await expect(lines(page).locator('p.name')).toHaveText([BOOTS]);
    const button = removeButton(page, BOOTS);
    await expect(button).toHaveCount(1);
    await expect(button).toBeVisible();
    await expect(line(page, BOOTS).locator('button.cart-remove')).toHaveAccessibleName(removeName(BOOTS));
    await expect(page.getByRole('button', { name: oldRemoveName(BOOTS), exact: true })).toHaveCount(0);
    await demo.caption(`Accessible name: "${removeName(BOOTS)}"`);
    await demo.highlight(button, `Named: ${removeName(BOOTS)}`);
    await demo.absent(button, `No button named "${oldRemoveName(BOOTS)}"`);
  });
});

test('TC-PRB-6-02 remove button\'s visible text is still "Remove"', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, BOOTS_ID, BOOTS);
  await test.step('navigate to /cart', async () => {
    await openCart(page, demo);
  });
  await test.step(`read the rendered text of the button named "${removeName(BOOTS)}"`, async () => {
    const button = removeButton(page, BOOTS);
    await expect(button).toBeVisible();
    expect((await button.innerText()).trim()).toBe('Remove');
    const row = line(page, BOOTS);
    await expect(row.getByText('from your shopping bag')).toHaveCount(0);
    await demo.caption('Visible text: "Remove"; "from your shopping bag" only in the accessible name');
    await demo.highlight(button, 'Visible text: Remove');
    await demo.absent(row, 'No visible "from your shopping bag" in the line');
  });
});

test('TC-PRB-6-03 activating the remove button still removes the line from the shopping bag', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, BOOTS_ID, BOOTS);
  await test.step(`navigate to /cart and confirm the "${BOOTS}" line is shown`, async () => {
    await openCart(page, demo);
    await expect(line(page, BOOTS)).toBeVisible();
    await demo.highlight(line(page, BOOTS), `Line: ${BOOTS}`);
  });
  await test.step(`click the button named "${removeName(BOOTS)}"`, async () => {
    const button = removeButton(page, BOOTS);
    await demo.highlight(button, `Click: ${removeName(BOOTS)}`);
    await button.click();
    await expect(line(page, BOOTS)).toHaveCount(0);
    await expect(removeButton(page, BOOTS)).toHaveCount(0);
    await demo.absent(page.locator('.cart'), `"${BOOTS}" line removed`);
  });
  await test.step('reload /cart', async () => {
    await page.reload();
    const empty = page.getByRole('heading', { name: EMPTY_HEADING, exact: true });
    await expect(empty).toBeVisible();
    await expect(line(page, BOOTS)).toHaveCount(0);
    await expect(lines(page)).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Shopping bag, 1 item', exact: true })).toHaveCount(0);
    await demo.caption(`Reloaded ${page.url()}`);
    await demo.highlight(empty, `After reload: ${EMPTY_HEADING}`);
    const headerBag = page.getByRole('banner').getByRole('link', { name: 'Shopping bag', exact: true });
    await expect(headerBag).toBeVisible();
    await demo.absent(headerBag, 'No header link "Shopping bag, 1 item"');
  });
});

test('TC-PRB-6-04 each line\'s remove button names its own product with "from your shopping bag"', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, BOOTS_ID, BOOTS);
  await addToBag(page, HARNESS_ID, HARNESS);
  await test.step('navigate to /cart and list the accessible names of all .cart-remove buttons', async () => {
    await openCart(page, demo);
    await expect(lines(page)).toHaveCount(2);
    const buttons = page.locator('button.cart-remove');
    await expect(buttons).toHaveCount(2);
    const names = await buttons.evaluateAll(els => els.map(el => el.getAttribute('aria-label') ?? ''));
    expect([...names].sort()).toEqual([removeName(BOOTS), removeName(HARNESS)].sort());
    await expect(line(page, BOOTS).locator('button.cart-remove')).toHaveAccessibleName(removeName(BOOTS));
    await expect(line(page, HARNESS).locator('button.cart-remove')).toHaveAccessibleName(removeName(HARNESS));
    for (const name of names) expect(name.endsWith('from your bag')).toBe(false);
    await demo.highlight(removeButton(page, BOOTS), `Named: ${removeName(BOOTS)}`);
    await demo.highlight(removeButton(page, HARNESS), `Named: ${removeName(HARNESS)}`);
    await demo.absent(page.locator('.cart-items'), 'No remove button name ends with "from your bag"');
  });
});

test('TC-PRB-6-05 the remove button named for one product does not remove the other line', async ({ page, demo }) => {
  await signInAsAlice(page);
  await addToBag(page, BOOTS_ID, BOOTS);
  await addToBag(page, HARNESS_ID, HARNESS);
  const empty = page.getByRole('heading', { name: EMPTY_HEADING, exact: true });
  await test.step(`navigate to /cart and click the button named "${removeName(HARNESS)}"`, async () => {
    await openCart(page, demo);
    await expect(lines(page)).toHaveCount(2);
    const button = removeButton(page, HARNESS);
    await demo.highlight(button, `Click: ${removeName(HARNESS)}`);
    await button.click();
    await expect(line(page, HARNESS)).toHaveCount(0);
    await expect(lines(page)).toHaveCount(1);
    await expect(lines(page).locator('p.name')).toHaveText([BOOTS]);
    await expect(empty).toHaveCount(0);
    await demo.highlight(line(page, BOOTS), `Only line left: ${BOOTS}`);
  });
  await test.step('reload /cart', async () => {
    await page.reload();
    await expect(lines(page)).toHaveCount(1);
    await expect(lines(page).locator('p.name')).toHaveText([BOOTS]);
    await expect(removeButton(page, BOOTS)).toHaveCount(1);
    await expect(removeButton(page, HARNESS)).toHaveCount(0);
    await expect(empty).toHaveCount(0);
    await demo.caption(`Reloaded ${page.url()}`);
    await demo.highlight(line(page, BOOTS), `After reload: only ${BOOTS}`);
    await demo.absent(line(page, BOOTS), `No "${HARNESS}" line, not empty`);
  });
});
