import { Locator, Page } from '@playwright/test';
import { test, expect, Demo, createDemo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// GIFT-1: a per-line gift message on the shopping bag page (/cart), stored with the basket in the Basket API.
// Scenario `gift-1` (.factory/stack/scenarios/gift-1): seeded user alice, empty basket, no orders. It is reloaded
// before every case because each case fills alice's bag and TC-GIFT-1-10 places an order.
// The narrated highlights (about 2.5 s each) push the longer cases past Playwright's 30 s default.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

const USER = 'alice';
const PASSWORD = 'Pass123$';
const ITEM_ID = 99;
const ITEM_NAME = 'Adventurer GPS Watch';
const ITEM_PRICE = '$199.99';
const MESSAGE = 'Happy birthday, Sam!';
const EDITED_MESSAGE = 'Congratulations, Alex!';
const OTHER_TEXT = 'Other text';
const SIXTY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ12345678';
const TEXT_A = `${SIXTY}X`;
const TEXT_L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
const ADD_ACTION = 'Add a gift message';
const EDIT_ACTION = 'Edit';
const SAVE_FAILED = "We couldn't save your gift message. Please try again.";
const PRODUCT_MISSING = 'Choose an item in your bag to add a gift message to.';
const EMPTY_BAG = 'Your shopping bag is empty';
const CART_PATH = /\/cart$/;
const ORDERS_PATH = /\/user\/orders$/;

test.beforeEach(() => {
  loadScenario('gift-1');
});

const line = (page: Page) => page.locator('.cart-item').filter({ has: page.locator('.name', { hasText: ITEM_NAME }) });
const quotedMessage = (page: Page) => line(page).locator('.gift-message');
const editorAction = (page: Page) => line(page).locator('details.gift-message-editor > summary');
const editor = (page: Page) => line(page).locator('details.gift-message-editor');
const messageInput = (page: Page) => page.getByLabel(`Gift message for ${ITEM_NAME}`, { exact: true });
const saveButton = (page: Page) => line(page).locator('.gift-message-form').getByRole('button', { name: 'Save', exact: true });
const quantityInput = (page: Page) => page.getByLabel(`Quantity of ${ITEM_NAME}`, { exact: true });
const emptyBag = (page: Page) => page.locator('.cart-empty');

async function signIn(page: Page) {
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

async function addWatchFromProductPage(page: Page) {
  await test.step(`open the product page of item ${ITEM_ID} "${ITEM_NAME}" and add it to the bag`, async () => {
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    await expect(page.locator('.in-cart').getByRole('link', { name: 'shopping bag' })).toBeVisible();
  });
}

async function openCart(page: Page, demo: Demo) {
  await page.goto(`${BASE_URL}/cart`);
  await expect(page).toHaveURL(CART_PATH);
  await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
  await demo.caption(`Opened ${page.url()}`);
}

async function signInAddWatchAndOpenCart(page: Page, demo: Demo) {
  await signIn(page);
  await addWatchFromProductPage(page);
  await test.step('open /cart', async () => {
    await openCart(page, demo);
    await expect(line(page)).toHaveCount(1);
  });
}

async function clickSave(page: Page) {
  const posted = page.waitForResponse(response =>
    response.request().method() === 'POST' && new URL(response.url()).pathname === '/cart');
  await saveButton(page).click();
  await posted;
  await page.waitForLoadState('networkidle');
}

// Blazor's enhanced form post and navigation merge the DOM and drop Playwright's overlay host (<x-pw-glass>),
// which Playwright re-attaches only on a new document, so demo.caption draws nothing after "Save" or
// "Place order". When the host is gone, draw the same caption in the page once streaming has finished.
async function showUrl(page: Page, demo: Demo, prefix: string) {
  await page.waitForLoadState('networkidle');
  const text = `${prefix}: ${page.url()}`;
  await demo.caption(text);
  if ((await page.locator('x-pw-glass').count()) > 0) return;
  await page.evaluate(caption => {
    document.getElementById('e2e-caption')?.remove();
    const el = document.createElement('div');
    el.id = 'e2e-caption';
    el.textContent = caption;
    el.style.cssText = 'position:fixed; left:50%; bottom:28px; transform:translateX(-50%); z-index:2147483647;'
      + ' max-width:80%; padding:10px 18px; border-radius:10px; background:rgba(15,23,42,.85); color:#fff;'
      + ' font:500 18px/1.4 system-ui, sans-serif; text-align:center; box-shadow:0 4px 18px rgba(0,0,0,.35);'
      + ' pointer-events:none;';
    document.body.appendChild(el);
  }, text);
  await expect(page.locator('#e2e-caption')).toHaveText(text);
}

async function chooseAddAndSave(page: Page, demo: Demo, message: string) {
  await test.step(`choose "${ADD_ACTION}" on the "${ITEM_NAME}" line`, async () => {
    await expect(editorAction(page)).toHaveText(ADD_ACTION);
    await editorAction(page).click();
    await expect(messageInput(page)).toBeVisible();
  });
  await test.step(`type "${message}" into the message box`, async () => {
    await demo.type(messageInput(page), message);
    await expect(messageInput(page)).toHaveValue(message);
  });
  await test.step('save the message', async () => {
    await clickSave(page);
    await expect(page).toHaveURL(CART_PATH);
    await expect(quotedMessage(page)).toHaveText(`"${message}"`);
  });
}

async function chooseEdit(page: Page) {
  await expect(editorAction(page)).toHaveText(EDIT_ACTION);
  await editorAction(page).click();
  await expect(messageInput(page)).toBeVisible();
}

/** The line shows `"message"` directly under the product name and offers "Edit" instead of "Add a gift message". */
async function expectLineShowsMessage(page: Page, message: string) {
  await expect(quotedMessage(page)).toHaveCount(1);
  await expect(quotedMessage(page)).toHaveText(`"${message}"`);
  const underName = await line(page).locator('.name').evaluate(el => el.nextElementSibling?.className ?? '');
  expect(underName).toBe('gift-message');
  await expect(editorAction(page)).toHaveText(EDIT_ACTION);
  await expect(line(page).getByText(ADD_ACTION, { exact: true })).toHaveCount(0);
}

/** The line has no quoted message and offers "Add a gift message", not "Edit". */
async function expectLineHasNoMessage(page: Page) {
  await expect(quotedMessage(page)).toHaveCount(0);
  await expect(editorAction(page)).toHaveText(ADD_ACTION);
  await expect(line(page).getByText(EDIT_ACTION, { exact: true })).toHaveCount(0);
  expect(await line(page).locator('.catalog-item-content').innerText()).not.toContain('"');
}

test('TC-GIFT-1-01 a bag line without a message offers "Add a gift message" and shows no message', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await test.step(`the bag has exactly one line "${ITEM_NAME}" with quantity 1`, async () => {
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(line(page).locator('.name')).toHaveText(ITEM_NAME);
    await expect(quantityInput(page)).toHaveValue('1');
    await demo.highlight(line(page), `${ITEM_NAME}, quantity 1`);
  });
  await test.step(`the line shows "${ADD_ACTION}", no quoted message and no "Edit"`, async () => {
    await expectLineHasNoMessage(page);
    await demo.highlight(editorAction(page), `"${ADD_ACTION}" action`);
    await demo.absent(line(page).locator('.name'), 'No quoted gift message and no "Edit" under the name');
  });
  await test.step('the line still shows the name, unit price, quantity input and line total', async () => {
    await expect(line(page).locator('.name')).toHaveText(ITEM_NAME);
    await expect(line(page).locator('.price')).toHaveText(ITEM_PRICE);
    await expect(quantityInput(page)).toBeVisible();
    await expect(line(page).locator('.catalog-item-total')).toHaveText(ITEM_PRICE);
    await demo.highlight(line(page), `Name, ${ITEM_PRICE} unit price, quantity 1, ${ITEM_PRICE} total`);
  });
});

test('TC-GIFT-1-02 saving a gift message shows it in quotes under the product name with an "Edit" action', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await chooseAddAndSave(page, demo, MESSAGE);
  await test.step(`the line shows "${MESSAGE}" in quotes under the name, "Edit", and quantity 1`, async () => {
    await expect(page).toHaveURL(CART_PATH);
    await expectLineShowsMessage(page, MESSAGE);
    await expect(quantityInput(page)).toHaveValue('1');
    await showUrl(page, demo, 'After Save');
    await demo.highlight(quotedMessage(page), `"${MESSAGE}" under the product name`);
    await demo.highlight(editorAction(page), `"${EDIT_ACTION}" replaces "${ADD_ACTION}"`);
    await demo.highlight(quantityInput(page), 'Quantity still 1');
  });
});

