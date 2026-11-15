import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// STORE-1: the footer link "Store locator", the /stores page with its fixed list of four stores and the City filter
// (trimmed, case-insensitive city prefix) carried in the URL as ?city=<text>.
// Scenario `store-1` (.factory/stack/scenarios/store-1): the default seed only; every case is an anonymous shopper.
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('store-1');
});

type Store = { name: string; address: string; city: string; hours: string };

const SEATTLE: Store = { name: 'AdventureWorks Seattle', address: '1200 Pine St', city: 'Seattle', hours: 'Mon–Sat 9:00–20:00' };
const REDMOND: Store = { name: 'AdventureWorks Redmond', address: '15700 NE 61st Ct', city: 'Redmond', hours: 'Mon–Fri 10:00–19:00' };
const PORTLAND: Store = { name: 'AdventureWorks Portland', address: '800 SW Broadway', city: 'Portland', hours: 'Mon–Sun 10:00–18:00' };
const DENVER: Store = { name: 'AdventureWorks Denver', address: '1600 16th St', city: 'Denver', hours: 'Tue–Sun 9:00–17:00' };
const ALL_STORES = [SEATTLE, REDMOND, PORTLAND, DENVER];

const heading = (page: Page) => page.getByRole('heading', { level: 1, name: 'Store locator' });
const storeItems = (page: Page) => page.locator('.stores-list .stores-item');
const cityBox = (page: Page) => page.getByLabel('City');
const findStores = (page: Page) => page.getByRole('button', { name: 'Find stores' });
const searchForm = (page: Page) => page.locator('form.stores-search');
const noStoresMessage = (page: Page) => page.getByText('No stores in');

/** Exactly these stores are listed, in this order, each with its name, street address, city and hours. */
async function expectListedStores(page: Page, stores: Store[]) {
  const items = storeItems(page);
  await expect(items).toHaveCount(stores.length);
  await expect(items.locator('.store-name')).toHaveText(stores.map((s) => s.name));
  await expect(items.locator('.store-address')).toHaveText(stores.map((s) => s.address));
  await expect(items.locator('.store-city')).toHaveText(stores.map((s) => s.city));
  await expect(items.locator('.store-hours')).toHaveText(stores.map((s) => s.hours));
}

/** None of the given store names appears anywhere on the page. */
async function expectStoresAbsent(page: Page, stores: Store[]) {
  for (const store of stores) {
    await expect(page.getByText(store.name, { exact: true })).toHaveCount(0);
  }
}

/** The no-match paragraph reads exactly `No stores in "<text>".` and no store is listed. */
async function expectNoStoresMessage(page: Page, text: string): Promise<Locator> {
  const message = page.locator('p.stores-empty');
  await expect(message).toHaveText(`No stores in "${text}".`);
  expect(await message.textContent()).toBe(`No stores in "${text}".`);
  await expect(storeItems(page)).toHaveCount(0);
  return message;
}

async function searchCity(page: Page, demo: { highlight: (l: Locator, label?: string) => Promise<void> }, text: string) {
  await page.goto(`${BASE_URL}/stores`);
  await expect(heading(page)).toBeVisible();
  await cityBox(page).fill(text);
  await expect(cityBox(page)).toHaveValue(text);
  await demo.highlight(searchForm(page), `City filled with "${text}"`);
  await findStores(page).click();
}

test('TC-STORE-1-01 footer link Store locator opens /stores with the heading and all four stores in order', async ({ page, demo }) => {
  await test.step('open / (the catalog home page)', async () => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
  });
  await test.step('click Store locator in the site footer', async () => {
    const link = page.locator('footer').getByRole('link', { name: 'Store locator', exact: true });
    await demo.highlight(link, 'Footer link Store locator');
    await link.click();
  });
  await test.step('the store locator lists the four stores in order', async () => {
    await expect(page).toHaveURL((u) => u.pathname === '/stores' && !u.searchParams.has('city'));
    await expect(heading(page)).toBeVisible();
    await expect(heading(page)).toHaveText('Store locator');
    await demo.highlight(heading(page), 'Heading Store locator on /stores');
    await expectListedStores(page, ALL_STORES);
    await expect(noStoresMessage(page)).toHaveCount(0);
    await demo.highlight(page.locator('.stores-list'), 'Seattle, Redmond, Portland, Denver in order');
  });
});

