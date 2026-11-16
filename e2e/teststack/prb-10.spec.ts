import { Locator, Page } from '@playwright/test';
import { test, expect, Demo } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// PRB-10: the header's "Shop all" link carries aria-current="page" on the catalog page only; its text, href and
// classes are otherwise unchanged. Scenario `prb-10` (.factory/stack/scenarios/prb-10): the default catalog and the
// seeded user alice (Pass123$) with an empty basket and no orders.
test.describe.configure({ mode: 'serial' });

const LINK_NAME = 'Shop all';
const ITEM_ID = 99;
const ITEM_NAME = 'Adventurer GPS Watch';

test.beforeAll(() => {
  loadScenario('prb-10');
});

/** The header's primary navigation. */
const primaryNav = (page: Page) => page.locator('header nav[aria-label="Primary"]');
/** The "Shop all" link inside the primary navigation. */
const shopAll = (page: Page) => primaryNav(page).getByRole('link', { name: LINK_NAME, exact: true });
/**
 * The "Shop all" link announced as the current page. Playwright's getByRole has no `current` option (an unknown
 * option is ignored and would match any state), so the role locator is intersected with aria-current="page".
 */
const shopAllCurrentPage = (page: Page) =>
  primaryNav(page).getByRole('link', { name: LINK_NAME }).and(page.locator('[aria-current="page"]'));

/**
 * Blazor's enhanced navigation patches the document and drops Playwright's overlay host (`x-pw-glass`), which
 * Playwright does not re-attach, so captions and highlights after an in-app click would not be drawn. Keep a
 * reference before the click (`clickInApp`) and put it back afterwards (`restoreOverlays`).
 */
async function clickInApp(page: Page, locator: Locator) {
  await page.evaluate(() => {
    (window as unknown as { __pwGlass: Element | null }).__pwGlass = document.querySelector('x-pw-glass');
  });
  await locator.click();
}

async function restoreOverlays(page: Page) {
  await page.evaluate(() => {
    const glass = (window as unknown as { __pwGlass?: HTMLElement | null }).__pwGlass;
    if (!glass || glass.isConnected) return;
    document.documentElement.appendChild(glass);
    glass.showPopover?.();
  });
}

/** aria-current as measured on the element: its value, or that the attribute is absent. */
async function ariaCurrentText(link: Locator) {
  const value = await link.getAttribute('aria-current');
  return value === null ? 'no aria-current (attribute absent)' : `aria-current="${value}"`;
}

/**
 * Scroll `locator` into view first, so the caption (drawn at the bottom of the viewport) stays on screen in the
 * highlight keyframe, then caption the page's URL and the measured state, and highlight the element.
 */
async function showState(page: Page, demo: Demo, locator: Locator, state: string, label: string, durationMs?: number) {
  await restoreOverlays(page);
  await locator.scrollIntoViewIfNeeded();
  await demo.caption(`${new URL(page.url()).pathname} -> Shop all: ${state}`);
  await demo.highlight(locator, label, durationMs);
}

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

test('TC-PRB-10-01 "Shop all" has aria-current="page" on the catalog page', async ({ page, demo }) => {
  await test.step('open the store home page /', async () => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('.catalog-product').first()).toBeVisible();
    await demo.caption(`Opened ${page.url()} (catalog)`);
  });
  await test.step('locate "Shop all" in the primary navigation: aria-current="page"', async () => {
    await expect(primaryNav(page).getByRole('link', { name: LINK_NAME })).toHaveCount(1);
    await expect(shopAll(page)).toHaveAttribute('aria-current', 'page');
    await expect(shopAllCurrentPage(page)).toHaveCount(1);
    await showState(page, demo, shopAll(page), await ariaCurrentText(shopAll(page)), 'Catalog: Shop all has aria-current="page"');
  });
});