test('TC-GIFT-1-03 the message box stops at 60 characters and a 60-character message is saved whole', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await test.step(`choose "${ADD_ACTION}" on the line`, async () => {
    await editorAction(page).click();
    await expect(messageInput(page)).toBeVisible();
  });
  await test.step('type the 61-character text A key by key: the box keeps the first 60 characters', async () => {
    await demo.caption(`Typing 61 characters: ${SIXTY.slice(0, 20)}...${SIXTY.slice(-8)} + X`);
    await demo.type(messageInput(page), TEXT_A);
    await expect(messageInput(page)).toHaveValue(SIXTY);
    expect((await messageInput(page).inputValue()).length).toBe(60);
    await demo.highlight(messageInput(page), 'Box holds 60 characters; the 61st "X" was not entered');
  });
  await test.step('save the message', async () => {
    await clickSave(page);
    await expect(page).toHaveURL(CART_PATH);
  });
  await test.step('the line shows all 60 characters in quotes with an "Edit" action and no error', async () => {
    await expectLineShowsMessage(page, SIXTY);
    await expect(page.locator('.gift-message-error')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await demo.highlight(quotedMessage(page), 'All 60 characters saved, in quotes');
    await demo.absent(line(page), 'No error message');
  });
});

test('TC-GIFT-1-04 editing a gift message replaces the shown message', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await chooseAddAndSave(page, demo, MESSAGE);
  await test.step(`choose "${EDIT_ACTION}": the box contains "${MESSAGE}"`, async () => {
    await chooseEdit(page);
    await expect(messageInput(page)).toHaveValue(MESSAGE);
    await demo.highlight(messageInput(page), `Box pre-filled with "${MESSAGE}"`);
  });
  await test.step(`replace the text with "${EDITED_MESSAGE}"`, async () => {
    await messageInput(page).fill('');
    await demo.type(messageInput(page), EDITED_MESSAGE);
    await expect(messageInput(page)).toHaveValue(EDITED_MESSAGE);
  });
  await test.step('save the message', async () => {
    await clickSave(page);
    await expect(page).toHaveURL(CART_PATH);
  });
  await test.step(`the line shows "${EDITED_MESSAGE}" and "Edit"; "${MESSAGE}" is gone`, async () => {
    await expectLineShowsMessage(page, EDITED_MESSAGE);
    await expect(page.getByText(MESSAGE)).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toContain(MESSAGE);
    await demo.highlight(quotedMessage(page), `"${EDITED_MESSAGE}" replaced "${MESSAGE}"`);
  });
});

