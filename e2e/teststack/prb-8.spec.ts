import { Locator, Page } from '@playwright/test';
import { test, expect } from '../demo';
import { BASE_URL } from './ports';
import { loadScenario } from './scenario';

// PRB-8: the footer's bottom row has a "Back to top" link as the last item of the Legal list; clicking it at the
// bottom of the catalog scrolls the same page back to its top. The rest of the footer is unchanged.
// Scenario `prb-8` (.factory/stack/scenarios/prb-8): the default catalog, browsed anonymously.
test.describe.configure({ mode: 'serial' });

const BACK_TO_TOP = 'Back to top';
const LEGAL_ITEMS = ['Privacy', 'Terms', 'Cookies', BACK_TO_TOP];
const ITEM_ID = 99;
const ITEM_NAME = 'Adventurer GPS Watch';

test.beforeAll(() => {
  loadScenario('prb-8');
});

const footer = (page: Page) => page.locator('footer.eshop-footer');
const footerBottom = (page: Page) => footer(page).locator('.eshop-footer-bottom');
const legalList = (page: Page) => footer(page).getByRole('list', { name: 'Legal', exact: true });
const backToTop = (page: Page) => footer(page).getByRole('link', { name: BACK_TO_TOP, exact: true });
const header = (page: Page) => page.locator('header.eshop-topbar');
const cardNames = (page: Page) => page.locator('.catalog-product .name');

/** Text and href attribute (null when absent) of every link in a region, in document order. */
async function linksOf(region: Locator) {
  return region.locator('a').evaluateAll(els => els.map(e => ({ text: (e.textContent ?? '').trim(), href: e.getAttribute('href') })));
}

async function scrollToBottom(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
}

test('TC-PRB-8-01 catalog page footer shows "Back to top" as the last legal link', async ({ page, demo }) => {
  await test.step('open / (the catalog page)', async () => {
    await page.goto(BASE_URL!);
    await expect(cardNames(page).first()).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
  });
  await test.step('locate the footer and its list "Legal"', async () => {
    await expect(legalList(page)).toHaveCount(1);
  });
  await test.step('the Legal list is Privacy, Terms, Cookies, Back to top in the footer bottom row', async () => {
    await expect(legalList(page).getByRole('listitem')).toHaveText(LEGAL_ITEMS);
    await expect(legalList(page).getByRole('listitem').nth(3).getByRole('link', { name: BACK_TO_TOP, exact: true })).toBeVisible();
    await expect(footerBottom(page).getByRole('list', { name: 'Legal', exact: true })).toHaveCount(1);
    await expect(footerBottom(page).locator('.eshop-footer-copy')).toHaveCount(1);
    await expect(page.getByRole('link', { name: BACK_TO_TOP, exact: true })).toHaveCount(1);
    await demo.highlight(footerBottom(page), 'Bottom row: copyright and Legal list');
    await demo.highlight(backToTop(page), 'Back to top: 4th item, after Cookies');
    await demo.caption('');
  });
});

test('TC-PRB-8-02 item page footer shows "Back to top" next to the legal links', async ({ page, demo }) => {
  await test.step(`open /item/${ITEM_ID}`, async () => {
    await page.goto(`${BASE_URL}/item/${ITEM_ID}`);
    await expect(page.getByRole('heading', { name: ITEM_NAME, exact: true })).toBeVisible();
    await demo.caption(`Opened ${page.url()}`);
    await demo.highlight(page.getByRole('heading', { name: ITEM_NAME, exact: true }), `Item page: ${ITEM_NAME}`);
  });
  await test.step('locate the footer list "Legal"', async () => {
    await expect(legalList(page)).toHaveCount(1);
  });
  await test.step('the Legal list ends with a visible "Back to top" linking to item/99#top', async () => {
    await expect(legalList(page).getByRole('listitem')).toHaveText(LEGAL_ITEMS);
    await expect(backToTop(page)).toBeVisible();
    await expect(backToTop(page)).toHaveAttribute('href', `item/${ITEM_ID}#top`);
    await demo.caption(`Back to top href = "${await backToTop(page).getAttribute('href')}"`);
    await demo.highlight(backToTop(page), `Back to top -> item/${ITEM_ID}#top`);
    await demo.caption('');
  });
});