test('TC-PRB-10-02 "Shop all" keeps its text, destination and is-current look on the catalog page', async ({ page, demo }) => {
  await test.step('open /', async () => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('.catalog-product').first()).toBeVisible();
    await demo.caption(`Opened ${page.url()} (catalog)`);
  });
  await test.step('read the link text, href, resolved URL and class', async () => {
    const link = shopAll(page);
    await expect(primaryNav(page).getByRole('link')).toHaveCount(1);
    expect(await link.innerText()).toBe(LINK_NAME);
    expect(await link.getAttribute('href')).toBe('');
    const webappRoot = `${new URL(BASE_URL).origin}/`;
    expect(await link.evaluate(a => (a as HTMLAnchorElement).href)).toBe(webappRoot);
    await expect(link).toHaveClass(/(^|\s)eshop-topnav-link(\s|$)/);
    await expect(link).toHaveClass(/(^|\s)is-current(\s|$)/);
    await showState(page, demo, link, `"${await link.innerText()}", href="" -> ${webappRoot}`, 'text and destination');
    await showState(page, demo, link, `class="${(await link.getAttribute('class'))?.trim()}"`, 'class: eshop-topnav-link is-current');
  });
});

test('TC-PRB-10-03 "Shop all" has no aria-current on a product page', async ({ page, demo }) => {
  await test.step(`open /item/${ITEM_ID} directly`, async () => {
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
    await demo.highlight(page.getByRole('heading', { name: ITEM_NAME }), `Product page: ${ITEM_NAME}`);
  });
  await test.step('locate "Shop all": no aria-current attribute', async () => {
    await expect(shopAll(page)).toHaveCount(1);
    expect(await shopAll(page).getAttribute('aria-current')).toBeNull();
    await expect(shopAllCurrentPage(page)).toHaveCount(0);
    await showState(page, demo, shopAll(page), await ariaCurrentText(shopAll(page)), 'Product page: Shop all has no aria-current');
  });
});

test('TC-PRB-10-04 "Shop all" has no aria-current on the shopping bag', async ({ page, demo }) => {
  await signInAsAlice(page);
  await test.step('open /cart', async () => {
    await page.goto(`${BASE_URL}/cart`);
    await expect(page).toHaveURL(/\/cart$/);
    expect(new URL(page.url()).pathname).toBe('/cart');
    await expect(page).toHaveTitle('Shopping Bag | AdventureWorks');
    await demo.caption(`Opened ${page.url()} (shopping bag)`);
  });
  await test.step('locate "Shop all": text "Shop all", no aria-current, no is-current', async () => {
    const link = shopAll(page);
    await expect(link).toHaveCount(1);
    expect(await link.innerText()).toBe(LINK_NAME);
    expect(await link.getAttribute('aria-current')).toBeNull();
    await expect(link).not.toHaveClass(/(^|\s)is-current(\s|$)/);
    await showState(page, demo, link, `"${await link.innerText()}", ${await ariaCurrentText(link)}, class="${(await link.getAttribute('class'))?.trim()}"`,
      'Shopping bag: Shop all, no aria-current, no is-current');
  });
});

test('TC-PRB-10-05 "Shop all" has no aria-current on My orders', async ({ page, demo }) => {
  await signInAsAlice(page);
  await test.step('open /user/orders', async () => {
    await page.goto(`${BASE_URL}/user/orders`);
    await expect(page).toHaveURL(/\/user\/orders$/);
    expect(new URL(page.url()).pathname).toBe('/user/orders');
    await expect(page.locator('.eshop-hero-intro h1')).toHaveText('My orders');
    await demo.caption(`Opened ${page.url()} (My orders)`);
  });
  await test.step('locate "Shop all": text "Shop all", no aria-current, no is-current', async () => {
    const link = shopAll(page);
    await expect(link).toHaveCount(1);
    expect(await link.innerText()).toBe(LINK_NAME);
    expect(await link.getAttribute('aria-current')).toBeNull();
    await expect(link).not.toHaveClass(/(^|\s)is-current(\s|$)/);
    await showState(page, demo, link, `"${await link.innerText()}", ${await ariaCurrentText(link)}, class="${(await link.getAttribute('class'))?.trim()}"`,
      'My orders: Shop all, no aria-current, no is-current');
  });
});