test('TC-STORE-1-02 footer link Store locator on a catalog item page also opens /stores', async ({ page, demo }) => {
  await test.step('open /item/99', async () => {
    await page.goto(`${BASE_URL}/item/99`);
    await expect(page.getByRole('heading', { name: 'Adventurer GPS Watch' })).toBeVisible();
  });
  await test.step('click Store locator in the site footer', async () => {
    const link = page.locator('footer').getByRole('link', { name: 'Store locator', exact: true });
    await demo.highlight(link, 'Footer link Store locator on /item/99');
    await link.click();
  });
  await test.step('the store locator opens at /stores with four stores', async () => {
    await expect(page).toHaveURL((u) => u.pathname === '/stores');
    await expect(heading(page)).toBeVisible();
    const items = storeItems(page);
    await expect(items).toHaveCount(4);
    await expect(items.first().locator('.store-name')).toHaveText(SEATTLE.name);
    await expect(items.last().locator('.store-name')).toHaveText(DENVER.name);
    await demo.highlight(page.locator('.stores-list'), 'Four stores, Seattle first and Denver last');
  });
});

test('TC-STORE-1-03 typing red in City and pressing Find stores lists only AdventureWorks Redmond', async ({ page, demo }) => {
  await test.step('open /stores, fill City with red and click Find stores', async () => {
    await searchCity(page, demo, 'red');
  });
  await test.step('only Redmond is listed and the URL contains city=red', async () => {
    await expect(page).toHaveURL(/city=red/);
    await expectListedStores(page, [REDMOND]);
    await expectStoresAbsent(page, [SEATTLE, PORTLAND, DENVER]);
    await expect(noStoresMessage(page)).toHaveCount(0);
    await demo.highlight(storeItems(page), 'Only AdventureWorks Redmond (?city=red)');
  });
});

test('TC-STORE-1-04 opening /stores?city=PORT lists only AdventureWorks Portland', async ({ page, demo }) => {
  await test.step('open /stores?city=PORT', async () => {
    await page.goto(`${BASE_URL}/stores?city=PORT`);
  });
  await test.step('only Portland is listed', async () => {
    await expect(heading(page)).toHaveText('Store locator');
    await expectListedStores(page, [PORTLAND]);
    await expectStoresAbsent(page, [SEATTLE, REDMOND, DENVER]);
    await demo.highlight(storeItems(page), 'Only AdventureWorks Portland (?city=PORT)');
  });
});

test('TC-STORE-1-05 searching for Boston shows No stores in "Boston". and no store', async ({ page, demo }) => {
  await test.step('open /stores, fill City with Boston and click Find stores', async () => {
    await searchCity(page, demo, 'Boston');
  });
  await test.step('the no-match message is shown and no store is listed', async () => {
    await expect(page).toHaveURL(/city=Boston/);
    const message = await expectNoStoresMessage(page, 'Boston');
    await expectStoresAbsent(page, ALL_STORES);
    await demo.highlight(message, 'No stores in "Boston".');
    await demo.absent(searchForm(page), 'No store listed');
  });
});

test('TC-STORE-1-06 clearing City on /stores?city=red and pressing Find stores lists all four stores again', async ({ page, demo }) => {
  await test.step('open /stores?city=red', async () => {
    await page.goto(`${BASE_URL}/stores?city=red`);
    await expectListedStores(page, [REDMOND]);
    await demo.highlight(storeItems(page), 'Filtered to Redmond');
  });
  await test.step('clear City and click Find stores', async () => {
    await cityBox(page).fill('');
    await expect(cityBox(page)).toHaveValue('');
    await demo.highlight(searchForm(page), 'City cleared');
    await findStores(page).click();
  });
  await test.step('all four stores are listed in order', async () => {
    await expect(page).not.toHaveURL(/city=red/);
    await expectListedStores(page, ALL_STORES);
    await expect(noStoresMessage(page)).toHaveCount(0);
    await demo.highlight(page.locator('.stores-list'), 'All four stores listed again');
  });
});