test('TC-GIFT-1-05 clearing the text and saving removes the message and brings back "Add a gift message"', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await chooseAddAndSave(page, demo, MESSAGE);
  await test.step(`choose "${EDIT_ACTION}", delete all text from the box and save`, async () => {
    await chooseEdit(page);
    await messageInput(page).fill('');
    await expect(messageInput(page)).toHaveValue('');
    await demo.highlight(messageInput(page), 'Box emptied');
    await clickSave(page);
    await expect(page).toHaveURL(CART_PATH);
  });
  await test.step(`after saving: "${ADD_ACTION}", no "Edit", no quoted text, quantity 1`, async () => {
    await expectLineHasNoMessage(page);
    await expect(page.getByText(`"${MESSAGE}"`)).toHaveCount(0);
    await expect(quantityInput(page)).toHaveValue('1');
    await demo.highlight(editorAction(page), `"${ADD_ACTION}" is back`);
    await demo.absent(line(page).locator('.name'), 'No quoted message (neither the old one nor "")');
  });
  await test.step('reload /cart', async () => {
    await page.reload();
    await expect(page).toHaveURL(CART_PATH);
    await expect(line(page)).toHaveCount(1);
    await demo.caption(`Reloaded ${page.url()}`);
  });
  await test.step(`after reload: still "${ADD_ACTION}", no quoted text, quantity 1`, async () => {
    await expectLineHasNoMessage(page);
    await expect(page.getByText(`"${MESSAGE}"`)).toHaveCount(0);
    await expect(quantityInput(page)).toHaveValue('1');
    await demo.highlight(line(page), `After reload: "${ADD_ACTION}", no message, quantity 1`);
  });
});