test('TC-PRB-10-06 "Shop all" keeps its text and destination and has no is-current look on a product page', async ({ page, demo }) => {
  await test.step(`open /item/${ITEM_ID}`, async () => {
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME })).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
  });
  await test.step('read the link text, href and class', async () => {
    const link = shopAll(page);
    expect(await link.innerText()).toBe(LINK_NAME);
    expect(await link.getAttribute('href')).toBe('');
    await expect(link).toHaveClass(/(^|\s)eshop-topnav-link(\s|$)/);
    await expect(link).not.toHaveClass(/(^|\s)is-current(\s|$)/);
    await showState(page, demo, link, `"${await link.innerText()}", href="", class="${(await link.getAttribute('class'))?.trim()}"`,
      'Product page: "Shop all", href="", no is-current');
  });
  await test.step('click "Shop all": the catalog at / is shown', async () => {
    await clickInApp(page, shopAll(page));
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
    await expect(page.locator('.catalog-product').first()).toBeVisible();
    await demo.pause(2000);
    // Enhanced navigation streams the catalog in, so a card can be replaced while it is being highlighted.
    await expect(async () => {
      const card = page.locator('.catalog-product').first();
      await restoreOverlays(page);
      await card.scrollIntoViewIfNeeded();
      await demo.caption(`After click: ${page.url()} (path ${new URL(page.url()).pathname})`);
      await demo.highlight(card, 'Catalog with product cards');
    }).toPass();
  });
});

test('TC-PRB-10-07 aria-current follows in-app navigation from the catalog to a product and back', async ({ page, demo }) => {
  // Two page loads plus the held post-navigation highlights the demo video must show exceed the default 30 s.
  test.slow();
  await test.step('open /', async () => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('.catalog-product').first()).toBeVisible();
    await demo.caption(`Opened ${page.url()} (catalog)`);
  });
  await test.step('check "Shop all": aria-current="page"', async () => {
    await expect(shopAll(page)).toHaveAttribute('aria-current', 'page');
    await showState(page, demo, shopAll(page), await ariaCurrentText(shopAll(page)), 'Catalog: aria-current="page"');
  });
  await test.step('click a product card on the catalog', async () => {
    const card = page.locator('.catalog-product').first();
    await demo.highlight(card, 'Click this product card');
    await clickInApp(page, card);
    await expect.poll(() => new URL(page.url()).pathname).toMatch(/^\/item\/\d+$/);
    await expect(page.locator('.eshop-hero-intro h1')).toBeVisible();
    await restoreOverlays(page);
    await demo.caption(`Now on ${page.url()}`);
    await demo.highlight(page.locator('.eshop-hero-intro h1'), `Product page ${new URL(page.url()).pathname}`);
  });
  await test.step('check "Shop all" again: no aria-current, no is-current', async () => {
    expect(new URL(page.url()).pathname).toMatch(/^\/item\/\d+$/);
    await expect(shopAll(page)).not.toHaveAttribute('aria-current');
    await expect(shopAll(page)).not.toHaveClass(/(^|\s)is-current(\s|$)/);
    await showState(page, demo, shopAll(page), `${await ariaCurrentText(shopAll(page))}, class="${(await shopAll(page).getAttribute('class'))?.trim()}"`,
      'Product page: no aria-current, no is-current', 4000);
  });
  await test.step('click "Shop all"', async () => {
    await clickInApp(page, shopAll(page));
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
    await expect(page.locator('.catalog-product').first()).toBeVisible();
    const hero = page.getByRole('heading', { name: 'Ready for a new adventure?' });
    await restoreOverlays(page);
    await hero.scrollIntoViewIfNeeded();
    await demo.caption(`Back on ${page.url()} (catalog)`);
    await demo.highlight(hero, `Back on ${new URL(page.url()).pathname}: the catalog`);
  });
  await test.step('check "Shop all" again: aria-current="page" and is-current', async () => {
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(shopAll(page)).toHaveAttribute('aria-current', 'page');
    await expect(shopAll(page)).toHaveClass(/(^|\s)is-current(\s|$)/);
    await showState(page, demo, shopAll(page), `${await ariaCurrentText(shopAll(page))}, class="${(await shopAll(page).getAttribute('class'))?.trim()}"`,
      'Catalog again: aria-current="page", is-current', 4000);
  });
});
