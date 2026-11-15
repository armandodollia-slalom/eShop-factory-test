import type { Page } from '@playwright/test';
import { test, expect, type Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// BUG-37: /item/0 and /item/-1 answer exactly as an unknown id (/item/999999) does: 404 and the "Not found" page.
// Scenario `bug-37` (.factory/stack/scenarios/bug-37): the default catalog, ids 1 to 101; item 1 is
// "Wanderer Black Hiking Boots" by Daybird at 109.99. Every case runs as an anonymous visitor.
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('bug-37');
});

const NOT_FOUND_TITLE = 'Not found';
const NOT_FOUND_MESSAGE = "Sorry, we couldn't find any such product.";
const BACK_LINK_TEXT = 'Back to catalog';
const SERVER_ERROR_TEXT = 'Internal Server Error';

/** Opens /item/{id} and checks the same "Not found" page, value by value, for every not-found case. */
async function expectNotFoundPage(page: Page, demo: Demo, id: number) {
  const response = await test.step(`open /item/${id}`, () => page.goto(`${BASE_URL}/item/${id}`));

  await test.step(`/item/${id} answers 404 with the Not found page`, async () => {
    expect(response?.status()).toBe(404);

    const title = page.locator('.eshop-hero-intro h1');
    await expect(title).toHaveText(NOT_FOUND_TITLE);
    await demo.highlight(title, `/item/${id}: title "${NOT_FOUND_TITLE}" (status 404)`);

    const message = page.locator('.item-page .item-notfound');
    await expect(message).toHaveText(NOT_FOUND_MESSAGE);
    await demo.highlight(message, `/item/${id}: "${NOT_FOUND_MESSAGE}"`);

    const back = page.locator('.item-page a.item-back');
    await expect(back).toBeVisible();
    await expect(back).toHaveText(BACK_LINK_TEXT);
    await demo.highlight(back, `/item/${id}: "${BACK_LINK_TEXT}" link`);
  });

  await test.step(`/item/${id} shows no product details, no add-to-cart form and no server error`, async () => {
    await expect(page.locator('.item-details')).toHaveCount(0);
    await expect(page.locator('form.add-to-cart')).toHaveCount(0);
    await expect(page.getByText(SERVER_ERROR_TEXT)).toHaveCount(0);
    await demo.absent(page.locator('.item-page'), `/item/${id}: no product details, add-to-cart form or "${SERVER_ERROR_TEXT}"`);
  });
}

test('TC-BUG-37-01 unknown product id 999999 answers 404 with the Not found page', async ({ page, demo }) => {
  await demo.chapter('Unknown product id 999999', 'The reference answer: 404 and the Not found page');
  await expectNotFoundPage(page, demo, 999999);

  // The Not found page's own route exists only for the router; opened directly it must not answer 200.
  const direct = await test.step('open /item/not-found directly', () => page.goto(`${BASE_URL}/item/not-found`));
  await test.step('/item/not-found answers 404, never a normal 200 page', async () => {
    expect(direct?.status()).toBe(404);
    await expect(page.locator('form.add-to-cart')).toHaveCount(0);
    await expect(page.getByText(SERVER_ERROR_TEXT)).toHaveCount(0);
    await demo.caption('/item/not-found opened directly: status 404');
  });
});

test('TC-BUG-37-02 product id 0 answers 404 with the same Not found page', async ({ page, demo }) => {
  await demo.chapter('Product id 0', 'Answers exactly as /item/999999 does: 404, not 500');
  await expectNotFoundPage(page, demo, 0);
});

test('TC-BUG-37-03 product id -1 answers 404 with the same Not found page', async ({ page, demo }) => {
  await demo.chapter('Product id -1', 'Answers exactly as /item/999999 does: 404, not 500');
  await expectNotFoundPage(page, demo, -1);
});

test('TC-BUG-37-04 existing product id 1 still answers 200 with its product page', async ({ page, demo }) => {
  const ITEM_ID = 1;
  const ITEM_NAME = 'Wanderer Black Hiking Boots';
  const ITEM_BRAND = 'Daybird';
  const ITEM_PRICE = '$109.99';

  await demo.chapter('Existing product id 1', 'The first catalog id still opens its product page');
  const response = await test.step(`open /item/${ITEM_ID}`, () => page.goto(`${BASE_URL}/item/${ITEM_ID}`));

  await test.step(`/item/${ITEM_ID} answers 200 with ${ITEM_NAME}`, async () => {
    expect(response?.status()).toBe(200);

    const title = page.locator('.eshop-hero-intro h1');
    await expect(title).toHaveText(ITEM_NAME);
    await demo.highlight(title, `/item/${ITEM_ID}: title "${ITEM_NAME}" (status 200)`);

    const details = page.locator('.item-details');
    await expect(details).toBeVisible();
    const brand = page.locator('.item-meta dd');
    await expect(brand).toHaveText(ITEM_BRAND);
    await demo.highlight(brand, `brand ${ITEM_BRAND}`);

    const price = page.locator('form.add-to-cart .price');
    await expect(price).toHaveText(ITEM_PRICE);
    await demo.highlight(price, `price ${ITEM_PRICE}`);
  });

  await test.step(`/item/${ITEM_ID} shows no Not found page`, async () => {
    await expect(page.locator('.item-notfound')).toHaveCount(0);
    await expect(page.locator('h1', { hasText: NOT_FOUND_TITLE })).toHaveCount(0);
    await demo.absent(page.locator('.item-details'), `/item/${ITEM_ID}: no "${NOT_FOUND_TITLE}" message`);
  });
});