test('TC-GIFT-1-06 the gift message survives a page reload', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await chooseAddAndSave(page, demo, MESSAGE);
  await test.step('reload /cart with the browser', async () => {
    await page.reload();
    await expect(page).toHaveURL(CART_PATH);
    await expect(line(page)).toHaveCount(1);
    await demo.caption(`Reloaded ${page.url()}`);
  });
  await test.step(`the line still shows "${MESSAGE}" under the name and "Edit"`, async () => {
    await expectLineShowsMessage(page, MESSAGE);
    await demo.highlight(quotedMessage(page), `After reload: "${MESSAGE}"`);
    await demo.highlight(editorAction(page), `"${EDIT_ACTION}" action`);
  });
});

test('TC-GIFT-1-07 the gift message survives signing out and signing in again', async ({ page, demo, browser }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await chooseAddAndSave(page, demo, MESSAGE);
  await test.step('sign out', async () => {
    await page.getByRole('button', { name: 'Account' }).hover();
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page.getByLabel('Sign in')).toBeVisible();
    await showUrl(page, demo, 'Signed out');
    await demo.highlight(page.getByLabel('Sign in'), 'Signed out');
  });

  const freshContext = await browser.newContext();
  const freshPage = await freshContext.newPage();
  const freshDemo = createDemo(freshPage);
  try {
    await test.step('open a new browser context (no cookies or storage) and sign in as alice', async () => {
      expect(await freshContext.cookies()).toHaveLength(0);
      await signIn(freshPage);
      await freshDemo.highlight(freshPage.getByRole('button', { name: 'Account' }), `New browser context: signed in as ${USER}`);
    });
    await test.step('open /cart', async () => {
      await openCart(freshPage, freshDemo);
    });
    await test.step(`the bag has "${ITEM_NAME}" with quantity 1, "${MESSAGE}" and "Edit"`, async () => {
      await expect(freshPage.locator('.cart-item')).toHaveCount(1);
      await expect(line(freshPage).locator('.name')).toHaveText(ITEM_NAME);
      await expect(quantityInput(freshPage)).toHaveValue('1');
      await expectLineShowsMessage(freshPage, MESSAGE);
      await freshDemo.highlight(line(freshPage), `After sign-in in a new browser: "${MESSAGE}", quantity 1, Edit`);
    });
  } finally {
    await freshDemo.dispose().catch(() => {});
  }
});

