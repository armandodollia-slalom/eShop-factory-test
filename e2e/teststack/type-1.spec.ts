import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// TYPE-1: the product page shows the product's category.
// Scenario `type-1` (.factory/stack/scenarios/type-1) is the default demo catalog.
// The API cases TC-TYPE-1-01 to 04 are functional tests (tests/Catalog.FunctionalTests/ProductCategoryTests.cs).
test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  loadScenario('type-1');
});

const meta = (page: Page) => page.locator('p.item-desc + dl.item-meta');

function styleOf(locator: Locator) {
  return locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, fontSize: s.fontSize, fontWeight: s.fontWeight };
  });
}

test('TC-TYPE-1-05 product page of item 1 shows Category Footwear right after Brand, in the same style', async ({ page, demo }) => {
  await test.step('open /item/1 as a visitor', async () => {
    await page.goto(`${BASE_URL}/item/1`);
    await expect(page.getByRole('heading', { name: 'Wanderer Black Hiking Boots', level: 1 })).toBeVisible();
    await demo.caption(`Opened ${page.url()} (not signed in)`);
  });
  await test.step('details list reads Brand Daybird, Category Footwear in that order and style', async () => {
    const entries = meta(page).locator('> *');
    await expect(entries).toHaveCount(4);
    expect(await entries.evaluateAll((els) => els.map((el) => el.tagName.toLowerCase()))).toEqual(['dt', 'dd', 'dt', 'dd']);
    await expect(entries).toHaveText(['Brand', 'Daybird', 'Category', 'Footwear']);

    const brandDt = meta(page).locator('dt').nth(0);
    const categoryDt = meta(page).locator('dt').nth(1);
    const brandDd = meta(page).locator('dd').nth(0);
    const categoryDd = meta(page).locator('dd').nth(1);
    await expect(categoryDt).toBeVisible();
    await expect(categoryDd).toBeVisible();
    expect(await styleOf(categoryDt)).toEqual(await styleOf(brandDt));
    expect(await styleOf(categoryDd)).toEqual(await styleOf(brandDd));
    await demo.highlight(meta(page), 'Brand Daybird, then Category Footwear in the same style');
  });
});