test('TC-STORE-1-07 City text with surrounding spaces lists only AdventureWorks Denver', async ({ page, demo }) => {
  const paddedDen = '  den  ';
  await test.step('open /stores, fill City with "  den  " and click Find stores', async () => {
    expect(paddedDen).toHaveLength(7);
    await searchCity(page, demo, paddedDen);
  });
  await test.step('only Denver is listed', async () => {
    await expect(page).toHaveURL(/city=/);
    await expectListedStores(page, [DENVER]);
    await expect(noStoresMessage(page)).toHaveCount(0);
    await demo.highlight(storeItems(page), 'Only AdventureWorks Denver for "  den  "');
  });
});

test('TC-STORE-1-08 the no-match message shows the typed text trimmed', async ({ page, demo }) => {
  const paddedBoston = '  Boston  ';
  await test.step('open /stores, fill City with "  Boston  " and click Find stores', async () => {
    expect(paddedBoston).toHaveLength(10);
    await searchCity(page, demo, paddedBoston);
  });
  await test.step('the message echoes Boston without the spaces', async () => {
    await expect(page).toHaveURL(/city=/);
    const message = await expectNoStoresMessage(page, 'Boston');
    expect(await message.textContent()).not.toContain('No stores in "  Boston');
    await expect(page.locator('body')).not.toContainText('No stores in "  Boston');
    await expectStoresAbsent(page, ALL_STORES);
    await demo.highlight(message, 'No stores in "Boston". (trimmed)');
  });
});

test('TC-STORE-1-09 a text inside a city but not at its start (land) matches no store', async ({ page, demo }) => {
  await test.step('open /stores?city=land', async () => {
    await page.goto(`${BASE_URL}/stores?city=land`);
  });
  await test.step('the no-match message is shown and Portland is not listed', async () => {
    const message = await expectNoStoresMessage(page, 'land');
    await expectStoresAbsent(page, [PORTLAND]);
    await expectStoresAbsent(page, [SEATTLE, REDMOND, DENVER]);
    await demo.highlight(message, 'No stores in "land". (Portland not matched)');
  });
});

test('TC-STORE-1-10 the whole city name Seattle lists only AdventureWorks Seattle', async ({ page, demo }) => {
  await test.step('open /stores?city=Seattle', async () => {
    await page.goto(`${BASE_URL}/stores?city=Seattle`);
  });
  await test.step('only Seattle is listed', async () => {
    await expectListedStores(page, [SEATTLE]);
    await expect(noStoresMessage(page)).toHaveCount(0);
    await demo.highlight(storeItems(page), 'Only AdventureWorks Seattle (?city=Seattle)');
  });
});

test('TC-STORE-1-11 the text Seattles (one character past the city name) matches no store', async ({ page, demo }) => {
  await test.step('open /stores?city=Seattles', async () => {
    await page.goto(`${BASE_URL}/stores?city=Seattles`);
  });
  await test.step('the no-match message is shown and no store is listed', async () => {
    const message = await expectNoStoresMessage(page, 'Seattles');
    await expectStoresAbsent(page, ALL_STORES);
    await demo.highlight(message, 'No stores in "Seattles".');
  });
});

test('TC-STORE-1-12 opening /stores?city= lists all four stores', async ({ page, demo }) => {
  await test.step('open /stores?city=', async () => {
    await page.goto(`${BASE_URL}/stores?city=`);
  });
  await test.step('all four stores are listed in order, no message', async () => {
    await expectListedStores(page, ALL_STORES);
    await expect(noStoresMessage(page)).toHaveCount(0);
    await demo.highlight(page.locator('.stores-list'), 'All four stores for an empty city');
    await demo.absent(searchForm(page), 'No "No stores in" message');
  });
});