test('TC-GIFT-1-08 the gift message survives a change of the line\'s quantity', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await chooseAddAndSave(page, demo, MESSAGE);
  await test.step('set the line\'s quantity to 3 and submit the update', async () => {
    const posted = page.waitForResponse(response =>
      response.request().method() === 'POST' && new URL(response.url()).pathname === '/cart');
    await quantityInput(page).fill('3');
    await quantityInput(page).press('Enter');
    await posted;
    await page.waitForLoadState('networkidle');
    await expect(line(page).locator('.catalog-item-total')).toHaveText('$599.97');
  });
  await test.step(`after the update: quantity 3 and "${MESSAGE}" with "Edit"`, async () => {
    await expect(quantityInput(page)).toHaveValue('3');
    await expectLineShowsMessage(page, MESSAGE);
    await demo.highlight(line(page), `Quantity 3, message "${MESSAGE}" kept`);
  });
  await test.step('reload /cart', async () => {
    await page.reload();
    await expect(page).toHaveURL(CART_PATH);
    await expect(line(page)).toHaveCount(1);
    await demo.caption(`Reloaded ${page.url()}`);
  });
  await test.step(`after reload: quantity 3 and "${MESSAGE}" with "Edit"`, async () => {
    await expect(quantityInput(page)).toHaveValue('3');
    await expectLineShowsMessage(page, MESSAGE);
    await demo.highlight(line(page), `After reload: quantity 3, "${MESSAGE}"`);
  });
});

test('TC-GIFT-1-09 removing the product and adding it again from its product page gives a line with no message', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await chooseAddAndSave(page, demo, MESSAGE);
  await test.step(`click "Remove" on the "${ITEM_NAME}" line`, async () => {
    await page.getByRole('button', { name: `Remove ${ITEM_NAME} from your bag`, exact: true }).click();
    await expect(emptyBag(page).getByRole('heading', { name: EMPTY_BAG })).toBeVisible();
    await expect(line(page)).toHaveCount(0);
    await demo.highlight(emptyBag(page), `No "${ITEM_NAME}" line: ${EMPTY_BAG}`);
  });
  await addWatchFromProductPage(page);
  await test.step('open /cart', async () => {
    await openCart(page, demo);
  });
  await test.step(`one "${ITEM_NAME}" line with quantity 1 and no message`, async () => {
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(line(page)).toHaveCount(1);
    await expect(quantityInput(page)).toHaveValue('1');
    await expectLineHasNoMessage(page);
    await expect(page.getByText(MESSAGE)).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toContain(MESSAGE);
    await demo.highlight(editorAction(page), `Re-added line offers "${ADD_ACTION}"`);
    await demo.absent(line(page).locator('.name'), `No "${MESSAGE}" and no "Edit"`);
  });
});

test('TC-GIFT-1-10 placing an order from a bag with a gift message still creates the order', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await chooseAddAndSave(page, demo, MESSAGE);
  await test.step('check out from the bag, fill the address and place the order', async () => {
    await page.getByRole('link', { name: 'Check out' }).click();
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
    const field = (property: string) => page.locator(`.checkout input[name="Info.${property}"]`);
    await field('Street').fill('15703 NE 61st Ct');
    await field('City').fill('Redmond');
    await field('State').fill('WA');
    await field('ZipCode').fill('98052');
    await field('Country').fill('U.S.');
    await demo.highlight(page.locator('.checkout .form-section').first(), 'Checkout form filled');
    await page.getByRole('button', { name: 'Place order', exact: true }).click();
  });
  await test.step('the order is placed without an error and the shopper is on the orders page', async () => {
    await expect(page).toHaveURL(ORDERS_PATH);
    await expect(page.getByRole('heading', { name: 'My orders', exact: true })).toBeVisible();
    await expect(page.locator('.validation-message')).toHaveCount(0);
    await expect(page.locator('ul.validation-errors li')).toHaveCount(0);
    await showUrl(page, demo, 'After Place order');
  });
  await test.step(`/user/orders lists exactly one order totalling ${ITEM_PRICE}`, async () => {
    const list = page.locator('.orders-list');
    await expect(list).toBeVisible();
    await expect(page.locator('.order-number')).toHaveCount(1);
    await expect(page.locator('.order-total')).toHaveText(ITEM_PRICE);
    await demo.highlight(list, `After Place order: one order, total ${ITEM_PRICE}`);
  });
  await test.step('open /cart: the bag is empty', async () => {
    await openCart(page, demo);
    await expect(emptyBag(page).getByRole('heading', { name: EMPTY_BAG })).toBeVisible();
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await demo.highlight(emptyBag(page), 'Bag is empty after the order');
  });
});