test('TC-PRB-8-03 clicking "Back to top" at the bottom of the catalog scrolls to the top and shows the header on the same page', async ({ page, demo }) => {
  let firstCard = '';
  await test.step('open / and wait for the first catalog item card', async () => {
    await page.goto(BASE_URL!);
    await expect(cardNames(page).first()).toBeVisible();
    firstCard = (await cardNames(page).first().innerText()).trim();
    expect(firstCard).not.toBe('');
    await demo.caption(`Opened ${page.url()}; first card: ${firstCard}`);
  });
  await test.step('scroll to the bottom of the page; Back to top is in the viewport', async () => {
    await scrollToBottom(page);
    await expect(backToTop(page)).toBeInViewport();
    const y = await page.evaluate(() => window.scrollY);
    await demo.caption(`Scrolled to the bottom: scrollY = ${y}`);
    await demo.highlight(backToTop(page), 'Back to top at the bottom of the catalog');
  });
  await test.step('click the footer link "Back to top"', async () => {
    await backToTop(page).click();
  });
  await test.step('the page is at its top with the header visible, still on /', async () => {
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBe(0);
    await expect(header(page)).toBeInViewport();
    await expect(header(page).getByRole('link', { name: 'Shop all', exact: true })).toBeVisible();
    const url = new URL(page.url());
    expect(url.pathname).toBe('/');
    expect(url.search).toBe('');
    expect(['', '#top']).toContain(url.hash);
    await expect(cardNames(page).first()).toHaveText(firstCard);
    await demo.caption(`After click: ${page.url()}, scrollY = 0`);
    await demo.highlight(header(page), 'Header visible at the top of the page');
    await demo.highlight(cardNames(page).first(), `Same first card: ${firstCard}`);
    await demo.caption('');
  });
});

test('TC-PRB-8-04 "Back to top" on catalog page 2 keeps the shopper on page 2 instead of the home page', async ({ page, demo }) => {
  let page2Cards: string[] = [];
  await test.step('open /?page=2 and note the item cards shown', async () => {
    await page.goto(`${BASE_URL}/?page=2`);
    await expect(cardNames(page).first()).toBeVisible();
    page2Cards = (await cardNames(page).allInnerTexts()).map(t => t.trim());
    expect(page2Cards.length).toBeGreaterThan(0);
    await demo.caption(`Opened ${page.url()}; first card: ${page2Cards[0]}`);
    await demo.highlight(cardNames(page).first(), `Page 2 first card: ${page2Cards[0]}`);
  });
  await test.step('scroll to the bottom of the page', async () => {
    await scrollToBottom(page);
    await expect(backToTop(page)).toHaveAttribute('href', '?page=2#top');
    await demo.caption(`Back to top href = "${await backToTop(page).getAttribute('href')}"`);
    await demo.highlight(backToTop(page), 'Back to top -> ?page=2#top');
  });
  await test.step('click the footer link "Back to top"', async () => {
    await backToTop(page).click();
  });
  await test.step('the page is at its top, still on ?page=2 with the same cards', async () => {
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBe(0);
    await expect(header(page)).toBeInViewport();
    const url = new URL(page.url());
    expect(url.pathname).toBe('/');
    expect(url.search).toBe('?page=2');
    await expect(cardNames(page)).toHaveText(page2Cards);
    await demo.caption(`After click: ${page.url()}, scrollY = 0`);
    await demo.highlight(header(page), 'Header visible at the top');
    await demo.highlight(cardNames(page).first(), `Still page 2: ${page2Cards[0]}`);
    await demo.caption('');
  });
});