test('TC-TYPE-1-06 category on the product page is the name the type filter shows for the product', async ({ page, demo }) => {
  const navigationItems = [
    'Adventurer GPS Watch',
    'Astro GPS Navigator',
    'Compass Pro A-320 Professional Compass',
    'Expedition 200 GPS Navigator',
    'Explorer Biking Computer',
    'Pathfinder GPS Watch',
    'Pathfinder Portable GPS',
    'Pulse Recon Tactical GPS Watch',
    'TrailSeeker GPS Watch',
    'TrailTracker GPS Watch',
    'VenturePro GPS Watch',
  ];
  test.setTimeout(60_000);
  const typeGroup = page.locator('.catalog-search-group').filter({ has: page.getByRole('heading', { name: 'Type', exact: true }) });
  const navigationTag = typeGroup.locator('a.catalog-search-tag').filter({ has: page.getByText('Navigation', { exact: true }) });
  let tagLabel = '';

  await test.step('open the catalog root /', async () => {
    await page.goto(BASE_URL!);
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
  });
  await test.step('click the Navigation tag in the Type filter', async () => {
    await expect(navigationTag).toHaveCount(1);
    tagLabel = (await navigationTag.locator('span').first().innerText()).trim();
    expect(tagLabel).toBe('Navigation');
    await demo.highlight(navigationTag, 'Type filter: click Navigation');
    await demo.caption('');
    await navigationTag.click();
    const cards = page.locator('.catalog-items .catalog-product');
    const assertFiltered = async () => {
      await expect(page).toHaveURL(/[?&]type=7(&|$)/);
      await expect(navigationTag).toHaveClass(/(^|\s)active(\s|$)/);
      await expect(typeGroup.locator('a.catalog-search-tag.active')).toHaveText(/^\s*Navigation\s*11\s*$/);
      await expect(cards).toHaveCount(9);
    };
    await assertFiltered();
    const names = (await cards.locator('.name').allInnerTexts()).map((n) => n.trim());
    for (const name of names) expect(navigationItems).toContain(name);
    expect(names).toContain('Adventurer GPS Watch');

    // Blazor's enhanced navigation detaches Playwright's overlay layer, which is only rebuilt on a new
    // document: reload the filtered URL (state is in the query string) so captions and highlights show.
    await page.reload();
    await assertFiltered();
    expect((await cards.locator('.name').allInnerTexts()).map((n) => n.trim())).toEqual(names);
    await page.waitForLoadState('networkidle');

    const filtered = new URL(page.url());
    const filteredPath = `${filtered.pathname}${filtered.search}`;
    await demo.caption(`Filtered: ${filteredPath} - ${names.length} cards`);
    await demo.highlight(navigationTag, `Navigation active at ${filteredPath}`);
    // One frame per row of three, so every one of the 9 cards is in view in some frame.
    for (let row = 0; row < 3; row++) {
      const first = row * 3;
      await demo.caption(names.slice(first, first + 3).join(' / '));
      await demo.highlight(cards.nth(first + 2), `Navigation cards ${first + 1}-${first + 3} of 9`, 1500);
    }
  });
  await test.step('click Adventurer GPS Watch in the filtered list', async () => {
    const card = page.locator('.catalog-items .catalog-product').filter({ has: page.getByText('Adventurer GPS Watch', { exact: true }) });
    await demo.highlight(card, 'Click Adventurer GPS Watch');
    await demo.caption('');
    await card.click();
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}/item/99$`));
    await expect(page.getByRole('heading', { name: 'Adventurer GPS Watch', level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await demo.caption(`Opened ${page.url()}`);
    const category = meta(page).locator('dt', { hasText: /^Category$/ }).locator('xpath=following-sibling::dd[1]');
    await expect(category).toHaveText('Navigation');
    expect((await category.innerText()).trim()).toBe(tagLabel);
    await demo.highlight(meta(page), `Category ${tagLabel} at /item/99, the label of the clicked type tag`);
  });
});

test('TC-TYPE-1-07 rest of the product page is unchanged for a signed-in shopper', async ({ page, demo }) => {
  test.setTimeout(60_000);
  await test.step('sign in as alice', async () => {
    await page.goto(BASE_URL!);
    await page.getByLabel('Sign in').click();
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await page.getByPlaceholder('Username').fill('alice');
    await page.getByPlaceholder('Password').fill('Pass123$');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'Ready for a new adventure?' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await demo.caption('Logged in with username alice / Pass123$');
    await demo.highlight(page.getByRole('button', { name: 'Account' }), 'Signed in as alice');
  });
  await test.step('open /item/1', async () => {
    await page.goto(`${BASE_URL}/item/1`);
    const title = page.locator('.eshop-hero-intro h1');
    await expect(title).toHaveText('Wanderer Black Hiking Boots');
    await page.waitForLoadState('networkidle');
    const opened = `${new URL(page.url()).pathname} as alice`;
    await demo.caption(`Opened ${page.url()} as alice`);
    await demo.highlight(page.getByRole('button', { name: 'Account' }), 'Still signed in as alice');

    await expect(page.locator('.eshop-hero-intro p')).toHaveText('Daybird');
    await expect(page).toHaveTitle('Wanderer Black Hiking Boots | AdventureWorks');
    const tabTitle = await page.title();
    await demo.caption(`${opened} - tab title: ${tabTitle}`);
    await demo.highlight(page.locator('.eshop-hero-intro'), `Title and subtitle Daybird; tab "${tabTitle}"`);

    const img = page.locator('img.item-media-img');
    await expect(img).toHaveAttribute('alt', 'Wanderer Black Hiking Boots');
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    await demo.caption(`${opened} - picture naturalWidth ${naturalWidth}px`);
    await demo.highlight(img, `Picture loaded, naturalWidth ${naturalWidth}px`);
    await demo.caption(`${opened}`);

    const desc = page.locator('p.item-desc');
    expect((await desc.innerText()).trim().startsWith(
      "Daybird's Wanderer Hiking Boots in sleek black are perfect for all your outdoor adventures.",
    )).toBe(true);
    const brandValue = meta(page).locator('dt', { hasText: /^Brand$/ }).locator('xpath=following-sibling::dd[1]');
    await expect(brandValue).toHaveText('Daybird');
    await demo.highlight(page.locator('.item-buy'), 'Description, Brand Daybird, price and button');

    await expect(page.locator('form.add-to-cart .price')).toHaveText('$109.99');
    const addButton = page.locator('form.add-to-cart button[type="submit"]', { hasText: 'Add to shopping bag' });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
    await demo.highlight(page.locator('form.add-to-cart'), '$109.99 and Add to shopping bag');

    const section = page.locator('section.item-brand-mates');
    await expect(page.getByRole('heading', { name: 'More from Daybird' })).toBeVisible();
    const cards = section.locator('.catalog-product');
    await expect(cards).toHaveCount(4);
    await expect(section.locator('.catalog-product .name').filter({ hasText: /^Wanderer Black Hiking Boots$/ })).toHaveCount(0);
    await demo.highlight(section, 'More from Daybird with four other products');
  });
});