test('TC-GIFT-1-17 a rejected save keeps the stored message under the product name and shows an inline error', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await chooseAddAndSave(page, demo, MESSAGE);
  await test.step(`choose "${EDIT_ACTION}" on the line`, async () => {
    await chooseEdit(page);
  });
  await test.step('remove the maxlength attribute from the message box in the DOM', async () => {
    await messageInput(page).evaluate(el => el.removeAttribute('maxlength'));
    await expect(messageInput(page)).not.toHaveAttribute('maxlength');
    await demo.caption('maxlength removed from the gift message box');
  });
  await test.step('fill the box with the 61-character text L and click "Save"', async () => {
    await messageInput(page).fill(TEXT_L);
    await expect(messageInput(page)).toHaveValue(TEXT_L);
    await demo.highlight(messageInput(page), 'Box holds 61 characters');
    await clickSave(page);
  });
  await test.step(`/cart shows the inline error in the open editor and keeps "${MESSAGE}"`, async () => {
    await expect(page).toHaveURL(CART_PATH);
    await expect(editor(page)).toHaveAttribute('open', '');
    const alert = editor(page).getByRole('alert');
    await expect(alert).toHaveText(SAVE_FAILED);
    await expectStoredMessageNotTextL(page);
    await expect(quantityInput(page)).toHaveValue('1');
    await showUrl(page, demo, 'After Save');
    await demo.highlight(alert,'Inline error in the open editor');
    await demo.highlight(quotedMessage(page), `Still "${MESSAGE}", not text L`);
  });
  await test.step('reload /cart', async () => {
    await page.reload();
    await expect(page).toHaveURL(CART_PATH);
    await expect(line(page)).toHaveCount(1);
    await demo.caption(`Reloaded ${page.url()}`);
  });
  await test.step(`after reload: "${MESSAGE}" and "Edit", no alert, no text L, quantity 1`, async () => {
    await expectLineShowsMessage(page, MESSAGE);
    await expect(page.getByText(SAVE_FAILED)).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toContain(TEXT_L);
    await expect(quantityInput(page)).toHaveValue('1');
    await demo.highlight(line(page), `After reload: "${MESSAGE}", Edit, quantity 1, no error`);
  });
});

async function expectStoredMessageNotTextL(page: Page) {
  await expect(quotedMessage(page)).toHaveText(`"${MESSAGE}"`);
  await expect(page.getByText(`"${TEXT_L}"`)).toHaveCount(0);
}

/** True when `first` comes before `second` in document order. */
async function precedes(first: Locator, second: Locator) {
  const handle = await second.elementHandle();
  return first.evaluate((a, b) => !!(a.compareDocumentPosition(b!) & Node.DOCUMENT_POSITION_FOLLOWING), handle);
}

async function removeHiddenProductId(page: Page, demo: Demo) {
  const hidden = line(page).locator('.gift-message-form input[name="GiftMessageProductId"]');
  await expect(hidden).toHaveCount(1);
  await hidden.evaluate(el => el.remove());
  await expect(hidden).toHaveCount(0);
  await demo.caption('Hidden GiftMessageProductId removed from the gift message form');
}

