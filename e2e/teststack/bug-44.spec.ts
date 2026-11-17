import { Page } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-44: on /checkout the required-field messages for Address and Zip code (under the field and in the
// validation summary) name the visible labels "Address" and "Zip code", not the properties Street and ZipCode.
// Scenario `bug-44` (.factory/stack/scenarios/bug-44): seeded user bob, empty basket, no orders. It is reloaded
// before every case because each case adds the backpack to bob's bag and TC-BUG-44-07 places an order.
// The narrated highlights (about 2.5 s each) push the longer cases past Playwright's 30 s default.
test.describe.configure({ mode: 'serial', timeout: 90_000 });

const USER = 'bob';
const PASSWORD = 'Pass123$';
const ITEM_ID = 7;
const ITEM_NAME = 'Explorer 45L Backpack';
const ITEM_TOTAL = '$149.99';
const CHECKOUT_PATH = /\/checkout$/;
const ORDERS_PATH = /\/user\/orders$/;

const ADDRESS_REQUIRED = 'The Address field is required.';
const CITY_REQUIRED = 'The City field is required.';
const STATE_REQUIRED = 'The State field is required.';
const ZIP_REQUIRED = 'The Zip code field is required.';
const COUNTRY_REQUIRED = 'The Country field is required.';

test.beforeEach(() => {
  loadScenario('bug-44');
});

/** The <label> that wraps a checkout input (its visible caption, input and ValidationMessage). */
const fieldLabel = (page: Page, property: string) =>
  page.locator('.checkout label').filter({ has: page.locator(`input[name="Info.${property}"]`) });
const field = (page: Page, property: string) => fieldLabel(page, property).locator('input');
const fieldMessage = (page: Page, property: string) => fieldLabel(page, property).locator('.validation-message');
const summary = (page: Page) => page.locator('ul.validation-errors');
const summaryItems = (page: Page) => summary(page).locator('li');
const placeOrder = (page: Page) => page.getByRole('button', { name: 'Place order', exact: true });

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

async function addBackpackAndOpenCheckout(page: Page, demo: Demo) {
  await test.step(`open the "${ITEM_NAME}" item page and click "Add to shopping bag"`, async () => {
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
    await page.getByRole('button', { name: 'Add to shopping bag' }).click();
    await expect(page.locator('.in-cart').getByRole('link', { name: 'shopping bag' })).toBeVisible();
  });
  await test.step('navigate to /checkout', async () => {
    await page.goto(`${BASE_URL}/checkout`);
    await expect(page).toHaveURL(CHECKOUT_PATH);
    await expect(placeOrder(page)).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
  });
}

async function clearFields(page: Page, properties: string[]) {
  for (const property of properties) {
    await field(page, property).fill('');
    await expect(field(page, property)).toHaveValue('');
  }
}

// Blazor's enhanced form post and navigation merge the DOM and drop Playwright's overlay host (<x-pw-glass>),
// which Playwright re-attaches only on a new document, so demo.caption draws nothing after "Place order".
// When the host is gone, draw the same caption in the page once streaming has finished.
async function showUrlAfterPlaceOrder(page: Page, demo: Demo) {
  await page.waitForLoadState('networkidle');
  const text = `After Place order: ${page.url()}`;
  await demo.caption(text);
  if ((await page.locator('x-pw-glass').count()) > 0) return;
  await page.evaluate(caption => {
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

async function clearAllAndSubmit(page: Page, demo: Demo) {
  await test.step('clear the Address, City, State, Zip code and Country inputs', async () => {
    await clearFields(page, ['Street', 'City', 'State', 'ZipCode', 'Country']);
    await demo.highlight(page.locator('.checkout .form-section').first(), 'All five address fields empty');
  });
  await test.step('click "Place order"', async () => {
    await placeOrder(page).click();
    await expect(summaryItems(page).first()).toBeVisible();
    await showUrlAfterPlaceOrder(page, demo);
  });
}

test('TC-BUG-44-01 empty Address shows "The Address field is required." under Address', async ({ page, demo }) => {
  await signInAsBob(page);
  await addBackpackAndOpenCheckout(page, demo);
  await clearAllAndSubmit(page, demo);
  await test.step('the message under Address names "Address", nothing names "Street", and the page stays on /checkout', async () => {
    await expect(fieldMessage(page, 'Street')).toHaveText(ADDRESS_REQUIRED, { useInnerText: true });
    await expect(fieldMessage(page, 'Street')).toHaveCount(1);
    await expect(page.getByText('The Street field is required.')).toHaveCount(0);
    await expect(page.locator('.validation-message').filter({ hasText: 'Street' })).toHaveCount(0);
    await expect(page).toHaveURL(CHECKOUT_PATH);
    await demo.highlight(fieldLabel(page, 'Street'), `Address: "${ADDRESS_REQUIRED}" (no "Street")`);
  });
});

test('TC-BUG-44-02 empty Zip code shows "The Zip code field is required." under Zip code', async ({ page, demo }) => {
  await signInAsBob(page);
  await addBackpackAndOpenCheckout(page, demo);
  await clearAllAndSubmit(page, demo);
  await test.step('the message under Zip code names "Zip code", nothing names "ZipCode", and the page stays on /checkout', async () => {
    await expect(fieldMessage(page, 'ZipCode')).toHaveText(ZIP_REQUIRED, { useInnerText: true });
    await expect(fieldMessage(page, 'ZipCode')).toHaveCount(1);
    await expect(page.getByText('The ZipCode field is required.')).toHaveCount(0);
    await expect(page.locator('.validation-message').filter({ hasText: 'ZipCode' })).toHaveCount(0);
    await expect(page).toHaveURL(CHECKOUT_PATH);
    await demo.highlight(fieldLabel(page, 'ZipCode'), `Zip code: "${ZIP_REQUIRED}" (no "ZipCode")`);
  });
});

test('TC-BUG-44-03 empty City, State and Country keep their unchanged required messages', async ({ page, demo }) => {
  await signInAsBob(page);
  await addBackpackAndOpenCheckout(page, demo);
  await clearAllAndSubmit(page, demo);
  await test.step('City, State and Country show their unchanged required messages', async () => {
    await expect(fieldMessage(page, 'City')).toHaveText(CITY_REQUIRED, { useInnerText: true });
    await expect(fieldMessage(page, 'State')).toHaveText(STATE_REQUIRED, { useInnerText: true });
    await expect(fieldMessage(page, 'Country')).toHaveText(COUNTRY_REQUIRED, { useInnerText: true });
    await demo.highlight(fieldLabel(page, 'City'), `City: "${CITY_REQUIRED}"`);
    await demo.highlight(fieldLabel(page, 'State'), `State: "${STATE_REQUIRED}"`);
    await demo.highlight(fieldLabel(page, 'Country'), `Country: "${COUNTRY_REQUIRED}"`);
  });
});

test('TC-BUG-44-04 the validation summary next to Place order lists the five messages with the visible names', async ({ page, demo }) => {
  await signInAsBob(page);
  await addBackpackAndOpenCheckout(page, demo);
  await clearAllAndSubmit(page, demo);
  await test.step('the summary lists exactly the five messages, none naming "Street" or "ZipCode"', async () => {
    await expect(summaryItems(page)).toHaveCount(5);
    const texts = (await summaryItems(page).allInnerTexts()).map(t => t.trim()).sort();
    expect(texts).toEqual([ADDRESS_REQUIRED, CITY_REQUIRED, STATE_REQUIRED, ZIP_REQUIRED, COUNTRY_REQUIRED].sort());
    await expect(summaryItems(page).filter({ hasText: 'Street' })).toHaveCount(0);
    await expect(summaryItems(page).filter({ hasText: 'ZipCode' })).toHaveCount(0);
    await demo.highlight(summary(page), 'Summary: Address, City, State, Zip code, Country');
  });
});

test('TC-BUG-44-05 submitting with every address field empty places no order', async ({ page, demo }) => {
  await signInAsBob(page);
  await addBackpackAndOpenCheckout(page, demo);
  await clearAllAndSubmit(page, demo);
  await test.step('the browser is still on /checkout', async () => {
    await expect(page).toHaveURL(CHECKOUT_PATH);
    await demo.highlight(placeOrder(page), `Still on ${new URL(page.url()).pathname}`);
  });
  await test.step('navigate to /user/orders: "No orders yet" and no order rows', async () => {
    await page.goto(`${BASE_URL}/user/orders`);
    await expect(page).toHaveURL(ORDERS_PATH);
    const empty = page.locator('.orders-empty');
    await expect(empty.getByRole('heading', { level: 2, name: 'No orders yet', exact: true })).toBeVisible();
    await expect(page.locator('.orders-list')).toHaveCount(0);
    await expect(page.locator('.order-number')).toHaveCount(0);
    await demo.caption(`Opened ${page.url()}`);
    await demo.highlight(empty, 'No orders yet: no order was placed');
  });
  await test.step(`navigate to /cart: "${ITEM_NAME}" is still there with quantity 1`, async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page.getByRole('heading', { name: 'Shopping bag', exact: true })).toBeVisible();
    const items = page.locator('.cart-item');
    await expect(items).toHaveCount(1);
    await expect(items.locator('.name')).toHaveText(ITEM_NAME);
    await expect(page.getByLabel(`Quantity of ${ITEM_NAME}`, { exact: true })).toHaveValue('1');
    await demo.caption(`Opened ${page.url()}`);
    await demo.highlight(items.first(), `${ITEM_NAME}, quantity 1, still in the bag`);
  });
});

test('TC-BUG-44-06 only the empty fields show a message when Address and Zip code alone are cleared', async ({ page, demo }) => {
  await signInAsBob(page);
  await addBackpackAndOpenCheckout(page, demo);
  await test.step('fill City "Seattle", State "WA", Country "USA"; clear Address and Zip code', async () => {
    await field(page, 'City').fill('Seattle');
    await field(page, 'State').fill('WA');
    await field(page, 'Country').fill('USA');
    await clearFields(page, ['Street', 'ZipCode']);
    await expect(field(page, 'City')).toHaveValue('Seattle');
    await expect(field(page, 'State')).toHaveValue('WA');
    await expect(field(page, 'Country')).toHaveValue('USA');
    await demo.highlight(page.locator('.checkout .form-section').first(), 'Address and Zip code empty; City, State, Country filled');
  });
  await test.step('click "Place order"', async () => {
    await placeOrder(page).click();
    await expect(summaryItems(page).first()).toBeVisible();
    await showUrlAfterPlaceOrder(page, demo);
  });
  await test.step('only Address and Zip code show messages, in the fields and in the summary', async () => {
    await expect(fieldMessage(page, 'Street')).toHaveText(ADDRESS_REQUIRED, { useInnerText: true });
    await expect(fieldMessage(page, 'ZipCode')).toHaveText(ZIP_REQUIRED, { useInnerText: true });
    await expect(fieldMessage(page, 'City')).toHaveCount(0);
    await expect(fieldMessage(page, 'State')).toHaveCount(0);
    await expect(fieldMessage(page, 'Country')).toHaveCount(0);
    await expect(summaryItems(page)).toHaveCount(2);
    const texts = (await summaryItems(page).allInnerTexts()).map(t => t.trim()).sort();
    expect(texts).toEqual([ADDRESS_REQUIRED, ZIP_REQUIRED].sort());
    await expect(page).toHaveURL(CHECKOUT_PATH);
    await demo.highlight(fieldLabel(page, 'Street'), `Address: "${ADDRESS_REQUIRED}"`);
    await demo.highlight(fieldLabel(page, 'ZipCode'), `Zip code: "${ZIP_REQUIRED}"`);
    await demo.absent(fieldLabel(page, 'City'), 'City: no message');
    await demo.absent(fieldLabel(page, 'State'), 'State: no message');
    await demo.absent(fieldLabel(page, 'Country'), 'Country: no message');
    await demo.highlight(summary(page), 'Summary: only Address and Zip code');
  });
});

test('TC-BUG-44-07 with every address field filled, Place order places the order', async ({ page, demo }) => {
  await signInAsBob(page);
  await addBackpackAndOpenCheckout(page, demo);
  await test.step('set Address "15703 NE 61st Ct", City "Redmond", State "WA", Zip code "98052", Country "U.S."', async () => {
    await field(page, 'Street').fill('15703 NE 61st Ct');
    await field(page, 'City').fill('Redmond');
    await field(page, 'State').fill('WA');
    await field(page, 'ZipCode').fill('98052');
    await field(page, 'Country').fill('U.S.');
    await demo.highlight(page.locator('.checkout .form-section').first(), 'Every address field filled');
  });
  await test.step('click "Place order": no validation message, browser goes to /user/orders', async () => {
    await placeOrder(page).click();
    await expect(page).toHaveURL(ORDERS_PATH);
    await expect(page.getByRole('heading', { name: 'My orders', exact: true })).toBeVisible();
    await expect(page.locator('.validation-message')).toHaveCount(0);
    await expect(summaryItems(page)).toHaveCount(0);
    await showUrlAfterPlaceOrder(page, demo);
  });
  await test.step(`the orders page lists exactly one order for ${USER} totalling ${ITEM_TOTAL}`, async () => {
    const list = page.locator('.orders-list');
    await expect(list).toBeVisible();
    await expect(page.locator('.order-number')).toHaveCount(1);
    await expect(page.locator('.order-total')).toHaveText(ITEM_TOTAL);
    await demo.highlight(list, `One order, total ${ITEM_TOTAL}`);
  });
  await test.step('navigate to /cart: the shopping bag is empty', async () => {
    await page.goto(`${BASE_URL}/cart`);
    const empty = page.locator('.cart-empty');
    await expect(empty.getByRole('heading', { name: 'Your shopping bag is empty' })).toBeVisible();
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await demo.caption(`Opened ${page.url()}`);
    await demo.highlight(empty, 'Shopping bag is empty after the order');
  });
});