test('TC-PRB-8-05 footer link columns, brand and social links are unchanged', async ({ page, demo }) => {
  await test.step('open /', async () => {
    await page.goto(BASE_URL!);
    await expect(footer(page)).toHaveCount(1);
    await demo.caption(`Opened ${page.url()}`);
  });
  await test.step('read Shop, Support, Company, the brand link and the social list', async () => {
    const shop = footer(page).getByRole('navigation', { name: 'Shop', exact: true });
    const support = footer(page).getByRole('navigation', { name: 'Support', exact: true });
    const company = footer(page).getByRole('navigation', { name: 'Company', exact: true });
    const brand = footer(page).getByRole('link', { name: 'AdventureWorks home', exact: true });
    const social = footer(page).getByRole('list', { name: 'AdventureWorks on social media', exact: true });

    expect(await linksOf(shop)).toEqual([
      { text: 'Shop all', href: '' },
      { text: 'Shopping bag', href: 'cart' },
      { text: 'My orders', href: 'user/orders' },
      { text: 'New arrivals', href: null },
      { text: 'Gift cards', href: null },
    ]);
    expect(await linksOf(support)).toEqual(
      ['Help center', 'Shipping and returns', 'Track an order', 'Size guide', 'Contact us'].map(text => ({ text, href: null })));
    expect(await linksOf(company)).toEqual(
      ['Our story', 'Careers', 'Sustainability', 'Store locator', 'Press'].map(text => ({ text, href: null })));
    await expect(brand).toHaveCount(1);
    await expect(brand).toHaveAttribute('href', '');
    const socialLinks = social.getByRole('link');
    await expect(socialLinks).toHaveCount(4);
    const networks = ['Instagram', 'Facebook', 'X', 'YouTube'];
    for (const [i, network] of networks.entries()) {
      await expect(socialLinks.nth(i)).toHaveAccessibleName(`AdventureWorks on ${network} (opens in a new tab)`);
      await expect(socialLinks.nth(i)).toHaveAttribute('target', '_blank');
    }
    for (const region of [shop, support, company, social]) {
      await expect(region.getByRole('link', { name: BACK_TO_TOP, exact: true })).toHaveCount(0);
    }
    await expect(footer(page).locator('.eshop-footer-brand-col').getByRole('link', { name: BACK_TO_TOP, exact: true })).toHaveCount(0);

    await demo.highlight(footer(page).locator('.eshop-footer-brand-col'), 'Brand link and 4 social links unchanged');
    await demo.highlight(shop, 'Shop: Shop all, Shopping bag, My orders, New arrivals, Gift cards');
    await demo.highlight(support, 'Support: 5 links unchanged');
    await demo.highlight(company, 'Company: 5 links unchanged');
    await demo.absent(footer(page).locator('.eshop-footer-main'), 'No Back to top in the columns');
    await demo.caption('');
  });
});

test('TC-PRB-8-06 copyright line and Privacy, Terms, Cookies legal links are unchanged', async ({ page, demo }) => {
  const year = new Date().getFullYear();
  await test.step('open /', async () => {
    await page.goto(BASE_URL!);
    await expect(footer(page)).toHaveCount(1);
    await demo.caption(`Opened ${page.url()}`);
  });
  await test.step('read the copyright line and the first three Legal items', async () => {
    const copy = footerBottom(page).locator('p.eshop-footer-copy');
    await expect(copy).toHaveText(`© ${year} AdventureWorks. All rights reserved.`, { useInnerText: true });
    const legalLinks = legalList(page).locator('li > a');
    expect((await linksOf(legalList(page))).slice(0, 3)).toEqual([
      { text: 'Privacy', href: null },
      { text: 'Terms', href: null },
      { text: 'Cookies', href: null },
    ]);
    await expect(legalLinks.nth(0)).toHaveText('Privacy');
    await expect(footer(page).locator('.eshop-footer-bottom > p.eshop-footer-copy')).toHaveCount(1);
    await expect(footer(page).locator('.eshop-footer-bottom > ul.eshop-footer-legal[aria-label="Legal"]')).toHaveCount(1);
    await demo.highlight(copy, `© ${year} AdventureWorks. All rights reserved.`);
    for (const [i, name] of ['Privacy', 'Terms', 'Cookies'].entries()) {
      await demo.highlight(legalLinks.nth(i), `${name} (no href)`, 1200);
    }
    await demo.caption('');
  });
});