test('TC-GIFT-1-18 a gift message post without a product id shows a notice above the bag and changes nothing', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await chooseAddAndSave(page, demo, MESSAGE);
  await test.step(`choose "${EDIT_ACTION}" on the line`, async () => {
    await chooseEdit(page);
  });
  await test.step('remove the hidden input GiftMessageProductId from the line\'s form in the DOM', async () => {
    await removeHiddenProductId(page, demo);
  });
  await test.step(`replace the text with "${OTHER_TEXT}" and click "Save"`, async () => {
    await messageInput(page).fill(OTHER_TEXT);
    await expect(messageInput(page)).toHaveValue(OTHER_TEXT);
    await clickSave(page);
  });
  await test.step('/cart shows the notice above the bag; the line keeps its message and quantity', async () => {
    await expect(page).toHaveURL(CART_PATH);
    const notice = page.getByRole('alert').filter({ hasText: PRODUCT_MISSING });
    await expect(notice).toHaveCount(1);
    await expect(notice).toHaveText(PRODUCT_MISSING);
    expect(await precedes(notice, page.locator('.cart'))).toBe(true);
    await expect(quotedMessage(page)).toHaveText(`"${MESSAGE}"`);
    await expect(page.getByText(`"${OTHER_TEXT}"`)).toHaveCount(0);
    await expect(quantityInput(page)).toHaveValue('1');
    await showUrl(page, demo, 'After Save');
    await demo.highlight(notice,'Notice above the bag');
    await demo.highlight(line(page), `Line unchanged: "${MESSAGE}", quantity 1`);
  });
  await test.step('reload /cart', async () => {
    await page.reload();
    await expect(page).toHaveURL(CART_PATH);
    await expect(line(page)).toHaveCount(1);
    await demo.caption(`Reloaded ${page.url()}`);
  });
  await test.step(`after reload: no notice, "${MESSAGE}" with quantity 1`, async () => {
    await expect(page.getByText(PRODUCT_MISSING)).toHaveCount(0);
    await expect(quotedMessage(page)).toHaveText(`"${MESSAGE}"`);
    await expect(quantityInput(page)).toHaveValue('1');
    await demo.absent(page.locator('.cart'), 'No notice above the bag after reload');
    await demo.highlight(line(page), `After reload: "${MESSAGE}", quantity 1`);
  });
});

test('TC-GIFT-1-19 a gift message post without a product id on an empty bag shows the notice and the bag stays empty', async ({ page, demo }) => {
  await signInAddWatchAndOpenCart(page, demo);
  await test.step(`in tab A choose "${ADD_ACTION}" and remove the hidden GiftMessageProductId in the DOM`, async () => {
    await editorAction(page).click();
    await expect(messageInput(page)).toBeVisible();
    await removeHiddenProductId(page, demo);
  });

  const tabB = await page.context().newPage();
  const demoB = createDemo(tabB);
  try {
    await test.step(`in tab B open /cart and click "Remove" on the "${ITEM_NAME}" line`, async () => {
      await openCart(tabB, demoB);
      await tabB.getByRole('button', { name: `Remove ${ITEM_NAME} from your bag`, exact: true }).click();
      await expect(emptyBag(tabB).getByRole('heading', { name: EMPTY_BAG })).toBeVisible();
      await demoB.highlight(emptyBag(tabB), `Tab B: ${EMPTY_BAG}`);
    });
  } finally {
    await demoB.dispose().catch(() => {});
    await tabB.close();
  }

  await test.step(`in tab A type "${MESSAGE}" and click "Save"`, async () => {
    await page.bringToFront();
    await demo.type(messageInput(page), MESSAGE);
    await expect(messageInput(page)).toHaveValue(MESSAGE);
    await clickSave(page);
  });
  await test.step('tab A shows the notice above "Your shopping bag is empty" and the bag stays empty', async () => {
    await expect(page).toHaveURL(CART_PATH);
    const notice = page.getByRole('alert').filter({ hasText: PRODUCT_MISSING });
    await expect(notice).toHaveText(PRODUCT_MISSING);
    const heading = emptyBag(page).getByRole('heading', { name: EMPTY_BAG });
    await expect(heading).toBeVisible();
    expect(await precedes(notice, heading)).toBe(true);
    await expect(line(page)).toHaveCount(0);
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await expect(page.getByText(`"${MESSAGE}"`)).toHaveCount(0);
    await showUrl(page, demo, 'Tab A after Save');
    await demo.highlight(notice, 'Notice above the empty bag');
    await demo.highlight(emptyBag(page), `${EMPTY_BAG}: no "${ITEM_NAME}" line`);
  });
});
